import {
  getBranchSubItems,
  getQuestionMode,
} from '../../shared/types/editor';
import type { EditorBlock, QuestionBlock } from '../../shared/types/editor';
import {
  stripBranchPrefix,
  stripQuestionPrefix,
  stripSubItemPrefix,
} from './examTextParser';

/** مسافات فارغة متساوية وواضحة (10 مسافات) بين كل نقطة وأخرى لتسهيل القراءة وتوزيع العناصر أفقياً */
export const HORIZONTAL_ITEM_SPACER = '          ';
const MAX_ITEM_LENGTH = 32;
const MAX_TOTAL_LINE_LENGTH = 110;

/** تنظيف النقطة من أي ترقيم أو رموز بداية سابقة لتوحيد التنسيق */
export function cleanItemText(raw: string): string {
  let cleaned = stripSubItemPrefix(raw);
  cleaned = cleaned
    .replace(/^(?:\(?\s*[أ-يa-zA-Z]\s*[-.)/]\s*)/u, '')
    .trim();
  return stripSubItemPrefix(cleaned);
}

/** تصفية العناصر المتكررة المتطابقة في السؤال الواحد لضمان عدم تكرار المفردة */
export function deduplicateItems(items: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of items) {
    const key = cleanItemText(item).replace(/\s+/g, ' ').trim();
    if (key && !seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  return result.length > 0 ? result : items;
}

/** هل النص يعتبر جملة أو تعليلاً أو فراغاً أو سؤالاً مستقلاً وليس مجرد نقطة أو مفردة قصيرة؟ */
function isLongSentenceOrQuestion(text: string): boolean {
  const trimmed = text.trim();
  // استثناء الفراغات الامتحانية نهائياً من الدمج الأفقي
  if (trimmed.includes('............') || trimmed.includes('......') || /فراغ/u.test(trimmed)) {
    return true;
  }
  // استثناء أسئلة التعاليل والمقارنات والأسئلة الإنشائية الطويلة
  if (/^(?:عرّف|علل|علّل|قارن|اشرح|وضّح|وضح|ما\s+الفرق|بيّن|بين|اذكر|يمثل|يجب|يقوم|أغلب|تسير|تحتوي|تكون|يستخدم|تشمل)\s+/u.test(trimmed)) {
    return true;
  }
  // جمل تنتهي بنقطة وتتجاوز 3 كلمات
  if (trimmed.endsWith('.') && trimmed.split(/\s+/).length > 3) {
    return true;
  }
  return false;
}

export function isIndependentQuestionBranch(text: string): boolean {
  return isLongSentenceOrQuestion(text);
}

/** فحص هل النقاط قصيرة بما يكفي لتتسع معاً في سطر واحد أو سطرين */
export function areItemsShort(items: string[]): boolean {
  if (!items || items.length < 2) return false;
  const cleaned = items.map(cleanItemText);
  if (cleaned.some(item => !item || item.length > MAX_ITEM_LENGTH || isLongSentenceOrQuestion(item))) {
    return false;
  }
  const totalLength =
    cleaned.reduce((sum, item) => sum + item.length, 0) +
    (cleaned.length - 1) * HORIZONTAL_ITEM_SPACER.length +
    cleaned.length * 4;
  return totalLength <= MAX_TOTAL_LINE_LENGTH;
}

/** دمج النقاط أفقياً بصيغة الأقواس لمنع انقلاب الاتجاه: (1) النقطة الأولى          (2) النقطة الثانية          ... */
export function formatItemsHorizontally(items: string[]): string {
  const uniqueItems = deduplicateItems(items);
  return uniqueItems
    .map((item, index) => `(${index + 1}) ${cleanItemText(item)}`)
    .join(HORIZONTAL_ITEM_SPACER);
}

function getSeparator(heading: string): string {
  if (!heading) return '';
  return /[:؛،]$/u.test(heading) ? ' ' : ': ';
}

/** يفحص إذا كان نص السؤال يحتوي على أسطر متعددة عبارة عن نقاط قصيرة */
function compactMultilineQuestionText(text: string): string {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return text;

  const firstLine = lines[0]!;
  const restLines = lines.slice(1);

  if (areItemsShort(restLines)) {
    const heading = firstLine.trim();
    const sep = getSeparator(heading);
    return `${heading}${sep}${formatItemsHorizontally(restLines)}`.trim();
  }

  if (areItemsShort(lines)) {
    return formatItemsHorizontally(lines);
  }

  return text;
}

function compactQuestionList(question: QuestionBlock): QuestionBlock {
  if (question.format === 'matching') {
    return question;
  }

  // 1. فحص إذا كان السؤال له فرع واحد يحتوي على نقاط فرعية (subItems)
  if (question.branches.length === 1) {
    const branch = question.branches[0]!;
    const branchItems = getBranchSubItems(branch).map(item => item.text.trim());
    if (areItemsShort(branchItems)) {
      const qText = stripQuestionPrefix(question.text).trim();
      const bText = stripBranchPrefix(branch.text).trim();
      const isHeadingRedundant =
        qText &&
        bText &&
        (qText.startsWith(bText.replace(/[:؛،]$/u, '').trim()) ||
          bText.startsWith(qText.replace(/[:؛،]$/u, '').trim()));
      const heading =
        qText && bText && !isHeadingRedundant
          ? `${qText} - ${bText}`
          : (bText || qText);
      const sep = getSeparator(heading);
      const score = question.score.trim() || branch.score.trim();
      return {
        ...question,
        text: `${heading}${sep}${formatItemsHorizontally(branchItems)}`.trim(),
        score,
        questionMode: 'direct',
        branches: [],
      };
    }
  }

  // 2. فحص إذا كان السؤال يحتوي على عدة فروع (branches)، كل فرع يمثل نقطة قصيرة
  if (question.branches.length >= 2) {
    const allBranchesHaveNoSubItems = question.branches.every(
      b => getBranchSubItems(b).length === 0,
    );
    const branchTexts = question.branches.map(b => stripBranchPrefix(b.text).trim());
    const anyIndependentQuestion = branchTexts.some(isIndependentQuestionBranch);

    if (allBranchesHaveNoSubItems && !anyIndependentQuestion && areItemsShort(branchTexts)) {
      const stem = stripQuestionPrefix(question.text).trim();
      const sep = getSeparator(stem);
      const totalBranchScore = question.branches.reduce(
        (sum, b) => sum + (parseFloat(b.score) || 0),
        0,
      );
      const score = question.score.trim() || (totalBranchScore > 0 ? String(totalBranchScore) : '');

      return {
        ...question,
        text: `${stem}${sep}${formatItemsHorizontally(branchTexts)}`.trim(),
        score,
        questionMode: 'direct',
        branches: [],
      };
    }

    // 3. إذا كانت الفروع متعددة ومستقلة، ولكن بعض الفروع بداخلها subItems قصيرة:
    let anyBranchUpdated = false;
    const updatedBranches = question.branches.map(b => {
      const subItems = getBranchSubItems(b).map(item => item.text.trim());
      if (areItemsShort(subItems)) {
        anyBranchUpdated = true;
        const bHeading = stripBranchPrefix(b.text).trim();
        const sep = getSeparator(bHeading);
        return {
          ...b,
          text: `${bHeading}${sep}${formatItemsHorizontally(subItems)}`.trim(),
          subItems: [],
        };
      }
      return b;
    });

    if (anyBranchUpdated) {
      return {
        ...question,
        branches: updatedBranches.map(b => ({
          ...b,
          subItems: getBranchSubItems(b).map(item => ({
            ...item,
            text: stripSubItemPrefix(item.text),
          })),
        })),
      };
    }
  }

  // 4. فحص إذا كان نص السؤال المباشر متعدد الأسطر ويحتوي على نقاط قصيرة
  const compactedText = compactMultilineQuestionText(question.text);
  if (compactedText !== question.text) {
    return {
      ...question,
      text: compactedText,
    };
  }

  // تنظيف أي نقاط فرعية متبقية في الفروع من بادئات الترقيم المكررة
  if (question.branches.length > 0) {
    return {
      ...question,
      branches: question.branches.map(b => ({
        ...b,
        subItems: getBranchSubItems(b).map(item => ({
          ...item,
          text: stripSubItemPrefix(item.text),
        })),
      })),
    };
  }

  return question;
}

/** يحوّل القوائم والنقاط والفروع القصيرة إلى توزيع أفقي متراص عند التنسيق الذكي لاستغلال المساحة الورقية. */
export function compactSmartFormatBlocks(blocks: EditorBlock[]): EditorBlock[] {
  return blocks.map(block =>
    block.type === 'question' ? compactQuestionList(block) : block,
  );
}
