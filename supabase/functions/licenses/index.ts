// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

class ApiError extends Error {
  constructor(readonly status: number, readonly code: string, message: string) {
    super(message);
  }
}

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function requiredString(
  value: unknown,
  code: string,
  message: string,
  maxLength = 200,
): string {
  if (typeof value !== 'string') throw new ApiError(400, code, message);
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength)
    throw new ApiError(400, code, message);
  return trimmed;
}

function optionalString(value: unknown, maxLength: number): string | null {
  if (value == null) return null;
  if (typeof value !== 'string')
    throw new ApiError(400, 'invalid_input', 'البيانات المدخلة غير صالحة.');
  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    throw new ApiError(
      400,
      'invalid_input',
      'البيانات المدخلة طويلة أكثر من اللازم.',
    );
  }
  return trimmed || null;
}

function installationIdFrom(input: Record<string, unknown>): string {
  const installationId = requiredString(
    input.installationId,
    'invalid_installation',
    'تعذر التحقق من هذا الجهاز. أعد تشغيل التطبيق ثم حاول مرة أخرى.',
    64,
  );
  if (!UUID_PATTERN.test(installationId)) {
    throw new ApiError(
      400,
      'invalid_installation',
      'تعذر التحقق من هذا الجهاز. أعد تشغيل التطبيق ثم حاول مرة أخرى.',
    );
  }
  return installationId;
}

function normalizeCode(input: string): string {
  return input
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), byte =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
}

function codeEncryptionSecret(): string {
  const secret = Deno.env.get('LICENSE_CODE_ENCRYPTION_KEY')?.trim();
  if (!secret || secret.length < 32) {
    throw new ApiError(
      503,
      'code_storage_unconfigured',
      'حفظ رموز التفعيل غير مهيأ بعد. اضبط LICENSE_CODE_ENCRYPTION_KEY ثم أعد المحاولة.',
    );
  }
  return secret;
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function base64UrlDecode(value: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) {
    throw new Error('invalid ciphertext');
  }
  const padded = value
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(padded);
  return Uint8Array.from(binary, char => char.charCodeAt(0));
}

async function encryptionKey(): Promise<CryptoKey> {
  const secretBytes = new TextEncoder().encode(codeEncryptionSecret());
  const keyBytes = await crypto.subtle.digest('SHA-256', secretBytes);
  return crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, [
    'encrypt',
    'decrypt',
  ]);
}

/** يحفظ الرمز مشفّراً؛ البصمة تبقى المرجع الوحيد لتفعيل التطبيق. */
async function encryptActivationCode(code: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      await encryptionKey(),
      new TextEncoder().encode(code),
    ),
  );
  const payload = new Uint8Array(iv.length + encrypted.length);
  payload.set(iv);
  payload.set(encrypted, iv.length);
  return `v1.${base64UrlEncode(payload)}`;
}

async function decryptActivationCode(ciphertext: string): Promise<string> {
  const [version, encoded] = ciphertext.split('.', 2);
  if (version !== 'v1' || !encoded) {
    throw new ApiError(
      503,
      'code_storage_invalid',
      'تعذر استرجاع رمز التفعيل لهذا الترخيص.',
    );
  }
  try {
    const payload = base64UrlDecode(encoded);
    if (payload.length <= 12) throw new Error('invalid ciphertext');
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: payload.slice(0, 12) },
      await encryptionKey(),
      payload.slice(12),
    );
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      503,
      'code_storage_invalid',
      'تعذر استرجاع رمز التفعيل لهذا الترخيص.',
    );
  }
}

function clientIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

async function enforcePublicRateLimit(
  admin: ReturnType<typeof createClient>,
  req: Request,
  action: 'status' | 'activate' | 'start_trial',
): Promise<void> {
  const limits = {
    status: { max: 60, windowMs: 60 * 60 * 1000 },
    activate: { max: 10, windowMs: 60 * 60 * 1000 },
    start_trial: { max: 5, windowMs: 60 * 60 * 1000 },
  } as const;
  const rule = limits[action];
  const salt =
    Deno.env.get('LICENSE_RATE_LIMIT_SALT') ?? 'teacher-bag-license-v1';
  // لا يدخل معرف التثبيت هنا لأنه قابل للتبديل من العميل لإعادة ضبط الحد.
  const subjectHash = await sha256(`${salt}:${clientIp(req)}:${action}`);
  const { data: allowed, error } = await admin.rpc(
    'record_license_request_attempt',
    {
      p_subject_hash: subjectHash,
      p_action: action,
      p_limit: rule.max,
      p_window_seconds: Math.floor(rule.windowMs / 1000),
    },
  );
  if (error) {
    console.error('Could not check license request rate', error.code);
    throw new ApiError(
      503,
      'service_unavailable',
      'تعذر التحقق من الترخيص حالياً. حاول مرة أخرى بعد قليل.',
    );
  }
  if (allowed !== true) {
    throw new ApiError(
      429,
      'rate_limited',
      'تمت محاولات كثيرة خلال وقت قصير. انتظر قليلاً ثم أعد المحاولة.',
    );
  }
}

async function rpcAccess(
  admin: ReturnType<typeof createClient>,
  installationId: string,
): Promise<Record<string, unknown>> {
  const { data, error } = await admin.rpc('license_access_for_installation', {
    p_installation_id: installationId,
  });
  if (error || !isRecord(data)) {
    console.error('Could not get license access', error?.code);
    throw new ApiError(
      503,
      'service_unavailable',
      'تعذر التحقق من الترخيص حالياً. حاول مرة أخرى بعد قليل.',
    );
  }

  // إثراء حالة الوصول بالخطة والمواد المحددة
  const { data: activation } = await admin
    .from('license_activations')
    .select('licenses(plan_id, max_subjects, selected_subjects)')
    .eq('installation_id', installationId)
    .eq('is_active', true)
    .maybeSingle();

  if (activation?.licenses) {
    const lic = activation.licenses as Record<string, unknown>;
    return {
      ...data,
      planId: lic.plan_id || 'single_subject',
      maxSubjects: lic.max_subjects || 1,
      selectedSubjects: lic.selected_subjects || [],
    };
  }

  const { data: trial } = await admin
    .from('license_trials')
    .select('selected_subjects, is_budget_exhausted, total_tokens_used')
    .eq('installation_id', installationId)
    .maybeSingle();

  return {
    ...data,
    planId: 'trial',
    maxSubjects: 1,
    selectedSubjects: trial?.selected_subjects || [],
    isTrialBudgetExhausted: trial?.is_budget_exhausted || false,
    trialTokensUsed: trial?.total_tokens_used || 0,
  };
}

async function handlePublicAction(
  admin: ReturnType<typeof createClient>,
  req: Request,
  input: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const action = requiredString(
    input.action,
    'invalid_action',
    'الطلب غير صالح.',
    32,
  ) as 'status' | 'activate' | 'start_trial' | 'set_selected_subjects';
  if (!['status', 'activate', 'start_trial', 'set_selected_subjects'].includes(action)) {
    throw new ApiError(400, 'invalid_action', 'الطلب غير صالح.');
  }

  const installationId = installationIdFrom(input);
  if (action !== 'set_selected_subjects') {
    await enforcePublicRateLimit(admin, req, action);
  }

  if (action === 'status') return rpcAccess(admin, installationId);

  if (action === 'set_selected_subjects') {
    const rawSubjects = Array.isArray(input.subjects) ? input.subjects : [];
    const subjects = rawSubjects
      .filter((s): s is string => typeof s === 'string')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const { data: activation } = await admin
      .from('license_activations')
      .select('license_id, licenses(id, max_subjects)')
      .eq('installation_id', installationId)
      .eq('is_active', true)
      .maybeSingle();

    if (activation?.licenses) {
      const lic = activation.licenses as Record<string, unknown>;
      const maxSubj = Number(lic.max_subjects) || 1;
      if (subjects.length > maxSubj) {
        throw new ApiError(400, 'max_subjects_exceeded', `لا يمكنك اختيار أكثر من ${maxSubj} مواد في باقتك.`);
      }
      await admin
        .from('licenses')
        .update({
          selected_subjects: subjects,
          subject_last_changed_at: new Date().toISOString(),
        })
        .eq('id', lic.id);

      return rpcAccess(admin, installationId);
    }

    if (subjects.length > 1) {
      throw new ApiError(400, 'max_subjects_exceeded', 'الفترة التجريبية تسمح بمادة واحدة فقط.');
    }
    await admin
      .from('license_trials')
      .update({ selected_subjects: subjects })
      .eq('installation_id', installationId);

    return rpcAccess(admin, installationId);
  }

  if (action === 'start_trial') {
    const { data, error } = await admin.rpc('start_license_trial', {
      p_installation_id: installationId,
    });
    if (error || !isRecord(data)) {
      console.error('Could not start free trial', error?.code);
      throw new ApiError(
        503,
        'service_unavailable',
        'تعذر بدء التجربة المجانية حالياً. حاول مرة أخرى بعد قليل.',
      );
    }
    return data;
  }

  const rawCode = requiredString(
    input.code,
    'invalid_code',
    'رمز التفعيل غير صحيح، يرجى التأكد من الرمز والمحاولة مرة أخرى.',
    80,
  );
  const code = normalizeCode(rawCode);
  if (code.length < 10 || code.length > 64) {
    throw new ApiError(
      400,
      'invalid_code',
      'رمز التفعيل غير صحيح، يرجى التأكد من الرمز والمحاولة مرة أخرى.',
    );
  }

  const platform = optionalString(input.platform, 32) ?? 'unknown';
  const appVersion = optionalString(input.appVersion, 32) ?? '';
  const { data, error } = await admin.rpc('activate_license', {
    p_code_hash: await sha256(code),
    p_installation_id: installationId,
    p_platform: platform,
    p_app_version: appVersion,
  });
  if (error || !isRecord(data)) {
    console.error('Could not activate license', error?.code);
    throw new ApiError(
      503,
      'service_unavailable',
      'تعذر التحقق من الرمز حالياً. تحقق من اتصالك ثم أعد المحاولة.',
    );
  }
  return data;
}

async function requireAdmin(
  admin: ReturnType<typeof createClient>,
  req: Request,
): Promise<{ id: string; email?: string }> {
  const authorization = req.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) {
    throw new ApiError(
      401,
      'unauthorized',
      'سجّل الدخول إلى لوحة الإدارة أولاً.',
    );
  }

  const token = authorization.slice('Bearer '.length);
  const { data: authData, error: authError } = await admin.auth.getUser(token);
  if (authError || !authData.user) {
    throw new ApiError(
      401,
      'unauthorized',
      'انتهت جلسة الإدارة. سجّل الدخول مجدداً.',
    );
  }

  const { data: role, error: roleError } = await admin
    .from('license_admins')
    .select('user_id')
    .eq('user_id', authData.user.id)
    .maybeSingle();
  if (roleError) {
    console.error('Could not check license administrator role', roleError.code);
    throw new ApiError(
      503,
      'service_unavailable',
      'تعذر التحقق من صلاحية الإدارة حالياً.',
    );
  }
  if (!role) {
    throw new ApiError(
      403,
      'forbidden',
      'هذا الحساب غير مخول لإدارة التراخيص.',
    );
  }
  return { id: authData.user.id, email: authData.user.email ?? undefined };
}

function adminLicense(row: Record<string, unknown>, activeDevices = 0) {
  return {
    id: row.id,
    codeHint: row.code_hint,
    label: row.label,
    status: row.status,
    expiresAt: row.expires_at,
    maxDevices: row.max_devices,
    activeDevices,
    planId: row.plan_id || 'single_subject',
    maxSubjects: row.max_subjects || 1,
    selectedSubjects: row.selected_subjects || [],
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function writeAudit(
  admin: ReturnType<typeof createClient>,
  adminUserId: string,
  action: string,
  licenseId: string | null,
  details: Record<string, unknown>,
): Promise<void> {
  const { error } = await admin.from('license_audit_log').insert({
    admin_user_id: adminUserId,
    license_id: licenseId,
    action,
    details,
  });
  if (error) console.error('Could not write license audit event', error.code);
}

function parseLicenseId(value: unknown): string {
  const id = requiredString(
    value,
    'invalid_license',
    'معرّف الترخيص غير صالح.',
    64,
  );
  if (!UUID_PATTERN.test(id)) {
    throw new ApiError(400, 'invalid_license', 'معرّف الترخيص غير صالح.');
  }
  return id;
}

function parseMaxDevices(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 50) {
    throw new ApiError(
      400,
      'invalid_devices',
      'عدد الأجهزة يجب أن يكون بين 1 و50.',
    );
  }
  return parsed;
}

function parseExpiry(value: unknown): string | null {
  if (value == null || value === '') return null;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new ApiError(400, 'invalid_expiry', 'تاريخ الانتهاء غير صالح.');
  }
  const [year, month, day] = value.split('-').map(Number);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > daysInMonth) {
    throw new ApiError(400, 'invalid_expiry', 'تاريخ الانتهاء غير صالح.');
  }
  // نهاية اليوم المختار حسب توقيت العراق، وليس بداية ذلك اليوم.
  const date = new Date(`${value}T23:59:59.999+03:00`);
  if (!Number.isFinite(date.getTime())) {
    throw new ApiError(400, 'invalid_expiry', 'تاريخ الانتهاء غير صالح.');
  }
  return date.toISOString();
}

const SUBSCRIPTION_MONTHS = {
  one_month: 1,
  three_months: 3,
  one_year: 12,
} as const;

type SubscriptionPlan = keyof typeof SUBSCRIPTION_MONTHS | 'custom';

function parseSubscriptionPlan(
  input: Record<string, unknown>,
): SubscriptionPlan {
  // لوحات المالك المنشورة قبل هذه الإضافة ترسل تاريخاً يدوياً فقط.
  if (!Object.prototype.hasOwnProperty.call(input, 'subscriptionPlan')) {
    return 'custom';
  }
  const value = input.subscriptionPlan;
  if (
    value === 'one_month' ||
    value === 'three_months' ||
    value === 'one_year' ||
    value === 'custom'
  ) {
    return value;
  }
  throw new ApiError(400, 'invalid_subscription', 'مدة الاشتراك غير صالحة.');
}

function iraqDateAfterMonths(months: number, now = new Date()): string {
  // العراق على UTC+3 طوال السنة؛ نستخدم تاريخ الخادم حتى لا تؤثر ساعة المتصفح.
  const iraqNow = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  const year = iraqNow.getUTCFullYear();
  const month = iraqNow.getUTCMonth() + 1;
  const day = iraqNow.getUTCDate();
  const targetMonthIndex = month - 1 + months;
  const targetYear = year + Math.floor(targetMonthIndex / 12);
  const targetMonth = (targetMonthIndex % 12) + 1;
  const lastDay = new Date(Date.UTC(targetYear, targetMonth, 0)).getUTCDate();
  const targetDay = Math.min(day, lastDay);

  return [targetYear, targetMonth, targetDay]
    .map((part, index) => String(part).padStart(index === 0 ? 4 : 2, '0'))
    .join('-');
}

function subscriptionExpiry(
  plan: SubscriptionPlan,
  customExpiry: unknown,
): string | null {
  if (plan === 'custom') return parseExpiry(customExpiry);
  return parseExpiry(iraqDateAfterMonths(SUBSCRIPTION_MONTHS[plan]));
}

function randomCode(): string {
  const groups: string[] = [];
  for (let group = 0; group < 4; group += 1) {
    const values = crypto.getRandomValues(new Uint32Array(4));
    let part = '';
    for (const value of values) {
      const index = Math.floor((value / 0x1_0000_0000) * CODE_ALPHABET.length);
      part += CODE_ALPHABET[index] ?? 'A';
    }
    groups.push(part);
  }
  return `TB-${groups.join('-')}`;
}

async function listLicenses(
  admin: ReturnType<typeof createClient>,
  searchInput: unknown,
): Promise<Record<string, unknown>> {
  const search = optionalString(searchInput, 120);
  let query = admin
    .from('licenses')
    .select(
      'id, code_hash, code_hint, label, status, expires_at, max_devices, plan_id, max_subjects, selected_subjects, notes, created_at, updated_at',
    )
    .order('created_at', { ascending: false })
    .limit(100);

  if (search) {
    const normalized = normalizeCode(search);
    query =
      normalized.length >= 10
        ? query.eq('code_hash', await sha256(normalized))
        : query.ilike('label', `%${search}%`);
  }

  const { data: licenses, error } = await query;
  if (error) {
    console.error('Could not list licenses', error.code);
    throw new ApiError(
      503,
      'service_unavailable',
      'تعذر تحميل التراخيص حالياً.',
    );
  }

  const ids = (licenses ?? []).map(license => license.id);
  const countByLicense = new Map<string, number>();
  if (ids.length) {
    const { data: activations, error: activationError } = await admin
      .from('license_activations')
      .select('license_id')
      .in('license_id', ids)
      .eq('is_active', true);
    if (activationError) {
      console.error(
        'Could not count license activations',
        activationError.code,
      );
      throw new ApiError(
        503,
        'service_unavailable',
        'تعذر تحميل التراخيص حالياً.',
      );
    }
    for (const activation of activations ?? []) {
      countByLicense.set(
        activation.license_id,
        (countByLicense.get(activation.license_id) ?? 0) + 1,
      );
    }
  }

  return {
    ok: true,
    licenses: (licenses ?? []).map(license =>
      adminLicense(license, countByLicense.get(license.id) ?? 0),
    ),
  };
}

async function handleAdminAction(
  admin: ReturnType<typeof createClient>,
  req: Request,
  input: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const adminUser = await requireAdmin(admin, req);
  const action = requiredString(
    input.action,
    'invalid_action',
    'الطلب غير صالح.',
    64,
  );

  if (action === 'admin-summary') {
    const now = new Date().toISOString();
    const [licenses, active, suspended, activations, trials] =
      await Promise.all([
        admin.from('licenses').select('id', { count: 'exact', head: true }),
        admin
          .from('licenses')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'active'),
        admin
          .from('licenses')
          .select('id', { count: 'exact', head: true })
          .neq('status', 'active'),
        admin
          .from('license_activations')
          .select('id', { count: 'exact', head: true })
          .eq('is_active', true),
        admin
          .from('license_trials')
          .select('installation_id', { count: 'exact', head: true })
          .gt('ends_at', now),
      ]);
    const failed = [licenses, active, suspended, activations, trials].some(
      result => result.error,
    );
    if (failed) {
      console.error('Could not load license summary');
      throw new ApiError(
        503,
        'service_unavailable',
        'تعذر تحميل ملخص التراخيص حالياً.',
      );
    }
    return {
      ok: true,
      summary: {
        licenses: licenses.count ?? 0,
        active: active.count ?? 0,
        suspended: suspended.count ?? 0,
        activeDevices: activations.count ?? 0,
        activeTrials: trials.count ?? 0,
      },
    };
  }

  if (action === 'admin-list-licenses') {
    return listLicenses(admin, input.search);
  }

  if (action === 'admin-license-detail') {
    const licenseId = parseLicenseId(input.licenseId);
    const [
      { data: license, error: licenseError },
      { data: activations, error: activationError },
    ] = await Promise.all([
      admin
        .from('licenses')
        .select(
          'id, code_hint, code_ciphertext, label, status, expires_at, max_devices, notes, created_at, updated_at',
        )
        .eq('id', licenseId)
        .maybeSingle(),
      admin
        .from('license_activations')
        .select(
          'id, installation_id, platform, app_version, activated_at, last_checked_at, is_active, deactivated_at, revoked_at',
        )
        .eq('license_id', licenseId)
        .order('activated_at', { ascending: false }),
    ]);
    if (licenseError?.code === '42703') {
      throw new ApiError(
        503,
        'migration_required',
        'طبّق ترحيل استرجاع رموز التفعيل ثم أعد المحاولة.',
      );
    }
    if (licenseError || activationError) {
      console.error(
        'Could not load license detail',
        licenseError?.code ?? activationError?.code,
      );
      throw new ApiError(
        503,
        'service_unavailable',
        'تعذر تحميل تفاصيل الترخيص حالياً.',
      );
    }
    if (!license) {
      throw new ApiError(404, 'not_found', 'لم يتم العثور على هذا الترخيص.');
    }
    const activeDevices = (activations ?? []).filter(
      item => item.is_active,
    ).length;
    const activationCode = license.code_ciphertext
      ? await decryptActivationCode(license.code_ciphertext)
      : null;
    if (activationCode) {
      await writeAudit(
        admin,
        adminUser.id,
        'license_code_viewed',
        licenseId,
        {},
      );
    }
    return {
      ok: true,
      license: adminLicense(license, activeDevices),
      activationCode,
      activations: (activations ?? []).map(activation => ({
        id: activation.id,
        installationHint: `…${activation.installation_id.slice(-6)}`,
        platform: activation.platform,
        appVersion: activation.app_version,
        activatedAt: activation.activated_at,
        lastCheckedAt: activation.last_checked_at,
        active: activation.is_active,
        deactivatedAt: activation.deactivated_at,
        revokedAt: activation.revoked_at,
      })),
    };
  }

  if (action === 'admin-create-license') {
    const label = optionalString(input.label, 120);
    const notes = optionalString(input.notes, 1000);
    const maxDevices = parseMaxDevices(input.maxDevices ?? 1);
    const subscriptionPlan = parseSubscriptionPlan(input);
    const expiresAt = subscriptionExpiry(subscriptionPlan, input.expiresOn);
    const planId = optionalString(input.planId, 32) || 'single_subject';
    const maxSubjects = typeof input.maxSubjects === 'number' ? Math.max(1, Math.min(20, Math.floor(input.maxSubjects))) : (planId === 'two_subjects' ? 2 : 1);
    const selectedSubjects = Array.isArray(input.selectedSubjects) ? input.selectedSubjects : [];
    let created: Record<string, unknown> | null = null;
    let rawCode = '';

    for (let attempt = 0; attempt < 5; attempt += 1) {
      rawCode = randomCode();
      const normalized = normalizeCode(rawCode);
      const { data, error } = await admin
        .from('licenses')
        .insert({
          code_hash: await sha256(normalized),
          code_ciphertext: await encryptActivationCode(rawCode),
          code_hint: normalized.slice(-4),
          label,
          expires_at: expiresAt,
          max_devices: maxDevices,
          plan_id: planId,
          max_subjects: maxSubjects,
          selected_subjects: selectedSubjects,
          notes,
          created_by: adminUser.id,
        })
        .select(
          'id, code_hint, label, status, expires_at, max_devices, plan_id, max_subjects, selected_subjects, notes, created_at, updated_at',
        )
        .single();
      if (!error && data) {
        created = data;
        break;
      }
      if (error?.code === '42703') {
        throw new ApiError(
          503,
          'migration_required',
          'طبّق ترحيل استرجاع رموز التفعيل ثم أعد المحاولة.',
        );
      }
      if (error?.code !== '23505') {
        console.error('Could not create license', error?.code);
        throw new ApiError(
          503,
          'service_unavailable',
          'تعذر إنشاء الترخيص حالياً.',
        );
      }
    }
    if (!created) {
      throw new ApiError(
        503,
        'service_unavailable',
        'تعذر إنشاء رمز فريد. حاول مرة أخرى.',
      );
    }
    await writeAudit(
      admin,
      adminUser.id,
      'license_created',
      created.id as string,
      {
        label,
        maxDevices,
        subscriptionPlan,
        expiresAt,
      },
    );
    return {
      ok: true,
      license: adminLicense(created),
      // يُعاد الآن عند الإنشاء، ويمكن للمالك استرجاع النسخة المشفّرة لاحقاً.
      activationCode: rawCode,
    };
  }

  if (action === 'admin-update-license') {
    const licenseId = parseLicenseId(input.licenseId);
    const updates: Record<string, unknown> = {};
    if (Object.prototype.hasOwnProperty.call(input, 'status')) {
      if (
        !['active', 'suspended', 'revoked'].includes(input.status as string)
      ) {
        throw new ApiError(400, 'invalid_status', 'حالة الترخيص غير صالحة.');
      }
      updates.status = input.status;
    }
    if (Object.prototype.hasOwnProperty.call(input, 'maxDevices')) {
      updates.max_devices = parseMaxDevices(input.maxDevices);
    }
    if (Object.prototype.hasOwnProperty.call(input, 'expiresOn')) {
      updates.expires_at = parseExpiry(input.expiresOn);
    }
    if (Object.prototype.hasOwnProperty.call(input, 'label')) {
      updates.label = optionalString(input.label, 120);
    }
    if (Object.prototype.hasOwnProperty.call(input, 'notes')) {
      updates.notes = optionalString(input.notes, 1000);
    }
    if (Object.prototype.hasOwnProperty.call(input, 'planId')) {
      updates.plan_id = optionalString(input.planId, 32);
    }
    if (Object.prototype.hasOwnProperty.call(input, 'maxSubjects')) {
      updates.max_subjects = parseMaxDevices(input.maxSubjects);
    }
    if (Object.prototype.hasOwnProperty.call(input, 'selectedSubjects')) {
      updates.selected_subjects = Array.isArray(input.selectedSubjects) ? input.selectedSubjects : [];
    }
    if (!Object.keys(updates).length) {
      throw new ApiError(400, 'invalid_input', 'لم يتم اختيار أي تعديل.');
    }

    const { data, error } = await admin
      .from('licenses')
      .update(updates)
      .eq('id', licenseId)
      .select(
        'id, code_hint, label, status, expires_at, max_devices, plan_id, max_subjects, selected_subjects, notes, created_at, updated_at',
      )
      .maybeSingle();
    if (error?.code === '23514') {
      throw new ApiError(
        400,
        'device_limit_below_active',
        'ألغِ تفعيل الأجهزة الزائدة أولاً، ثم خفّض الحد المسموح.',
      );
    }
    if (error || !data) {
      throw new ApiError(404, 'not_found', 'لم يتم العثور على هذا الترخيص.');
    }
    await writeAudit(
      admin,
      adminUser.id,
      'license_updated',
      licenseId,
      updates,
    );
    return { ok: true, license: adminLicense(data) };
  }

  if (action === 'admin-revoke-activation') {
    const licenseId = parseLicenseId(input.licenseId);
    const activationId = parseLicenseId(input.activationId);
    const { data, error } = await admin
      .from('license_activations')
      .update({ is_active: false, revoked_at: new Date().toISOString() })
      .eq('id', activationId)
      .eq('license_id', licenseId)
      .eq('is_active', true)
      .select('id')
      .maybeSingle();
    if (error || !data) {
      throw new ApiError(
        404,
        'not_found',
        'لم يتم العثور على هذا التفعيل النشط.',
      );
    }
    await writeAudit(admin, adminUser.id, 'activation_revoked', licenseId, {
      activationId,
    });
    return { ok: true };
  }

  if (action === 'admin-get-ai-analytics') {
    const { data: overview } = await admin.rpc('get_ai_consumption_overview');
    const { data: features } = await admin.rpc('get_ai_features_breakdown');
    const { data: topConsumers } = await admin.rpc('get_ai_top_consumers', { p_limit: 25 });
    return {
      ok: true,
      overview: overview || {},
      features: features || [],
      topConsumers: topConsumers || [],
    };
  }

  if (action === 'admin-update-license-subjects') {
    const licenseId = parseLicenseId(input.licenseId);
    const rawSubjects = Array.isArray(input.selectedSubjects) ? input.selectedSubjects : [];
    const selectedSubjects = rawSubjects.filter(s => typeof s === 'string' && s.trim());

    const { data, error } = await admin
      .from('licenses')
      .update({ selected_subjects: selectedSubjects, updated_at: new Date().toISOString() })
      .eq('id', licenseId)
      .select(
        'id, code_hint, label, status, expires_at, max_devices, plan_id, max_subjects, selected_subjects, notes, created_at, updated_at',
      )
      .maybeSingle();

    if (error || !data) {
      throw new ApiError(404, 'not_found', 'لم يتم العثور على هذا الترخيص.');
    }
    await writeAudit(admin, adminUser.id, 'license_subjects_updated', licenseId, { selectedSubjects });
    return { ok: true, license: adminLicense(data) };
  }

  throw new ApiError(400, 'invalid_action', 'الطلب غير صالح.');
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS')
    return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST')
    return json(
      { ok: false, code: 'method_not_allowed', message: 'الطريقة غير مدعومة.' },
      405,
    );

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) {
      throw new ApiError(
        503,
        'service_unavailable',
        'خدمة التفعيل غير مهيأة بعد. حاول مرة أخرى لاحقاً.',
      );
    }

    const input = await req.json().catch(() => null);
    if (!isRecord(input))
      throw new ApiError(400, 'invalid_input', 'الطلب غير صالح.');

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const action = typeof input.action === 'string' ? input.action : '';
    const body = [
      'status',
      'activate',
      'start_trial',
      'set_selected_subjects',
    ].includes(action)
      ? await handlePublicAction(admin, req, input)
      : await handleAdminAction(admin, req, input);
    return json(body);
  } catch (error) {
    if (error instanceof ApiError) {
      return json(
        { ok: false, code: error.code, message: error.message },
        error.status,
      );
    }
    // لا نسجل payload لأن طلب التفعيل قد يتضمن رمزاً سرياً.
    console.error(
      'License function failed',
      error instanceof Error ? error.message : 'unknown error',
    );
    return json(
      {
        ok: false,
        code: 'service_unavailable',
        message: 'تعذر تنفيذ الطلب حالياً. حاول مرة أخرى بعد قليل.',
      },
      500,
    );
  }
});
