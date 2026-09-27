// @ts-nocheck

export const AI_PROVIDER_IDS = [
  'gemini',
  'deepseek',
  'openrouter',
  'nvidia_nim',
] as const;

export type AIProviderId = (typeof AI_PROVIDER_IDS)[number];

export class ProviderCredentialError extends Error {
  constructor(readonly code: string, message: string) {
    super(message);
  }
}

const ENCRYPTION_KEY_ID_PATTERN = /^[A-Za-z0-9_-]{1,32}$/;
const BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/;

export function isAIProviderId(value: unknown): value is AIProviderId {
  return (
    value === 'gemini' ||
    value === 'deepseek' ||
    value === 'openrouter' ||
    value === 'nvidia_nim'
  );
}

export function providerEnvironmentVariable(provider: AIProviderId): string {
  switch (provider) {
    case 'gemini':
      return 'GEMINI_API_KEY';
    case 'deepseek':
      return 'DEEPSEEK_API_KEY';
    case 'openrouter':
      return 'OPENROUTER_API_KEY';
    case 'nvidia_nim':
      return 'NVIDIA_NIM_API_KEY';
  }
}

export function normalizeProviderApiKey(value: unknown): string {
  if (typeof value !== 'string') {
    throw new ProviderCredentialError(
      'invalid_provider_key',
      'مفتاح API غير صالح.',
    );
  }
  const key = value.trim();
  if (
    key.length < 12 ||
    key.length > 2048 ||
    /[\s\x00-\x1f\x7f]/.test(key)
  ) {
    throw new ProviderCredentialError(
      'invalid_provider_key',
      'مفتاح API غير صالح.',
    );
  }
  return key;
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
  if (!BASE64URL_PATTERN.test(value)) throw new Error('invalid base64url');
  const padded = value
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(padded);
  return Uint8Array.from(binary, char => char.charCodeAt(0));
}

function encryptionKeyId(): string {
  const keyId =
    Deno.env.get('AI_PROVIDER_KEY_ENCRYPTION_KEY_ID')?.trim() || 'v1';
  if (!ENCRYPTION_KEY_ID_PATTERN.test(keyId)) {
    throw new ProviderCredentialError(
      'provider_key_storage_unconfigured',
      'تخزين مفاتيح المزوّدين غير مهيأ بأمان على الخادم.',
    );
  }
  return keyId;
}

async function providerEncryptionKey(): Promise<CryptoKey> {
  const encoded = Deno.env.get('AI_PROVIDER_KEY_ENCRYPTION_KEY')?.trim();
  if (!encoded) {
    throw new ProviderCredentialError(
      'provider_key_storage_unconfigured',
      'تخزين مفاتيح المزوّدين غير مهيأ بأمان على الخادم.',
    );
  }

  let raw: Uint8Array;
  try {
    raw = base64UrlDecode(encoded);
  } catch {
    throw new ProviderCredentialError(
      'provider_key_storage_unconfigured',
      'تخزين مفاتيح المزوّدين غير مهيأ بأمان على الخادم.',
    );
  }
  if (raw.length !== 32) {
    throw new ProviderCredentialError(
      'provider_key_storage_unconfigured',
      'تخزين مفاتيح المزوّدين غير مهيأ بأمان على الخادم.',
    );
  }
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, [
    'encrypt',
    'decrypt',
  ]);
}

function additionalData(provider: AIProviderId): Uint8Array {
  return new TextEncoder().encode(`teacherbag:provider-credential:v1:${provider}`);
}

export function providerKeyStorageReady(): boolean {
  try {
    const encoded = Deno.env.get('AI_PROVIDER_KEY_ENCRYPTION_KEY')?.trim();
    return Boolean(encoded && base64UrlDecode(encoded).length === 32 && encryptionKeyId());
  } catch {
    return false;
  }
}

export async function encryptProviderApiKey(
  provider: AIProviderId,
  value: string,
): Promise<{ ciphertext: string; iv: string; encryptionKeyId: string }> {
  const apiKey = normalizeProviderApiKey(value);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: additionalData(provider) },
    await providerEncryptionKey(),
    new TextEncoder().encode(apiKey),
  );
  return {
    ciphertext: base64UrlEncode(new Uint8Array(encrypted)),
    iv: base64UrlEncode(iv),
    encryptionKeyId: encryptionKeyId(),
  };
}

export async function decryptProviderApiKey(
  provider: AIProviderId,
  credential: Record<string, unknown>,
): Promise<string> {
  const keyId = credential.encryption_key_id;
  const ciphertext = credential.ciphertext;
  const iv = credential.iv;
  if (
    typeof keyId !== 'string' ||
    keyId !== encryptionKeyId() ||
    typeof ciphertext !== 'string' ||
    typeof iv !== 'string'
  ) {
    throw new ProviderCredentialError(
      'provider_key_decryption_failed',
      'تعذر تحميل مفتاح المزوّد بأمان.',
    );
  }

  try {
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: base64UrlDecode(iv),
        additionalData: additionalData(provider),
      },
      await providerEncryptionKey(),
      base64UrlDecode(ciphertext),
    );
    return normalizeProviderApiKey(new TextDecoder().decode(decrypted));
  } catch (error) {
    if (error instanceof ProviderCredentialError) throw error;
    throw new ProviderCredentialError(
      'provider_key_decryption_failed',
      'تعذر تحميل مفتاح المزوّد بأمان.',
    );
  }
}

function environmentProviderKey(provider: AIProviderId): string | null {
  const value = Deno.env.get(providerEnvironmentVariable(provider));
  return value?.trim() ? normalizeProviderApiKey(value) : null;
}

export async function resolveProviderApiKey(
  admin: { from: (table: string) => any },
  provider: AIProviderId,
): Promise<{
  apiKey: string | null;
  source: 'managed' | 'environment' | 'missing';
  keyVersion: number | null;
  rotatedAt: string | null;
}> {
  const { data, error } = await admin
    .from('ai_provider_credentials')
    .select('provider_id, ciphertext, iv, encryption_key_id, key_version, rotated_at')
    .eq('provider_id', provider)
    .maybeSingle();
  if (error) {
    throw new ProviderCredentialError(
      'provider_key_storage_unavailable',
      'تعذر تحميل إعدادات مفاتيح المزوّدين بأمان.',
    );
  }
  if (data) {
    return {
      apiKey: await decryptProviderApiKey(provider, data),
      source: 'managed',
      keyVersion: Number(data.key_version) || null,
      rotatedAt: typeof data.rotated_at === 'string' ? data.rotated_at : null,
    };
  }

  const apiKey = environmentProviderKey(provider);
  return {
    apiKey,
    source: apiKey ? 'environment' : 'missing',
    keyVersion: null,
    rotatedAt: null,
  };
}

export async function providerCredentialStatuses(
  admin: { from: (table: string) => any },
): Promise<
  Array<{
    id: AIProviderId;
    configured: boolean;
    source: 'managed' | 'environment' | 'missing';
    keyVersion: number | null;
    rotatedAt: string | null;
  }>
> {
  const { data, error } = await admin
    .from('ai_provider_credentials')
    .select(
      'provider_id, ciphertext, iv, encryption_key_id, key_version, rotated_at',
    );
  if (error) {
    throw new ProviderCredentialError(
      'provider_key_storage_unavailable',
      'تعذر تحميل إعدادات مفاتيح المزوّدين بأمان.',
    );
  }
  const managed = new Map(
    (data ?? []).map((row: Record<string, unknown>) => [row.provider_id, row]),
  );
  return Promise.all(AI_PROVIDER_IDS.map(async provider => {
    const credential = managed.get(provider) as Record<string, unknown> | undefined;
    if (credential) {
      let configured = true;
      try {
        // Validate decryption here so routing cannot select a credential that
        // the execution function would fail to load later.
        await decryptProviderApiKey(provider, credential);
      } catch {
        configured = false;
      }
      return {
        id: provider,
        configured,
        source: 'managed' as const,
        keyVersion: Number(credential.key_version) || null,
        rotatedAt:
          typeof credential.rotated_at === 'string' ? credential.rotated_at : null,
      };
    }
    const configured = Boolean(environmentProviderKey(provider));
    return {
      id: provider,
      configured,
      source: configured ? ('environment' as const) : ('missing' as const),
      keyVersion: null,
      rotatedAt: null,
    };
  }));
}

const PROVIDER_TEST_PROFILES: Record<
  Exclude<AIProviderId, 'gemini'>,
  { endpoint: string; modelId: string }
> = {
  deepseek: {
    endpoint: 'https://api.deepseek.com/chat/completions',
    modelId: 'deepseek-v4-pro',
  },
  openrouter: {
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    modelId: 'openai/gpt-4o-mini',
  },
  nvidia_nim: {
    endpoint: 'https://integrate.api.nvidia.com/v1/chat/completions',
    modelId: 'meta/llama-3.1-8b-instruct',
  },
};

export async function testProviderApiKey(
  provider: AIProviderId,
  apiKey: string,
): Promise<{ providerId: AIProviderId; modelId: string; latencyMs: number }> {
  const modelId =
    provider === 'gemini'
      ? 'gemini-2.5-flash'
      : PROVIDER_TEST_PROFILES[provider].modelId;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  const startedAt = Date.now();
  let response: Response;
  try {
    response =
      provider === 'gemini'
        ? await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-goog-api-key': apiKey,
              },
              body: JSON.stringify({
                contents: [{ parts: [{ text: 'Reply with OK.' }] }],
              }),
              signal: controller.signal,
            },
          )
        : await fetch(PROVIDER_TEST_PROFILES[provider].endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: modelId,
              messages: [{ role: 'user', content: 'Reply with OK.' }],
              stream: false,
            }),
            signal: controller.signal,
          });
  } catch {
    throw new ProviderCredentialError(
      'provider_network_error',
      'تعذر الاتصال بمزوّد الذكاء الاصطناعي. تحقق من المفتاح والحساب ثم أعد المحاولة.',
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    console.error('Provider key test was rejected', provider, response.status);
    if (response.status === 401 || response.status === 403) {
      throw new ProviderCredentialError(
        'provider_key_rejected',
        'رفض المزوّد مفتاح API. تأكد من اختيار المزوّد الصحيح، ومن تفعيل API للمفتاح وعدم تقييده بطلبات المتصفح فقط.',
      );
    }
    if (response.status === 402) {
      throw new ProviderCredentialError(
        'provider_billing_required',
        'حساب المزوّد لا يملك رصيداً أو وسيلة دفع صالحة لتنفيذ اختبار المفتاح.',
      );
    }
    if (response.status === 404) {
      throw new ProviderCredentialError(
        'provider_model_unavailable',
        'نموذج الاختبار غير متاح لهذا الحساب أو المفتاح. تحقق من صلاحية النموذج في حساب المزوّد.',
      );
    }
    if (response.status === 429) {
      throw new ProviderCredentialError(
        'provider_rate_limited',
        'رفض المزوّد الاختبار مؤقتاً بسبب حد الاستخدام. انتظر قليلاً ثم أعد المحاولة.',
      );
    }
    throw new ProviderCredentialError(
      `provider_http_${response.status}`,
      'رفض مزوّد الذكاء الاصطناعي اختبار الاتصال. تحقق من المفتاح والنموذج والحساب.',
    );
  }

  const payload = await response.json().catch(() => null);
  const text =
    provider === 'gemini'
      ? payload?.candidates?.[0]?.content?.parts?.[0]?.text
      : payload?.choices?.[0]?.message?.content;
  if (typeof text !== 'string' || !text.trim()) {
    throw new ProviderCredentialError(
      'provider_test_failed',
      'عاد مزوّد الذكاء الاصطناعي باختبار غير مكتمل.',
    );
  }

  return {
    providerId: provider,
    modelId,
    latencyMs: Math.max(0, Date.now() - startedAt),
  };
}
