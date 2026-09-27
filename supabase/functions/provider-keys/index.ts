// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  AIProviderId,
  AI_PROVIDER_IDS,
  ProviderCredentialError,
  encryptProviderApiKey,
  isAIProviderId,
  normalizeProviderApiKey,
  providerCredentialStatuses,
  providerKeyStorageReady,
  testProviderApiKey,
} from '../_shared/provider-credentials.ts';

const DEFAULT_ALLOWED_ORIGINS = new Set([
  'https://teacher-rn-license-admin.vercel.app',
  'http://localhost:5175',
]);
const MFA_MAX_AGE_MS = 5 * 60 * 1000;

class ApiError extends Error {
  constructor(readonly status: number, readonly code: string, message: string) {
    super(message);
  }
}

function allowedOrigins(): Set<string> {
  const configured = Deno.env.get('ADMIN_ALLOWED_ORIGINS')
    ?.split(',')
    .map(origin => origin.trim())
    .filter(Boolean);
  return configured?.length ? new Set(configured) : DEFAULT_ALLOWED_ORIGINS;
}

function requestHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Vary': 'Origin',
  };
  if (origin && allowedOrigins().has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Headers'] =
      'authorization, x-client-info, apikey, content-type';
    headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
  }
  return headers;
}

function json(req: Request, body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: requestHeaders(req),
  });
}

function assertAllowedOrigin(req: Request): void {
  const origin = req.headers.get('origin');
  if (origin && !allowedOrigins().has(origin)) {
    throw new ApiError(403, 'origin_forbidden', 'مصدر الطلب غير مسموح.');
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function requiredAction(value: unknown): 'status' | 'rotate' {
  if (value === 'status' || value === 'rotate') return value;
  throw new ApiError(400, 'invalid_action', 'الطلب غير صالح.');
}

function parseProvider(value: unknown) {
  if (isAIProviderId(value)) return value;
  throw new ApiError(400, 'invalid_ai_provider', 'مزوّد الذكاء الاصطناعي غير صالح.');
}

function authorizationToken(req: Request): string {
  const authorization = req.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) {
    throw new ApiError(401, 'unauthorized', 'سجّل الدخول إلى لوحة المالك أولاً.');
  }
  return authorization.slice('Bearer '.length);
}

function mfaTimestamp(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value < 10_000_000_000 ? value * 1000 : value;
  }
  if (typeof value === 'string') {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return mfaTimestamp(numeric);
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function verifiedMfaClaims(
  token: string,
  userId: string,
): { aal: string | null; amr: unknown } | null {
  const parts = token.split('.');
  const payload = parts[1];
  if (parts.length !== 3 || !payload || !/^[A-Za-z0-9_-]+$/.test(payload)) {
    return null;
  }
  try {
    const padded = payload
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(payload.length / 4) * 4, '=');
    const binary = atob(padded);
    const claims = JSON.parse(
      new TextDecoder().decode(
        Uint8Array.from(binary, character => character.charCodeAt(0)),
      ),
    );
    if (!isRecord(claims) || claims.sub !== userId) return null;
    return {
      aal: typeof claims.aal === 'string' ? claims.aal : null,
      amr: claims.amr,
    };
  } catch {
    return null;
  }
}

function recentMfa(
  methods: unknown,
): { method: 'totp' | 'webauthn' | 'phone'; verifiedAt: string } | null {
  if (!Array.isArray(methods)) return null;
  const accepted = new Set(['totp', 'webauthn', 'phone']);
  let latest: { method: 'totp' | 'webauthn' | 'phone'; timestamp: number } | null =
    null;
  for (const entry of methods) {
    if (!isRecord(entry) || !accepted.has(entry.method as string)) continue;
    const timestamp = mfaTimestamp(entry.timestamp);
    if (!timestamp || Date.now() - timestamp > MFA_MAX_AGE_MS || timestamp > Date.now() + 60_000) {
      continue;
    }
    if (!latest || timestamp > latest.timestamp) {
      latest = {
        method: entry.method as 'totp' | 'webauthn' | 'phone',
        timestamp,
      };
    }
  }
  return latest
    ? { method: latest.method, verifiedAt: new Date(latest.timestamp).toISOString() }
    : null;
}

async function requireOwner(
  admin: ReturnType<typeof createClient>,
  req: Request,
  requireFreshMfa: boolean,
): Promise<{
  id: string;
  mfaMethod?: 'totp' | 'webauthn' | 'phone';
  mfaVerifiedAt?: string;
}> {
  const token = authorizationToken(req);
  const { data: authData, error: authError } = await admin.auth.getUser(token);
  if (authError || !authData.user) {
    throw new ApiError(401, 'unauthorized', 'انتهت جلسة الإدارة. سجّل الدخول مجدداً.');
  }

  const { data: role, error: roleError } = await admin
    .from('license_admins')
    .select('role')
    .eq('user_id', authData.user.id)
    .maybeSingle();
  if (roleError) {
    console.error('Could not verify owner role', roleError.code);
    throw new ApiError(503, 'service_unavailable', 'تعذر التحقق من صلاحية المالك.');
  }
  if (!role || role.role !== 'owner') {
    throw new ApiError(403, 'owner_required', 'هذه العملية متاحة لحساب المالك فقط.');
  }
  if (!requireFreshMfa) return { id: authData.user.id };

  // getUser(token) above verifies this exact token with Supabase Auth before
  // claims below are used for the step-up decision.
  const claims = verifiedMfaClaims(token, authData.user.id);
  if (claims?.aal !== 'aal2') {
    throw new ApiError(
      403,
      'mfa_step_up_required',
      'أكمل التحقق بخطوتين قبل تدوير مفتاح المزوّد.',
    );
  }
  const mfa = recentMfa(claims.amr);
  if (!mfa) {
    throw new ApiError(
      403,
      'mfa_step_up_required',
      'أعد التحقق بخطوتين خلال خمس دقائق قبل تدوير مفتاح المزوّد.',
    );
  }
  return {
    id: authData.user.id,
    mfaMethod: mfa.method,
    mfaVerifiedAt: mfa.verifiedAt,
  };
}

async function rotationHistory(admin: ReturnType<typeof createClient>) {
  const { data, error } = await admin
    .from('ai_provider_key_audit_log')
    .select('provider_id, action, key_version, mfa_method, failure_code, created_at')
    .order('created_at', { ascending: false })
    .limit(12);
  if (error) {
    throw new ApiError(503, 'service_unavailable', 'تعذر تحميل سجل تدوير المفاتيح.');
  }
  return (data ?? []).map(row => ({
    providerId: row.provider_id,
    action: row.action,
    keyVersion: row.key_version,
    mfaMethod: row.mfa_method,
    failureCode: row.failure_code,
    createdAt: row.created_at,
  }));
}

async function writeRejectedRotation(
  admin: ReturnType<typeof createClient>,
  input: {
    provider: AIProviderId;
    ownerId: string;
    mfaMethod: 'totp' | 'webauthn' | 'phone';
    mfaVerifiedAt: string;
    failureCode: string;
  },
): Promise<void> {
  const { error } = await admin.from('ai_provider_key_audit_log').insert({
    provider_id: input.provider,
    actor_user_id: input.ownerId,
    action: 'rejected',
    mfa_method: input.mfaMethod,
    mfa_verified_at: input.mfaVerifiedAt,
    failure_code: input.failureCode,
  });
  if (error) {
    console.error('Could not record rejected provider key rotation', error.code);
    throw new ApiError(503, 'audit_unavailable', 'تعذر تثبيت سجل تدقيق العملية بأمان.');
  }
}

Deno.serve(async req => {
  try {
    assertAllowedOrigin(req);
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: requestHeaders(req) });
    }
    if (req.method !== 'POST') {
      return json(req, { ok: false, code: 'method_not_allowed', message: 'الطريقة غير مدعومة.' }, 405);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) {
      throw new ApiError(503, 'service_unavailable', 'خدمة إدارة المفاتيح غير مهيأة بعد.');
    }
    const input = await req.json().catch(() => null);
    if (!isRecord(input)) throw new ApiError(400, 'invalid_input', 'الطلب غير صالح.');

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const action = requiredAction(input.action);

    if (action === 'status') {
      await requireOwner(admin, req, false);
      const [providers, history] = await Promise.all([
        providerCredentialStatuses(admin),
        rotationHistory(admin),
      ]);
      return json(req, {
        ok: true,
        storageReady: providerKeyStorageReady(),
        providers,
        history,
      });
    }

    const owner = await requireOwner(admin, req, true);
    const provider = parseProvider(input.providerId);
    let apiKey: string;
    try {
      apiKey = normalizeProviderApiKey(input.apiKey);
    } catch (error) {
      await writeRejectedRotation(admin, {
        provider,
        ownerId: owner.id,
        mfaMethod: owner.mfaMethod!,
        mfaVerifiedAt: owner.mfaVerifiedAt!,
        failureCode: error instanceof ProviderCredentialError ? error.code : 'invalid_provider_key',
      });
      throw error;
    }

    try {
      const test = await testProviderApiKey(provider, apiKey);
      const encrypted = await encryptProviderApiKey(provider, apiKey);
      const { data: credential, error: rotateError } = await admin.rpc(
        'rotate_ai_provider_credential',
        {
          p_provider_id: provider,
          p_ciphertext: encrypted.ciphertext,
          p_iv: encrypted.iv,
          p_encryption_key_id: encrypted.encryptionKeyId,
          p_actor_user_id: owner.id,
          p_mfa_method: owner.mfaMethod,
          p_mfa_verified_at: owner.mfaVerifiedAt,
        },
      );
      if (rotateError || !credential) {
        console.error('Could not rotate provider key', rotateError?.code);
        throw new ProviderCredentialError(
          'provider_key_rotation_failed',
          'تعذر حفظ المفتاح الجديد بأمان. لم يتم تغيير المفتاح النشط.',
        );
      }
      return json(req, { ok: true, credential, test });
    } catch (error) {
      await writeRejectedRotation(admin, {
        provider,
        ownerId: owner.id,
        mfaMethod: owner.mfaMethod!,
        mfaVerifiedAt: owner.mfaVerifiedAt!,
        failureCode:
          error instanceof ProviderCredentialError
            ? error.code
            : 'provider_key_rotation_failed',
      });
      throw error;
    }
  } catch (error) {
    if (error instanceof ApiError || error instanceof ProviderCredentialError) {
      return json(
        req,
        { ok: false, code: error.code, message: error.message },
        error instanceof ApiError ? error.status : 400,
      );
    }
    // Never log the request payload: it can contain a raw provider credential.
    console.error('Provider key function failed', error instanceof Error ? error.name : 'unknown');
    return json(
      req,
      {
        ok: false,
        code: 'service_unavailable',
        message: 'تعذر تنفيذ عملية المفتاح حالياً. حاول مرة أخرى بعد قليل.',
      },
      500,
    );
  }
});
