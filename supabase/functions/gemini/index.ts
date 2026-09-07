// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const MAX_PROMPT_LENGTH = 35_000;
const MAX_IMAGE_BYTES = 7 * 1024 * 1024;
const MAX_REQUESTS_PER_MINUTE = 6;

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
  };
}

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function normalizeBaseSubject(raw: string | null | undefined): string {
  if (!raw || typeof raw !== 'string') return 'أخرى';
  const cleaned = raw
    .trim()
    .replace(/[ـ\u0640]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة\b/g, 'ه')
    .toLowerCase();

  if (/كيميا|chem/i.test(cleaned)) return 'الكيمياء';
  if (/فيزيا|phys/i.test(cleaned)) return 'الفيزياء';
  if (/احيا|علوم الحياة|بيولوج|bio/i.test(cleaned)) return 'الأحياء';
  if (/رياضيات|حساب|جبر|math/i.test(cleaned)) return 'الرياضيات';
  if (/انكليز|انجليز|english/i.test(cleaned)) return 'اللغة الإنكليزية';
  if (/عرب|قواعد|ادب|نصوص|قراءه/i.test(cleaned)) return 'اللغة العربية';
  if (/اسلام|دين|قران/i.test(cleaned)) return 'التربية الإسلامية';
  if (/اجتماع|تاريخ|جغرافي/i.test(cleaned)) return 'الاجتماعيات';
  if (/حاسوب|كمبيوتر|computer/i.test(cleaned)) return 'الحاسوب';
  if (/علوم|science/i.test(cleaned)) return 'العلوم';
  return raw.trim();
}

function isSubjectAllowed(target: string | null, allowedList: string[]): boolean {
  if (!target || !target.trim()) return true;
  if (!allowedList || allowedList.length === 0) return true;
  if (allowedList.includes('*') || allowedList.includes('all')) return true;

  const normTarget = normalizeBaseSubject(target);
  return allowedList.some(allowed => {
    const normAllowed = normalizeBaseSubject(allowed);
    return normTarget === normAllowed || normTarget.includes(normAllowed) || normAllowed.includes(normTarget);
  });
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'الطريقة غير مدعومة' }, 405);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    if (!supabaseUrl || !serviceRoleKey || !geminiKey) {
      return json({ error: 'خدمة الذكاء الاصطناعي غير مهيأة بعد' }, 503);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const input = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const prompt = typeof input.prompt === 'string' ? input.prompt.trim() : '';
    const imageBase64 = typeof input.imageBase64 === 'string' ? input.imageBase64 : undefined;
    const featureType = typeof input.featureType === 'string' ? input.featureType : 'other_ai';
    const subjectName = typeof input.subjectName === 'string' ? input.subjectName.trim() : null;
    const subjectId = typeof input.subjectId === 'string' ? input.subjectId : null;
    const installationId = typeof input.installationId === 'string' ? input.installationId : null;
    const requestId = typeof input.requestId === 'string' && input.requestId ? input.requestId : crypto.randomUUID();

    if (!prompt || prompt.length > MAX_PROMPT_LENGTH) {
      return json({ error: 'النص المطلوب غير صالح أو طويل جداً' }, 400);
    }
    if (imageBase64 && imageBase64.length * 0.75 > MAX_IMAGE_BYTES) {
      return json({ error: 'حجم الصورة كبير جداً لاستخدام الذكاء الاصطناعي' }, 413);
    }

    // التحقق من المستخدم المسجل إن وجد
    let userId: string | null = null;
    const authorization = req.headers.get('Authorization');
    if (authorization?.startsWith('Bearer ')) {
      const token = authorization.slice('Bearer '.length);
      const { data: authData } = await admin.auth.getUser(token);
      if (authData?.user) userId = authData.user.id;
    }

    const deviceId = installationId || userId || 'unknown_device';

    // 1. منع تكرار نفس الطلب (Idempotency)
    const { data: existingRecord } = await admin
      .from('ai_usage_records')
      .select('id, status')
      .eq('request_id', requestId)
      .maybeSingle();

    if (existingRecord && existingRecord.status === 'success') {
      return json({ error: 'تمت معالجة هذا الطلب مسبقاً.' }, 409);
    }

    // 2. التحقق من التزامن اللحظي (Burst Rate Limit)
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const { count: burstCount } = await admin
      .from('ai_usage_records')
      .select('id', { count: 'exact', head: true })
      .eq('installation_id', deviceId)
      .gte('created_at', oneMinuteAgo);

    if ((burstCount ?? 0) >= MAX_REQUESTS_PER_MINUTE) {
      return json({ error: 'يرجى الانتظار بضع ثوانٍ قبل إرسال طلب جديد.' }, 429);
    }

    // 3. التحقق من الترخيص والتجربة والمواد المسموحة
    let isTrial = false;
    let licenseId: string | null = null;
    let allowedSubjects: string[] = [];
    let isHardLimitReached = false;

    // فحص التفعيل النشط للجهاز
    const { data: activation } = await admin
      .from('license_activations')
      .select('license_id, licenses(id, status, expires_at, selected_subjects, max_subjects)')
      .eq('installation_id', deviceId)
      .eq('is_active', true)
      .maybeSingle();

    if (activation && activation.licenses && activation.licenses.status === 'active') {
      const lic = activation.licenses;
      const isExpired = lic.expires_at && new Date(lic.expires_at) <= new Date();
      if (!isExpired) {
        licenseId = lic.id;
        allowedSubjects = Array.isArray(lic.selected_subjects) ? lic.selected_subjects : [];
      }
    }

    // إذا لم يكن مرخصاً، نتحقق من التجربة المجانية
    if (!licenseId) {
      const { data: trial } = await admin
        .from('license_trials')
        .select('*')
        .eq('installation_id', deviceId)
        .maybeSingle();

      if (trial) {
        const isTrialTimeExpired = new Date(trial.ends_at) <= new Date();
        const isBudgetExhausted = trial.is_budget_exhausted || (trial.total_tokens_used >= 40000);

        if (isTrialTimeExpired || isBudgetExhausted) {
          return json({
            error: 'انتهت الفترة التجريبية لأدوات الذكاء الاصطناعي. فعّل ترخيصك للاستمرار باستخدام مريح ومفتوح.',
          }, 403);
        }
        isTrial = true;
        allowedSubjects = Array.isArray(trial.selected_subjects) ? trial.selected_subjects : [];
      } else {
        // إنشاء تجربة جديدة تلقائياً عند أول طلب
        const endsAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
        await admin.from('license_trials').insert({
          installation_id: deviceId,
          ends_at: endsAt,
        });
        isTrial = true;
      }
    }

    // 4. فحص المادة المسموحة (Pre-flight Subject Verification)
    if (subjectName && allowedSubjects.length > 0) {
      if (!isSubjectAllowed(subjectName, allowedSubjects)) {
        return json({
          error: `المادة (${normalizeBaseSubject(subjectName)}) غير مشمولة في باقتك الحالية (${allowedSubjects.join('، ')}).`,
        }, 403);
      }
    }

    // 5. موجه النماذج (AI Model Router)
    let selectedModel = 'gemini-2.5-flash';
    if (featureType === 'question_formatting') {
      selectedModel = 'gemini-2.5-flash-lite';
    }

    // 6. استدعاء Google Gemini API
    const parts: Array<Record<string, unknown>> = [{ text: prompt }];
    if (imageBase64) {
      const cleanImg = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
      parts.push({ inlineData: { mimeType: 'image/jpeg', data: cleanImg } });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(selectedModel)}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': geminiKey,
        },
        body: JSON.stringify({ contents: [{ parts }] }),
      },
    );

    const gemini = (await response.json().catch(() => null)) as GeminiResponse | null;
    if (!response.ok) {
      console.error('Gemini API call failed', response.status, gemini?.error?.message);
      if (response.status === 429) {
        return json({ error: 'الخادم مشغول حالياً بكثرة الطلبات. انتظر بضع ثوانٍ ثم حاول ثانية.' }, 429);
      }
      return json({ error: gemini?.error?.message || 'تعذر إكمال طلب الذكاء الاصطناعي حالياً.' }, 502);
    }

    const text = gemini?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) {
      return json({ error: 'عاد الذكاء الاصطناعي باستجابة فارغة' }, 502);
    }

    // 7. استخراج التوكنات الفعلية وحساب التكلفة
    const inputTokens = gemini?.usageMetadata?.promptTokenCount ?? Math.ceil(prompt.length / 4);
    const outputTokens = gemini?.usageMetadata?.candidatesTokenCount ?? Math.ceil(text.length / 4);
    const totalTokens = gemini?.usageMetadata?.totalTokenCount ?? (inputTokens + outputTokens);

    // حساب التكلفة ($0.075 input / $0.30 output لكل مليون توكن في flash)
    const inputRate = selectedModel.includes('flash-lite') ? 0.0375 : 0.075;
    const outputRate = selectedModel.includes('flash-lite') ? 0.15 : 0.30;
    const estimatedCost = (inputTokens * inputRate + outputTokens * outputRate) / 1_000_000;

    // 8. تسجيل السجل المفصل في قاعدة البيانات
    await admin.from('ai_usage_records').insert({
      request_id: requestId,
      user_id: userId,
      installation_id: deviceId,
      license_id: licenseId,
      is_trial: isTrial,
      feature_type: featureType,
      subject_id: subjectId,
      subject_name: subjectName ? normalizeBaseSubject(subjectName) : null,
      model_id: selectedModel,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      total_tokens: totalTokens,
      estimated_cost: estimatedCost,
      status: 'success',
      pricing_version: '2026-v1',
    });

    // إذا كان تجريبياً، نقوم بتحديث عدادات التجربة
    if (isTrial) {
      const { data: currentTrial } = await admin
        .from('license_trials')
        .select('total_tokens_used, total_cost')
        .eq('installation_id', deviceId)
        .maybeSingle();

      const newTokens = (currentTrial?.total_tokens_used || 0) + totalTokens;
      const newCost = (Number(currentTrial?.total_cost) || 0) + estimatedCost;
      await admin.from('license_trials').update({
        total_tokens_used: newTokens,
        total_cost: newCost,
        is_budget_exhausted: newTokens >= 40000,
      }).eq('installation_id', deviceId);
    }

    return json({
      text,
      usage: {
        inputTokens,
        outputTokens,
        totalTokens,
        estimatedCost: Math.round(estimatedCost * 1_000_000) / 1_000_000,
        modelId: selectedModel,
      },
      quotaStatus: {
        isTrial,
        isLicensed: Boolean(licenseId),
        allowedSubjects,
      },
    });
  } catch (error) {
    console.error('Gemini Edge Function unexpected error', error);
    return json({ error: 'تعذر معالجة الطلب حالياً. تأكد من اتصال الإنترنت.' }, 500);
  }
});
