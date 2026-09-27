import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  createClient,
  type Session,
  type SupabaseClient,
} from '@supabase/supabase-js';
import './styles.css';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as
  | string
  | undefined;
const supabase =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: true, detectSessionInUrl: true },
      })
    : null;

type LicenseStatus = 'active' | 'suspended' | 'revoked';
type ProviderId = 'gemini' | 'deepseek' | 'openrouter' | 'nvidia_nim';
type DashboardTab = 'licenses' | 'ai-analytics' | 'ai-control';

const AI_PROVIDER_LABELS: Record<ProviderId, string> = {
  gemini: 'Google Gemini',
  deepseek: 'DeepSeek',
  openrouter: 'OpenRouter',
  nvidia_nim: 'NVIDIA NIM',
};

const AI_FEATURES = [
  'daily_plan',
  'annual_plan',
  'question_generation',
  'question_regeneration',
  'question_formatting',
  'question_improvement',
  'curriculum_analysis',
  'lesson_summary',
  'other_ai',
] as const;

type AIFeature = (typeof AI_FEATURES)[number];

interface Summary {
  licenses: number;
  active: number;
  suspended: number;
  activeDevices: number;
  activeTrials: number;
}

interface License {
  id: string;
  codeHint: string;
  label: string | null;
  status: LicenseStatus;
  expiresAt: string | null;
  maxDevices: number;
  activeDevices: number;
  planId?: string;
  maxSubjects?: number;
  selectedSubjects?: string[];
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Activation {
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

interface LicenseDetail {
  license: License;
  activationCode: string | null;
  activations: Activation[];
}

interface ApiFailure {
  code?: string;
  message?: string;
}

interface AIOverview {
  totalUsers?: number;
  activeTrialUsers?: number;
  activePaidUsers?: number;
  totalInputTokens?: number;
  totalOutputTokens?: number;
  totalTokens?: number;
  totalCost?: number;
  trialCost?: number;
  paidCost?: number;
  avgCostPerTrialUser?: number;
  avgCostPerPaidUser?: number;
  todayCost?: number;
  thisMonthCost?: number;
}

interface AIFeatureMetric {
  featureType: string;
  totalCalls: number;
  totalTokens: number;
  avgInputTokens: number;
  avgOutputTokens: number;
  avgTotalTokens: number;
  totalCost: number;
  avgCost: number;
}

interface AITopConsumer {
  installationId: string;
  isTrial: boolean;
  requestCount: number;
  totalTokens: number;
  totalCost: number;
  lastActiveAt: string | null;
}

interface AIAnalyticsData {
  overview: AIOverview;
  features: AIFeatureMetric[];
  topConsumers: AITopConsumer[];
}

interface AIRoute {
  provider: ProviderId;
  model: string;
}

interface AIRouting {
  version: number;
  trial: Record<AIFeature, AIRoute>;
  licensed: Record<AIFeature, AIRoute>;
  emergency: {
    pausedProviders: ProviderId[];
    paidFallback: AIRoute;
  };
}

interface AIProvider {
  id: ProviderId;
  label: string;
  configured: boolean;
  supportsImages: boolean;
}

interface AIMonitoringError {
  type: string;
  count: number;
}

interface AIProviderMonitoring {
  providerId: ProviderId;
  modelId: string;
  requestCount: number;
  successCount: number;
  failureCount: number;
  processingCount: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number;
  providerCost: number;
  averageLatencyMs: number;
  p95LatencyMs: number;
  lastRequestAt: string | null;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  health: 'healthy' | 'degraded' | 'down' | 'unknown';
  errors: AIMonitoringError[];
}

interface AIControlData {
  routing: AIRouting;
  updatedAt: string;
  monitoring: {
    windowHours: number;
    generatedAt: string;
    providers: AIProviderMonitoring[];
  };
  providers: AIProvider[];
  modelCatalog: Record<ProviderId, string[]>;
}

interface ProviderCredentialStatus {
  id: ProviderId;
  configured: boolean;
  source: 'managed' | 'environment' | 'missing';
  keyVersion: number | null;
  rotatedAt: string | null;
}

interface ProviderKeyAuditEvent {
  providerId: ProviderId;
  action: 'rotated' | 'rejected';
  keyVersion: number | null;
  mfaMethod: 'totp' | 'webauthn' | 'phone';
  failureCode: string | null;
  createdAt: string;
}

interface ProviderKeyControlStatus {
  storageReady: boolean;
  providers: ProviderCredentialStatus[];
  history: ProviderKeyAuditEvent[];
}

interface MFAStatus {
  factorId: string | null;
  currentLevel: string | null;
  nextLevel: string | null;
}

interface MFAEnrollment {
  factorId: string;
  qrCode: string;
  secret: string;
}

const AI_PLANS = [
  {
    value: 'single_subject',
    label: 'مادة دراسية واحدة (Single)',
    maxSubjects: 1,
  },
  {
    value: 'two_subjects',
    label: 'مادتين دراسيتين (Two Subjects)',
    maxSubjects: 2,
  },
  { value: 'pro', label: 'شامل كل المناهج والمواد (Pro)', maxSubjects: 10 },
] as const;

const FEATURE_NAMES_AR: Record<string, string> = {
  daily_plan: 'خطة يومية',
  annual_plan: 'خطة سنوية',
  question_generation: 'توليد أسئلة',
  question_regeneration: 'إعادة توليد أسئلة',
  question_formatting: 'تنسيق الأسئلة',
  question_improvement: 'تحسين وتدقيق الأسئلة',
  curriculum_analysis: 'تحليل المنهج',
  lesson_summary: 'تلخيص الدرس',
  other_ai: 'عمليات أخرى',
};

const SUBSCRIPTION_PLANS = [
  { value: 'one_month', label: 'شهر واحد', detail: 'اشتراك شهري' },
  { value: 'three_months', label: '3 أشهر', detail: 'اشتراك ربع سنوي' },
  { value: 'one_year', label: 'سنة واحدة', detail: 'اشتراك سنوي' },
  { value: 'custom', label: 'مخصص / دائم', detail: 'حدّد التاريخ بنفسك' },
] as const;

type SubscriptionPlan = (typeof SUBSCRIPTION_PLANS)[number]['value'];

const INITIAL_LICENSE_FORM = {
  label: '',
  subscriptionPlan: 'one_month' as SubscriptionPlan,
  planId: 'single_subject',
  maxSubjects: '1',
  expiresOn: '',
  maxDevices: '1',
  notes: '',
};

function isFailure(value: unknown): value is ApiFailure {
  return typeof value === 'object' && value !== null;
}

async function errorFromFunction(
  error: unknown,
  missingFunctionMessage =
    'دالة التراخيص غير منشورة في Supabase. انشر الدالة licenses ثم أعد المحاولة.',
): Promise<Error> {
  const candidate = error as {
    message?: unknown;
    context?: { status?: number; json?: () => Promise<unknown> };
  };
  if (candidate.context?.status === 404) {
    return new Error(missingFunctionMessage);
  }
  const payload = await candidate.context?.json?.().catch(() => null);
  if (isFailure(payload) && typeof payload.message === 'string') {
    return new Error(payload.message);
  }
  return new Error(
    'تعذر الاتصال بخدمة التراخيص. تحقق من اتصالك ثم أعد المحاولة.',
  );
}

async function callAdmin<T>(
  client: SupabaseClient,
  action: string,
  body: Record<string, unknown> = {},
): Promise<T> {
  const { data, error } = await client.functions.invoke('licenses', {
    body: { action, ...body },
  });
  if (error) throw await errorFromFunction(error);
  if (!isFailure(data) || (data as { ok?: unknown }).ok !== true) {
    throw new Error(
      typeof data?.message === 'string'
        ? data.message
        : 'تعذر تنفيذ الطلب حالياً.',
    );
  }
  return data as T;
}

async function callProviderKeyControl<T>(
  client: SupabaseClient,
  action: 'status' | 'rotate',
  body: Record<string, unknown> = {},
): Promise<T> {
  const { data, error } = await client.functions.invoke('provider-keys', {
    body: { action, ...body },
  });
  if (error) {
    throw await errorFromFunction(
      error,
      'دالة إدارة مفاتيح المزوّدين غير منشورة في Supabase. انشر الدالة provider-keys ثم أعد المحاولة.',
    );
  }
  if (!isFailure(data) || (data as { ok?: unknown }).ok !== true) {
    throw new Error(
      typeof data?.message === 'string'
        ? data.message
        : 'تعذر تنفيذ عملية مفتاح المزوّد.',
    );
  }
  return data as T;
}

function formatDate(value: string | null): string {
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

function formatDateTime(value: string | null | undefined): string {
  if (!value) return 'غير متاح';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'غير معروف';
  return new Intl.DateTimeFormat('ar-IQ', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Baghdad',
  }).format(date);
}

function formatNumber(value: number | null | undefined): string {
  return new Intl.NumberFormat('en-US').format(value ?? 0);
}

function formatCost(value: number | null | undefined, digits = 4): string {
  return `$${(value ?? 0).toFixed(digits)}`;
}

function cloneRouteScope(
  scope: Record<AIFeature, AIRoute>,
): Record<AIFeature, AIRoute> {
  const copy = {} as Record<AIFeature, AIRoute>;
  for (const feature of AI_FEATURES) {
    copy[feature] = { ...scope[feature] };
  }
  return copy;
}

function cloneAIRouting(routing: AIRouting): AIRouting {
  return {
    version: routing.version,
    trial: cloneRouteScope(routing.trial),
    licensed: cloneRouteScope(routing.licensed),
    emergency: {
      pausedProviders: [...routing.emergency.pausedProviders],
      paidFallback: { ...routing.emergency.paidFallback },
    },
  };
}

function sameAIRouting(left: AIRouting, right: AIRouting): boolean {
  if (left.version !== right.version) return false;
  for (const feature of AI_FEATURES) {
    const leftTrial = left.trial[feature];
    const rightTrial = right.trial[feature];
    const leftLicensed = left.licensed[feature];
    const rightLicensed = right.licensed[feature];
    if (
      leftTrial.provider !== rightTrial.provider ||
      leftTrial.model !== rightTrial.model ||
      leftLicensed.provider !== rightLicensed.provider ||
      leftLicensed.model !== rightLicensed.model
    ) {
      return false;
    }
  }
  if (
    left.emergency.paidFallback.provider !==
      right.emergency.paidFallback.provider ||
    left.emergency.paidFallback.model !== right.emergency.paidFallback.model
  ) {
    return false;
  }
  const leftPaused = [...left.emergency.pausedProviders].sort();
  const rightPaused = [...right.emergency.pausedProviders].sort();
  return (
    leftPaused.length === rightPaused.length &&
    leftPaused.every((provider, index) => provider === rightPaused[index])
  );
}

function dateInputValue(value: string | null): string {
  return value ? value.slice(0, 10) : '';
}

function statusLabel(status: LicenseStatus): string {
  if (status === 'active') return 'نشط';
  if (status === 'suspended') return 'موقوف مؤقتًا';
  return 'ملغى';
}

/** تستدعي المعالجات التي تعالج أخطاءها داخلياً دون قيمة Promise معلقة في React. */
function runTask(task: Promise<unknown>): void {
  task.catch(() => {});
}

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    if (!supabase) return;
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setSession(data.session);
        setCheckingSession(false);
      }
    });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setCheckingSession(false);
    });
    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  if (!supabase) {
    return <ConfigurationRequired />;
  }
  if (checkingSession) {
    return (
      <main className="center-message">جارٍ التحقق من جلسة الإدارة...</main>
    );
  }
  if (!session) {
    return <Login client={supabase} />;
  }
  return <Dashboard client={supabase} session={session} />;
}

function ConfigurationRequired() {
  return (
    <main className="center-message config-message">
      <div className="brand-mark">ح</div>
      <h1>لوحة تراخيص حقيبة المدرس</h1>
      <p>
        أضف <code>VITE_SUPABASE_URL</code> و{' '}
        <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> إلى ملف البيئة قبل تشغيل
        اللوحة.
      </p>
    </main>
  );
}

function Login({ client }: { client: SupabaseClient }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async () => {
    setError(null);
    setLoading(true);
    const { error: signInError } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
    });
    if (signInError) {
      setError('تعذر فتح تسجيل الدخول بجوجل. حاول مرة أخرى.');
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="brand-mark">ح</div>
        <p className="eyebrow">حقيبة المدرس</p>
        <h1>إدارة التراخيص</h1>
        <p className="muted">
          سجّل الدخول بحساب المالك المخوّل لإدارة رموز التفعيل.
        </p>
        <button
          className="primary-button"
          type="button"
          onClick={login}
          disabled={loading}
        >
          {loading ? 'جارٍ التحويل...' : 'الدخول بواسطة جوجل'}
        </button>
        {error ? <p className="error-message">{error}</p> : null}
      </section>
    </main>
  );
}

function Dashboard({
  client,
  session,
}: {
  client: SupabaseClient;
  session: Session;
}) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [detail, setDetail] = useState<LicenseDetail | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [pendingRevocation, setPendingRevocation] = useState<string | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<DashboardTab>('licenses');
  const [aiAnalytics, setAiAnalytics] = useState<AIAnalyticsData | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [aiControl, setAiControl] = useState<AIControlData | null>(null);
  const [routingDraft, setRoutingDraft] = useState<AIRouting | null>(null);
  const [loadingAIControl, setLoadingAIControl] = useState(false);
  const [savingAIRouting, setSavingAIRouting] = useState(false);
  const [testingProvider, setTestingProvider] = useState<ProviderId | null>(
    null,
  );
  const [refreshingAll, setRefreshingAll] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [dirtyLicenseIds, setDirtyLicenseIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [form, setForm] = useState(INITIAL_LICENSE_FORM);
  const routingDirty = Boolean(
    routingDraft &&
      aiControl &&
      !sameAIRouting(routingDraft, aiControl.routing),
  );
  const routingDirtyRef = useRef(routingDirty);

  useEffect(() => {
    routingDirtyRef.current = routingDirty;
  }, [routingDirty]);

  const load = useCallback(
    async (nextSearch = '', reportErrors = true): Promise<boolean> => {
      setLoading(true);
      if (reportErrors) setError(null);
      try {
        const [summaryResponse, listResponse] = await Promise.all([
          callAdmin<{ summary: Summary }>(client, 'admin-summary'),
          callAdmin<{ licenses: License[] }>(client, 'admin-list-licenses', {
            search: nextSearch,
          }),
        ]);
        setSummary(summaryResponse.summary);
        setLicenses(listResponse.licenses);
        return true;
      } catch (loadError) {
        if (reportErrors) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'تعذر تحميل البيانات.',
          );
        }
        return false;
      } finally {
        setLoading(false);
      }
    },
    [client],
  );

  const loadAIAnalytics = useCallback(
    async (reportErrors = true): Promise<boolean> => {
      setLoadingAnalytics(true);
      if (reportErrors) setError(null);
      try {
        const res = await callAdmin<AIAnalyticsData>(
          client,
          'admin-get-ai-analytics',
        );
        setAiAnalytics(res);
        return true;
      } catch (analyticsError) {
        if (reportErrors) {
          setError(
            analyticsError instanceof Error
              ? analyticsError.message
              : 'تعذر تحميل إحصائيات الذكاء الاصطناعي.',
          );
        }
        return false;
      } finally {
        setLoadingAnalytics(false);
      }
    },
    [client],
  );

  const loadAIControl = useCallback(
    async (reportErrors = true): Promise<boolean> => {
      setLoadingAIControl(true);
      if (reportErrors) setError(null);
      try {
        const result = await callAdmin<AIControlData>(
          client,
          'admin-get-ai-control',
        );
        setAiControl(result);
        if (!routingDirtyRef.current) {
          setRoutingDraft(cloneAIRouting(result.routing));
        }
        return true;
      } catch (controlError) {
        if (reportErrors) {
          setError(
            controlError instanceof Error
              ? controlError.message
              : 'تعذر تحميل مركز تحكم الذكاء الاصطناعي.',
          );
        }
        return false;
      } finally {
        setLoadingAIControl(false);
      }
    },
    [client],
  );

  useEffect(() => {
    runTask(load(''));
  }, [load]);

  useEffect(() => {
    if (activeTab === 'ai-analytics') {
      runTask(loadAIAnalytics());
    }
    if (activeTab === 'ai-control') {
      runTask(loadAIControl());
    }
  }, [activeTab, loadAIAnalytics, loadAIControl]);

  const createLicense = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreating(true);
    setError(null);
    setNotice(null);
    try {
      const result = await callAdmin<{
        license: License;
        activationCode: string;
      }>(client, 'admin-create-license', {
        label: form.label,
        subscriptionPlan: form.subscriptionPlan,
        expiresOn:
          form.subscriptionPlan === 'custom' ? form.expiresOn || null : null,
        maxDevices: Number(form.maxDevices),
        planId: form.planId,
        maxSubjects: Number(form.maxSubjects),
        notes: form.notes,
      });
      setCreatedCode(result.activationCode);
      setForm(INITIAL_LICENSE_FORM);
      setNotice('تم إنشاء الترخيص. يمكنك فتح الترخيص لاحقاً لنسخ رمز التفعيل.');
      await load(search);
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : 'تعذر إنشاء الترخيص.',
      );
    } finally {
      setCreating(false);
    }
  };

  const openDetail = useCallback(
    async (licenseId: string, reportErrors = true): Promise<boolean> => {
      if (reportErrors) setError(null);
      try {
        const result = await callAdmin<LicenseDetail>(
          client,
          'admin-license-detail',
          {
            licenseId,
          },
        );
        setDetail(result);
        return true;
      } catch (detailError) {
        if (reportErrors) {
          setError(
            detailError instanceof Error
              ? detailError.message
              : 'تعذر تحميل الأجهزة.',
          );
        }
        return false;
      }
    },
    [client],
  );

  const updateLicense = useCallback(
    async (licenseId: string, changes: Record<string, unknown>) => {
      setError(null);
      try {
        await callAdmin(client, 'admin-update-license', {
          licenseId,
          ...changes,
        });
        setNotice('تم حفظ التعديلات.');
        await load(search);
        if (detail?.license.id === licenseId) {
          await openDetail(licenseId);
        }
      } catch (updateError) {
        setError(
          updateError instanceof Error
            ? updateError.message
            : 'تعذر حفظ التعديلات.',
        );
      }
    },
    [client, detail, load, openDetail, search],
  );

  const revokeActivation = useCallback(
    async (activationId: string) => {
      if (!detail) return;
      setError(null);
      try {
        await callAdmin(client, 'admin-revoke-activation', {
          licenseId: detail.license.id,
          activationId,
        });
        setNotice('تم إلغاء تفعيل الجهاز.');
        await openDetail(detail.license.id);
        await load(search);
      } catch (revokeError) {
        setError(
          revokeError instanceof Error
            ? revokeError.message
            : 'تعذر إلغاء التفعيل.',
        );
      }
    },
    [client, detail, load, openDetail, search],
  );

  const copyCode = useCallback(async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setNotice('تم نسخ رمز التفعيل.');
    } catch {
      setNotice('حدّد الرمز وانسخه يدوياً.');
    }
  }, []);

  const saveLicense = useCallback(
    (licenseId: string, changes: Record<string, unknown>) => {
      runTask(updateLicense(licenseId, changes));
    },
    [updateLicense],
  );

  const openDevices = useCallback(
    (licenseId: string) => {
      runTask(openDetail(licenseId));
    },
    [openDetail],
  );

  const trackLicenseDirty = useCallback((licenseId: string, dirty: boolean) => {
    setDirtyLicenseIds(current => {
      if (current.has(licenseId) === dirty) return current;
      const next = new Set(current);
      if (dirty) next.add(licenseId);
      else next.delete(licenseId);
      return next;
    });
  }, []);

  const updateAIRoute = useCallback(
    (scope: 'trial' | 'licensed', feature: AIFeature, route: AIRoute) => {
      routingDirtyRef.current = true;
      setRoutingDraft(current => {
        if (!current) return current;
        const next = cloneAIRouting(current);
        next[scope][feature] = route;
        return next;
      });
    },
    [],
  );

  const togglePausedProvider = useCallback((provider: ProviderId) => {
    routingDirtyRef.current = true;
    setRoutingDraft(current => {
      if (!current) return current;
      const next = cloneAIRouting(current);
      const paused = next.emergency.pausedProviders.includes(provider);
      next.emergency.pausedProviders = paused
        ? next.emergency.pausedProviders.filter(item => item !== provider)
        : [...next.emergency.pausedProviders, provider];
      return next;
    });
  }, []);

  const updatePaidFallback = useCallback((route: AIRoute) => {
    routingDirtyRef.current = true;
    setRoutingDraft(current => {
      if (!current) return current;
      const next = cloneAIRouting(current);
      next.emergency.paidFallback = { ...route };
      return next;
    });
  }, []);

  const saveAIRouting = useCallback(async () => {
    if (!routingDraft || !aiControl) return;
    setSavingAIRouting(true);
    setError(null);
    setNotice(null);
    try {
      const result = await callAdmin<{
        routing: AIRouting;
        updatedAt: string;
      }>(client, 'admin-update-ai-routing', {
        routing: routingDraft,
        expectedUpdatedAt: aiControl.updatedAt,
      });
      setAiControl(current =>
        current
          ? { ...current, routing: result.routing, updatedAt: result.updatedAt }
          : current,
      );
      setRoutingDraft(cloneAIRouting(result.routing));
      routingDirtyRef.current = false;
      setNotice('تم حفظ توجيه AI وإعدادات الطوارئ.');
    } catch (routingError) {
      setError(
        routingError instanceof Error
          ? routingError.message
          : 'تعذر حفظ إعدادات توجيه الذكاء الاصطناعي.',
      );
    } finally {
      setSavingAIRouting(false);
    }
  }, [aiControl, client, routingDraft]);

  const testAIProvider = useCallback(
    async (providerId: ProviderId) => {
      setTestingProvider(providerId);
      setError(null);
      setNotice(null);
      try {
        const result = await callAdmin<{
          providerId: ProviderId;
          modelId: string;
          latencyMs: number;
        }>(client, 'admin-test-ai-provider', { providerId });
        setNotice(
          `نجح اختبار ${AI_PROVIDER_LABELS[result.providerId]} عبر ${
            result.modelId
          } خلال ${formatNumber(result.latencyMs)} ms.`,
        );
        await loadAIControl(false);
      } catch (testError) {
        setError(
          testError instanceof Error
            ? testError.message
            : 'تعذر اختبار اتصال مزوّد الذكاء الاصطناعي.',
        );
      } finally {
        setTestingProvider(null);
      }
    },
    [client, loadAIControl],
  );

  const refreshAll = useCallback(async () => {
    setRefreshingAll(true);
    setError(null);
    setNotice(null);
    const detailId = detail?.license.id;
    const [licensesLoaded, analyticsLoaded, controlLoaded, detailLoaded] =
      await Promise.all([
        load(search, false),
        loadAIAnalytics(false),
        loadAIControl(false),
        detailId ? openDetail(detailId, false) : Promise.resolve(true),
      ]);
    if (licensesLoaded && analyticsLoaded && controlLoaded) {
      setLastUpdated(new Date().toISOString());
      setNotice(
        detailLoaded
          ? 'تم تحديث بيانات مركز العمليات.'
          : 'تم تحديث المركز، وتعذر تحديث تفاصيل الترخيص المفتوحة فقط.',
      );
    } else {
      setError('تعذر تحديث جزء من بيانات المركز. حاول مرة أخرى.');
    }
    setRefreshingAll(false);
  }, [detail, load, loadAIAnalytics, loadAIControl, openDetail, search]);

  return (
    <main className="command-center">
      <aside className="command-rail" aria-label="التنقل الرئيسي">
        <div className="rail-brand">
          <div className="brand-mark compact">ح</div>
          <div>
            <p className="eyebrow">حقيبة المدرس</p>
            <h1>مركز قيادة المالك</h1>
          </div>
        </div>

        <nav className="rail-navigation" aria-label="أقسام المركز">
          <button
            type="button"
            className={`rail-nav-button ${
              activeTab === 'licenses' ? 'active' : ''
            }`}
            aria-current={activeTab === 'licenses' ? 'page' : undefined}
            onClick={() => setActiveTab('licenses')}
          >
            <span className="nav-sequence" aria-hidden="true">
              01
            </span>
            <span>إدارة التراخيص</span>
          </button>
          <button
            type="button"
            className={`rail-nav-button ${
              activeTab === 'ai-analytics' ? 'active' : ''
            }`}
            aria-current={activeTab === 'ai-analytics' ? 'page' : undefined}
            onClick={() => setActiveTab('ai-analytics')}
          >
            <span className="nav-sequence" aria-hidden="true">
              02
            </span>
            <span>تحليلات AI</span>
          </button>
          <button
            type="button"
            className={`rail-nav-button ${
              activeTab === 'ai-control' ? 'active' : ''
            }`}
            aria-current={activeTab === 'ai-control' ? 'page' : undefined}
            onClick={() => setActiveTab('ai-control')}
          >
            <span className="nav-sequence" aria-hidden="true">
              03
            </span>
            <span>مركز تحكم AI</span>
          </button>
        </nav>

        <div className="rail-account">
          <span>جلسة المالك</span>
          <strong dir="ltr">{session.user.email ?? 'owner account'}</strong>
          <button
            className="rail-signout"
            type="button"
            onClick={() => client.auth.signOut()}
          >
            تسجيل الخروج
          </button>
        </div>
      </aside>

      <section className="command-workspace">
        <header className="command-header">
          <div>
            <p className="eyebrow">غرفة العمليات</p>
            <h2>
              {activeTab === 'licenses'
                ? 'إدارة التراخيص والأجهزة'
                : activeTab === 'ai-analytics'
                ? 'تحليلات واستهلاك AI'
                : 'مركز تحكم AI'}
            </h2>
          </div>
          <div className="command-header-actions">
            <p className="refresh-state" aria-live="polite">
              <span
                className={`refresh-indicator ${
                  refreshingAll ? 'loading' : ''
                }`}
                aria-hidden="true"
              />
              {refreshingAll
                ? 'جارٍ تحديث كل المصادر...'
                : lastUpdated
                ? `آخر تحديث شامل: ${formatDateTime(lastUpdated)}`
                : 'لم يُجرَ تحديث شامل بعد'}
            </p>
            <button
              className="refresh-all-button"
              type="button"
              onClick={() => runTask(refreshAll())}
              disabled={refreshingAll}
            >
              {refreshingAll ? 'جارٍ التحديث...' : 'تحديث الكل'}
            </button>
          </div>
        </header>

        <div className="page-content">
          {dirtyLicenseIds.size > 0 || routingDirty ? (
            <p className="draft-marker" role="status">
              توجد تعديلات غير محفوظة؛ التحديث الشامل يحافظ على مسودات التراخيص
              وتوجيه AI.
            </p>
          ) : null}

          {error ? <p className="alert error-message">{error}</p> : null}
          {notice ? <p className="alert success-message">{notice}</p> : null}

          {activeTab === 'licenses' ? (
            <>
              <section className="stats" aria-label="ملخص التراخيص">
                <Stat label="كل التراخيص" value={summary?.licenses} />
                <Stat
                  label="تراخيص نشطة"
                  value={summary?.active}
                  accent="blue"
                />
                <Stat
                  label="أجهزة مفعلة"
                  value={summary?.activeDevices}
                  accent="green"
                />
                <Stat
                  label="تجارب نشطة"
                  value={summary?.activeTrials}
                  accent="orange"
                />
              </section>

              <section className="work-grid">
                <form className="panel create-panel" onSubmit={createLicense}>
                  <div className="section-heading">
                    <div>
                      <p className="eyebrow">رمز جديد</p>
                      <h2>إنشاء ترخيص</h2>
                    </div>
                    <span className="subtle">
                      يمكن استرجاع الرمز من تفاصيل الترخيص
                    </span>
                  </div>

                  <label>
                    اسم أو ملاحظة داخلية
                    <input
                      value={form.label}
                      onChange={event =>
                        setForm({ ...form, label: event.target.value })
                      }
                      placeholder="مثال: الأستاذة سارة - سنوي"
                      maxLength={120}
                      disabled={creating}
                    />
                  </label>
                  <fieldset className="subscription-options">
                    <legend>مدة الاشتراك</legend>
                    <div className="subscription-grid">
                      {SUBSCRIPTION_PLANS.map(plan => (
                        <label
                          className={`subscription-choice ${
                            form.subscriptionPlan === plan.value
                              ? 'selected'
                              : ''
                          }`}
                          key={plan.value}
                        >
                          <input
                            type="radio"
                            name="subscriptionPlan"
                            value={plan.value}
                            checked={form.subscriptionPlan === plan.value}
                            disabled={creating}
                            onChange={() =>
                              setForm({ ...form, subscriptionPlan: plan.value })
                            }
                          />
                          <span>
                            <strong>{plan.label}</strong>
                            <small>{plan.detail}</small>
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <div className="form-row">
                    {form.subscriptionPlan === 'custom' ? (
                      <label>
                        ينتهي في (اختياري)
                        <input
                          type="date"
                          value={form.expiresOn}
                          disabled={creating}
                          onChange={event =>
                            setForm({ ...form, expiresOn: event.target.value })
                          }
                        />
                      </label>
                    ) : (
                      <p className="plan-note">
                        يُحسب الانتهاء تلقائياً من وقت الخادم وبنهاية اليوم
                        بتوقيت العراق.
                      </p>
                    )}
                    <label>
                      عدد الأجهزة
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={form.maxDevices}
                        disabled={creating}
                        onChange={event =>
                          setForm({ ...form, maxDevices: event.target.value })
                        }
                      />
                    </label>
                  </div>
                  <div className="form-row">
                    <label>
                      خطة الذكاء الاصطناعي (AI Plan)
                      <select
                        value={form.planId}
                        disabled={creating}
                        onChange={event => {
                          const nextPlan = event.target.value;
                          const defaultMax =
                            nextPlan === 'two_subjects'
                              ? '2'
                              : nextPlan === 'pro'
                              ? '10'
                              : '1';
                          setForm({
                            ...form,
                            planId: nextPlan,
                            maxSubjects: defaultMax,
                          });
                        }}
                      >
                        {AI_PLANS.map(p => (
                          <option key={p.value} value={p.value}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      عدد المواد المسموحة
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={form.maxSubjects}
                        disabled={creating}
                        onChange={event =>
                          setForm({ ...form, maxSubjects: event.target.value })
                        }
                      />
                    </label>
                  </div>
                  <label>
                    ملاحظات
                    <textarea
                      value={form.notes}
                      onChange={event =>
                        setForm({ ...form, notes: event.target.value })
                      }
                      placeholder="معلومات داخلية لا تظهر للمستخدم"
                      maxLength={1000}
                      rows={3}
                      disabled={creating}
                    />
                  </label>
                  <button
                    className="primary-button"
                    type="submit"
                    disabled={creating}
                  >
                    {creating ? 'جارٍ الإنشاء...' : 'إنشاء رمز التفعيل'}
                  </button>
                </form>

                <section className="panel guide-panel">
                  <p className="eyebrow">طريقة العمل</p>
                  <h2>مسار بسيط وآمن</h2>
                  <p>
                    أنشئ رمزاً، أرسله للمستخدم بالطريقة المناسبة لك، ثم راقب
                    الأجهزة المفعلة من هذه اللوحة.
                  </p>
                  <p>
                    افتح تفاصيل الترخيص في أي وقت لعرض رمز التفعيل ونسخه. الرموز
                    القديمة التي أُنشئت قبل هذه الميزة لا يمكن استرجاعها.
                  </p>
                  <p className="subtle">
                    التواريخ تنتهي في نهاية اليوم المحدد بتوقيت العراق.
                  </p>
                </section>
              </section>

              {createdCode ? (
                <section className="created-code" aria-live="polite">
                  <div>
                    <p className="eyebrow">رمز التفعيل الجديد</p>
                    <strong dir="ltr">{createdCode}</strong>
                  </div>
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => runTask(copyCode(createdCode))}
                  >
                    نسخ الرمز
                  </button>
                </section>
              ) : null}

              <section className="panel licenses-panel">
                <div className="section-heading licenses-heading">
                  <div>
                    <p className="eyebrow">السجل</p>
                    <h2>التراخيص</h2>
                  </div>
                  <form
                    className="search-form"
                    onSubmit={event => {
                      event.preventDefault();
                      runTask(load(search));
                    }}
                  >
                    <input
                      value={search}
                      onChange={event => setSearch(event.target.value)}
                      placeholder="ابحث بالاسم أو رمز كامل"
                    />
                    <button className="secondary-button" type="submit">
                      بحث
                    </button>
                  </form>
                </div>

                {loading ? (
                  <p className="empty-state">جارٍ تحميل التراخيص...</p>
                ) : null}
                {!loading && licenses.length === 0 ? (
                  <p className="empty-state">لا توجد تراخيص مطابقة.</p>
                ) : null}
                <div className="license-list">
                  {licenses.map(license => (
                    <LicenseCard
                      key={license.id}
                      license={license}
                      onSave={saveLicense}
                      onDevices={openDevices}
                      onDirtyChange={trackLicenseDirty}
                    />
                  ))}
                </div>
              </section>

              {detail ? (
                <section className="panel details-panel">
                  <div className="section-heading">
                    <div>
                      <p className="eyebrow">الأجهزة المرتبطة</p>
                      <h2>
                        {detail.license.label ||
                          `رمز ينتهي بـ ${detail.license.codeHint}`}
                      </h2>
                    </div>
                    <button
                      className="text-button"
                      type="button"
                      onClick={() => setDetail(null)}
                    >
                      إغلاق
                    </button>
                  </div>
                  {detail.activationCode ? (
                    <div className="recovered-code">
                      <div>
                        <p className="eyebrow">رمز التفعيل</p>
                        <strong dir="ltr">{detail.activationCode}</strong>
                      </div>
                      <button
                        className="secondary-button"
                        type="button"
                        onClick={() => {
                          if (detail.activationCode) {
                            runTask(copyCode(detail.activationCode));
                          }
                        }}
                      >
                        نسخ الرمز
                      </button>
                    </div>
                  ) : (
                    <p className="code-unavailable">
                      هذا ترخيص قديم أُنشئ قبل تفعيل الحفظ المشفّر للرموز، لذلك
                      لا يمكن استرجاع رمزه. أنشئ رمزاً جديداً عند الحاجة.
                    </p>
                  )}
                  {detail.activations.length === 0 ? (
                    <p className="empty-state">
                      لم يُفعّل هذا الرمز على أي جهاز بعد.
                    </p>
                  ) : (
                    <div className="activation-list">
                      {detail.activations.map(activation => (
                        <article className="activation-row" key={activation.id}>
                          <div>
                            <strong>{activation.installationHint}</strong>
                            <span>
                              {activation.platform}{' '}
                              {activation.appVersion
                                ? `- ${activation.appVersion}`
                                : ''}
                            </span>
                            <span>
                              آخر تحقق: {formatDate(activation.lastCheckedAt)}
                            </span>
                          </div>
                          {activation.active ? (
                            <button
                              className="danger-button"
                              type="button"
                              onClick={() =>
                                setPendingRevocation(activation.id)
                              }
                            >
                              إلغاء التفعيل
                            </button>
                          ) : (
                            <span className="status-badge muted-badge">
                              غير نشط
                            </span>
                          )}
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              ) : null}

              {pendingRevocation ? (
                <div className="modal-backdrop" role="presentation">
                  <section
                    className="confirmation-modal"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="revoke-title"
                  >
                    <p className="eyebrow">إجراء حساس</p>
                    <h2 id="revoke-title">إلغاء تفعيل الجهاز؟</h2>
                    <p>
                      سيفقد هذا الجهاز الوصول عند التحقق التالي. يمكن لصاحب
                      الرمز إدخاله مجددًا ما لم توقف الترخيص نفسه.
                    </p>
                    <div className="modal-actions">
                      <button
                        className="text-button"
                        type="button"
                        onClick={() => setPendingRevocation(null)}
                      >
                        إلغاء
                      </button>
                      <button
                        className="danger-button"
                        type="button"
                        onClick={() => {
                          const activationId = pendingRevocation;
                          setPendingRevocation(null);
                          runTask(revokeActivation(activationId));
                        }}
                      >
                        نعم، ألغِ التفعيل
                      </button>
                    </div>
                  </section>
                </div>
              ) : null}
            </>
          ) : activeTab === 'ai-analytics' ? (
            <AIAnalyticsView
              data={aiAnalytics}
              loading={loadingAnalytics}
              onRefresh={() => runTask(loadAIAnalytics())}
            />
          ) : (
            <AIControlView
              client={client}
              data={aiControl}
              routing={routingDraft}
              loading={loadingAIControl}
              saving={savingAIRouting}
              dirty={routingDirty}
              onRefresh={() => runTask(loadAIControl())}
              onRouteChange={updateAIRoute}
              onTogglePausedProvider={togglePausedProvider}
              onPaidFallbackChange={updatePaidFallback}
              onTestProvider={provider => runTask(testAIProvider(provider))}
              testingProvider={testingProvider}
              onSave={() => runTask(saveAIRouting())}
              onProviderRotated={() => loadAIControl(false)}
            />
          )}
        </div>
      </section>
    </main>
  );
}

const Stat = memo(function StatCard({
  label,
  value,
  accent = 'slate',
}: {
  label: string;
  value?: number;
  accent?: string;
}) {
  return (
    <article className={`stat-card ${accent}`}>
      <strong>{value ?? '...'}</strong>
      <span>{label}</span>
    </article>
  );
});

interface LicenseEditDraft {
  status: LicenseStatus;
  maxDevices: string;
  expiresOn: string;
  planId: string;
  maxSubjects: string;
}

function licenseEditDraft(license: License): LicenseEditDraft {
  return {
    status: license.status,
    maxDevices: String(license.maxDevices),
    expiresOn: dateInputValue(license.expiresAt),
    planId: license.planId || 'single_subject',
    maxSubjects: String(license.maxSubjects || 1),
  };
}

function sameLicenseEditDraft(
  left: LicenseEditDraft,
  right: LicenseEditDraft,
): boolean {
  return (
    left.status === right.status &&
    left.maxDevices === right.maxDevices &&
    left.expiresOn === right.expiresOn &&
    left.planId === right.planId &&
    left.maxSubjects === right.maxSubjects
  );
}

const LicenseCard = memo(function LicenseCardItem({
  license,
  onSave,
  onDevices,
  onDirtyChange,
}: {
  license: License;
  onSave: (licenseId: string, changes: Record<string, unknown>) => void;
  onDevices: (licenseId: string) => void;
  onDirtyChange: (licenseId: string, dirty: boolean) => void;
}) {
  const [draft, setDraft] = useState<LicenseEditDraft>(() =>
    licenseEditDraft(license),
  );
  const baselineRef = useRef<LicenseEditDraft>(licenseEditDraft(license));
  const dirty = !sameLicenseEditDraft(draft, baselineRef.current);

  useEffect(() => {
    const next = licenseEditDraft(license);
    setDraft(current => {
      const wasDirty = !sameLicenseEditDraft(current, baselineRef.current);
      baselineRef.current = next;
      return !wasDirty || sameLicenseEditDraft(current, next) ? next : current;
    });
  }, [license]);

  useEffect(() => {
    onDirtyChange(license.id, dirty);
    return () => onDirtyChange(license.id, false);
  }, [dirty, license.id, onDirtyChange]);

  const planObj = AI_PLANS.find(p => p.value === draft.planId) || AI_PLANS[0];

  return (
    <article className="license-card">
      <div className="license-card-title">
        <div>
          <h3>{license.label || 'ترخيص بلا اسم'}</h3>
          <p dir="ltr">****-{license.codeHint}</p>
        </div>
        <span className={`status-badge ${draft.status}`}>
          {statusLabel(draft.status)}
        </span>
      </div>
      <div className="license-meta">
        <span>
          الأجهزة: {license.activeDevices} / {draft.maxDevices}
        </span>
        <span>الانتهاء: {formatDate(license.expiresAt)}</span>
        <span>
          خطة AI: {planObj ? planObj.label : 'مادة واحدة'} (
          {draft.maxSubjects || 1} مادة)
        </span>
        {license.selectedSubjects && license.selectedSubjects.length > 0 && (
          <span>المواد المعتمدة: {license.selectedSubjects.join('، ')}</span>
        )}
        <span>أُنشئ: {formatDate(license.createdAt)}</span>
      </div>
      <div className="license-controls">
        <label>
          الحالة
          <select
            value={draft.status}
            onChange={event =>
              setDraft(current => ({
                ...current,
                status: event.target.value as LicenseStatus,
              }))
            }
          >
            <option value="active">نشط</option>
            <option value="suspended">موقوف مؤقتًا</option>
            <option value="revoked">ملغى</option>
          </select>
        </label>
        <label>
          الأجهزة
          <input
            type="number"
            min="1"
            max="50"
            value={draft.maxDevices}
            onChange={event =>
              setDraft(current => ({
                ...current,
                maxDevices: event.target.value,
              }))
            }
          />
        </label>
        <label>
          خطة AI
          <select
            value={draft.planId}
            onChange={event => {
              const val = event.target.value;
              const defaultMax =
                val === 'two_subjects' ? '2' : val === 'pro' ? '15' : '1';
              setDraft(current => ({
                ...current,
                planId: val,
                maxSubjects: defaultMax,
              }));
            }}
          >
            {AI_PLANS.map(p => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          عدد المواد
          <input
            type="number"
            min="1"
            max="20"
            value={draft.maxSubjects}
            onChange={event =>
              setDraft(current => ({
                ...current,
                maxSubjects: event.target.value,
              }))
            }
          />
        </label>
        <label>
          تاريخ الانتهاء
          <input
            type="date"
            value={draft.expiresOn}
            onChange={event =>
              setDraft(current => ({
                ...current,
                expiresOn: event.target.value,
              }))
            }
          />
        </label>
      </div>
      <div className="license-actions">
        <button
          className="secondary-button"
          type="button"
          onClick={() =>
            onSave(license.id, {
              status: draft.status,
              maxDevices: Number(draft.maxDevices),
              expiresOn: draft.expiresOn || null,
              planId: draft.planId,
              maxSubjects: Number(draft.maxSubjects),
            })
          }
        >
          حفظ التعديل
        </button>
        {dirty ? <span className="unsaved-chip">تعديل غير محفوظ</span> : null}
        <button
          className="text-button"
          type="button"
          onClick={() => onDevices(license.id)}
        >
          إدارة الترخيص
        </button>
      </div>
    </article>
  );
});

function AIAnalyticsView({
  data,
  loading,
  onRefresh,
}: {
  data: AIAnalyticsData | null;
  loading: boolean;
  onRefresh: () => void;
}) {
  const overview = data?.overview;
  const features = data?.features ?? [];
  const topConsumers = data?.topConsumers ?? [];

  return (
    <div className="analytics-view">
      <div className="section-heading">
        <div>
          <p className="eyebrow">الاستهلاك والتكاليف الحقيقية</p>
          <h2>لوحة تحليلات الذكاء الاصطناعي</h2>
        </div>
        <button
          className="secondary-button"
          type="button"
          onClick={onRefresh}
          disabled={loading}
        >
          {loading ? 'جارٍ التحديث...' : 'تحديث البيانات'}
        </button>
      </div>

      {loading && !data ? (
        <p className="empty-state">جارٍ تحميل بيانات الاستهلاك والتكاليف...</p>
      ) : null}

      {/* بطاقات المؤشرات الإجمالية */}
      <section className="stats" aria-label="ملخص استهلاك الذكاء الاصطناعي">
        <article className="stat-card blue">
          <strong className="cost-highlight">
            ${(overview?.totalCost ?? 0).toFixed(4)}
          </strong>
          <span>إجمالي تكلفة API المقدرة</span>
        </article>
        <article className="stat-card green">
          <strong className="cost-highlight">
            ${(overview?.paidCost ?? 0).toFixed(4)}
          </strong>
          <span>تكلفة المشتركين المدفوعين</span>
        </article>
        <article className="stat-card orange">
          <strong className="cost-highlight">
            ${(overview?.trialCost ?? 0).toFixed(4)}
          </strong>
          <span>تكلفة المستخدمين التجريبيين</span>
        </article>
        <article className="stat-card slate">
          <strong className="cost-highlight">
            ${(overview?.todayCost ?? 0).toFixed(4)}
          </strong>
          <span>تكلفة اليوم (اليوم الحالي)</span>
        </article>
        <article className="stat-card slate">
          <strong className="cost-highlight">
            ${(overview?.thisMonthCost ?? 0).toFixed(4)}
          </strong>
          <span>تكلفة الشهر الحالي</span>
        </article>
        <article className="stat-card blue">
          <strong className="token-highlight">
            {(overview?.totalTokens ?? 0).toLocaleString()}
          </strong>
          <span>إجمالي التوكنز المستهلكة</span>
        </article>
      </section>

      {/* جدول متوسطات وتفاصيل العمليات */}
      <section className="panel analytics-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">المتوسطات وتكاليف الميزات</p>
            <h2>تحليل استهلاك الأدوات (Feature Breakdown)</h2>
          </div>
        </div>

        {features.length === 0 ? (
          <p className="empty-state">لا توجد عمليات ذكاء اصطناعي مسجلة بعد.</p>
        ) : (
          <div className="table-responsive">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>الميزة / الأداة</th>
                  <th>العمليات</th>
                  <th>متوسط الإدخال (Input)</th>
                  <th>متوسط الإخراج (Output)</th>
                  <th>متوسط التوكنز / عملية</th>
                  <th>إجمالي التكلفة ($)</th>
                  <th>متوسط التكلفة / عملية ($)</th>
                </tr>
              </thead>
              <tbody>
                {features.map(f => (
                  <tr key={f.featureType}>
                    <td>
                      <strong>
                        {FEATURE_NAMES_AR[f.featureType] || f.featureType}
                      </strong>
                    </td>
                    <td>{f.totalCalls.toLocaleString()}</td>
                    <td dir="ltr">
                      {Math.round(f.avgInputTokens || 0).toLocaleString()}
                    </td>
                    <td dir="ltr">
                      {Math.round(f.avgOutputTokens || 0).toLocaleString()}
                    </td>
                    <td dir="ltr">
                      <span className="token-highlight">
                        {Math.round(f.avgTotalTokens || 0).toLocaleString()}
                      </span>
                    </td>
                    <td dir="ltr">
                      <span className="cost-highlight">
                        ${(f.totalCost || 0).toFixed(4)}
                      </span>
                    </td>
                    <td dir="ltr">
                      <span className="cost-highlight">
                        ${(f.avgCost || 0).toFixed(5)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* أعلى الأجهزة استهلاكاً */}
      <section className="panel analytics-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">كشف الأنماط الشاذة وكبار المستهلكين</p>
            <h2>أعلى الأجهزة استهلاكاً (Top Consumers)</h2>
          </div>
        </div>

        {topConsumers.length === 0 ? (
          <p className="empty-state">لا توجد بيانات استهلاك للأجهزة بعد.</p>
        ) : (
          <div className="table-responsive">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>معرّف الجهاز (Installation)</th>
                  <th>النوع</th>
                  <th>عدد العمليات</th>
                  <th>إجمالي التوكنز</th>
                  <th>التكلفة التراكمية ($)</th>
                  <th>آخر استخدام</th>
                </tr>
              </thead>
              <tbody>
                {topConsumers.map(c => (
                  <tr key={c.installationId}>
                    <td dir="ltr">
                      <code>...{c.installationId.slice(-8)}</code>
                    </td>
                    <td>
                      <span
                        className={c.isTrial ? 'badge-trial' : 'badge-paid'}
                      >
                        {c.isTrial ? 'تجريبي' : 'مرخص'}
                      </span>
                    </td>
                    <td>{c.requestCount.toLocaleString()}</td>
                    <td dir="ltr">
                      <span className="token-highlight">
                        {c.totalTokens.toLocaleString()}
                      </span>
                    </td>
                    <td dir="ltr">
                      <span className="cost-highlight">
                        ${(c.totalCost || 0).toFixed(4)}
                      </span>
                    </td>
                    <td>{formatDate(c.lastActiveAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function providerStatusLabel(configured: boolean): string {
  return configured ? 'مهيأ' : 'غير مهيأ';
}

function providerHealthLabel(health: AIProviderMonitoring['health']): string {
  if (health === 'healthy') return 'مستقر';
  if (health === 'degraded') return 'متدهور';
  if (health === 'down') return 'متوقف';
  return 'غير معروف';
}

function allowedProvidersForRoute(
  scope: 'trial' | 'licensed',
  feature: AIFeature,
): ProviderId[] {
  if (scope === 'trial' || feature === 'other_ai') return ['gemini'];
  return ['gemini', 'deepseek', 'openrouter', 'nvidia_nim'];
}

function RouteEditor({
  scope,
  feature,
  route,
  providers,
  modelCatalog,
  disabled,
  onChange,
}: {
  scope: 'trial' | 'licensed';
  feature: AIFeature;
  route: AIRoute;
  providers: AIProvider[];
  modelCatalog: Record<ProviderId, string[]>;
  disabled: boolean;
  onChange: (route: AIRoute) => void;
}) {
  const allowedProviders = allowedProvidersForRoute(scope, feature);
  const selectedProvider = providers.find(
    provider => provider.id === route.provider,
  );
  const models = modelCatalog[route.provider];
  const visibleModels = models.includes(route.model)
    ? models
    : [route.model, ...models];
  const restricted = scope === 'trial' || feature === 'other_ai';

  return (
    <div className="route-row">
      <div className="route-label">
        <strong>{FEATURE_NAMES_AR[feature]}</strong>
        {restricted ? (
          <span className="route-rule">
            {scope === 'trial' ? 'Gemini فقط للتجربة' : 'Gemini فقط للصور'}
          </span>
        ) : null}
      </div>
      <div className="route-selects">
        <label>
          <span>المزوّد</span>
          <select
            value={route.provider}
            disabled={disabled}
            onChange={event => {
              const provider = event.target.value as ProviderId;
              const nextModels = modelCatalog[provider];
              onChange({
                provider,
                model: nextModels[0] ?? route.model,
              });
            }}
          >
            {allowedProviders.map(providerId => {
              const provider = providers.find(item => item.id === providerId);
              return (
                <option key={providerId} value={providerId}>
                  {provider?.label ?? providerId} -{' '}
                  {providerStatusLabel(provider?.configured ?? false)}
                </option>
              );
            })}
          </select>
        </label>
        <label>
          <span>النموذج</span>
          <select
            value={route.model}
            disabled={disabled || visibleModels.length === 0}
            onChange={event =>
              onChange({ ...route, model: event.target.value })
            }
          >
            {visibleModels.map(model => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
        </label>
      </div>
      {!selectedProvider?.configured ? (
        <p className="route-warning">
          المزوّد المختار غير مهيأ، ولن يعالج الطلبات حتى تُضبط مفاتيحه على
          الخادم.
        </p>
      ) : null}
    </div>
  );
}

function ProviderMonitoringCard({
  item,
  providers,
}: {
  item: AIProviderMonitoring;
  providers: AIProvider[];
}) {
  const provider = providers.find(value => value.id === item.providerId);
  const failureRate =
    item.requestCount > 0
      ? Math.round((item.failureCount / item.requestCount) * 100)
      : 0;
  const errorSummary = item.errors
    .map(error => `${error.type}: ${formatNumber(error.count)}`)
    .join(' | ');

  return (
    <article className={`monitoring-card health-${item.health}`}>
      <div className="monitoring-card-heading">
        <div>
          <p>{provider?.label ?? item.providerId}</p>
          <h3 dir="ltr">{item.modelId}</h3>
        </div>
        <span className={`health-badge ${item.health}`}>
          {providerHealthLabel(item.health)}
        </span>
      </div>
      <dl className="monitoring-card-metrics">
        <div>
          <dt>الطلبات</dt>
          <dd dir="ltr">{formatNumber(item.requestCount)}</dd>
        </div>
        <div>
          <dt>الفشل</dt>
          <dd dir="ltr">{failureRate}%</dd>
        </div>
        <div>
          <dt>التوكنز</dt>
          <dd dir="ltr">{formatNumber(item.totalTokens)}</dd>
        </div>
        <div>
          <dt>زمن P95</dt>
          <dd dir="ltr">{formatNumber(item.p95LatencyMs)} ms</dd>
        </div>
      </dl>
      <p className="monitoring-card-cost" dir="ltr">
        {formatCost(item.estimatedCost, 6)} estimated /{' '}
        {formatCost(item.providerCost, 6)} provider
      </p>
      <p className="monitoring-card-errors">
        {errorSummary ? `الأخطاء: ${errorSummary}` : 'لا توجد أخطاء مسجلة'}
      </p>
    </article>
  );
}

function providerCredentialSourceLabel(
  source: ProviderCredentialStatus['source'],
): string {
  if (source === 'managed') return 'مدار ومشفّر';
  if (source === 'environment') return 'Supabase Secret';
  return 'غير مهيأ';
}

function providerKeyFailureLabel(code: string | null): string {
  switch (code) {
    case 'provider_key_rejected':
      return 'رفض المزوّد المفتاح أو صلاحياته';
    case 'provider_billing_required':
      return 'الحساب يحتاج رصيداً أو وسيلة دفع صالحة';
    case 'provider_model_unavailable':
      return 'نموذج الاختبار غير متاح لهذا الحساب';
    case 'provider_rate_limited':
      return 'تجاوز المزوّد حد الاستخدام مؤقتاً';
    case 'provider_network_error':
      return 'تعذر الاتصال بالمزوّد';
    default:
      return 'رُفضت العملية قبل تغيير المفتاح';
  }
}

function ProviderKeyRotationPanel({
  client,
  onProviderRotated,
}: {
  client: SupabaseClient;
  onProviderRotated: () => Promise<unknown>;
}) {
  const apiKeyInput = useRef<HTMLInputElement>(null);
  const [data, setData] = useState<ProviderKeyControlStatus | null>(null);
  const [mfa, setMfa] = useState<MFAStatus>({
    factorId: null,
    currentLevel: null,
    nextLevel: null,
  });
  const [enrollment, setEnrollment] = useState<MFAEnrollment | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [stepUpUntil, setStepUpUntil] = useState(0);
  const [selectedProvider, setSelectedProvider] = useState<ProviderId>('gemini');
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mfaBusy, setMfaBusy] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadMfa = useCallback(async () => {
    const [factors, assurance] = await Promise.all([
      client.auth.mfa.listFactors(),
      client.auth.mfa.getAuthenticatorAssuranceLevel(),
    ]);
    if (factors.error) throw factors.error;
    if (assurance.error) throw assurance.error;
    const factor = factors.data?.totp?.[0] ?? null;
    setMfa({
      factorId: factor?.id ?? null,
      currentLevel: assurance.data?.currentLevel ?? null,
      nextLevel: assurance.data?.nextLevel ?? null,
    });
  }, [client]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const status = await callProviderKeyControl<ProviderKeyControlStatus>(
        client,
        'status',
      );
      setData(status);
      await loadMfa();
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'تعذر تحميل إعدادات تدوير المفاتيح.',
      );
    } finally {
      setLoading(false);
    }
  }, [client, loadMfa]);

  useEffect(() => {
    runTask(refresh());
  }, [refresh]);

  const startEnrollment = async () => {
    setMfaBusy(true);
    setError(null);
    setMessage(null);
    try {
      const result = await client.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'إدارة مفاتيح AI',
      });
      if (result.error || !result.data?.totp) {
        throw result.error ?? new Error('تعذر بدء إعداد التحقق بخطوتين.');
      }
      setEnrollment({
        factorId: result.data.id,
        qrCode: result.data.totp.qr_code,
        secret: result.data.totp.secret,
      });
      setMfaCode('');
      setMessage('امسح رمز QR بتطبيق المصادقة ثم أدخل الرمز المكوّن من 6 أرقام.');
    } catch (enrollError) {
      setError(
        enrollError instanceof Error
          ? enrollError.message
          : 'تعذر إعداد التحقق بخطوتين.',
      );
    } finally {
      setMfaBusy(false);
    }
  };

  const verifyMfa = async () => {
    const factorId = enrollment?.factorId ?? mfa.factorId;
    const code = mfaCode.replace(/\s/g, '');
    if (!factorId || !/^\d{6,10}$/.test(code)) {
      setError('أدخل رمز التحقق الصحيح من تطبيق المصادقة.');
      return;
    }
    setMfaBusy(true);
    setError(null);
    setMessage(null);
    try {
      const result = await client.auth.mfa.challengeAndVerify({ factorId, code });
      if (result.error) throw result.error;
      setEnrollment(null);
      setMfaCode('');
      setStepUpUntil(Date.now() + 5 * 60 * 1000);
      await loadMfa();
      setMessage('تم التحقق بخطوتين. يمكنك تدوير مفتاح واحد خلال الدقائق الخمس القادمة.');
    } catch (verifyError) {
      setError(
        verifyError instanceof Error
          ? verifyError.message
          : 'تعذر التحقق من الرمز.',
      );
    } finally {
      setMfaBusy(false);
    }
  };

  const rotate = async () => {
    const input = apiKeyInput.current;
    const apiKey = input?.value ?? '';
    if (!data?.storageReady) {
      setError('تخزين مفاتيح المزوّدين غير مهيأ على الخادم بعد.');
      return;
    }
    if (stepUpUntil <= Date.now()) {
      setError('أكمل التحقق بخطوتين الآن قبل تدوير المفتاح.');
      return;
    }
    if (!confirmed) {
      setError('أكّد استبدال المفتاح الحالي قبل المتابعة.');
      return;
    }
    if (!apiKey.trim()) {
      setError('أدخل مفتاح API الجديد.');
      return;
    }

    // Keep the raw credential out of React state and clear the field before waiting.
    if (input) input.value = '';
    setRotating(true);
    setError(null);
    setMessage(null);
    try {
      const result = await callProviderKeyControl<{
        credential: { keyVersion: number };
        test: { providerId: ProviderId; modelId: string; latencyMs: number };
      }>(client, 'rotate', { providerId: selectedProvider, apiKey });
      setConfirmed(false);
      setMessage(
        `تم اختبار المفتاح وتدويره إلى الإصدار ${result.credential.keyVersion} عبر ${result.test.modelId} خلال ${formatNumber(result.test.latencyMs)} ms.`,
      );
      await Promise.all([refresh(), onProviderRotated()]);
    } catch (rotateError) {
      setError(
        rotateError instanceof Error
          ? rotateError.message
          : 'تعذر تدوير المفتاح. لم يتغير المفتاح النشط.',
      );
    } finally {
      if (input) input.value = '';
      setRotating(false);
    }
  };

  const verifiedStepUp = stepUpUntil > Date.now();

  return (
    <section className="panel provider-key-panel" aria-label="تدوير مفاتيح المزوّدين">
      <div className="section-heading">
        <div>
          <p className="eyebrow">عملية حساسة محمية بالتحقق بخطوتين</p>
          <h2>تدوير مفاتيح API</h2>
          <p className="subtle">
            لا يُعرض المفتاح ولا يُحفظ كنص واضح. يُختبر أولاً ثم يُشفّر على الخادم
            قبل حفظه، ويستبدل المفتاح السابق مباشرة.
          </p>
        </div>
        <button
          className="secondary-button"
          type="button"
          onClick={() => runTask(refresh())}
          disabled={loading || rotating || mfaBusy}
        >
          {loading ? 'جارٍ التحديث...' : 'تحديث الحالة'}
        </button>
      </div>

      {loading && !data ? (
        <p className="empty-state">جارٍ التحقق من صلاحية المالك وحالة التخزين...</p>
      ) : null}
      {error ? <p className="error-message key-control-message">{error}</p> : null}
      {message ? <p className="notice-message key-control-message">{message}</p> : null}

      {data ? (
        <>
          <div className="credential-status-grid">
            {data.providers.map(provider => (
              <article className="credential-status" key={provider.id}>
                <div>
                  <strong>{AI_PROVIDER_LABELS[provider.id] ?? provider.id}</strong>
                  <span>{providerCredentialSourceLabel(provider.source)}</span>
                </div>
                <p>
                  {provider.keyVersion
                    ? `إصدار المفتاح: ${provider.keyVersion}`
                    : provider.configured
                    ? 'لا يوجد تدوير من اللوحة بعد.'
                    : 'لا يوجد مفتاح نشط.'}
                </p>
                {provider.rotatedAt ? (
                  <small>آخر تدوير: {formatDateTime(provider.rotatedAt)}</small>
                ) : null}
              </article>
            ))}
          </div>

          {!data.storageReady ? (
            <p className="key-control-warning">
              لم يجهز الخادم مفتاح التشفير الجذري بعد. لا يمكن قبول مفاتيح جديدة
              حتى يضبط المسؤول <code>AI_PROVIDER_KEY_ENCRYPTION_KEY</code> في
              Supabase Secrets.
            </p>
          ) : null}

          <div className="mfa-key-grid">
            <section className="mfa-step">
              <p className="eyebrow">خطوة الأمان الإلزامية</p>
              <h3>التحقق بخطوتين (TOTP)</h3>
              {!mfa.factorId && !enrollment ? (
                <>
                  <p className="subtle">
                    فعّل تطبيق مصادقة قبل أن تتمكن من تدوير أي مفتاح.
                  </p>
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => runTask(startEnrollment())}
                    disabled={mfaBusy || rotating}
                  >
                    {mfaBusy ? 'جارٍ تجهيز TOTP...' : 'إعداد تطبيق المصادقة'}
                  </button>
                </>
              ) : (
                <>
                  {enrollment ? (
                    <div className="mfa-enrollment">
                      <img src={enrollment.qrCode} alt="رمز QR لتطبيق المصادقة" />
                      <p>إن لم يعمل المسح، أدخل المفتاح المؤقت يدوياً:</p>
                      <code dir="ltr">{enrollment.secret}</code>
                    </div>
                  ) : null}
                  <label className="mfa-code-field">
                    <span>رمز تطبيق المصادقة</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={mfaCode}
                      maxLength={10}
                      onChange={event =>
                        setMfaCode(event.target.value.replace(/\D/g, ''))
                      }
                    />
                  </label>
                  <div className="mfa-actions">
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() => runTask(verifyMfa())}
                      disabled={mfaBusy || rotating}
                    >
                      {mfaBusy
                        ? 'جارٍ التحقق...'
                        : enrollment
                        ? 'تأكيد إعداد TOTP'
                        : 'تحقق الآن'}
                    </button>
                    {enrollment ? (
                      <button
                        className="text-button"
                        type="button"
                        onClick={() => {
                          setEnrollment(null);
                          setMfaCode('');
                        }}
                        disabled={mfaBusy}
                      >
                        إلغاء الإعداد
                      </button>
                    ) : null}
                  </div>
                  <small>
                    الجلسة الحالية: {mfa.currentLevel ?? 'غير معروفة'} | المستوى
                    التالي: {mfa.nextLevel ?? 'غير معروف'}
                  </small>
                </>
              )}
              {verifiedStepUp ? (
                <p className="mfa-success">تمت المصادقة الحديثة؛ يمكنك التدوير الآن.</p>
              ) : (
                <p className="mfa-pending">يلزم تحقق حديث لكل عملية تدوير.</p>
              )}
            </section>

            <section className="key-rotation-form">
              <p className="eyebrow">اختبار ثم استبدال ذري</p>
              <h3>مفتاح مزوّد جديد</h3>
              <label>
                <span>المزوّد</span>
                <select
                  value={selectedProvider}
                  disabled={rotating || mfaBusy}
                  onChange={event =>
                    setSelectedProvider(event.target.value as ProviderId)
                  }
                >
                  <option value="gemini">Google Gemini</option>
                  <option value="deepseek">DeepSeek</option>
                </select>
              </label>
              <label>
                <span>مفتاح API الجديد</span>
                <input
                  ref={apiKeyInput}
                  type="password"
                  dir="ltr"
                  autoComplete="new-password"
                  spellCheck={false}
                  disabled={!data.storageReady || rotating || mfaBusy}
                />
              </label>
              <label className="rotation-confirmation">
                <input
                  type="checkbox"
                  checked={confirmed}
                  disabled={rotating || mfaBusy}
                  onChange={event => setConfirmed(event.target.checked)}
                />
                <span>
                  أفهم أن المفتاح الجديد سيستبدل المفتاح الحالي وأن علي إلغاء المفتاح
                  القديم من حساب المزوّد بعد نجاح العملية.
                </span>
              </label>
              <button
                className="danger-button"
                type="button"
                onClick={() => runTask(rotate())}
                disabled={
                  !data.storageReady ||
                  !verifiedStepUp ||
                  !confirmed ||
                  rotating ||
                  mfaBusy
                }
              >
                {rotating ? 'جارٍ الاختبار والتدوير...' : 'اختبر ودوّر المفتاح'}
              </button>
            </section>
          </div>

          <section className="key-audit-section">
            <div>
              <p className="eyebrow">سجل التدقيق دون أسرار</p>
              <h3>آخر عمليات تدوير المفاتيح</h3>
            </div>
            {data.history.length === 0 ? (
              <p className="empty-state">لا توجد عمليات تدوير مسجلة بعد.</p>
            ) : (
              <div className="key-audit-list">
                {data.history.map((event, index) => (
                  <article
                    className={`key-audit-entry ${event.action}`}
                    key={`${event.createdAt}-${event.providerId}-${index}`}
                  >
                    <strong>
                      {AI_PROVIDER_LABELS[event.providerId] ?? event.providerId}
                    </strong>
                    <span>
                      {event.action === 'rotated'
                        ? `تم تدوير الإصدار ${event.keyVersion}`
                        : providerKeyFailureLabel(event.failureCode)}
                    </span>
                    <small>{formatDateTime(event.createdAt)}</small>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      ) : null}
    </section>
  );
}

function AIControlView({
  client,
  data,
  routing,
  loading,
  saving,
  dirty,
  onRefresh,
  onRouteChange,
  onTogglePausedProvider,
  onPaidFallbackChange,
  onTestProvider,
  testingProvider,
  onSave,
  onProviderRotated,
}: {
  client: SupabaseClient;
  data: AIControlData | null;
  routing: AIRouting | null;
  loading: boolean;
  saving: boolean;
  dirty: boolean;
  onRefresh: () => void;
  onRouteChange: (
    scope: 'trial' | 'licensed',
    feature: AIFeature,
    route: AIRoute,
  ) => void;
  onTogglePausedProvider: (provider: ProviderId) => void;
  onPaidFallbackChange: (route: AIRoute) => void;
  onTestProvider: (provider: ProviderId) => void;
  testingProvider: ProviderId | null;
  onSave: () => void;
  onProviderRotated: () => Promise<unknown>;
}) {
  if (!data || !routing) {
    return (
      <section className="panel control-empty-state">
        <p className="eyebrow">توجيه ومراقبة المزودات</p>
        <h2>مركز تحكم AI</h2>
        <p className="empty-state">
          {loading
            ? 'جارٍ تحميل إعدادات التوجيه ومراقبة المزوّدين...'
            : 'لا تتوفر بيانات مركز التحكم حالياً.'}
        </p>
        {!loading ? (
          <button
            className="secondary-button"
            type="button"
            onClick={onRefresh}
          >
            إعادة المحاولة
          </button>
        ) : null}
      </section>
    );
  }

  const fallbackModels = data.modelCatalog[
    routing.emergency.paidFallback.provider
  ].includes(routing.emergency.paidFallback.model)
    ? data.modelCatalog[routing.emergency.paidFallback.provider]
    : [
        routing.emergency.paidFallback.model,
        ...data.modelCatalog[routing.emergency.paidFallback.provider],
      ];
  const monitoringItems = data.monitoring.providers;

  return (
    <div className="ai-control-view">
      <div className="section-heading control-heading">
        <div>
          <p className="eyebrow">التوجيه الحي وسلامة الخدمة</p>
          <h2>مركز تحكم AI</h2>
          <p className="subtle">
            إصدار التوجيه {routing.version} | آخر حفظ:{' '}
            {formatDateTime(data.updatedAt)}
          </p>
        </div>
        <div className="control-actions">
          {dirty ? (
            <span className="unsaved-chip">تعديلات غير محفوظة</span>
          ) : null}
          <button
            className="secondary-button"
            type="button"
            onClick={onRefresh}
            disabled={loading || saving}
          >
            {loading ? 'جارٍ تحديث المركز...' : 'تحديث المركز'}
          </button>
          <button
            className="primary-button"
            type="button"
            onClick={onSave}
            disabled={!dirty || saving}
          >
            {saving ? 'جارٍ حفظ التوجيه...' : 'حفظ التوجيه'}
          </button>
        </div>
      </div>

      <section className="provider-grid" aria-label="حالة مزوّدي AI">
        {data.providers.map(provider => (
          <article className="provider-card" key={provider.id}>
            <div className="provider-card-heading">
              <div>
                <p className="eyebrow">مزوّد الخدمة</p>
                <h3>{provider.label}</h3>
              </div>
              <span
                className={`provider-state ${
                  provider.configured ? 'configured' : 'not-configured'
                }`}
              >
                {providerStatusLabel(provider.configured)}
              </span>
            </div>
            <p>
              {provider.supportsImages
                ? 'يدعم مدخلات الصور وعمليات OCR.'
                : 'مخصص للعمليات النصية ولا يدعم الصور.'}
            </p>
            <p className="key-privacy">
              لا تُعرض مفاتيح API الخام مطلقاً. تدويرها من اللوحة يتطلب تحققاً
              حديثاً بخطوتين ويُسجل دون حفظ السر.
            </p>
            <div className="provider-card-actions">
              <button
                className="secondary-button"
                type="button"
                onClick={() => onTestProvider(provider.id)}
                disabled={
                  !provider.configured || saving || testingProvider !== null
                }
              >
                {testingProvider === provider.id
                  ? 'جارٍ اختبار الاتصال...'
                  : 'اختبار الاتصال'}
              </button>
            </div>
          </article>
        ))}
      </section>

      <ProviderKeyRotationPanel
        client={client}
        onProviderRotated={onProviderRotated}
      />

      <section className="panel routing-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">خريطة تنفيذ الميزات</p>
            <h2>توجيه المزوّد والنموذج</h2>
          </div>
          <span className="subtle">
            المزوّدون النصيّون لا يتاحون للتجربة أو لعمليات الصور (تبقى
            Gemini).
          </span>
        </div>
        <div className="routing-grid">
          {(['trial', 'licensed'] as const).map(scope => (
            <section className="route-scope" key={scope}>
              <div className="route-scope-heading">
                <div>
                  <p className="eyebrow">
                    {scope === 'trial' ? 'النطاق التجريبي' : 'النطاق المرخّص'}
                  </p>
                  <h3>
                    {scope === 'trial' ? 'مسارات التجربة' : 'مسارات المشتركين'}
                  </h3>
                </div>
                <span>
                  {scope === 'trial' ? 'Gemini فقط' : 'النصي يدعم مزوّدين'}
                </span>
              </div>
              <div className="route-list">
                {AI_FEATURES.map(feature => (
                  <RouteEditor
                    key={feature}
                    scope={scope}
                    feature={feature}
                    route={routing[scope][feature]}
                    providers={data.providers}
                    modelCatalog={data.modelCatalog}
                    disabled={saving}
                    onChange={route => onRouteChange(scope, feature, route)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>

      <section className="emergency-grid" aria-label="إعدادات الطوارئ">
        <article className="panel emergency-panel">
          <p className="eyebrow">قاطع الخدمة</p>
          <h2>إيقاف مزوّد مؤقتاً</h2>
          <p className="subtle">
            إيقاف المزوّد يمنع توجيه الطلبات الجديدة إليه حتى تعيد تفعيله.
          </p>
          <div className="pause-provider-list">
            {data.providers.map(provider => {
              const paused = routing.emergency.pausedProviders.includes(
                provider.id,
              );
              return (
                <label className="pause-provider-choice" key={provider.id}>
                  <input
                    type="checkbox"
                    checked={paused}
                    disabled={saving}
                    onChange={() => onTogglePausedProvider(provider.id)}
                  />
                  <span>
                    <strong>{provider.label}</strong>
                    <small>{paused ? 'متوقف حالياً' : 'متاح للتوجيه'}</small>
                  </span>
                </label>
              );
            })}
          </div>
        </article>

        <article className="panel emergency-panel fallback-panel">
          <p className="eyebrow">مسار الاسترداد المدفوع</p>
          <h2>العودة الآمنة للمشتركين</h2>
          <p className="subtle">
            يُستخدم فقط عند توقف مزوّد المسار المدفوع. عمليات الصور تحتاج
            Gemini.
          </p>
          <div className="fallback-selects">
            <label className="fallback-select">
              <span>المزوّد الاحتياطي</span>
              <select
                value={routing.emergency.paidFallback.provider}
                disabled={saving}
                onChange={event => {
                  const provider = event.target.value as ProviderId;
                  onPaidFallbackChange({
                    provider,
                    model:
                      data.modelCatalog[provider][0] ??
                      routing.emergency.paidFallback.model,
                  });
                }}
              >
                {data.providers.map(provider => (
                  <option key={provider.id} value={provider.id}>
                    {provider.label} -{' '}
                    {providerStatusLabel(provider.configured)}
                  </option>
                ))}
              </select>
            </label>
            <label className="fallback-select">
              <span>النموذج الاحتياطي</span>
              <select
                value={routing.emergency.paidFallback.model}
                disabled={saving || fallbackModels.length === 0}
                onChange={event =>
                  onPaidFallbackChange({
                    ...routing.emergency.paidFallback,
                    model: event.target.value,
                  })
                }
              >
                {fallbackModels.map(model => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </article>
      </section>

      <section className="monitoring-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">إشارات الاعتمادية والتكلفة</p>
            <h2>مراقبة المزوّدين والنماذج</h2>
            <p className="subtle">
              نافذة القراءة: {data.monitoring.windowHours} ساعة | أُنشئت:{' '}
              {formatDateTime(data.monitoring.generatedAt)}
            </p>
          </div>
        </div>

        {monitoringItems.length === 0 ? (
          <section className="panel">
            <p className="empty-state">
              لا توجد طلبات مسجلة ضمن نافذة المراقبة الحالية.
            </p>
          </section>
        ) : (
          <>
            <div className="monitoring-grid">
              {monitoringItems.map(item => (
                <ProviderMonitoringCard
                  key={`${item.providerId}-${item.modelId}`}
                  item={item}
                  providers={data.providers}
                />
              ))}
            </div>
            <section className="panel monitoring-table-panel">
              <div className="table-responsive">
                <table className="analytics-table monitoring-table">
                  <thead>
                    <tr>
                      <th>المزوّد / النموذج</th>
                      <th>الحالة</th>
                      <th>الطلبات</th>
                      <th>نجاح / فشل / قيد التنفيذ</th>
                      <th>إدخال / إخراج / إجمالي التوكنز</th>
                      <th>التكلفة المقدرة / الفعلية</th>
                      <th>المتوسط / P95</th>
                      <th>آخر طلب / نجاح / فشل</th>
                      <th>تفاصيل الأخطاء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monitoringItems.map(item => (
                      <tr key={`${item.providerId}-${item.modelId}`}>
                        <td>
                          <strong>
                            {data.providers.find(
                              provider => provider.id === item.providerId,
                            )?.label ?? item.providerId}
                          </strong>
                          <code dir="ltr">{item.modelId}</code>
                        </td>
                        <td>
                          <span className={`health-badge ${item.health}`}>
                            {providerHealthLabel(item.health)}
                          </span>
                        </td>
                        <td dir="ltr">{formatNumber(item.requestCount)}</td>
                        <td dir="ltr">
                          {formatNumber(item.successCount)} /{' '}
                          {formatNumber(item.failureCount)} /{' '}
                          {formatNumber(item.processingCount)}
                        </td>
                        <td dir="ltr">
                          {formatNumber(item.inputTokens)} /{' '}
                          {formatNumber(item.outputTokens)} /{' '}
                          {formatNumber(item.totalTokens)}
                        </td>
                        <td dir="ltr">
                          {formatCost(item.estimatedCost, 6)} /{' '}
                          {formatCost(item.providerCost, 6)}
                        </td>
                        <td dir="ltr">
                          {formatNumber(item.averageLatencyMs)} ms /{' '}
                          {formatNumber(item.p95LatencyMs)} ms
                        </td>
                        <td className="monitoring-timestamps">
                          <span>طلب: {formatDateTime(item.lastRequestAt)}</span>
                          <span>
                            نجاح: {formatDateTime(item.lastSuccessAt)}
                          </span>
                          <span>فشل: {formatDateTime(item.lastFailureAt)}</span>
                        </td>
                        <td className="monitoring-error-cell">
                          {item.errors.length > 0
                            ? item.errors
                                .map(
                                  error =>
                                    `${error.type}: ${formatNumber(
                                      error.count,
                                    )}`,
                                )
                                .join(' | ')
                            : 'لا توجد أخطاء'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </section>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
