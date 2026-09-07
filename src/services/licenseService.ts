/**
 * خدمة الترخيص العامة.
 *
 * لا تحتوي على أي سر أو منطق تحقق حساس؛ القرار النهائي يصدر من Edge Function.
 * تحفظ الاستجابة الموثوقة مؤقتاً فقط لتقديم فترة سماح قصيرة دون اتصال.
 */
import { Platform } from 'react-native';
import { APP_VERSION } from '../shared/constants/app';
import {
  readJSON,
  storage,
  StorageKeys,
  writeJSON,
} from '../shared/lib/storage';
import { newId } from '../shared/utils/id';
import { normalizeActivationCode } from '../shared/utils/license';
import { supabase } from './supabase';

export {
  normalizeActivationCode,
  trialRemainingMessage,
} from '../shared/utils/license';

const CACHE_GRACE_MS = 7 * 24 * 60 * 60 * 1000;
const TRIAL_CACHE_GRACE_MS = 24 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 12_000;
const CLOCK_ROLLBACK_TOLERANCE_MS = 5 * 60 * 1000;

const ACCESS_KINDS = [
  'none',
  'trial',
  'licensed',
  'trial_expired',
  'license_expired',
  'license_revoked',
] as const;

export type LicenseAccessKind = (typeof ACCESS_KINDS)[number];

export interface LicenseAccess {
  kind: LicenseAccessKind;
  /** تاريخ انتهاء التجربة أو الترخيص المدفوع، أو null للترخيص الدائم. */
  expiresAt: string | null;
  /** آخر أربعة رموز من الترخيص، ولا تحفظ الشيفرة الكاملة على الجهاز. */
  codeHint: string | null;
  /** وقت الخادم عند آخر تحقق ناجح. */
  checkedAt: string | null;
  /** معرف خطة الاشتراك */
  planId?: string | null;
  /** الحد الأقصى للمواد */
  maxSubjects?: number;
  /** المواد الأساسية المحددة */
  selectedSubjects?: string[];
}

interface CachedLicenseAccess extends LicenseAccess {
  offlineGraceUntil: string;
  /** فرق وقت الخادم عن ساعة الجهاز عند آخر تحقق. */
  serverTimeOffsetMs: number;
  /** يمنع إبقاء الوصول بعد إعادة ساعة الجهاز للخلف. */
  lastObservedDeviceAt: string;
}

interface LicenseApiResult extends LicenseAccess {
  offlineGraceUntil?: string;
}

type LicenseApiAction = 'status' | 'activate' | 'start_trial' | 'set_selected_subjects';

interface LicenseApiRequest {
  action: LicenseApiAction;
  installationId: string;
  platform: string;
  appVersion: string;
  code?: string;
  subjects?: string[];
}

/** خطأ متوقع من خدمة الترخيص يمكن عرضه للمستخدم دون فقدان الإدخال. */
export class LicenseServiceError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly retryable = false,
  ) {
    super(message);
    this.name = 'LicenseServiceError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isAccessKind(value: unknown): value is LicenseAccessKind {
  return (
    typeof value === 'string' &&
    (ACCESS_KINDS as readonly string[]).includes(value)
  );
}

function isValidUuid(value: string | undefined): value is string {
  return Boolean(
    value &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value,
      ),
  );
}

function emptyAccess(): LicenseAccess {
  return { kind: 'none', expiresAt: null, codeHint: null, checkedAt: null };
}

export function isLicenseAccessAllowed(access: LicenseAccess): boolean {
  return access.kind === 'trial' || access.kind === 'licensed';
}

export function messageForLicenseAccess(access: LicenseAccess): string {
  switch (access.kind) {
    case 'trial_expired':
      return 'انتهت الفترة التجريبية. أدخل رمز التفعيل للاستمرار في استخدام حقيبة المدرس.';
    case 'license_expired':
      return 'انتهت صلاحية هذا الترخيص.';
    case 'license_revoked':
      return 'تم إيقاف هذا الترخيص. يرجى التواصل مع الجهة التي زودتك بالرمز.';
    default:
      return '';
  }
}

function getInstallationId(): string {
  const existing = storage.getString(StorageKeys.licenseInstallation);
  if (isValidUuid(existing)) return existing;

  const installationId = newId();
  storage.set(StorageKeys.licenseInstallation, installationId);
  return installationId;
}

function parseCachedAccess(value: unknown): CachedLicenseAccess | null {
  if (!isRecord(value) || !isAccessKind(value.kind)) return null;
  if (typeof value.offlineGraceUntil !== 'string') return null;

  return {
    kind: value.kind,
    expiresAt: typeof value.expiresAt === 'string' ? value.expiresAt : null,
    codeHint: typeof value.codeHint === 'string' ? value.codeHint : null,
    checkedAt: typeof value.checkedAt === 'string' ? value.checkedAt : null,
    offlineGraceUntil: value.offlineGraceUntil,
    serverTimeOffsetMs:
      typeof value.serverTimeOffsetMs === 'number' &&
      Number.isFinite(value.serverTimeOffsetMs)
        ? value.serverTimeOffsetMs
        : 0,
    lastObservedDeviceAt:
      typeof value.lastObservedDeviceAt === 'string'
        ? value.lastObservedDeviceAt
        : new Date().toISOString(),
  };
}

function cachedAccess(): CachedLicenseAccess | null {
  return parseCachedAccess(
    readJSON<unknown>(StorageKeys.licenseEntitlement, null),
  );
}

/** آخر حالة محفوظة، حتى إن تجاوزت فترة السماح، لاستخدامها في رسالة الانتهاء. */
export function getStoredLicenseAccess(): LicenseAccess | null {
  const cached = cachedAccess();
  if (!cached) return null;
  return {
    kind: cached.kind,
    expiresAt: cached.expiresAt,
    codeHint: cached.codeHint,
    checkedAt: cached.checkedAt,
  };
}

/** وقت ساعة الجهاز الذي يجب عنده إعادة التحقق قبل انتهاء الوصول الحالي. */
export function getLicenseRefreshDeadline(
  expiresAt: string | null,
): number | null {
  const cached = cachedAccess();
  const serverTimeOffsetMs = cached?.serverTimeOffsetMs ?? 0;
  const expirationDeadline = expiresAt
    ? Date.parse(expiresAt) - serverTimeOffsetMs
    : Infinity;
  const graceDeadline =
    cached && isLicenseAccessAllowed(cached)
      ? Date.parse(cached.offlineGraceUntil) - serverTimeOffsetMs
      : Infinity;
  const deadline = Math.min(
    Number.isFinite(expirationDeadline) ? expirationDeadline : Infinity,
    Number.isFinite(graceDeadline) ? graceDeadline : Infinity,
  );

  return Number.isFinite(deadline) ? deadline : null;
}

/** حالة صالحة للاستخدام محلياً ضمن فترة السماح دون اتصال. */
export function getUsableCachedLicenseAccess(
  now = Date.now(),
): LicenseAccess | null {
  const cached = cachedAccess();
  if (!cached || !isLicenseAccessAllowed(cached)) return null;

  const lastObservedMs = Date.parse(cached.lastObservedDeviceAt);
  if (
    Number.isFinite(lastObservedMs) &&
    now + CLOCK_ROLLBACK_TOLERANCE_MS < lastObservedMs
  ) {
    return null;
  }

  const trustedNow = now + cached.serverTimeOffsetMs;
  const graceMs = Date.parse(cached.offlineGraceUntil);
  const expirationMs = cached.expiresAt
    ? Date.parse(cached.expiresAt)
    : Infinity;
  if (
    !Number.isFinite(graceMs) ||
    graceMs <= trustedNow ||
    expirationMs <= trustedNow
  ) {
    return null;
  }

  if (!Number.isFinite(lastObservedMs) || now > lastObservedMs) {
    writeJSON<CachedLicenseAccess>(StorageKeys.licenseEntitlement, {
      ...cached,
      lastObservedDeviceAt: new Date(now).toISOString(),
    });
  }

  return {
    kind: cached.kind,
    expiresAt: cached.expiresAt,
    codeHint: cached.codeHint,
    checkedAt: cached.checkedAt,
  };
}

function persistAccess(access: LicenseAccess): void {
  if (!isLicenseAccessAllowed(access)) {
    if (
      access.kind === 'trial_expired' ||
      access.kind === 'license_expired' ||
      access.kind === 'license_revoked'
    ) {
      // نحتفظ بالقرار المانع لعرض الرسالة الصحيحة حتى لو انقطع الاتصال عند الفتح التالي.
      writeJSON<CachedLicenseAccess>(StorageKeys.licenseEntitlement, {
        ...access,
        offlineGraceUntil: new Date().toISOString(),
        serverTimeOffsetMs: 0,
        lastObservedDeviceAt: new Date().toISOString(),
      });
    } else {
      storage.remove(StorageKeys.licenseEntitlement);
    }
    return;
  }

  const deviceNow = Date.now();
  if (access.kind === 'trial' && !access.expiresAt) return;
  const serverNow = access.checkedAt ? Date.parse(access.checkedAt) : NaN;
  const trustedNow = Number.isFinite(serverNow) ? serverNow : deviceNow;
  const expirationMs = access.expiresAt
    ? Date.parse(access.expiresAt)
    : Infinity;
  const normalGraceMs =
    access.kind === 'trial'
      ? trustedNow + TRIAL_CACHE_GRACE_MS
      : trustedNow + CACHE_GRACE_MS;
  const graceMs = Math.min(expirationMs, normalGraceMs);
  if (!Number.isFinite(graceMs) && access.kind === 'trial') return;

  writeJSON<CachedLicenseAccess>(StorageKeys.licenseEntitlement, {
    ...access,
    offlineGraceUntil: new Date(graceMs).toISOString(),
    serverTimeOffsetMs: trustedNow - deviceNow,
    lastObservedDeviceAt: new Date(deviceNow).toISOString(),
  });
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(
        new LicenseServiceError(
          'network_unavailable',
          'تعذر الاتصال بخدمة التفعيل مؤقتاً. تحقق من اتصالك ثم أعد المحاولة.',
          true,
        ),
      );
    }, timeoutMs);

    promise.then(
      value => {
        clearTimeout(timer);
        resolve(value);
      },
      error => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

async function parseFunctionFailure(
  error: unknown,
): Promise<LicenseServiceError> {
  const candidate = error as {
    message?: unknown;
    context?: { json?: () => Promise<unknown> };
  };
  const payload = await candidate.context?.json?.().catch(() => null);
  if (isRecord(payload) && typeof payload.message === 'string') {
    return new LicenseServiceError(
      typeof payload.code === 'string'
        ? payload.code
        : 'license_request_failed',
      payload.message,
      payload.code === 'service_unavailable',
    );
  }

  return new LicenseServiceError(
    'network_unavailable',
    'تعذر الاتصال بخدمة التفعيل مؤقتاً. تحقق من اتصالك ثم أعد المحاولة.',
    true,
  );
}

function parseApiResult(payload: unknown): LicenseApiResult {
  if (!isRecord(payload)) {
    throw new LicenseServiceError(
      'invalid_response',
      'تعذر التحقق من الترخيص حالياً. حاول مرة أخرى.',
      true,
    );
  }
  if (payload.ok !== true) {
    throw new LicenseServiceError(
      typeof payload.code === 'string'
        ? payload.code
        : 'license_request_failed',
      typeof payload.message === 'string'
        ? payload.message
        : 'تعذر التحقق من الترخيص حالياً. حاول مرة أخرى.',
      payload.code === 'service_unavailable',
    );
  }
  if (!isAccessKind(payload.access)) {
    throw new LicenseServiceError(
      'invalid_response',
      'تعذر التحقق من الترخيص حالياً. حاول مرة أخرى.',
      true,
    );
  }

  return {
    kind: payload.access,
    expiresAt: typeof payload.expiresAt === 'string' ? payload.expiresAt : null,
    codeHint: typeof payload.codeHint === 'string' ? payload.codeHint : null,
    checkedAt:
      typeof payload.serverTime === 'string' ? payload.serverTime : null,
    planId: typeof payload.planId === 'string' ? payload.planId : null,
    maxSubjects: typeof payload.maxSubjects === 'number' ? payload.maxSubjects : 1,
    selectedSubjects: Array.isArray(payload.selectedSubjects) ? payload.selectedSubjects : [],
  };
}

async function callLicenseApi(
  request: LicenseApiRequest,
): Promise<LicenseApiResult> {
  let result: Awaited<ReturnType<typeof supabase.functions.invoke<unknown>>>;
  try {
    result = await withTimeout(
      supabase.functions.invoke<unknown>('licenses', { body: request }),
      REQUEST_TIMEOUT_MS,
    );
  } catch (error) {
    if (error instanceof LicenseServiceError) throw error;
    throw new LicenseServiceError(
      'network_unavailable',
      'تعذر الاتصال بخدمة التفعيل مؤقتاً. تحقق من اتصالك ثم أعد المحاولة.',
      true,
    );
  }

  if (result.error) throw await parseFunctionFailure(result.error);
  return parseApiResult(result.data);
}

function baseRequest(action: LicenseApiAction): LicenseApiRequest {
  return {
    action,
    installationId: getInstallationId(),
    platform: Platform.OS,
    appVersion: APP_VERSION,
  };
}

/** التحقق من حالة الترخيص أو التجربة للجهاز الحالي. */
export async function fetchCurrentLicenseAccess(): Promise<LicenseAccess> {
  return callLicenseApi(baseRequest('status'));
}

/** تفعيل رمز موجود مسبقاً. لا يكتب الرمز نفسه في التخزين المحلي. */
export async function activateLicense(code: string): Promise<LicenseAccess> {
  const normalizedCode = normalizeActivationCode(code);
  if (normalizedCode.length < 10) {
    throw new LicenseServiceError(
      'invalid_code_format',
      'أدخل رمز تفعيل صحيحاً ثم حاول مرة أخرى.',
    );
  }

  return callLicenseApi({
    ...baseRequest('activate'),
    code: normalizedCode,
  });
}

/** بدء أول تجربة مجانية للجهاز من وقت الخادم. */
export async function startFreeTrial(): Promise<LicenseAccess> {
  return callLicenseApi(baseRequest('start_trial'));
}

/** حفظ المواد الأساسية المحددة في الترخيص على الخادم ومحلياً */
export async function saveSelectedSubjects(subjects: string[]): Promise<LicenseAccess> {
  return callLicenseApi({
    ...baseRequest('set_selected_subjects'),
    subjects,
  });
}

/** يحفظ قراراً تم قبوله من أحدث طلب فقط. يستدعيه المخزن بعد حراسة ترتيب الردود. */
export function saveLicenseAccess(access: LicenseAccess): void {
  persistAccess(access);
  if (access.selectedSubjects && access.selectedSubjects.length > 0) {
    import('./aiUsageManager').then(m => {
      m.aiUsageManager.setSelectedSubjects(access.selectedSubjects!);
    }).catch(() => {});
  }
}

/** إعادة حالة افتراضية آمنة عند عدم وجود ترخيص أو اتصال سابق. */
export function noLicenseAccess(): LicenseAccess {
  return emptyAccess();
}
