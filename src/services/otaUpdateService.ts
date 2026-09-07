/**
 * خدمة التحديثات الفورية (Over-The-Air - OTA Live Updates)
 *
 * تتيح إرسال وتطبيق تحديثات JavaScript الفورية والأصول للمستخدمين
 * عبر Supabase مباشرة دون الحاجة لانتظار مراجعة متجر Google Play.
 *
 * عند تطبيق التحديث: يُنزَّل البندل الحقيقي، تُتحقق سابقاً من سلامته على مستوى
 * الأصلي (SHA-256) عند كل إقلاع، ثم يُعاد تشغيل التطبيق لتشغيل الكود المحدّث.
 */
import { NativeModules, Platform } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { storage } from '../shared/lib/storage';
import { APP_VERSION } from '../shared/constants/app';
import { supabase } from './supabase';

export interface AppUpdateInfo {
  id: string;
  versionName: string;
  versionCode: number;
  bundleUrl: string;
  bundleHash?: string;
  releaseNotes?: string;
  isMandatory?: boolean;
  createdAt: string;
}

export interface CheckUpdateResult {
  hasUpdate: boolean;
  update: AppUpdateInfo | null;
  currentVersion: string;
  lastCheckedAt: string;
  /** سبب فشل الفحص؛ يميّز مشكلة الاتصال عن عدم وجود تحديث. */
  error?: string;
}

export interface ApplyUpdateResult {
  ok: boolean;
  /**
   * صحيح عندما تم تنزيل البندل وتثبيته بنجاح ويُعاد تشغيل التطبيق لتطبيقه،
   * وصحيح أيضاً عندما لم يكن التحديث ناتجاً عن تغيير جافاسكربت فعلي (فقط بيانات).
   */
  needsRestart?: boolean;
  /** Whether the native layer accepted scheduling an automatic restart. */
  restartScheduled?: boolean;
  error?: string;
}

const STORAGE_KEYS = {
  INSTALLED_VERSION: '@ota_installed_version',
  INSTALLED_VERSION_CODE: '@ota_installed_version_code',
  INSTALLED_HASH: '@ota_installed_hash',
  LAST_CHECKED: '@ota_last_checked_at',
};

export const BASE_APP_VERSION = APP_VERSION;
export const BASE_VERSION_CODE = 8;

type UpdateManagerModule = {
  documentDir?: string;
  otaEnabled?: boolean;
  confirmUpdate?: () => void;
  restartApp?: () => Promise<boolean>;
};

function nativeUpdateManager(): UpdateManagerModule | null {
  return (
    (NativeModules.UpdateManager as UpdateManagerModule | undefined) ?? null
  );
}

/** OTA is reserved for explicitly built direct-distribution Android releases. */
export function isOtaEnabled(): boolean {
  return (
    Platform.OS === 'android' && nativeUpdateManager()?.otaEnabled === true
  );
}

/**
 * تأكيد أن البندل المحدّث يعمل بنجاح. يُستدعى عند إقلاع التطبيق (مرة واحدة)
 * لإزالة علامة الحماية من الانهيار المتكرر على مستوى الـ native، بحيث لا يُرجَع
 * تلقائياً إلى البندل المدمج بعد محاولات ناجحة.
 */
export function confirmUpdateInstalled(): void {
  if (!isOtaEnabled()) return;
  try {
    const native = nativeUpdateManager();
    if (native && typeof native.confirmUpdate === 'function') {
      native.confirmUpdate();
    }
  } catch {}
}

const OTA_DIR = 'ota';
const OTA_BUNDLE_FILENAME = 'index.android.bundle';

function otaDir(): string {
  // documentDir يُعاد من الـ native module ويطابق filesDir الذي يقرأ منه الـ native.
  const documentDir = nativeUpdateManager()?.documentDir;
  return `${documentDir || ReactNativeBlobUtil.fs.dirs.DocumentDir}/${OTA_DIR}`;
}

function responseHeader(headers: unknown, name: string): string {
  if (!headers || typeof headers !== 'object') return '';
  const entry = Object.entries(headers as Record<string, unknown>).find(
    ([key]) => key.toLowerCase() === name.toLowerCase(),
  );
  return entry && typeof entry[1] === 'string' ? entry[1] : '';
}

function compareVersionNames(left: string, right: string): number | null {
  const toParts = (value: string): number[] | null => {
    const parts = value.trim().split('.');
    if (!parts.length || parts.some(part => !/^\d+$/.test(part))) return null;
    return parts.map(Number);
  };

  const leftParts = toParts(left);
  const rightParts = toParts(right);
  if (!leftParts || !rightParts) return null;

  const length = Math.max(leftParts.length, rightParts.length);
  for (let index = 0; index < length; index += 1) {
    const difference = (leftParts[index] ?? 0) - (rightParts[index] ?? 0);
    if (difference) return difference > 0 ? 1 : -1;
  }
  return 0;
}

/** الحصول على رقم الإصدار الحالي النشط في التطبيق */
export async function getCurrentAppVersion(): Promise<{
  versionName: string;
  versionCode: number;
  bundleHash?: string;
  lastChecked?: string;
}> {
  if (!isOtaEnabled()) {
    return { versionName: BASE_APP_VERSION, versionCode: BASE_VERSION_CODE };
  }
  try {
    const storedVersion = storage.getString(STORAGE_KEYS.INSTALLED_VERSION);
    const storedHash = storage.getString(STORAGE_KEYS.INSTALLED_HASH);
    const storedCode = storage.getNumber(STORAGE_KEYS.INSTALLED_VERSION_CODE);
    const lastChecked = storage.getString(STORAGE_KEYS.LAST_CHECKED);

    return {
      versionName: storedVersion || BASE_APP_VERSION,
      versionCode: storedCode != null ? storedCode : BASE_VERSION_CODE,
      bundleHash: storedHash || undefined,
      lastChecked: lastChecked || undefined,
    };
  } catch {
    return {
      versionName: BASE_APP_VERSION,
      versionCode: BASE_VERSION_CODE,
    };
  }
}

/** التحقق من وجود تحديث فوري جديد من Supabase */
export async function checkForAppUpdate(): Promise<CheckUpdateResult> {
  const now = new Date().toISOString();
  const current = await getCurrentAppVersion();
  if (!isOtaEnabled()) {
    return {
      hasUpdate: false,
      update: null,
      currentVersion: current.versionName,
      lastCheckedAt: now,
    };
  }
  storage.set(STORAGE_KEYS.LAST_CHECKED, now);

  const platform =
    Platform.OS === 'ios' ? 'ios' : Platform.OS === 'web' ? 'web' : 'android';

  try {
    const { data: updateRow, error } = await supabase
      .from('app_updates')
      .select('*')
      .eq('platform', platform)
      .eq('is_active', true)
      .order('version_code', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!updateRow) {
      return {
        hasUpdate: false,
        update: null,
        currentVersion: current.versionName,
        lastCheckedAt: now,
      };
    }

    const latestUpdate: AppUpdateInfo = {
      id: updateRow.id,
      versionName: updateRow.version_name,
      versionCode: updateRow.version_code,
      bundleUrl: updateRow.bundle_url,
      bundleHash: updateRow.bundle_hash,
      releaseNotes: updateRow.release_notes,
      isMandatory: updateRow.is_mandatory,
      createdAt: updateRow.created_at,
    };

    // رقم OTA الزمني ليس رقم بناء Android، لذلك لا يجوز أن يرقّي حزمة أقدم
    // فوق APK أحدث. الهاش يحدّث فقط نسخة OTA مثبتة بالرقم نفسه.
    const versionComparison = compareVersionNames(
      latestUpdate.versionName,
      current.versionName,
    );
    const isNewVersion =
      versionComparison === null
        ? latestUpdate.versionCode > current.versionCode ||
          latestUpdate.versionName !== current.versionName
        : versionComparison > 0 ||
          (versionComparison === 0 &&
            Boolean(current.bundleHash) &&
            Boolean(latestUpdate.bundleHash) &&
            latestUpdate.bundleHash !== current.bundleHash);

    return {
      hasUpdate: isNewVersion,
      update: isNewVersion ? latestUpdate : null,
      currentVersion: current.versionName,
      lastCheckedAt: now,
    };
  } catch {
    return {
      hasUpdate: false,
      update: null,
      currentVersion: current.versionName,
      lastCheckedAt: now,
      error: 'تعذر الاتصال بخدمة التحديثات الفورية',
    };
  }
}

/**
 * تطبيق التحديث الفوري:
 *  1) تنزيل البندل الجديد إلى مجلد مؤقت
 *  2) كتابة state.json (يتضمن الهاش) بعد البندل
 *  3) استبدال البندل الحالي بالجديد
 *  4) تحديث بيانات الإصدار ثم إعادة تشغيل التطبيق
 *
 * على مستوى الـ native تُعاد مقارنة SHA-256 عند كل إقلاع؛ إن لم يطابق الهاش
 * يُحذف البندل المُحدَّث ويُرجَع تلقائياً إلى البندل المدمج داخل الـ APK.
 */
export async function applyAppUpdate(
  update: AppUpdateInfo,
  onProgress?: (percent: number) => void,
): Promise<ApplyUpdateResult> {
  if (!isOtaEnabled()) {
    return {
      ok: false,
      error: 'التحديثات الفورية غير متاحة في نسخة Google Play',
    };
  }
  if (!update.bundleUrl) {
    return { ok: false, error: 'رابط حزمة التحديث غير متوفر' };
  }
  const expectedHash = update.bundleHash?.trim().toLowerCase();
  if (!expectedHash || !/^[a-f0-9]{64}$/.test(expectedHash)) {
    return { ok: false, error: 'بصمة حزمة التحديث غير صالحة' };
  }

  const fs = ReactNativeBlobUtil.fs;
  const dir = otaDir();
  const tmpPath = `${dir}/${OTA_BUNDLE_FILENAME}.tmp`;
  try {
    // mkdir يفشل عند وجود المجلد من تحديث سابق، وهذا هو الوضع الطبيعي.
    if (!(await fs.exists(dir))) {
      await fs.mkdir(dir);
    }

    await fs.unlink(tmpPath).catch(() => {});

    const response = await ReactNativeBlobUtil.config({
      path: tmpPath,
      fileCache: true,
      timeout: 90000,
    })
        .fetch('GET', update.bundleUrl, { Accept: '*/*' })
        .progress({ interval: 100 }, (received, total) => {
          if (onProgress && total > 0) {
            onProgress(Math.min(1, received / total));
          }
        });

    const info = response.info();
    if (info.status !== 200) {
      throw new Error(`تعذر تنزيل الحزمة (رمز HTTP ${info.status})`);
    }
    const contentType = responseHeader(info.headers, 'content-type').toLowerCase();
    if (!contentType.includes('javascript')) {
      throw new Error('الخادم لم يرسل حزمة تحديث صالحة');
    }

    const size = Number((await fs.stat(tmpPath)).size);
    if (size <= 0) {
      throw new Error('الحزمة التي تم تنزيلها فارغة');
    }
    const expectedSize = Number(responseHeader(info.headers, 'content-length'));
    if (Number.isFinite(expectedSize) && expectedSize > 0 && size !== expectedSize) {
      throw new Error('اكتمل تنزيل الحزمة بشكل غير كامل');
    }
    const actualHash = (await fs.hash(tmpPath, 'sha256')).toLowerCase();
    if (actualHash !== expectedHash) {
      throw new Error('بصمة الحزمة التي تم تنزيلها لا تطابق المصدر');
    }

    const finalPath = `${dir}/${OTA_BUNDLE_FILENAME}`;
    await fs.unlink(finalPath).catch(() => {});
    await fs.mv(tmpPath, finalPath);

    // كتابة ملف الحالة ليستخدمه الـ native لعملية التحقق من السلامة (SHA-256).
    await fs.writeFile(`${dir}/state.json`, JSON.stringify({ hash: expectedHash }), 'utf8');

    storage.set(STORAGE_KEYS.INSTALLED_VERSION, update.versionName);
    storage.set(STORAGE_KEYS.INSTALLED_VERSION_CODE, update.versionCode);
    storage.set(STORAGE_KEYS.INSTALLED_HASH, expectedHash);

    let restartScheduled = false;
    try {
      const native = nativeUpdateManager();
      if (native && typeof native.restartApp === 'function') {
        restartScheduled = (await native.restartApp()) === true;
      }
    } catch {
      // وظيفة التثبيت اكتملت وسيُطبَّق التحديث عند الإقلاع اليدوي التالي.
    }

    return { ok: true, needsRestart: true, restartScheduled };
  } catch (e) {
    await fs.unlink(tmpPath).catch(() => {});
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, error: message };
  }
}
