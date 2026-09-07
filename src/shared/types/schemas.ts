/**
 * مخططات Zod — التحقق من كل البيانات الخارجية (ردود الذكاء الاصطناعي،
 * ملفات النسخ الاحتياطي المستوردة) قبل القبول.
 */
import { z } from 'zod';

/** مخطط سؤال مولّد من الذكاء الاصطناعي */
export const questionSchema = z.object({
  type: z.string(),
  text: z.string(),
  options: z.array(z.string()).optional(),
  correct_answer: z.string().optional(),
  answer: z.string().optional(),
  model_answer: z.string().optional(),
  difficulty: z.string().optional(),
  source: z.string().optional(),
});

/** استجابة توليد الأسئلة (JSON فقط) */
export const questionsResponseSchema = z.object({
  questions: z.array(questionSchema),
});

/** مخطط توزيع شهر من الذكاء الاصطناعي */
export const aiMonthDistributionSchema = z.object({
  month: z.string(),
  periodCount: z.number().optional(),
  topics: z.array(z.string()).optional(),
  vocabulary: z.string().optional(),
  teachingMethods: z.string().optional(),
  evaluation: z.string().optional(),
});

/** استجابة توليد الخطة السنوية */
export const annualPlanResponseSchema = z.object({
  generalObjectives: z.string().optional(),
  teachingAids: z.string().optional(),
  distribution: z.array(aiMonthDistributionSchema).optional(),
});

/** مخطط النسخة الاحتياطية (v2) — تحقق خفيف من البنية */
export const backupSchema = z.object({
  app: z.literal('teacher-bag'),
  version: z.number(),
  exportedAt: z.string(),
  data: z.record(z.string(), z.unknown()),
});

/* ------------------- مخطط كتل المحرر (استجابة الذكاء الاصطناعي) ------------------- */

/** نقطة مرقمة داخل فرع سؤال في استجابة الذكاء الاصطناعي */
export const aiSubItemSchema = z.object({
  text: z.string(),
});

/** فرع سؤال في استجابة الذكاء الاصطناعي */
export const aiBranchSchema = z.object({
  text: z.string(),
  score: z
    .union([z.string(), z.number()])
    .transform(v => String(v))
    .optional(),
  subItems: z.array(aiSubItemSchema).optional(),
});

/** كتلة سؤال في استجابة التنسيق البنيوي */
export const aiQuestionBlockSchema = z.object({
  type: z.literal('question'),
  text: z.string(),
  score: z
    .union([z.string(), z.number()])
    .transform(v => String(v))
    .optional(),
  format: z
    .enum(['generic', 'mcq', 'trueFalse', 'fillBlank', 'matching', 'short'])
    .catch('generic')
    .optional(),
  branches: z.array(aiBranchSchema).optional(),
  options: z.array(z.string()).optional(),
  pairs: z.array(z.tuple([z.string(), z.string()])).optional(),
});

/** كتلة نصية في استجابة التنسيق البنيوي */
export const aiParagraphBlockSchema = z.object({
  type: z.literal('paragraph'),
  text: z.string(),
  align: z.enum(['right', 'center', 'left']).optional(),
});

/** كتلة عنوان */
export const aiHeadingBlockSchema = z.object({
  type: z.literal('heading'),
  level: z
    .union([z.literal(1), z.literal(2), z.literal(3), z.number()])
    .transform(v => (v === 1 || v === 2 || v === 3 ? v : 2) as 1 | 2 | 3),
  text: z.string(),
  align: z.enum(['right', 'center', 'left']).optional(),
});

/** استجابة تنسيق الأسئلة بنيويًا (JSON فقط) */
export const formatBlocksResponseSchema = z.object({
  blocks: z.array(
    z.union([aiQuestionBlockSchema, aiParagraphBlockSchema, aiHeadingBlockSchema]),
  ),
});

/** مخطط مشكلة تدقيق لغوي أو علمي */
export const proofreadIssueSchema = z.object({
  id: z.string().optional(),
  category: z.enum(['spelling', 'grammar', 'scientific', 'formula', 'symbol', 'format']).default('spelling'),
  categoryLabel: z.string().optional(),
  title: z.string(),
  explanation: z.string(),
  originalText: z.string(),
  suggestedText: z.string(),
  blockId: z.string().optional(),
});

/** استجابة التدقيق اللغوي والعلمي الكاملة (JSON فقط) */
export const proofreadResponseSchema = z.object({
  issues: z.array(proofreadIssueSchema),
});

export type FormatBlocksResponse = z.infer<typeof formatBlocksResponseSchema>;
export type ProofreadResponse = z.infer<typeof proofreadResponseSchema>;

export type QuestionsResponse = z.infer<typeof questionsResponseSchema>;
export type AnnualPlanResponse = z.infer<typeof annualPlanResponseSchema>;
export type BackupPayload = z.infer<typeof backupSchema>;
