import { supabase } from '../services/supabase';

export type LicenseStatus = 'active' | 'suspended' | 'revoked';

export interface LicenseSummary {
  licenses: number;
  active: number;
  suspended: number;
  activeDevices: number;
  activeTrials: number;
}

export interface ManagedLicense {
  id: string;
  codeHint: string;
  label: string | null;
  status: LicenseStatus;
  expiresAt: string | null;
  maxDevices: number;
  activeDevices: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LicenseActivation {
  id: string;
  installationHint: string;
  platform: string;
  appVersion: string | null;
  activatedAt: string;
  lastCheckedAt: string;
  active: boolean;
  deactivatedAt: string | null;
  revokedAt: string | null;
}

export interface LicenseDetail {
  license: ManagedLicense;
  activationCode: string | null;
  activations: LicenseActivation[];
}

export const SUBSCRIPTION_PLANS = [
  { value: 'one_month', label: 'شهر واحد' },
  { value: 'three_months', label: '3 أشهر' },
  { value: 'one_year', label: 'سنة واحدة' },
  { value: 'custom', label: 'مخصص / دائم' },
] as const;

export type SubscriptionPlan = (typeof SUBSCRIPTION_PLANS)[number]['value'];

type ApiFailure = {
  ok?: boolean;
  code?: string;
  message?: string;
};

function isFailure(value: unknown): value is ApiFailure {
  return typeof value === 'object' && value !== null;
}

async function errorFromFunction(error: unknown): Promise<Error> {
  const candidate = error as {
    message?: unknown;
    context?: { status?: number; json?: () => Promise<unknown> };
  };
  if (candidate.context?.status === 404) {
    return new Error(
      'دالة التراخيص غير منشورة في Supabase. انشر الدالة licenses ثم أعد المحاولة.',
    );
  }
  const payload = await candidate.context?.json?.().catch(() => null);
  if (isFailure(payload) && typeof payload.message === 'string') {
    return new Error(payload.message);
  }
  return new Error(
    'تعذر الاتصال بخدمة التراخيص. تحقق من اتصالك ثم أعد المحاولة.',
  );
}

export async function callAdmin<T>(
  action: string,
  body: Record<string, unknown> = {},
): Promise<T> {
  const { data, error } = await supabase.functions.invoke('licenses', {
    body: { action, ...body },
  });
  if (error) throw await errorFromFunction(error);
  if (!isFailure(data) || data.ok !== true) {
    throw new Error(
      isFailure(data) && typeof data.message === 'string'
        ? data.message
        : 'تعذر تنفيذ الطلب حالياً.',
    );
  }
  return data as T;
}

export function formatLicenseDate(value: string | null): string {
  if (!value) return 'دائم';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'غير معروف';
  return new Intl.DateTimeFormat('ar-IQ', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'Asia/Baghdad',
  }).format(date);
}

export function dateInputValue(value: string | null): string {
  return value ? value.slice(0, 10) : '';
}

export function statusLabel(status: LicenseStatus): string {
  if (status === 'active') return 'نشط';
  if (status === 'suspended') return 'موقوف';
  return 'ملغى';
}
