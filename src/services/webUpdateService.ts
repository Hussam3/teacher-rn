/**
 * خدمة التحديث الفوري لنسخة الويب (Web Live Updates).
 *
 * مكافئ ويب لآلية التحديثات الفورية في تطبيق الهاتف: بدل تنزيل حزمة JS من Supabase
 * (المتصفح لا ينفّذ حزمة عشوائية دون مراجعة)، يفحص التطبيق بيان البناء المنشور
 * `version.json` الذي يكتبه بناء Vite، ويكتشف أن معرّف البناء
 * المنشور مختلف عن المعرّف المضمّن داخل الحزمة الحالية — أي أن نشراً أحدث من
 * النسخة التي تعمل في المتصفح.
 *
 * عند التطبيق: يُعاد تسجيل الـ service worker (أو يُلغى)، وتُحذف كل ذاكرات
 * التخزين المؤقت، ثم تُعاد تحميل الصفحة، فيصبح المتصفح على آخر بناء.
 */
import { Platform } from 'react-native';
import { APP_VERSION } from '../shared/constants/app';

/** معرّف البناء يُحقنه بناء الويب؛ غير معرّف في البناءات الأصلية. */
declare const __WEB_BUILD_ID__: string | undefined;

export interface WebBuildInfo {
  /** رقم إصدار التطبيق كما هو في بيان البناء */
  version: string;
  /** معرّف البناء (commit المنشور) */
  buildId: string;
  /** وقت البناء بتوقيت ISO */
  builtAt?: string;
}

export const WEB_BUILD_MANIFEST_PATH = '/version.json';

const REQUEST_TIMEOUT_MS = 8000;

/** معرّف البناء الذي تعمل عليه هذه الحزمة الآن. */
const CURRENT_BUILD_ID =
  typeof __WEB_BUILD_ID__ === 'string' ? __WEB_BUILD_ID__ : '';

interface WebGlobals {
  navigator?: {
    serviceWorker?: {
      getRegistrations?: () => Promise<Array<{ unregister: () => Promise<boolean> }>>;
    };
  };
  caches?: {
    keys: () => Promise<string[]>;
    delete: (name: string) => Promise<boolean>;
  };
  location?: { reload: () => void };
}

function webGlobals(): WebGlobals {
  return globalThis as unknown as WebGlobals;
}

/** أنواع المتصفح غير متاحة في إعداد TypeScript الأصلي، فيُوصَف fetch محلياً. */
type WebFetch = (
  input: string,
  init?: {
    cache?: 'no-store';
    headers?: Record<string, string>;
    signal?: unknown;
  },
) => Promise<{ ok: boolean; json: () => Promise<unknown> }>;

/** آلية التحديثات الفورية متاحة على الويب فقط (تُبنى عبر Vite). */
export function isWebUpdateSupported(): boolean {
  return (
    Platform.OS === 'web' &&
    typeof fetch === 'function' &&
    CURRENT_BUILD_ID.length > 0
  );
}

export function currentWebBuildId(): string {
  return CURRENT_BUILD_ID;
}

/** جلب بيان البناء المنشور، دون أي تخزين مؤقت، أو null عند الفشل. */
export async function fetchLatestWebBuild(
  signal?: { abort: () => void },
): Promise<WebBuildInfo | null> {
  const controller =
    typeof AbortController === 'function' ? new AbortController() : null;
  const timer = controller
    ? setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
    : null;
  try {
    const webFetch = fetch as unknown as WebFetch;
    const response = await webFetch(
      `${WEB_BUILD_MANIFEST_PATH}?t=${Date.now()}`,
      {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
        signal: signal ?? controller?.signal,
      },
    );
    if (!response.ok) return null;
    const data: unknown = await response.json();
    if (!data || typeof data !== 'object') return null;
    const payload = data as Record<string, unknown>;
    const buildId = payload.buildId;
    if (typeof buildId !== 'string' || !buildId) return null;
    return {
      version:
        typeof payload.version === 'string' ? payload.version : APP_VERSION,
      buildId,
      builtAt: typeof payload.builtAt === 'string' ? payload.builtAt : undefined,
    };
  } catch {
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** صحيح عندما يكون البناء المنشور مختلفاً عن البناء الذي يعمل الآن. */
export function isStaleWebBuild(
  remote: WebBuildInfo | null,
  localBuildId: string = CURRENT_BUILD_ID,
): boolean {
  if (!remote) return false;
  return remote.buildId !== localBuildId;
}

/**
 * تطبيق البناء المنشور: إلغاء تسجيل الـ service workers، حذف كل ذاكرات
 * التخزين المؤقت القديمة، ثم إعادة تحميل الصفحة.
 */
export async function activateLatestWebBuild(): Promise<boolean> {
  const target = webGlobals();
  try {
    const registrations = (await target.navigator?.serviceWorker
      ?.getRegistrations?.()) ?? [];
    await Promise.all(
      registrations.map(registration =>
        registration.unregister().catch(() => false),
      ),
    );
  } catch {
    // لا يوجد service worker مسجّل، أو المتصفح رفض الإلغاء.
  }
  try {
    const keys = (await target.caches?.keys()) ?? [];
    await Promise.all(keys.map(key => target.caches?.delete(key)));
  } catch {
    // Cache Storage غير متاح، أو فشل الحذف.
  }
  try {
    target.location?.reload();
    return true;
  } catch {
    return false;
  }
}
