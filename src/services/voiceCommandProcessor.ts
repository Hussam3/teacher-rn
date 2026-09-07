/**
 * معالج الأوامر والنصوص الصوتية المخصص لمحرر وكتابة الأسئلة الامتحانية.
 *
 * يقوم بـ:
 * 1. رصد الأوامر الصوتية الصريحة (مثل: "سؤال جديد"، "فرع ب"، "سطر جديد").
 * 2. معالجة الأوامر المركبة (مثل: "سؤال جديد ما هي أسباب الثورة الفرنسية؟").
 * 3. تحويل الكلمات الدالة على علامات الترقيم (نقطة، فارزة، علامة استفهام) لرموز حقيقية.
 * 4. تنظيف وتنسيق النصوص العربية وقواعد الفواصل والمسافات.
 */
import type { QuestionFormat } from '../shared/types/editor';

export type VoiceCommandType =
  | 'new_question'
  | 'select_branch'
  | 'new_line'
  | 'new_paragraph'
  | 'new_heading'
  | 'new_divider'
  | 'delete_current'
  | 'undo'
  | 'text_only';

export interface ProcessedVoiceResult {
  type: VoiceCommandType;
  /** التنسيق المطلوب إذا كان نوع السؤال محدداً */
  questionFormat?: QuestionFormat;
  /** رقم أو دليل الفرع (0=أ, 1=ب, 2=ج, 3=د) */
  branchIndex?: number;
  /** النص الفعلي المراد إدراجه بعد تجريده من الأمر وتنظيفه */
  payloadText: string;
  /** ملخص للأمر الذي تم تنفيذه للملاحظة السريعة للمعلم */
  feedbackLabel?: string;
}

/** تنظيف وتحسين النص العربي وعلامات الترقيم */
export function cleanArabicVoiceText(rawText: string): string {
  if (!rawText) return '';

  let text = rawText.trim();

  // تحويل أسماء علامات الترقيم إلى رموز
  const punctuationReplacements: Array<[RegExp, string]> = [
    [/\s*علامة\s+استفهام\s*/gi, '؟ '],
    [/\s*علامة\s+تعجب\s*/gi, '! '],
    [/\s*(فاصلة|فارزة)\s*/gi, '، '],
    [/\s*نقطت(ان|ين)(\s+رأسيتين|\s+رأسيتان)?\s*/gi, ': '],
    [/\s*نقطة\s*/gi, '. '],
    [/\s*شرطة\s*/gi, ' - '],
    [/\s*يساوي\s*/gi, ' = '],
    [/\s*زائد\s*/gi, ' + '],
    [/\s*ناقص\s*/gi, ' - '],
    [/\s*ضرب\s*/gi, ' × '],
    [/\s*تقسيم\s*/gi, ' ÷ '],
  ];

  for (const [regex, replacement] of punctuationReplacements) {
    text = text.replace(regex, replacement);
  }

  // ضبط المسافات حول علامات الترقيم العربية
  text = text
    .replace(/\s+([،.؛:؟!])/g, '$1') // منع المسافة قبل علامة الترقيم
    .replace(/([،.؛:؟!])(?=[^\s،.؛:؟!])/g, '$1 ') // ضمان مسافة واحدة بعد علامة الترقيم
    .replace(/\s{2,}/g, ' ') // إزالة المسافات المتكررة
    .trim();

  return text;
}

/**
 * فحص وتصنيف النص الصوتي المنطوق إلى أمر أو نص مع تنفيذه بذكاء
 */
export function processVoiceInput(spokenText: string): ProcessedVoiceResult {
  const trimmed = spokenText.trim();
  const lower = trimmed.toLowerCase();

  // 1. أوامر التراجع
  if (/^(تراجع|الغ الأمر|إلغاء الأمر|تراجع عن الأمر)$/i.test(lower)) {
    return {
      type: 'undo',
      payloadText: '',
      feedbackLabel: 'تم التراجع ↩️',
    };
  }

  // 2. أوامر الحذف
  if (/^(احذف|حذف|امسح|احذف السؤال|احذف الحالي|امسح السؤال)$/i.test(lower)) {
    return {
      type: 'delete_current',
      payloadText: '',
      feedbackLabel: 'تم الحذف 🗑️',
    };
  }

  // 3. أوامر الفاصل والأسطر
  if (/^(خط فاصل|فاصل|أضف فاصل|خط)$/i.test(lower)) {
    return {
      type: 'new_divider',
      payloadText: '',
      feedbackLabel: 'تمت إضافة خط فاصل ➖',
    };
  }

  if (/^(سطر جديد|انزل سطر|سطر|سطر اسفل)$/i.test(lower)) {
    return {
      type: 'new_line',
      payloadText: '\n',
      feedbackLabel: 'سطر جديد ↵',
    };
  }

  if (/^(فقرة جديدة|أضف فقرة|فقرة)$/i.test(lower)) {
    return {
      type: 'new_paragraph',
      payloadText: '',
      feedbackLabel: 'تمت إضافة فقرة جديدة 📝',
    };
  }

  // 4. أمر السؤال العام أو السؤال التالي
  const questionMatch = lower.match(
    /^(سؤال جديد|السؤال التالي|أضف سؤال|سؤال اخر|سؤال آخر|سؤال اختيارات|سؤال صح وخطأ|سؤال صح أو خطأ|صح وخطأ|صح أو خطأ|سؤال فراغات|سؤال مطابقة|سؤال)(.*)$/i,
  );
  if (questionMatch) {
    const remaining = cleanArabicVoiceText(questionMatch[2] ?? '');
    return {
      type: 'new_question',
      questionFormat: 'generic',
      payloadText: remaining,
      feedbackLabel: 'سؤال جديد ❓',
    };
  }

  // 5. أوامر الفروع (فرع أ، فرع ب، فرع ج، فرع د / أولاً، ثانياً، ثالثاً)
  const branchMap: Array<{ regex: RegExp; index: number; label: string }> = [
    { regex: /^(فرع\s*(أ|الف|ا)|أول(ا|اً))(\s*:\s*|\s+|$)(.*)/i, index: 0, label: 'فرع (أ)' },
    { regex: /^(فرع\s*ب|ثاني(ا|اً))(\s*:\s*|\s+|$)(.*)/i, index: 1, label: 'فرع (ب)' },
    { regex: /^(فرع\s*ج|ثالث(ا|اً))(\s*:\s*|\s+|$)(.*)/i, index: 2, label: 'فرع (ج)' },
    { regex: /^(فرع\s*د|رابع(ا|اً))(\s*:\s*|\s+|$)(.*)/i, index: 3, label: 'فرع (د)' },
    { regex: /^(فرع\s*هـ|خامس(ا|اً))(\s*:\s*|\s+|$)(.*)/i, index: 4, label: 'فرع (هـ)' },
    { regex: /^(فرع\s*و|سادس(ا|اً))(\s*:\s*|\s+|$)(.*)/i, index: 5, label: 'فرع (و)' },
  ];

  for (const b of branchMap) {
    const match = lower.match(b.regex);
    if (match) {
      const remaining = cleanArabicVoiceText(match[5] ?? match[4] ?? '');
      return {
        type: 'select_branch',
        branchIndex: b.index,
        payloadText: remaining,
        feedbackLabel: `انتقال إلى ${b.label}`,
      };
    }
  }

  // 6. نص عادي مع تنظيف علامات الترقيم
  return {
    type: 'text_only',
    payloadText: cleanArabicVoiceText(trimmed),
  };
}
