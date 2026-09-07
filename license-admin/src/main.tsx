import React, { useCallback, useEffect, useState } from 'react';
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
  totalCalls: number;
  totalTokens: number;
  totalCost: number;
  lastUsedAt: string;
}

interface AIAnalyticsData {
  overview: AIOverview;
  features: AIFeatureMetric[];
  topConsumers: AITopConsumer[];
}

const AI_PLANS = [
  { value: 'single_subject', label: 'مادة دراسية واحدة (Single)', maxSubjects: 1 },
  { value: 'two_subjects', label: 'مادتين دراسيتين (Two Subjects)', maxSubjects: 2 },
  { value: 'pro', label: 'شامل كل المناهج والمواد (Pro)', maxSubjects: 15 },
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
  const [activeTab, setActiveTab] = useState<'licenses' | 'ai-analytics'>(
    'licenses',
  );
  const [aiAnalytics, setAiAnalytics] = useState<AIAnalyticsData | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [form, setForm] = useState(INITIAL_LICENSE_FORM);

  const load = useCallback(
    async (nextSearch = '') => {
      setLoading(true);
      setError(null);
      try {
        const [summaryResponse, listResponse] = await Promise.all([
          callAdmin<{ summary: Summary }>(client, 'admin-summary'),
          callAdmin<{ licenses: License[] }>(client, 'admin-list-licenses', {
            search: nextSearch,
          }),
        ]);
        setSummary(summaryResponse.summary);
        setLicenses(listResponse.licenses);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'تعذر تحميل البيانات.',
        );
      } finally {
        setLoading(false);
      }
    },
    [client],
  );

  const loadAIAnalytics = useCallback(async () => {
    setLoadingAnalytics(true);
    setError(null);
    try {
      const res = await callAdmin<AIAnalyticsData>(
        client,
        'admin-get-ai-analytics',
      );
      setAiAnalytics(res);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'تعذر تحميل إحصائيات الذكاء الاصطناعي.',
      );
    } finally {
      setLoadingAnalytics(false);
    }
  }, [client]);

  useEffect(() => {
    runTask(load(''));
  }, [load]);

  useEffect(() => {
    if (activeTab === 'ai-analytics') {
      runTask(loadAIAnalytics());
    }
  }, [activeTab, loadAIAnalytics]);

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

  const updateLicense = async (
    licenseId: string,
    changes: Record<string, unknown>,
  ) => {
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
  };

  const openDetail = async (licenseId: string) => {
    setError(null);
    try {
      const result = await callAdmin<LicenseDetail>(
        client,
        'admin-license-detail',
        {
          licenseId,
        },
      );
      setDetail(result);
    } catch (detailError) {
      setError(
        detailError instanceof Error
          ? detailError.message
          : 'تعذر تحميل الأجهزة.',
      );
    }
  };

  const revokeActivation = async (activationId: string) => {
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
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setNotice('تم نسخ رمز التفعيل.');
    } catch {
      setNotice('حدّد الرمز وانسخه يدوياً.');
    }
  };

  return (
    <main className="dashboard">
      <header className="topbar">
        <div className="identity">
          <div className="brand-mark compact">ح</div>
          <div>
            <p className="eyebrow">حقيبة المدرس</p>
            <h1>إدارة التراخيص</h1>
          </div>
        </div>
        <div className="account">
          <span>{session.user.email ?? 'حساب المالك'}</span>
          <button
            className="text-button"
            type="button"
            onClick={() => client.auth.signOut()}
          >
            تسجيل الخروج
          </button>
        </div>
      </header>

      <div className="page-content">
        <nav className="tabs-nav">
          <button
            type="button"
            className={`tab-btn ${activeTab === 'licenses' ? 'active' : ''}`}
            onClick={() => setActiveTab('licenses')}
          >
            إدارة التراخيص والأجهزة
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'ai-analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('ai-analytics')}
          >
            إحصائيات واستهلاك الذكاء الاصطناعي (AI Analytics)
          </button>
        </nav>

        {error ? <p className="alert error-message">{error}</p> : null}
        {notice ? <p className="alert success-message">{notice}</p> : null}

        {activeTab === 'licenses' ? (
          <>
            <section className="stats" aria-label="ملخص التراخيص">
              <Stat label="كل التراخيص" value={summary?.licenses} />
              <Stat label="تراخيص نشطة" value={summary?.active} accent="blue" />
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
                      form.subscriptionPlan === plan.value ? 'selected' : ''
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
                  يُحسب الانتهاء تلقائياً من وقت الخادم وبنهاية اليوم بتوقيت
                  العراق.
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
                        ? '15'
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
              أنشئ رمزاً، أرسله للمستخدم بالطريقة المناسبة لك، ثم راقب الأجهزة
              المفعلة من هذه اللوحة.
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
                onSave={changes => runTask(updateLicense(license.id, changes))}
                onDevices={() => runTask(openDetail(license.id))}
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
                هذا ترخيص قديم أُنشئ قبل تفعيل الحفظ المشفّر للرموز، لذلك لا
                يمكن استرجاع رمزه. أنشئ رمزاً جديداً عند الحاجة.
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
                        onClick={() => setPendingRevocation(activation.id)}
                      >
                        إلغاء التفعيل
                      </button>
                    ) : (
                      <span className="status-badge muted-badge">غير نشط</span>
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
                سيفقد هذا الجهاز الوصول عند التحقق التالي. يمكن لصاحب الرمز
                إدخاله مجددًا ما لم توقف الترخيص نفسه.
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
        ) : (
          <AIAnalyticsView
            data={aiAnalytics}
            loading={loadingAnalytics}
            onRefresh={() => runTask(loadAIAnalytics())}
          />
        )}
      </div>
    </main>
  );
}

function Stat({
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
}

function LicenseCard({
  license,
  onSave,
  onDevices,
}: {
  license: License;
  onSave: (changes: Record<string, unknown>) => void;
  onDevices: () => void;
}) {
  const [status, setStatus] = useState<LicenseStatus>(license.status);
  const [maxDevices, setMaxDevices] = useState(String(license.maxDevices));
  const [expiresOn, setExpiresOn] = useState(dateInputValue(license.expiresAt));
  const [planId, setPlanId] = useState(license.planId || 'single_subject');
  const [maxSubjects, setMaxSubjects] = useState(
    String(license.maxSubjects || 1),
  );

  useEffect(() => {
    setStatus(license.status);
    setMaxDevices(String(license.maxDevices));
    setExpiresOn(dateInputValue(license.expiresAt));
    setPlanId(license.planId || 'single_subject');
    setMaxSubjects(String(license.maxSubjects || 1));
  }, [license]);

  const planObj =
    AI_PLANS.find(p => p.value === license.planId) || AI_PLANS[0];

  return (
    <article className="license-card">
      <div className="license-card-title">
        <div>
          <h3>{license.label || 'ترخيص بلا اسم'}</h3>
          <p dir="ltr">****-{license.codeHint}</p>
        </div>
        <span className={`status-badge ${license.status}`}>
          {statusLabel(license.status)}
        </span>
      </div>
      <div className="license-meta">
        <span>
          الأجهزة: {license.activeDevices} / {license.maxDevices}
        </span>
        <span>الانتهاء: {formatDate(license.expiresAt)}</span>
        <span>
          خطة AI: {planObj ? planObj.label : 'مادة واحدة'} (
          {license.maxSubjects || 1} مادة)
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
            value={status}
            onChange={event => setStatus(event.target.value as LicenseStatus)}
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
            value={maxDevices}
            onChange={event => setMaxDevices(event.target.value)}
          />
        </label>
        <label>
          خطة AI
          <select
            value={planId}
            onChange={event => {
              const val = event.target.value;
              setPlanId(val);
              if (val === 'two_subjects') setMaxSubjects('2');
              else if (val === 'pro') setMaxSubjects('15');
              else setMaxSubjects('1');
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
            value={maxSubjects}
            onChange={event => setMaxSubjects(event.target.value)}
          />
        </label>
        <label>
          تاريخ الانتهاء
          <input
            type="date"
            value={expiresOn}
            onChange={event => setExpiresOn(event.target.value)}
          />
        </label>
      </div>
      <div className="license-actions">
        <button
          className="secondary-button"
          type="button"
          onClick={() =>
            onSave({
              status,
              maxDevices: Number(maxDevices),
              expiresOn: expiresOn || null,
              planId,
              maxSubjects: Number(maxSubjects),
            })
          }
        >
          حفظ التعديل
        </button>
        <button className="text-button" type="button" onClick={onDevices}>
          إدارة الترخيص
        </button>
      </div>
    </article>
  );
}

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
                      <code>…{c.installationId.slice(-8)}</code>
                    </td>
                    <td>
                      <span
                        className={c.isTrial ? 'badge-trial' : 'badge-paid'}
                      >
                        {c.isTrial ? 'تجريبي' : 'مرخص'}
                      </span>
                    </td>
                    <td>{c.totalCalls.toLocaleString()}</td>
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
                    <td>{formatDate(c.lastUsedAt)}</td>
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

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
