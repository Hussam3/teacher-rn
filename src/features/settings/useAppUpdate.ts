/**
 * متحكم مشترك في التحديثات الفورية (OTA).
 *
 * يجمع فحص التحديثات وتطبيقها في مكان واحد ليستخدمه زر التحديث العائم أعلى
 * التطبيق وقسم «التحديثات الفورية» داخل الإعدادات دون تكرار المنطق.
 *
 * على أندرويد (نسخ التوزيع المباشر) يُنزَّل بندل جديد من Supabase، وعلى الويب
 * يُكتشف نشر أحدث عبر `version.json` ثم يُعاد تحميل الصفحة من الشبكة.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  applyAppUpdate,
  BASE_APP_VERSION,
  checkForAppUpdate,
  getCurrentAppVersion,
  isOtaEnabled,
  type AppUpdateInfo,
  type CheckUpdateResult,
} from '../../services/otaUpdateService';
import {
  activateLatestWebBuild,
  fetchLatestWebBuild,
  isStaleWebBuild,
  isWebUpdateSupported,
  type WebBuildInfo,
} from '../../services/webUpdateService';
import { strings } from '../../shared/i18n/ar';

/** الفترة بين فحوص التحديث على الويب أثناء بقاء التطبيق مفتوحاً. */
const WEB_CHECK_INTERVAL_MS = 5 * 60 * 1000;

export interface ApplyOutcome {
  ok: boolean;
  /** رسالة جاهزة للعرض للمستخدم */
  message: string;
}

export interface AppUpdateController {
  /** التحديثات الفورية متاحة فقط في نسخ Android المبنية للتوزيع المباشر */
  otaEnabled: boolean;
  /** التحديث يمر عبر الويب (نسخة منشورة) لا عبر حزمة Supabase */
  webUpdate: boolean;
  /** أي من القناتين متاح، فيُعرض الزر العائم وقسم الإعدادات */
  enabled: boolean;
  /** رقم الإصدار الذي يعمل عليه التطبيق الآن */
  otaVersion: string;
  /** التحديث المتاح، أو null إن لم يوجد */
  updateInfo: AppUpdateInfo | null;
  checking: boolean;
  applying: boolean;
  /** نسبة التنزيل من 0 إلى 1 */
  progress: number;
  /** يفحص عن تحديث جديد ويخزّن النتيجة */
  check: () => Promise<CheckUpdateResult>;
  /** ينزّل التحديث ويثبّته، مع الإبلاغ عن التقدم */
  apply: (update: AppUpdateInfo) => Promise<ApplyOutcome>;
  /** إغلاق إشعار التحديث دون تطبيقه */
  dismiss: () => void;
}

/** تحويل بيان البناء المنشور إلى نفس شكل تحديث التطبيق ليشترك معه العرض. */
function toWebUpdateInfo(build: WebBuildInfo): AppUpdateInfo {
  return {
    id: `web-${build.buildId}`,
    versionName: build.version,
    versionCode: 0,
    bundleUrl: '',
    releaseNotes: undefined,
    isMandatory: false,
    createdAt: build.builtAt ?? new Date().toISOString(),
  };
}

export function useAppUpdate(): AppUpdateController {
  const otaEnabled = isOtaEnabled();
  const webUpdate = isWebUpdateSupported();
  const enabled = otaEnabled || webUpdate;
  const [otaVersion, setOtaVersion] = useState<string>(BASE_APP_VERSION);
  const [updateInfo, setUpdateInfo] = useState<AppUpdateInfo | null>(null);
  const [checking, setChecking] = useState(false);
  const [applying, setApplying] = useState(false);
  const [progress, setProgress] = useState(0);
  const checkRef = useRef<(() => Promise<CheckUpdateResult>) | null>(null);

  useEffect(() => {
    if (!otaEnabled) return;
    let active = true;
    getCurrentAppVersion().then(v => {
      if (active) setOtaVersion(v.versionName);
    });
    return () => {
      active = false;
    };
  }, [otaEnabled]);

  const check = useCallback(async (): Promise<CheckUpdateResult> => {
    if (!enabled) {
      return {
        hasUpdate: false,
        update: null,
        currentVersion: BASE_APP_VERSION,
        lastCheckedAt: new Date().toISOString(),
      };
    }
    setChecking(true);
    try {
      if (webUpdate) {
        const build = await fetchLatestWebBuild();
        const hasUpdate = isStaleWebBuild(build);
        const update = build && hasUpdate ? toWebUpdateInfo(build) : null;
        setUpdateInfo(update);
        return {
          hasUpdate,
          update,
          currentVersion: otaVersion || BASE_APP_VERSION,
          lastCheckedAt: new Date().toISOString(),
        };
      }
      const result = await checkForAppUpdate();
      setUpdateInfo(result.hasUpdate ? result.update : null);
      return result;
    } finally {
      setChecking(false);
    }
  }, [enabled, webUpdate, otaVersion]);

  useEffect(() => {
    checkRef.current = check;
  }, [check]);

  // على الويب: يُفحص عن نشر أحدث دورياً ما دامت الصفحة مفتوحة، تماماً كما
  // يفحص تطبيق الهاتف عن تحديث فوري جديد.
  useEffect(() => {
    if (!webUpdate) return;
    const timer = setInterval(() => {
      checkRef.current?.().catch(() => {});
    }, WEB_CHECK_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [webUpdate]);

  const apply = useCallback(
    async (update: AppUpdateInfo): Promise<ApplyOutcome> => {
      if (webUpdate) {
        setApplying(true);
        try {
          const reloaded = await activateLatestWebBuild();
          return {
            ok: reloaded,
            message: reloaded
              ? strings.update.reloading
              : strings.update.applyFailed,
          };
        } finally {
          setApplying(false);
        }
      }
      setApplying(true);
      setProgress(0);
      try {
        const result = await applyAppUpdate(update, p => setProgress(p));
        if (!result.ok) {
          return {
            ok: false,
            message: strings.update.applyError.replace(
              '{error}',
              result.error || strings.update.unexpectedError,
            ),
          };
        }
        setOtaVersion(update.versionName);
        setUpdateInfo(null);
        if (result.needsRestart) {
          return {
            ok: true,
            message: result.restartScheduled
              ? strings.update.restartScheduled
              : strings.update.restartManual,
          };
        }
        return {
          ok: true,
          message: strings.update.applied.replace('{version}', update.versionName),
        };
      } catch {
        return { ok: false, message: strings.update.applyFailed };
      } finally {
        setApplying(false);
      }
    },
    [webUpdate],
  );

  const dismiss = useCallback(() => setUpdateInfo(null), []);

  return {
    otaEnabled,
    webUpdate,
    enabled,
    otaVersion,
    updateInfo,
    checking,
    applying,
    progress,
    check,
    apply,
    dismiss,
  };
}
