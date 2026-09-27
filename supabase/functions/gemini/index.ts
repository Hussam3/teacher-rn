// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  ProviderCredentialError,
  resolveProviderApiKey,
} from '../_shared/provider-credentials.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-gemini-api-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const MAX_PROMPT_LENGTH = 35_000;
const MAX_IMAGE_BYTES = 7 * 1024 * 1024;
const DEFAULT_ESTIMATED_TOKENS = 2500;
const GEMINI_MODELS = new Set([
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.5-pro',
]);
const OPENAI_COMPATIBLE_ENDPOINTS: Record<string, string> = {
  deepseek: 'https://api.deepseek.com/chat/completions',
  openrouter: 'https://openrouter.ai/api/v1/chat/completions',
  nvidia_nim: 'https://integrate.api.nvidia.com/v1/chat/completions',
};
const PROVIDER_MODEL_SETS: Record<string, Set<string>> = {
  gemini: GEMINI_MODELS,
  deepseek: new Set(['deepseek-v4-pro']),
  openrouter: new Set([
    'openai/gpt-4o-mini',
    'anthropic/claude-3.5-haiku',
    'google/gemini-2.5-flash',
    'meta-llama/llama-3.3-70b-instruct',
    'qwen/qwen-2.5-72b-instruct',
    'deepseek/deepseek-chat-v3-0324',
  ]),
  nvidia_nim: new Set([
    'meta/llama-3.3-70b-instruct',
    'meta/llama-3.1-8b-instruct',
    'qwen/qwen2.5-72b-instruct',
    'google/gemma-2-27b-it',
    'deepseek-ai/deepseek-r1',
  ]),
};
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface GeminiUsageMetadata {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  totalTokenCount?: number;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
  usageMetadata?: GeminiUsageMetadata;
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
}

interface OpenAICompatibleResponse {
  choices?: Array<{
    message?: { content?: string };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  error?: {
    code?: string | number;
    message?: string;
  };
}

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function trialClaimError(
  message: string | undefined,
): { code: string; error: string } | null {
  switch (message) {
    case 'trial_daily_plan_limit':
      return {
        code: message,
        error:
          'استخدمت خطة اليوم في التجربة المجانية. تتجدد فرصتك لإنشاء خطة جديدة غداً.',
      };
    case 'trial_proofread_limit':
      return {
        code: message,
        error:
          'استخدمت التدقيق اللغوي المتاح اليوم في التجربة المجانية. يتجدد غداً.',
      };
    case 'trial_formatting_limit':
      return {
        code: message,
        error:
          'استخدمت التنسيق بالذكاء المتاح اليوم في التجربة المجانية. يتجدد غداً.',
      };
    case 'trial_feature_not_allowed':
      return {
        code: message,
        error:
          'هذه الميزة متاحة في الخطة المدفوعة، التي تفتح أدوات ذكاء إضافية ونتائج أعلى جودة.',
      };
    case 'trial_feature_limit':
      return {
        code: message,
        error: 'اكتمل الحد اليومي لهذه الميزة في التجربة المجانية. يتجدد غداً.',
      };
    case 'trial_configuration_missing':
      return {
        code: message,
        error: 'إعدادات التجربة المجانية غير مكتملة على الخادم. حاول لاحقاً.',
      };
    case 'ai_provider_paused':
      return {
        code: message,
        error: 'مزود الذكاء الاصطناعي متوقف مؤقتاً للصيانة. حاول لاحقاً.',
      };
    case 'ai_request_id_conflict':
      return {
        code: message,
        error: 'لا يمكن استخدام معرّف هذا الطلب من جهاز أو حساب آخر.',
      };
    case 'ai_entitlement_changed':
      return {
        code: message,
        error: 'تغيرت حالة الترخيص أثناء تجهيز الطلب. أعد المحاولة.',
      };
    case 'ai_route_configuration_missing':
    case 'ai_route_configuration_invalid':
      return {
        code: message,
        error: 'إعدادات مزود الذكاء الاصطناعي غير مكتملة. حاول لاحقاً.',
      };
    default:
      return null;
  }
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS')
    return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'الطريقة غير مدعومة' }, 405);

  let admin: ReturnType<typeof createClient> | null = null;
  let requestId: string = crypto.randomUUID();
  let wasClaimed = false;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      return json(
        { error: 'خدمة الذكاء الاصطناعي غير مهيأة بعد على الخادم.' },
        503,
      );
    }

    admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const input = (await req.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const prompt = typeof input.prompt === 'string' ? input.prompt.trim() : '';
    const imageBase64 =
      typeof input.imageBase64 === 'string' ? input.imageBase64 : undefined;
    const featureType =
      typeof input.featureType === 'string' ? input.featureType : 'other_ai';
    const subjectName =
      typeof input.subjectName === 'string' ? input.subjectName.trim() : null;
    const subjectId =
      typeof input.subjectId === 'string' ? input.subjectId : null;
    const installationId =
      typeof input.installationId === 'string' ? input.installationId : null;
    if (typeof input.requestId === 'string' && input.requestId) {
      if (!UUID_PATTERN.test(input.requestId)) {
        return json({ error: 'معرّف الطلب غير صالح.' }, 400);
      }
      requestId = input.requestId;
    }

    // دعم المفتاح الشخصي من الـ Headers أو الـ Body مع ضمان عدم تسجيله في السجلات
    const headerPersonalKey = req.headers.get('x-gemini-api-key');
    const bodyPersonalKey =
      typeof input.personalApiKey === 'string' && input.personalApiKey.trim()
        ? input.personalApiKey.trim()
        : null;
    const personalApiKey = headerPersonalKey || bodyPersonalKey || null;
    const hasPersonalKey = Boolean(
      personalApiKey && personalApiKey.length > 10,
    );

    if (!installationId) {
      return json(
        { error: 'تعذر التحقق من هوية الجهاز (Installation ID مفقود).' },
        400,
      );
    }

    if (!prompt || prompt.length > MAX_PROMPT_LENGTH) {
      return json(
        {
          error: 'النص المطلوب غير صالح أو طويل جداً (الحد الأقصى 35,000 حرف).',
        },
        400,
      );
    }
    if (imageBase64 && imageBase64.length * 0.75 > MAX_IMAGE_BYTES) {
      return json(
        { error: 'حجم الصورة كبير جداً (الحد الأقصى 7 ميجابايت).' },
        413,
      );
    }

    // استخراج معرّف المستخدم الموثق إن وجد
    let userId: string | null = null;
    const authorization = req.headers.get('Authorization');
    if (authorization?.startsWith('Bearer ')) {
      const token = authorization.slice('Bearer '.length);
      const { data: authData } = await admin.auth.getUser(token);
      if (authData?.user) userId = authData.user.id;
    }

    // تقدير مبدئي للتوكنات للحجز المسبق (Usage Reservation) لمنع التجاوز
    const estimatedTokens = Math.max(
      DEFAULT_ESTIMATED_TOKENS,
      Math.ceil(prompt.length / 3.5),
    );

    // 1. استدعاء الدالة الذرية المركزية في قاعدة البيانات (Claim AI Request)
    const { data: claimData, error: claimError } = await admin.rpc(
      'claim_ai_request_routed',
      {
        p_request_id: requestId,
        p_installation_id: installationId,
        p_user_id: userId,
        p_feature_type: featureType,
        p_subject_name: subjectName,
        p_subject_id: subjectId,
        p_estimated_tokens: estimatedTokens,
        p_has_personal_key: hasPersonalKey,
        p_requires_vision: Boolean(imageBase64),
      },
    );

    if (claimError || !claimData) {
      const trialError = trialClaimError(claimError?.message);
      if (trialError) {
        return json(
          { error: trialError.error, code: trialError.code },
          [
            'trial_configuration_missing',
            'ai_route_configuration_missing',
            'ai_route_configuration_invalid',
          ].includes(trialError.code)
            ? 503
            : ['ai_request_id_conflict', 'ai_entitlement_changed'].includes(
                trialError.code,
              )
            ? 409
            : 403,
        );
      }
      console.error('Error claiming AI request RPC', claimError);
      return json(
        {
          error:
            'تعذر التحقق من صلاحيات الذكاء الاصطناعي. يرجى المحاولة لاحقاً.',
        },
        500,
      );
    }

    // إذا كان الطلب مسجلاً مسبقاً بنجاح (Idempotent Cache Replay)
    if (claimData.is_duplicate && claimData.status === 'success') {
      return json({
        text: claimData.response_cache || '',
        usage: claimData.usage || {},
        cached: true,
      });
    }

    // إذا رفضت الخطة أو الصلاحيات الطلب
    if (!claimData.allowed) {
      const errorCode = claimData.error_code || 'forbidden';
      const statusMap: Record<string, number> = {
        concurrency_in_flight: 409,
        rate_limit_burst: 429,
        rate_limit_hourly: 429,
        trial_expired: 403,
        trial_usage_limit: 403,
        trial_daily_limit: 403,
        daily_hard_limit: 403,
        monthly_hard_limit: 403,
        subject_not_allowed: 403,
        feature_not_allowed: 403,
        license_inactive: 403,
        license_expired: 403,
        request_expired: 409,
        request_not_reusable: 409,
      };
      const httpStatus = statusMap[errorCode] || 403;
      return json(
        {
          error: claimData.error || 'طلب الذكاء الاصطناعي غير مصرح به.',
          code: errorCode,
        },
        httpStatus,
      );
    }

    wasClaimed = true;
    const selectedProvider =
      typeof claimData.provider_id === 'string' ? claimData.provider_id : '';
    const selectedModel =
      typeof claimData.model_id === 'string' ? claimData.model_id : '';
    const isValidRoute =
      PROVIDER_MODEL_SETS[selectedProvider]?.has(selectedModel) ?? false;
    if (!isValidRoute) {
      await admin.rpc('complete_ai_request', {
        p_request_id: requestId,
        p_status: 'failed',
        p_failure_reason: 'إعدادات مزود الذكاء الاصطناعي غير صالحة.',
        p_provider_error_type: 'invalid_route',
      });
      return json({ error: 'إعدادات مزود الذكاء الاصطناعي غير صالحة.' }, 503);
    }

    let activeApiKey = selectedProvider === 'gemini' ? personalApiKey : null;
    if (!activeApiKey) {
      try {
        activeApiKey = (
          await resolveProviderApiKey(admin, selectedProvider)
        ).apiKey;
      } catch (error) {
        console.error(
          'AI provider credential unavailable',
          selectedProvider,
          error instanceof ProviderCredentialError ? error.code : 'unknown',
        );
        await admin.rpc('complete_ai_request', {
          p_request_id: requestId,
          p_status: 'failed',
          p_failure_reason: `تعذر تحميل مفتاح ${selectedProvider} بأمان.`,
          p_provider_error_type: 'provider_credential_unavailable',
        });
        return json(
          { error: `مزود ${selectedProvider} غير مهيأ على الخادم.` },
          503,
        );
      }
    }
    if (!activeApiKey) {
      await admin.rpc('complete_ai_request', {
        p_request_id: requestId,
        p_status: 'failed',
        p_failure_reason: `مفتاح ${selectedProvider} غير مهيأ على الخادم.`,
        p_provider_error_type: 'missing_provider_key',
      });
      return json(
        { error: `مزود ${selectedProvider} غير مهيأ على الخادم.` },
        503,
      );
    }

    if (selectedProvider !== 'gemini' && imageBase64) {
      await admin.rpc('complete_ai_request', {
        p_request_id: requestId,
        p_status: 'failed',
        p_failure_reason: 'هذا النموذج لا يدعم معالجة الصور.',
        p_provider_error_type: 'vision_not_supported',
      });
      return json({ error: 'النموذج المختار لا يدعم معالجة الصور.' }, 422);
    }

    const trialProofreadingRestriction =
      claimData.is_trial && featureType === 'question_improvement'
        ? '\n\nقيد التجربة المجانية: اقتصر حصراً على التدقيق الإملائي والنحوي والأسلوبي. لا تقترح تصحيحات علمية أو صيغاً كيميائية أو رموزاً رياضية أو تعديلات في محتوى الأسئلة.'
        : '';

    // 2. استدعاء المزود المحدد من خادم التوجيه فقط.
    const providerPrompt = `${prompt}${trialProofreadingRestriction}`;
    const openAICompatibleEndpoint =
      selectedProvider === 'gemini'
        ? null
        : OPENAI_COMPATIBLE_ENDPOINTS[selectedProvider];
    let response: Response;
    try {
      if (selectedProvider === 'gemini') {
        const parts: Array<Record<string, unknown>> = [
          { text: providerPrompt },
        ];
        if (imageBase64) {
          const cleanImg = imageBase64.includes(',')
            ? imageBase64.split(',')[1]
            : imageBase64;
          parts.push({
            inlineData: { mimeType: 'image/jpeg', data: cleanImg },
          });
        }
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
          selectedModel,
        )}:generateContent`;
        response = await fetch(geminiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-goog-api-key': activeApiKey,
          },
          body: JSON.stringify({ contents: [{ parts }] }),
        });
      } else if (openAICompatibleEndpoint) {
        response = await fetch(openAICompatibleEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${activeApiKey}`,
          },
          body: JSON.stringify({
            model: selectedModel,
            messages: [{ role: 'user', content: providerPrompt }],
            stream: false,
          }),
        });
      } else {
        throw new Error('Unsupported provider endpoint');
      }
    } catch {
      await admin.rpc('complete_ai_request', {
        p_request_id: requestId,
        p_status: 'failed',
        p_failure_reason: 'فشل الاتصال بمزود خدمة الذكاء الاصطناعي.',
        p_provider_error_type: `${selectedProvider}_network_error`,
      });
      return json(
        {
          error:
            'تعذر الاتصال بمزود الذكاء الاصطناعي. تأكد من اتصال الإنترنت وحاول ثانية.',
        },
        502,
      );
    }

    const payload = await response.json().catch(() => null);
    const gemini =
      selectedProvider === 'gemini' ? (payload as GeminiResponse | null) : null;
    const openai =
      selectedProvider !== 'gemini'
        ? (payload as OpenAICompatibleResponse | null)
        : null;

    if (!response.ok) {
      console.error('AI provider request failed', {
        provider: selectedProvider,
        status: response.status,
      });
      const isRateLimit = response.status === 429;
      const errorMsg = isRateLimit
        ? 'الخادم مشغول حالياً بكثرة الطلبات المتزامنة. يرجى الانتظار بضع ثوانٍ.'
        : 'تعذر إكمال طلب الذكاء الاصطناعي حالياً.';

      await admin.rpc('complete_ai_request', {
        p_request_id: requestId,
        p_status: 'failed',
        p_failure_reason: errorMsg,
        p_provider_error_type: `${selectedProvider}_http_${response.status}`,
      });

      return json(
        {
          error: errorMsg,
          code: isRateLimit ? 'provider_busy' : 'provider_error',
        },
        response.status === 429 ? 429 : 502,
      );
    }

    const text =
      selectedProvider === 'gemini'
        ? gemini?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
        : openai?.choices?.[0]?.message?.content?.trim();
    if (!text) {
      await admin.rpc('complete_ai_request', {
        p_request_id: requestId,
        p_status: 'failed',
        p_failure_reason: 'عاد الذكاء الاصطناعي باستجابة فارغة.',
        p_provider_error_type: `${selectedProvider}_empty_response`,
      });
      return json(
        {
          error:
            'عاد الذكاء الاصطناعي باستجابة فارغة. حاول إعادة صياغة السؤال أو الطلب.',
        },
        502,
      );
    }

    // 3. استخراج التوكنات الفعلية وحساب التكلفة الدقيقة
    const inputTokens =
      (selectedProvider === 'gemini'
        ? gemini?.usageMetadata?.promptTokenCount
        : openai?.usage?.prompt_tokens) ??
      Math.ceil(providerPrompt.length / 4);
    const outputTokens =
      (selectedProvider === 'gemini'
        ? gemini?.usageMetadata?.candidatesTokenCount
        : openai?.usage?.completion_tokens) ?? Math.ceil(text.length / 4);
    const totalTokens =
      (selectedProvider === 'gemini'
        ? gemini?.usageMetadata?.totalTokenCount
        : openai?.usage?.total_tokens) ?? inputTokens + outputTokens;

    const inputRate = Number(claimData.input_rate_per_million);
    const outputRate = Number(claimData.output_rate_per_million);
    if (
      !Number.isFinite(inputRate) ||
      !Number.isFinite(outputRate) ||
      inputRate < 0 ||
      outputRate < 0
    ) {
      await admin.rpc('complete_ai_request', {
        p_request_id: requestId,
        p_status: 'failed',
        p_failure_reason: 'لم يتم تثبيت تسعير النموذج قبل التنفيذ.',
        p_provider_error_type: 'missing_pricing_snapshot',
      });
      return json({ error: 'إعدادات تسعير النموذج غير صالحة.' }, 503);
    }
    const providerCost =
      (inputTokens * inputRate + outputTokens * outputRate) / 1_000_000;
    // المفتاح الشخصي مدعوم لـ Gemini فقط؛ بقية المزوّدين يستخدمون مفتاح المشروع دائماً.
    const estimatedCost = claimData.uses_personal_key ? 0.0 : providerCost;

    // 4. إكمال الطلب وتثبيت الاستهلاك وتحرير الحجز الذري
    const { data: completionData, error: completionError } = await admin.rpc(
      'complete_ai_request',
      {
        p_request_id: requestId,
        p_status: 'success',
        p_input_tokens: inputTokens,
        p_output_tokens: outputTokens,
        p_total_tokens: totalTokens,
        p_estimated_cost: estimatedCost,
        p_provider_cost: providerCost,
        p_response_text: text,
      },
    );
    if (
      completionError ||
      !completionData?.ok ||
      completionData.status !== 'success' ||
      completionData.replayed
    ) {
      console.error('Could not finalize AI request', {
        code: completionError?.code,
        status: completionData?.status,
      });
      return json(
        {
          error:
            'تعذر تثبيت نتيجة الطلب بأمان. أرسل طلباً جديداً بدلاً من إعادة المحاولة تلقائياً.',
        },
        completionData?.replayed ? 409 : 503,
      );
    }

    return json({
      text,
      usage: {
        inputTokens,
        outputTokens,
        totalTokens,
        estimatedCost: Math.round(estimatedCost * 1_000_000) / 1_000_000,
        providerId: selectedProvider,
        modelId: selectedModel,
      },
      quotaStatus: {
        isTrial: Boolean(claimData.is_trial),
        isLicensed: Boolean(claimData.license_id),
        allowedSubjects: claimData.allowed_subjects || [],
      },
    });
  } catch (error) {
    console.error('Gemini Edge Function unexpected error', error);
    if (admin && wasClaimed) {
      try {
        await admin.rpc('complete_ai_request', {
          p_request_id: requestId,
          p_status: 'failed',
          p_failure_reason:
            error instanceof Error ? error.message : 'Unknown server error',
          p_provider_error_type: 'uncaught_exception',
        });
      } catch (e) {
        console.error('Failed to cleanup claimed request', e);
      }
    }
    return json(
      {
        error:
          'تعذر معالجة الطلب حالياً. يرجى التحقق من اتصال الإنترنت والمحاولة لاحقاً.',
      },
      500,
    );
  }
});
