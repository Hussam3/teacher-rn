/**
 * خدمة الذكاء الاصطناعي — توليد الخطط والأسئلة وتنسيقها.
 *
 * تستدعي Gemini عبر Supabase Edge Function حتى لا يصل المفتاح إلى التطبيق.
 * كل الـ Prompts العربية منقولة حرفياً من النسخة الأصلية مع ترقية النموذج
 * إلى gemini-2.5-flash ودعم التحقق بـ Zod.
 */
import type {
  AnnualPlan,
  AnnualPlanRequest,
  DailyPlan,
  Question,
  QuestionType,
} from '../shared/types/domain';
import { normalizeDailyPlanTopics } from '../shared/types/domain';
import type { EditorBlock, ProofreadIssue } from '../shared/types/editor';
import { z } from 'zod';
import {
  annualPlanResponseSchema,
  formatBlocksResponseSchema,
  proofreadResponseSchema,
  questionsResponseSchema,
} from '../shared/types/schemas';
import { newId } from '../shared/utils/id';
import { todayISO } from '../shared/utils/date';
import {
  computeMonthlyDistribution,
  defaultMonthTopics,
} from '../shared/utils/monthlyDistribution';
import { parseNames } from '../shared/utils/names';
import { GEMINI_MODEL } from './geminiConfig';
import { aiQuotaService } from './aiQuotaService';
import { aiUsageManager } from './aiUsageManager';
import type { FeatureType } from '../shared/types/aiUsage';
import { subjectRepo } from '../data/repositories';
import { getChaptersList } from './curriculumRegistry';
import { supabase } from './supabase';

/** واجهة خدمة الذكاء الاصطناعي */
export interface AIService {
  generateDailyPlan(params: GenerateDailyPlanParams): Promise<DailyPlan>;
  generateAnnualPlan(request: AnnualPlanRequest): Promise<AnnualPlan>;
  generateQuestions(params: GenerateQuestionsParams): Promise<Question[]>;
  formatExamQuestions(rawText: string): Promise<string>;
  /** تنسيق نص الأسئلة بنيويًا — يُرجع كتل محرر حقيقية (JSON) تحافظ على بنية الأسئلة */
  formatExamToBlocks(rawText: string, questionHint?: number): Promise<EditorBlock[]>;
  /** تدقيق لغوي وعلمي واكتشاف أخطاء الصيغ والمعادلات الكيميائية والرموز */
  proofreadExam(rawText: string, blocks?: EditorBlock[]): Promise<ProofreadIssue[]>;
  /** استخراج أسماء الطلاب من صورة (Base64 JPEG/PNG) */
  extractStudentNames(imageBase64: string): Promise<string[]>;
  isAvailable(): boolean;
}

export interface GenerateDailyPlanParams {
  subjectId: string;
  subjectName: string;
  topic: string;
  topics?: string[];
  topicContent?: string;
  className: string;
  duration: number;
  teachingMethod: string;
  chapterTitle?: string;
  pageRange?: string;
  textbookExcerpt?: string;
}

function dailyPlanTopicsFromParams(params: GenerateDailyPlanParams): string[] {
  const topics = normalizeDailyPlanTopics(
    params.topics?.length ? params.topics : [params.topic],
  );
  return topics.length ? topics : ['مفردات الدرس المنهجي'];
}

export interface GenerateQuestionsParams {
  curriculumContent: string;
  types: QuestionType[];
  count: number;
  difficulty: string;
  scope?: string;
  chapterTitle?: string;
  textbookExcerpt?: string;
  subjectName?: string;
  subjectId?: string;
}

interface GeminiApiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
}

/** استخراج نص الـ JSON من استجابة الذكاء الاصطناعي بشكل آمن */
function extractJson(text: string): string {
  let cleaned = text.trim();
  if (cleaned.includes('```')) {
    const match = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match && match[1]) cleaned = match[1].trim();
  }
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  let start = -1;
  if (firstBrace !== -1 && firstBracket !== -1) {
    start = Math.min(firstBrace, firstBracket);
  } else if (firstBrace !== -1) {
    start = firstBrace;
  } else if (firstBracket !== -1) {
    start = firstBracket;
  }

  const lastBrace = cleaned.lastIndexOf('}');
  const lastBracket = cleaned.lastIndexOf(']');
  const end = Math.max(lastBrace, lastBracket);

  if (start !== -1 && end !== -1 && end >= start) {
    return cleaned.slice(start, end + 1);
  }
  return cleaned;
}

async function callGeminiDirect(
  prompt: string,
  imageBase64: string | undefined,
  apiKey: string,
): Promise<string> {
  const parts: Array<Record<string, unknown>> = [{ text: prompt }];

  if (imageBase64) {
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: imageBase64,
      },
    });
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    GEMINI_MODEL,
  )}:generateContent`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-goog-api-key': apiKey,
    },
    body: JSON.stringify({ contents: [{ parts }] }),
  });

  const data = (await response.json().catch(() => null)) as GeminiApiResponse | null;
  if (!response.ok) {
    if (response.status === 429) {
      throw new Error(
        'الخادم مشغول حالياً بكثرة الطلبات المتزامنة. يرجى الانتظار ثم المحاولة ثانية.',
      );
    }
    throw new Error(
      data?.error?.message ||
        `تعذر إكمال طلب الذكاء الاصطناعي (رمز الخطأ: ${response.status})`,
    );
  }

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text || !text.trim()) {
    throw new Error('عاد الذكاء الاصطناعي باستجابة فارغة');
  }
  return text.trim();
}

async function edgeFunctionErrorMessage(error: unknown): Promise<string> {
  const fallback =
    error instanceof Error && error.message
      ? error.message
      : 'تعذر الاتصال بخدمة الذكاء الاصطناعي. تأكد من اتصال الإنترنت.';
  const context = (error as { context?: { json?: () => Promise<unknown> } })?.context;
  if (!context?.json) return fallback;
  const body = await context.json().catch(() => null);
  if (!body || typeof body !== 'object') return fallback;
  const message = (body as { error?: unknown }).error;
  return typeof message === 'string' && message.trim() ? message : fallback;
}

export interface AICallContext {
  featureType: FeatureType;
  subjectName?: string | null;
  subjectId?: string | null;
  imageBase64?: string;
}

/** يستخدم المفتاح الشخصي مباشرة؛ المفتاح المشترك يمر عبر Edge Function. */
async function callGemini(
  prompt: string,
  contextOrImage?: string | AICallContext,
): Promise<string> {
  const context: AICallContext =
    typeof contextOrImage === 'object' && contextOrImage !== null
      ? contextOrImage
      : {
          featureType: 'other_ai',
          imageBase64: typeof contextOrImage === 'string' ? contextOrImage : undefined,
        };

  const preCheck = await aiUsageManager.checkCanRequest({
    featureType: context.featureType,
    subjectName: context.subjectName,
  });

  if (!preCheck.allowed) {
    throw new Error(
      preCheck.reason ||
        'تم الوصول للحد الأقصى لطلبات الذكاء الاصطناعي.',
    );
  }

  aiUsageManager.acquireLock();

  const cleanImageBase64 = context.imageBase64?.includes(',')
    ? context.imageBase64.split(',')[1]
    : context.imageBase64;
  const personalKey = await aiUsageManager.getPersonalApiKey();

  try {
    if (personalKey) {
      const text = await callGeminiDirect(prompt, cleanImageBase64, personalKey);
      const inTokens = Math.ceil(prompt.length / 4);
      const outTokens = Math.ceil(text.length / 4);
      await aiUsageManager.recordUsageSuccess({
        requestId: preCheck.requestId,
        featureType: context.featureType,
        subjectName: context.subjectName,
        modelId: GEMINI_MODEL,
        inputTokens: inTokens,
        outputTokens: outTokens,
        totalTokens: inTokens + outTokens,
      });
      return text;
    }

    const { data, error } = await supabase.functions.invoke('gemini', {
      body: {
        prompt,
        imageBase64: cleanImageBase64,
        featureType: context.featureType,
        subjectName: context.subjectName,
        subjectId: context.subjectId,
        requestId: preCheck.requestId,
        installationId: aiUsageManager.getInstallationId(),
      },
    });
    if (error) throw new Error(await edgeFunctionErrorMessage(error));

    const text = (data as { text?: unknown } | null)?.text;
    if (typeof text !== 'string' || !text.trim()) {
      throw new Error('عاد الذكاء الاصطناعي باستجابة فارغة');
    }

    const usage = (data as {
      usage?: {
        inputTokens?: number;
        outputTokens?: number;
        totalTokens?: number;
        estimatedCost?: number;
        modelId?: string;
      };
    } | null)?.usage;

    const inTokens = usage?.inputTokens ?? Math.ceil(prompt.length / 4);
    const outTokens = usage?.outputTokens ?? Math.ceil(text.length / 4);
    const totalTokens = usage?.totalTokens ?? (inTokens + outTokens);

    await aiUsageManager.recordUsageSuccess({
      requestId: preCheck.requestId,
      featureType: context.featureType,
      subjectName: context.subjectName,
      modelId: usage?.modelId || 'gemini-2.5-flash',
      inputTokens: inTokens,
      outputTokens: outTokens,
      totalTokens,
      estimatedCost: usage?.estimatedCost,
    });

    return text.trim();
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error('تعذر الاتصال بخدمة الذكاء الاصطناعي. تأكد من اتصال الإنترنت.');
  } finally {
    aiUsageManager.releaseLock();
  }
}

/** نداء Gemini مع صورة (رؤية) — Base64 JPEG/PNG */
async function callGeminiVision(
  prompt: string,
  imageBase64: string,
  context?: Partial<AICallContext>,
): Promise<string> {
  return callGemini(prompt, {
    featureType: context?.featureType || 'other_ai',
    subjectName: context?.subjectName,
    subjectId: context?.subjectId,
    imageBase64,
  });
}

/** استخراج قسم بين علامات متعددة في نص منسّق بمرونة عالية */
/** تنسيق السطر وإزالة الصياغة (أرقام، رصاصات، ترويسة Markdown) للمطابقة على العناوين */
function normalizeMarkerLine(line: string): string {
  return line
    .trim()
    .replace(/^=+\s*/, '')
    .replace(/^#+\s*/, '')
    .replace(/^[*\-•+]+\s*/, '')
    .replace(/^\d+[.)\-:]\s*/, '')
    .replace(/^\s*\*{1,3}\s*/, '')
    .replace(/\*{1,3}$/, '')
    .replace(/\s+\*{1,3}$/, '')
    .trim();
}

/** هل يبدأ السطر بأحد العناوين المطلوبة (يتحمل صياغة Markdown والأرقام والرصاصات)؟ */
function startsWithMarker(line: string, markers: string[]): boolean {
  const cleaned = normalizeMarkerLine(line);
  return markers.some(m => {
    const norm = normalizeMarkerLine(m);
    return cleaned === norm || cleaned.startsWith(`${norm} `) || cleaned.startsWith(`${norm}:`) || cleaned.startsWith(`${norm}-`);
  });
}

function extractSectionSmart(
  text: string,
  startMarkers: string[],
  endMarkers?: string[],
): string {
  const lines = text.split('\n');
  let capturing = false;
  let result: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!capturing) {
      const matchStart = startMarkers.find(m => startsWithMarker(trimmed, [m]));
      if (matchStart) {
        capturing = true;
        const clean = normalizeMarkerLine(trimmed).replace(matchStart, '');
        if (clean) result.push(clean);
      }
      continue;
    }
    if (
      endMarkers &&
      endMarkers.some(em => startsWithMarker(trimmed, [em]))
    ) {
      break;
    }
    result.push(line);
  }

  return result.join('\n').trim();
}

/** هل الخطأ عابر (شبكة / خادم مشغول) ويستحق إعادة محاولة؟ */
function isTransientAiError(message: string): boolean {
  return (
    message.includes('الخادم مشغول') ||
    message.includes('تعذر الاتصال') ||
    message.includes('رمز الخطأ: 5') ||
    message.includes('استجابة فارغة')
  );
}

/** استنباط عنوان الفصل الذي يغطي نطاق الصفحات من سجل المنهج المعتمد */
function inferChapterFromPageRange(params: GenerateDailyPlanParams): string | null {
  if (params.chapterTitle) return params.chapterTitle;
  const rangeSource = params.pageRange || params.topic;
  const nums = (rangeSource.match(/\d+/g) || []).map(n => parseInt(n, 10));
  if (nums.length === 0) return null;
  const startPage = Math.min(...nums);
  const chapters = getChaptersList(params.subjectName, params.className);
  if (chapters.length === 0) return null;
  const covering = chapters
    .filter(c => c.page <= startPage)
    .sort((a, b) => b.page - a.page)[0];
  if (!covering) return null;
  const title = covering.title.replace(/^[\d\s./>-]+/, '').trim();
  return title.length > 3 ? title : null;
}

/** توليد خطة يومية نموذجية مبنية على المنهج العراقي عند تعذر الاتصال أو للاستجابة الفورية */
export function generateFallbackDailyPlan(params: GenerateDailyPlanParams): DailyPlan {
  const topics = dailyPlanTopicsFromParams(params);
  const t = topics.join('، ');
  const subj = params.subjectName || 'المادة';
  const method = params.teachingMethod || 'المناقشة والحوار وعرض الأمثلة';
  const inferredChapter = inferChapterFromPageRange(params);
  const isPageRangeOnly = t.startsWith('من صفحة') || t.includes('صفحة');
  const topicLabel = inferredChapter
    ? `موضوع (${inferredChapter})`
    : isPageRangeOnly
    ? `مفردات ومفاهيم الدرس المقرر`
    : `موضوع (${t})`;

  return {
    id: newId(),
    subjectId: params.subjectId,
    topic: t,
    topics,
    date: todayISO(),
    className: params.className,
    duration: params.duration || 45,
    objectives: `1. أن يتعرف الطالب على المفاهيم والمصطلحات الأساسية لـ ${topicLabel}.\n2. أن يوضح الطالب القواعد والخصائص العلمية المقررة لمادة ${subj}.\n3. أن يطبق الطالب ما تعلمه في حل التدريبات والأنشطة الصفية بدقة وإتقان.`,
    activities: `الكتاب المنهجي المقرر لمادة ${subj}، السبورة، الأقلام الملونة، أمثلة وتطبيقات توضيحية، واستراتيجية ${method}.`,
    introduction: `تهيئة أذهان الطلاب وطرح سؤال استكشافي مشوق حول ${topicLabel} لربط الدرس بالخبرات السابقة وتحديد أهداف الحصة (5-7 دقائق).`,
    presentation: `عرض ${topicLabel} بالتفصيل باستخدام أسلوب (${method})، مع شرح المفاهيم خطوة بخطوة، وقراءة النصوص وتحليل الأمثلة والأنشطة التفاعلية مع الطلاب (25 دقيقة).`,
    evaluation: `طرح أسئلة شفهية وتطبيقية سريعة لقياس مدى تحقق الأهداف السلوكية واستيعاب الطلاب لـ ${topicLabel} (10 دقائق).`,
    homework: `حل الأسئلة والتمارين المقررة في الكتاب المنهجي حول ${topicLabel} مع مراجعة الدرس القادم (5 دقائق).`,
    isEdited: false,
    createdAt: todayISO(),
  };
}

/** استخراج الدرجة من النص إن وجدت وتنظيف النص منها تلقائياً */
export function extractAndCleanScore(
  text: string,
  existingScore?: string,
): { cleanText: string; score: string } {
  let cleanText = text;
  let score = existingScore?.trim() || '';

  // أنماط مطابقة الدرجة في نهاية النص أو بين أقواس:
  // مثل: (10 درجات) أو [15 درجة] أو (10 د) أو "10 درجات" أو "درجة: 10"
  const patterns = [
    /[(\[]\s*(\d+(?:\.\d+)?)\s*(?:درجات|درجة|علامات|علامة|درجه|د)\s*[)\]]\s*$/i,
    /(?:^|\s+)[(\[]\s*(\d+(?:\.\d+)?)\s*(?:درجات|درجة|علامات|علامة|درجه|د)\s*[)\]]/i,
    /(?:^|\s+)(\d+(?:\.\d+)?)\s*(?:درجات|درجة|علامات|علامة|درجه)\s*$/i,
    /(?:^|\s+)(?:درجة|درجات|الدرجة|العلامة)\s*[:=]\s*(\d+(?:\.\d+)?)\s*$/i,
  ];

  for (const pat of patterns) {
    const m = cleanText.match(pat);
    if (m && m[1]) {
      if (!score) {
        score = m[1];
      }
      cleanText = cleanText.replace(pat, '').trim();
      break;
    }
  }

  return { cleanText, score };
}

/* ------------------------------------------------------------------ */
/* التطبيق الحقيقي (Gemini)                                            */
/* ------------------------------------------------------------------ */

export class GeminiAIService implements AIService {
  isAvailable(): boolean {
    return true;
  }

  async generateDailyPlan(params: GenerateDailyPlanParams): Promise<DailyPlan> {
    const contentBlock = params.textbookExcerpt || params.topicContent;
    const topics = dailyPlanTopicsFromParams(params);
    const topicLabel = topics.join('، ');
    const topicPrompt =
      topics.length === 1
        ? `الموضوع: ${topicLabel}`
        : `موضوعات الحصة:\n${topics.map((topic, index) => `${index + 1}. ${topic}`).join('\n')}`;
    const prompt = `أنت معلم عراقي متمرس ومحترف في إعداد الخطط التدريسية لوزارة التربية العراقية لمادة ${params.subjectName} للصف ${params.className}.

المطلوب: إعداد خطة درس يومية متكاملة ونوعية ومطابقة بدقة للمنهج العراقي الرسمي المعتمد.

المادة المنهجية: ${params.subjectName}
الصف / المرحلة: ${params.className}
${topicPrompt}${params.chapterTitle ? ` (ضمن: ${params.chapterTitle})` : ''}${params.pageRange ? ` [نطاق الصفحات: ${params.pageRange}]` : ''}
مدة الحصة: ${params.duration} دقيقة
طريقة التدريس المختارة: ${params.teachingMethod}

${
  contentBlock && contentBlock.trim().length > 0
    ? `نصوص ومفردات الدرس المعتمدة من الكتاب المنهجي العراقي:\n"""\n${contentBlock.trim()}\n"""\n\nتنبيه صارم: التزم تماماً بالمفاهيم والمصطلحات والأنشطة والأمثلة الواردة في المنهج المرفق أعلاه ولا تضف معلومات غير موجودة فيه.`
    : `ملاحظة: اعتمد على المعايير والمفردات المعتمدة للمنهج العراقي لمادة ${params.subjectName} للصف ${params.className}.`
}

قواعد وإرشادات صارمة جداً:
1. ممنوع منعاً باتاً كتابة عبارة "من صفحة X إلى Y" أو "الموضوع المحدد" داخل الأهداف السلوكية أو التمهيد أو العرض أو التقويم.
2. إذا كان المدخل عبارة عن نطاق صفحات، فاستنبط فوراً الموضوع العلمي الدقيق المقرر في تلك الصفحات من منهج وزارة التربية العراقية (مثال: في كيمياء الثالث المتوسط ص 20-24 الموضوع هو الترتيب الإلكتروني وقواعد التوزيع ومستويات الطاقة).
3. الأهداف السلوكية: اكتب 3 أهداف سلوكية نوعية دقيقة تبدأ بـ "أن + فعل مضارع سلوكي (يذكر، يوضح، يعرف، يقارن، يحل، يطبق) + الطالب + المفهوم العلمي الدقيق بالاسم".
4. الوسائل: اذكر الوسائل والأدوات التعليمية الحقيقية المرتبطة بموضوع الدرس المنهجي.
5. التمهيد: سؤال استكشافي تحفيزي ذكي ومشوق لربط موضوع الدرس بالخبرات السابقة (5-7 دقائق).
6. العرض: شرح مفصل لخطوات الدرس والقوانين والمفاهيم مع حل الأمثلة المذكورة في المنهج (25 دقيقة).
7. التقويم: 3 أسئلة تقويمية تطبيقية محددة تقيس مدى تحقق الأهداف السلوكية (10 دقائق).
8. الواجب البيتي: تحديد حل التمارين والأسئلة المقررة في الكتاب المنهجي (5 دقائق).

التزم بالعناوين التالية بالترتيب بالضبط:
الأهداف السلوكية
الوسائل
التمهيد
العرض
التقويم
الواجب البيتي`;

    let response: string;
    try {
      response = await callGemini(prompt, {
        featureType: 'daily_plan',
        subjectName: params.subjectName,
        subjectId: params.subjectId,
      });
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'خطأ غير معروف';
      // محاولة ثانية فقط للأخطاء العابرة (شبكة / خادم مشغول)، وليس للحصة المستنفدة
      if (isTransientAiError(reason)) {
        await new Promise<void>(resolve => setTimeout(() => resolve(), 2000));
        response = await callGemini(prompt, {
          featureType: 'daily_plan',
          subjectName: params.subjectName,
          subjectId: params.subjectId,
        });
      } else {
        throw err;
      }
    }

    try {
      const objectives = extractSectionSmart(
        response,
        ['الأهداف السلوكية', 'الاهداف السلوكية', 'الأهداف', 'الاهداف'],
        ['الوسائل', 'الوسائل التعليمية', 'الأنشطة', 'الادوات'],
      );
      const activities = extractSectionSmart(
        response,
        ['الوسائل', 'الوسائل التعليمية', 'الأنشطة', 'الادوات'],
        ['التمهيد', 'المقدمة', 'التهيئة'],
      );
      const introduction = extractSectionSmart(
        response,
        ['التمهيد', 'المقدمة', 'التهيئة'],
        ['العرض', 'عرض الدرس', 'سير الدرس'],
      );
      const presentation = extractSectionSmart(
        response,
        ['العرض', 'عرض الدرس', 'سير الدرس'],
        ['التقويم', 'التقييم', 'الخاتمة'],
      );
      const evaluation = extractSectionSmart(
        response,
        ['التقويم', 'التقييم'],
        ['الواجب البيتي', 'الواجب', 'المهمة'],
      );
      const homework = extractSectionSmart(
        response,
        ['الواجب البيتي', 'الواجب', 'المهمة'],
      );

      const foundSections = [
        objectives,
        activities,
        introduction,
        presentation,
        evaluation,
        homework,
      ].filter(s => s && s.trim().length > 0).length;

      // الاستجابة سليمة تماماً لكن لا شيء استُخرج منها: لا نعرض خطة زائفة.
      if (foundSections === 0) {
        throw new Error(
          'استجابة الذكاء الاصطناعي لم تتضمن الأقسام المطلوبة. أعد المحاولة.',
        );
      }

      return {
        id: newId(),
        subjectId: params.subjectId,
        topic: topicLabel,
        topics,
        date: todayISO(),
        className: params.className,
        duration: params.duration,
        objectives: objectives || '',
        activities: activities || '',
        introduction: introduction || '',
        presentation: presentation || '',
        evaluation: evaluation || '',
        homework: homework || '',
        isEdited: false,
        createdAt: todayISO(),
      };
    } catch {
      throw new Error(
        'تعذر تحليل استجابة الذكاء الاصطناعي لإنشاء الخطة. حاول مرة أخرى.',
      );
    }
  }

  async generateAnnualPlan(request: AnnualPlanRequest): Promise<AnnualPlan> {
    const distribution = computeMonthlyDistribution({
      startDate: new Date(request.startDate),
      endDate: new Date(request.endDate),
      weeklyPeriods: request.weeklyPeriods,
      holidays: request.holidays.map(d => new Date(d)),
      isManualAllocation: request.isManualAllocation,
    });

    const chapters = getChaptersList(
      request.curriculumContent.replace(/^الخطة السنوية لمادة\s*/, ''),
      request.className,
    );
    const chapterTitles = chapters.map(c => c.title);

    const prompt = `أنت معلم عراقي متمرس في إعداد الخطط السنوية لوزارة التربية العراقية.
قم بتوزيع المنهج التالي على الأشهر الدراسية (من أيلول إلى أيار).

المادة: ${request.curriculumContent}
الصف: ${request.className}
عدد الحصص الأسبوعية: ${request.weeklyPeriods}
${
  chapterTitles.length > 0
    ? `فصول ووحدات المنهج الوزاري المعتمد:\n${chapterTitles.map((t, idx) => `${idx + 1}. ${t}`).join('\n')}\nوزع هذه الفصول بالترتيب على أشهر السنة الدراسية.`
    : ''
}

أعد JSON فقط بالبنية التالية:
{
  "generalObjectives": "الأهداف العامة للمنهج وفق المعايير الوزارية",
  "teachingAids": "الوسائل والأنشطة العامة المقترحة",
  "distribution": [
    { "month": "أيلول", "topics": ["عنوان الفصل"], "vocabulary": "المفردات", "teachingMethods": "الوسائل" }
  ]
}`;

    const subject = request.subjectId ? subjectRepo.get(request.subjectId) : undefined;
    try {
      const response = await callGemini(prompt, {
        featureType: 'annual_plan',
        subjectName: subject?.name,
        subjectId: request.subjectId,
      });
      const jsonText = extractJson(response);
      const parsed = annualPlanResponseSchema.safeParse(JSON.parse(jsonText));

      if (parsed.success) {
        const aiDist = parsed.data.distribution ?? [];
        distribution.forEach((month, i) => {
          const match = aiDist[i];
          if (match?.topics?.length) month.topics = match.topics;
          else if (chapterTitles.length > 0 && i < chapterTitles.length) month.topics = [chapterTitles[i]!];

          if (match?.vocabulary) month.vocabulary = match.vocabulary;
          else if (chapterTitles.length > 0 && i < chapterTitles.length) month.vocabulary = `مفردات ${chapterTitles[i]}`;

          if (match?.teachingMethods)
            month.teachingMethods = match.teachingMethods;
        });
        return {
          id: newId(),
          subjectId: request.subjectId,
          teacherName: request.teacherName,
          className: request.className,
          startDate: request.startDate,
          endDate: request.endDate,
          weeklyPeriods: request.weeklyPeriods,
          holidays: request.holidays,
          exams: [],
          distribution,
          generalObjectives:
            parsed.data.generalObjectives ||
            `إكساب الطالب المفاهيم والمهارات الأساسية في مادة ${request.curriculumContent} وتنمية التفكير العلمي والتطبيقي.`,
          teachingAids:
            parsed.data.teachingAids ||
            'الكتاب المنهجي المقرر، السبورة الذكية، الوسائل التعليمية والأنشطة الصفية.',
          isEdited: false,
          createdAt: todayISO(),
        };
      }
    } catch {
      // إكمال الخطة السنوية حتمياً باستخدام فصول المنهج المعتمدة
    }

    distribution.forEach((month, i) => {
      if (chapterTitles.length > 0 && i < chapterTitles.length) {
        month.topics = [chapterTitles[i]!];
        month.vocabulary = `مفردات ومفاهيم ${chapterTitles[i]}`;
      } else {
        month.topics = defaultMonthTopics(month.month, i);
        month.vocabulary = `مفردات ${month.month}`;
      }
      month.teachingMethods = 'المناقشة، حل التمارين، التجارب والأنشطة الصفية';
    });

    return {
      id: newId(),
      subjectId: request.subjectId,
      teacherName: request.teacherName,
      className: request.className,
      startDate: request.startDate,
      endDate: request.endDate,
      weeklyPeriods: request.weeklyPeriods,
      holidays: request.holidays,
      exams: [],
      distribution,
      generalObjectives: `إكساب الطالب المعارف والمهارات الأساسية في ${request.curriculumContent} للصف ${request.className}.`,
      teachingAids: 'الكتاب المدرسي، السبورة، الوسائل التعليمية والمصورات التوضيحية.',
      isEdited: false,
      createdAt: todayISO(),
    };
  }

  async generateQuestions(
    params: GenerateQuestionsParams,
  ): Promise<Question[]> {
    const typesStr = params.types.join('، ');
    const prompt = `أنت معلم عراقي خبير في وضع الأسئلة الامتحانية الوزارية الرصينة وفق معايير وزارة التربية العراقية.

المادة / المرحلة: ${params.curriculumContent}
${params.chapterTitle ? `الفصل / الوحدة: ${params.chapterTitle}` : ''}
${params.scope ? `نطاق التركيز: ${params.scope}` : 'نطاق التركيز: كامل مفردات الفصل والموضوع'}

${
  params.textbookExcerpt && params.textbookExcerpt.trim().length > 0
    ? `نصوص ومحتوى المنهج المعتمد من الكتاب الوزاري:\n"""\n${params.textbookExcerpt.trim()}\n"""\n\nتنبيه صارم: استخرج وصغ الأسئلة والخيارات والتعاليل والتعاريف والمسائل مستنداً حصراً إلى نصوص ومفاهيم الكتاب المدرسي المرفق أعلاه.`
    : `ملاحظة: ضع أسئلة وزارية نموذجية تطابق صياغة الامتحانات الوزارية العراقية ونصوص الكتاب المدرسي.`
}

المطلوب: توليد ${params.count} أسئلة من الأنواع التالية: ${typesStr}، بمستوى صعوبة: ${params.difficulty}.

أعد JSON فقط بالبنية التالية:
{
  "questions": [
    { "type": "mcq", "text": "نص السؤال", "options": ["خيار1", "خيار2", "خيار3", "خيار4"], "correct_answer": "الخيار الصحيح", "difficulty": "${
      params.difficulty
    }", "source": "${params.chapterTitle || 'المنهج الوزاري'}" },
    { "type": "definition", "text": "عرف ما يأتي: ...", "answer": "الإجابة النموذجية", "difficulty": "${
      params.difficulty
    }" }
  ]
}

الأنواع المدعومة: mcq, definition, reasoning, fill_blanks, true_false, enumerate, calculation.
القواعد:
- الأسئلة باللغة العربية الفصحى وبأسلوب تربوي عراقي رسمي وواضح.
- في أسئلة الاختيار من متعدد (mcq)، يجب أن تكون الخيارات الأربعة دقيقة ومستوحاة من الكتاب.
- في أسئلة التعاليل (reasoning) والتعاريف (definition)، استخدم الصيغ الوزارية المعتمدة.`;

    const response = await callGemini(prompt, {
      featureType: 'question_generation',
      subjectName: params.subjectName,
      subjectId: params.subjectId,
    });
    const jsonText = extractJson(response);
    const parsed = questionsResponseSchema.safeParse(JSON.parse(jsonText));

    if (!parsed.success) return [];

    return parsed.data.questions.map(q => ({
      id: newId(),
      type: parseQuestionType(q.type),
      text: q.text,
      options: q.options,
      correctAnswer: q.correct_answer,
      modelAnswer: q.answer ?? q.model_answer,
      difficulty: (q.difficulty as Question['difficulty']) ?? 'medium',
      source: q.source,
    }));
  }

  async formatExamQuestions(rawText: string): Promise<string> {
    // حساب عدد الأسئلة في النص الأصلي لتضمينه في التعليمات
    const qCount = countQuestionsInText(rawText);
    const qCountHint = qCount > 0
      ? `\n\n⚠️ تحذير صارم: النص الأصلي يحتوي على ${qCount} أسئلة رئيسية بالضبط. يجب أن تُرجع جميع الـ ${qCount} أسئلة كاملة بدون حذف أي سؤال أو فرع.`
      : '';

    const prompt = `أنت معلم عراقي خبير في تنسيق الأسئلة الامتحانية وتدقيقها لغوياً وعلمياً.

قم بتنسيق الأسئلة التالية بأسلوب نموذجي رصين دون إضافة أو استنتاج أو حذف أي معلومة، ودون تقديم أي شروحات خارج نص الأسئلة:
${rawText}

قواعد التنسيق الإلزامية:
1. الترقيم واستغلال المساحة: اكتب «س1/ نص السؤال» في السطر نفسه. وللفرع المستقل اكتب «س1/أ/ نص الفرع». يُمنع ترك رمز السؤال في سطر منفصل فارغ.
2. الحفاظ الصارم على كافة المفردات والتعاريف والنقاط:
    - يُمنع منعاً باتاً وقطعياً حذف أو اختصار أي تعريف أو مفردة أو خيار أو نقطة ذكرها المستخدم (مثل عناصر «عرف ما يأتي»، نقاط «أجب عن إحدى النقطتين»، فروع «علل»).
    - القائمة القصيرة المتجانسة، مثل التعاريف أو المصطلحات، تكتب متصلة في السطر نفسه: «س1/ عرّف ما يأتي: 1. ...، 2. ...، 3. ...». لا تجعل كل تعريف سطراً مستقلاً إلا إذا كان طويلاً أو سؤالاً مستقلاً.
3. الدرجات: إذا ذكر المستخدم درجة (مثل: 10 درجات، 20 درجة)، ضعها بصيغة «(10 درجات)» في نهاية سطر السؤال أو الفرع.
4. تصحيح الأخطاء الإملائية والنحوية وتصحيح صياغة الأسئلة علمياً.
5. معادلات الكيمياء والفيزياء بترميز يونيكود الدقيق: H2O→H₂O، Fe3+→Fe³⁺، CO2→CO₂، x^2→x²، Na2SO4→Na₂SO₄، Al2(SO4)3→Al₂(SO₄)₃، الأسهم → و ⇌، الكسور a/b.
6. أعد النص المنسّق فقط.${qCountHint}`;

    return callGemini(prompt, { featureType: 'question_formatting' });
  }

  async formatExamToBlocks(rawText: string, questionHint?: number): Promise<EditorBlock[]> {
    // حساب عدد الأسئلة والفروع في النص الأصلي
    const expectedQCount = questionHint ?? countQuestionsInText(rawText);
    const expectedBranchCount = countBranchesInText(rawText);

    const countWarning = expectedQCount > 0
      ? `\n\n⚠️⚠️⚠️ تحذير بالغ الأهمية — عدد الأسئلة والمحتوى:
- النص الأصلي يحتوي على ${expectedQCount} أسئلة رئيسية بالضبط. يجب أن تُرجع ${expectedQCount} كتل من نوع "question" بالضبط.
- النص الأصلي يحتوي على نحو ${expectedBranchCount} علامة فرع أو قائمة. احفظ جميع نصوصها كاملة، ويمكن دمج عناصر القائمة المتجانسة القصيرة داخل text بدلاً من branches.
- إذا أرجعت عدداً أقل من ${expectedQCount} أسئلة، فأنت قد حذفت أسئلة وهذا خطأ فادح غير مقبول.
- راجع إجابتك قبل إرسالها وتأكد أن العدد مطابق.`
      : '';

    const prompt = `أنت معلم عراقي خبير في تنسيق الأسئلة الامتحانية بنيويًا.
مهمتك: تحويل نص الامتحان الخام التالي إلى مصفوفة JSON من كتل المحرر (Editor Blocks) تحافظ بدقة على بنية الأسئلة والفروع والخيارات ودرجاتها.

نص الامتحان الخام:
${rawText}

القواعد البنيوية الصارمة:
1. الأسئلة الرئيسية: كل سؤال رئيسي (مثل "س1"، "س 2"، "السؤال الثالث") يُحوّل إلى كتلة type: "question".
   - إذا كان السؤال يحتوي على فروع مستقلة (أ، ب، ج أو 1، 2)، اجعل questionMode: "branched".
   - إذا كان سؤالاً مباشراً دون فروع (مثل اختر الإجابة أو صح وخطأ أو سؤال مقالي مباشر)، اجعل questionMode: "direct".
2. الفروع والنقاط:
   - فروع السؤال المستقلة توضع في مصفوفة branches.
   - لكل فرع: نص الفرع في text ودرجته في score (إن وُجدت، وإلا فارغ "").
   - إذا كان الفرع يحتوي على نقاط مرقمة داخله (مثل 1، 2، 3 داخل فرع "علل ما يأتي" أو "أجب عما يأتي")، ضع هذه النقاط داخل subItems: [{ "text": "النقطة الأولى" }, ...].
3. التمييز الصارم بين خيارات السؤال (Options) والنقاط الفرعية (SubItems):
   * خيارات متعددة لسؤال واحد (مثل اختر الإجابة الصحيحة):
     - ضع نص السؤال في text.
     - ضع خيارات الإجابة الأربعة في options: ["الخيار الأول", "الخيار الثاني", ...].
     - اجعل format: "mcq" و questionMode: "direct".
     - لا تضع خيارات الاختيار من متعدد داخل branches أبداً.
   * سؤال يحتوي على نقطتين للاختيار بينهما ("أجب عن نقطة واحدة مما يأتي: 1... 2..."):
     - هذا سؤال متفرع أو يحتوي على subItems وليس خيارات متعددة.
     - لا تضع النقطتين في options.
     - انقل النقطتين كاملتين إلى branches.
4. تصنيف نوع السؤال (format):
   - خيارات متعددة (أ، ب، ج، د) → "mcq"
   - صح وخطأ → "trueFalse"
   - أكمل الفراغات → "fillBlank"
   - وصّل / طابق عمودين → "matching" (مع ملء pairs)
   - تعاريف / تعاليل / مقالي → "generic" أو "short"
5. معادلات وصيغ الكيمياء والفيزياء بترميز يونيكود الصحيح: H2O→H₂O، Fe3+→Fe³⁺، CO2→CO₂، x^2→x²، الأسهم → و ⇌.
6. لا تحذف أي سؤال أو بند أو معلومة من النص الأصلي نهائياً. كل سطر وكل فرع وكل مفردة يجب أن تظهر في الناتج.${countWarning}`;

    const response = await callGemini(prompt, { featureType: 'question_formatting' });
    const jsonText = extractJson(response);
    const parsed = formatBlocksResponseSchema.safeParse(JSON.parse(jsonText));
    if (!parsed.success) {
      throw new Error(`استجابة غير صالحة: ${parsed.error.message}`);
    }

    const resultBlocks = parsed.data.blocks;

    // تحقق: هل عدد الأسئلة المُرجعة أقل من المتوقع؟
    if (expectedQCount > 0) {
      const returnedQCount = resultBlocks.filter(b => b.type === 'question').length;
      if (returnedQCount < expectedQCount) {
        // محاولة ثانية مع تشديد إضافي
        const retryPrompt = `${prompt}\n\n🚨🚨🚨 تنبيه: في محاولتك السابقة أرجعت ${returnedQCount} أسئلة فقط بينما النص الأصلي يحتوي على ${expectedQCount} أسئلة. أعد المحاولة وأرجع جميع الأسئلة الـ ${expectedQCount} كاملة بدون أي حذف أو دمج.`;
        try {
          const retryResponse = await callGemini(retryPrompt, { featureType: 'question_formatting' });
          const retryJsonText = extractJson(retryResponse);
          const retryParsed = formatBlocksResponseSchema.safeParse(JSON.parse(retryJsonText));
          if (retryParsed.success) {
            const retryQCount = retryParsed.data.blocks.filter(b => b.type === 'question').length;
            // استخدام الإجابة الأفضل (الأكثر أسئلة)
            if (retryQCount > returnedQCount) {
              return mapBlocksToEditor(retryParsed.data.blocks);
            }
          }
        } catch {
          // نكمل بالنتيجة الأولى
        }
      }
    }

    return mapBlocksToEditor(resultBlocks);
  }

  async proofreadExam(rawText: string, _blocks?: EditorBlock[]): Promise<ProofreadIssue[]> {
    const prompt = `أنت مدقق لغوي وعلمي وخبير مناهج دراسية وامتحانات في العراق.
مهمتك: فحص ورقة الامتحان بدقة فائقة لاكتشاف الأخطاء اللغوية والعلمية وصيغ المعادلات الكيميائية والرموز وتصحيحها.

نص الامتحان المراد تدقيقه:
${rawText}

المطلوب: اكتشاف أي من المشاكل التالية:
1. أخطاء إملائية ونحوية ولغوية (category: 'spelling' أو 'grammar').
2. أخطاء علمية أو مفاهيمية أو معلوماتية غير دقيقة (category: 'scientific').
3. أخطاء في كتابة الصيغ والمعادلات الكيميائية وتكافؤ العناصر والشحنات والأسهم، مثل كتابة H2O بدلاً من H₂O أو Fe+3 بدلاً من Fe³⁺ أو خطأ في صيغة مركب (category: 'formula').
4. أخطاء في الرموز الرياضية والفيزيائية والوحدات (category: 'symbol').
5. أخطاء في الترقيم مثل كتابة «السؤال الأول» بدلاً من الترقيم القياسي «س 1:» (category: 'format').

أعد النتيجة حصراً بصيغة JSON بالهيكل التالي:
{
  "issues": [
    {
      "id": "iss_1",
      "category": "spelling|grammar|scientific|formula|symbol|format",
      "categoryLabel": "خطأ إملائي | خطأ نحوي | خطأ علمي | صيغة كيميائية | رمز رياضي | تنسيق وترقيم",
      "title": "عنوان موجز للخطأ (مثال: تصحيح الصيغة الكيميائية للماء)",
      "explanation": "شرح سبب التصحيح والقاعدة العلمية أو اللغوية",
      "originalText": "النص الأصلي الخاطئ تماماً كما ورد",
      "suggestedText": "النص المصحح البديل الدقيق"
    }
  ]
}

إذا كانت الورقة سليمة وخالية من الأخطاء، أعد: { "issues": [] }`;

    try {
      const response = await callGemini(prompt, { featureType: 'question_improvement' });
      const jsonText = extractJson(response);
      const parsed = proofreadResponseSchema.safeParse(JSON.parse(jsonText));
      if (!parsed.success) return [];
      return parsed.data.issues.map((iss, i) => ({
        id: iss.id || `iss_${Date.now()}_${i}`,
        category: iss.category,
        categoryLabel: iss.categoryLabel || categoryLabelFallback(iss.category),
        title: iss.title,
        explanation: iss.explanation,
        originalText: iss.originalText,
        suggestedText: iss.suggestedText,
      }));
    } catch {
      return [];
    }
  }

  async extractStudentNames(imageBase64: string): Promise<string[]> {
    const prompt = `أنت معلم عراقي يساعد في استخراج أسماء الطلاب من صورة قائمة أسماء (كشف حضور أو سجل درجات).
مهمتك:
1. استخرج كل أسماء الطلاب الظاهرة في الصورة.
2. تجاهل العناوين والأرقام وأسماء الأعمدة (مثل: ت، اسم الطالب، رقم الجلوس، الشهر الأول...).
3. إذا تكرر الاسم نفسه أعدّه مرة واحدة فقط.
4. رتب الأسماء بنفس ترتيب ظهورها في الصورة.
قواعد صارمة:
- أخرج الأسماء فقط، كل اسم في سطر مستقل.
- لا تضيف أي ترقيم أو رموز أو شرطات قبل الأسماء.
- لا تخرج أي نص أو شرح آخر غير الأسماء.`;
    const response = await callGeminiVision(prompt, imageBase64, { featureType: 'other_ai' });
    return parseNames(response);
  }
}

/* ------------------------------------------------------------------ */
/* التطبيق التجريبي (Mock) — للتطوير والاختبار                          */
/* ------------------------------------------------------------------ */

export class MockAIService implements AIService {
  isAvailable(): boolean {
    return true;
  }

  async generateDailyPlan(params: GenerateDailyPlanParams): Promise<DailyPlan> {
    await delay(600);
    const topics = dailyPlanTopicsFromParams(params);
    const t = topics.join('، ');
    return {
      id: newId(),
      subjectId: params.subjectId,
      topic: t,
      topics,
      date: todayISO(),
      className: params.className,
      duration: params.duration,
      objectives: `أن يتعرف الطالب على مفهوم ${t}.\nأن يوضح الطالب أهمية ${t}.\nأن يطبق الطالب قواعد ${t} في أمثلة عملية.`,
      activities: 'السبورة، الأقلام الملونة، جهاز العرض، الكتاب المدرسي.',
      introduction: `أبدأ الدرس بطرح سؤال تحفيزي حول ${t} لربط الدرس بحياة الطالب، مع مناقشة قصيرة (5-7 دقائق).`,
      presentation: `أعرض المفهوم الرئيسي لـ${t} بأسلوب ${params.teachingMethod} مع أمثلة توضيحية وحل تدريبات (25 دقيقة).`,
      evaluation: `أطرح أسئلة تقويمية حول ${t} وأتحقق من تحقيق الأهداف (10 دقائق).`,
      homework: `حل التدريبات في الكتاب المدرسي حول ${t} (5 دقائق).`,
      isEdited: false,
      createdAt: todayISO(),
    };
  }

  async generateAnnualPlan(request: AnnualPlanRequest): Promise<AnnualPlan> {
    await delay(400);
    const distribution = computeMonthlyDistribution({
      startDate: new Date(request.startDate),
      endDate: new Date(request.endDate),
      weeklyPeriods: request.weeklyPeriods,
      holidays: request.holidays.map(d => new Date(d)),
      isManualAllocation: request.isManualAllocation,
    });
    distribution.forEach((month, i) => {
      month.topics = defaultMonthTopics(month.month, i);
      month.vocabulary = `مفردات ${month.month}: (مفردة 1، مفردة 2، مفردة 3)`;
    });
    return {
      id: newId(),
      subjectId: request.subjectId,
      teacherName: request.teacherName,
      className: request.className,
      startDate: request.startDate,
      endDate: request.endDate,
      weeklyPeriods: request.weeklyPeriods,
      holidays: request.holidays,
      exams: [],
      distribution,
      generalObjectives:
        'تنمية معارف الطالب ومهاراته بما يحقق أهداف المادة الدراسية.',
      teachingAids: 'السبورة، الكتاب المدرسي، الوسائل التعليمية المتوفرة.',
      isEdited: false,
      createdAt: todayISO(),
    };
  }

  async generateQuestions(
    params: GenerateQuestionsParams,
  ): Promise<Question[]> {
    await delay(500);
    const result: Question[] = [];
    for (let i = 0; i < params.count; i++) {
      const type = params.types[i % params.types.length] ?? 'mcq';
      result.push({
        id: `mock_${i}`,
        type,
        text: `سؤال تجريبي ${i + 1} من نوع ${type}`,
        options: type === 'mcq' ? ['أ', 'ب', 'ج', 'د'] : undefined,
        correctAnswer: type === 'mcq' ? 'ب' : undefined,
        modelAnswer: type === 'mcq' ? undefined : 'الإجابة النموذجية',
        difficulty: 'medium',
        source: 'مثال',
      });
    }
    return result;
  }

  async formatExamQuestions(rawText: string): Promise<string> {
    await delay(300);
    return rawText;
  }

  async formatExamToBlocks(rawText: string): Promise<EditorBlock[]> {
    await delay(300);
    return [{ id: newId(), type: 'paragraph', text: rawText }];
  }

  async proofreadExam(rawText: string): Promise<ProofreadIssue[]> {
    await delay(500);
    if (!rawText.trim()) return [];
    return [
      {
        id: 'mock_iss_1',
        category: 'formula',
        categoryLabel: 'صيغة كيميائية',
        title: 'تحويل صيغة الماء إلى ترميز سفلي',
        explanation: 'تكتب أرقام ذرات العناصر بالترميز السفلي في الصيغ الكيميائية',
        originalText: 'H2O',
        suggestedText: 'H₂O',
      },
      {
        id: 'mock_iss_2',
        category: 'format',
        categoryLabel: 'تنسيق وترقيم',
        title: 'اعتماد صيغة الترقيم س 1: بدلاً من السؤال الأول',
        explanation: 'الترقيم القياسي المعتمد في الامتحانات هو س 1: يليه نص السؤال مباشرة',
        originalText: 'السؤال الأول',
        suggestedText: 'س 1:',
      },
    ];
  }

  async extractStudentNames(_imageBase64: string): Promise<string[]> {
    await delay(700);
    return [
      'أحمد محمد علي',
      'حسين كريم جاسم',
      'زينب عبد الله حسن',
      'مصطفى علي صالح',
    ];
  }
}

function categoryLabelFallback(category: string): string {
  switch (category) {
    case 'spelling':
      return 'خطأ إملائي';
    case 'grammar':
      return 'خطأ نحوي';
    case 'scientific':
      return 'خطأ علمي';
    case 'formula':
      return 'صيغة كيميائية';
    case 'symbol':
      return 'رمز رياضي';
    case 'format':
      return 'تنسيق وترقيم';
    default:
      return 'تدقيق';
  }
}

/* ------------------------------------------------------------------ */

function parseQuestionType(type: string): QuestionType {
  switch (type) {
    case 'definition':
      return 'definition';
    case 'reasoning':
    case 'explain':
      return 'reasoning';
    case 'fill_blanks':
    case 'blanks':
      return 'fill_blanks';
    case 'true_false':
      return 'true_false';
    case 'enumerate':
    case 'list':
      return 'enumerate';
    case 'calculation':
    case 'math':
      return 'calculation';
    default:
      return 'mcq';
  }
}

/** عدّ الأسئلة الرئيسية في النص الخام (يستخدم أنماط ترقيم متعددة) */
function countQuestionsInText(text: string): number {
  const patterns = [
    /^\s*س\s*\d+/gm,                          // س 1: أو س1:
    /^\s*السؤال\s+(الأول|الثاني|الثالث|الرابع|الخامس|السادس|السابع|الثامن|التاسع|العاشر)/gm,
    /^\s*Q\s*\d+/gim,                           // Q1, Q 2
  ];

  let maxCount = 0;
  for (const pat of patterns) {
    const matches = text.match(pat);
    if (matches && matches.length > maxCount) {
      maxCount = matches.length;
    }
  }

  // كتكتيك بديل: عدّ الأسطر التي تبدأ بأرقام متبوعة بنقطة أو شرطة (مثل: 1- أو 1.)
  // فقط إذا لم نجد أي نمط من الأعلى
  if (maxCount === 0) {
    // حاول عدّ الأسئلة بالأرقام المنفردة في بداية السطر
    const numMatches = text.match(/^\s*\d+\s*[-.):]\s*(?!\s*$)/gm);
    if (numMatches) {
      // تحقق: هل هذه أسئلة فعلاً أم مجرد فروع؟
      // الأسئلة عادة تبدأ من 1 وتتابع
      const numbers = numMatches.map(m => parseInt(m.match(/\d+/)?.[0] || '0', 10));
      if (numbers.length > 0 && numbers[0] === 1) {
        maxCount = Math.max(...numbers);
      }
    }
  }

  return maxCount;
}

/** عدّ الفروع/المفردات/النقاط الفرعية في النص الخام */
function countBranchesInText(text: string): number {
  const branchPatterns = [
    /^\s*[أ-ي]\s*[-)]/gm,                       // أ) ب) ج) أو أ- ب- ج-
    /^\s*[a-zA-Z]\s*[-)]/gm,                     // a) b) c)
  ];

  let total = 0;
  for (const pat of branchPatterns) {
    const matches = text.match(pat);
    if (matches) total += matches.length;
  }
  return total;
}

/** تحويل كتل JSON المحللة إلى كتل محرر EditorBlock[] */
function mapBlocksToEditor(
  blocks: z.infer<typeof formatBlocksResponseSchema>['blocks'],
): EditorBlock[] {
  return blocks.map((b, i) => {
    const id = `ai_${Date.now()}_${i}`;
    if (b.type === 'question') {
      const qScoreInfo = extractAndCleanScore(b.text, b.score);
      const branches = (b.branches?.length ? b.branches : []).map(br => {
        const brScoreInfo = extractAndCleanScore(br.text, br.score);
        return {
          text: brScoreInfo.cleanText,
          score: brScoreInfo.score,
          subItems: br.subItems?.map(item => ({ text: item.text })) ?? [],
        };
      });
      return {
        id,
        type: 'question' as const,
        text: qScoreInfo.cleanText,
        questionMode: branches.length ? ('branched' as const) : ('direct' as const),
        score: qScoreInfo.score,
        format: b.format ?? 'generic',
        branches,
        options: b.options,
        pairs: b.pairs,
      };
    }
    if (b.type === 'heading') {
      return {
        id,
        type: 'heading' as const,
        level: b.level,
        text: b.text,
        align: b.align,
      };
    }
    return { id, type: 'paragraph' as const, text: b.text, align: b.align };
  });
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** خدمة Gemini المشتركة؛ لا يحتاج المستخدم إلى مفتاح شخصي. */
export function getAIService(): AIService {
  return new GeminiAIService();
}
