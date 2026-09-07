/**
 * محلل محلي لنصوص أوراق الامتحان العربية.
 * يحافظ على كل بند وارد في النص بدلاً من الاعتماد على نموذج لغوي قد يختصره.
 */
import type {
  EditorBlock,
  ExamHeader,
  QuestionBranch,
} from '../../shared/types/editor';

const ARABIC_DIGITS: Record<string, string> = {
  '٠': '0',
  '١': '1',
  '٢': '2',
  '٣': '3',
  '٤': '4',
  '٥': '5',
  '٦': '6',
  '٧': '7',
  '٨': '8',
  '٩': '9',
};

const SUBSCRIPTS: Record<string, string> = {
  '0': '₀',
  '1': '₁',
  '2': '₂',
  '3': '₃',
  '4': '₄',
  '5': '₅',
  '6': '₆',
  '7': '₇',
  '8': '₈',
  '9': '₉',
};

const SUPERSCRIPTS: Record<string, string> = {
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
  '+': '⁺',
  '-': '⁻',
};

interface ParsedQuestion {
  number: number;
  text: string;
  branches: QuestionBranch[];
}

export interface ParsedExamText {
  blocks: EditorBlock[];
  header: Partial<ExamHeader>;
  title: string;
  /** النص يتضمن ترويسة صريحة، لذلك لا ينبغي الإبقاء على بيانات قالب قديم. */
  replaceHeader: boolean;
}

function toLatinDigits(value: string): string {
  return value.replace(/[٠-٩]/g, digit => ARABIC_DIGITS[digit] ?? digit);
}

function toSubscript(value: string): string {
  return value.replace(/\d/g, digit => SUBSCRIPTS[digit] ?? digit);
}

function toSuperscript(value: string): string {
  return value.replace(/[\d+-]/g, char => SUPERSCRIPTS[char] ?? char);
}

/** توحيد الصيغ الشائعة وإبقاء اتجاه الرموز العلمية مستقراً عند الطباعة. */
export function normalizeScientificText(value: string): string {
  let text = value
    .replace(/\bPCI5\b/gi, 'PCl5')
    .replace(/\bCl\s*1\s*7\b/g, 'Cl17')
    .replace(/√\s*=\s*h\s*\/\s*p/gi, 'λ = h/p')
    .replace(/(\d+(?:[.,]\d+)?)\s*([mM])l\b/g, '$1 mL')
    .replace(/(\d+(?:[.,]\d+)?)\s*g\b/g, '$1 g');

  text = text.replace(
    /\b(?:[A-Z][a-z]?\d*)+(?:[+-]\d+|\d+[+-])?\b/g,
    token => {
      const suffixCharge = token.match(/^(.+?)([+-])(\d+)$/);
      if (suffixCharge) {
        return `${toSubscript(suffixCharge[1]!)}${toSuperscript(
          `${suffixCharge[3]}${suffixCharge[2]}`,
        )}`;
      }

      const prefixCharge = token.match(/^(.+?)(\d+)([+-])$/);
      if (prefixCharge) {
        return `${toSubscript(prefixCharge[1]!)}${toSuperscript(
          `${prefixCharge[2]}${prefixCharge[3]}`,
        )}`;
      }

      return toSubscript(token);
    },
  );

  return text;
}

/** تصحيحات آمنة ومتوقعة في نصوص الأسئلة دون تغيير المعنى. */
export function normalizeExamText(rawText: string): string {
  let text = toLatinDigits(rawText)
    .replace(/\r\n?/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ');

  const replacements: Array<[RegExp, string]> = [
    [/اسئلة/g, 'أسئلة'],
    [/الاجابة/g, 'الإجابة'],
    [/اربعة/g, 'أربعة'],
    [/ماهي/g, 'ما هي'],
    [/ماهو/g, 'ما هو'],
    [/اجب/g, 'أجب'],
    [/عرف\s+خمسا/g, 'عرّف خمساً'],
    [/دوبرنير/g, 'دوبراينر'],
    [/الاشكال/g, 'الأشكال'],
    [/الاشعة/g, 'الأشعة'],
    [/المحظر/g, 'المحضّر'],
    [/الدور\s+الاول/g, 'الدور الأول'],
    [/الاولى/g, 'الأولى'],
    [/الاخرى/g, 'أخرى'],
    [/لاوكسيد/g, 'لأوكسيد'],
    [/من\s+اذابه/g, 'من إذابة'],
    [/بحجم\s+قدرة\s+(?=\d)/g, 'بحجم قدره '],
    [/نهايه/g, 'نهاية'],
    [/علما\s+ان/g, 'علماً أن'],
    [/بن\s+ابي/g, 'بن أبي'],
    [/الامام/g, 'الإمام'],
  ];
  for (const [pattern, replacement] of replacements) {
    text = text.replace(pattern, replacement);
  }

  text = text.replace(/(^|\s)بين(?=\s+(?:نوع|السبب))/gmu, '$1بيّن');

  return normalizeScientificText(text);
}

/** إزالة رقم سؤال موجود داخل النص حتى لا يطبعه المحرك مرتين. */
export function stripQuestionPrefix(text: string): string {
  const trimmed = text.trim();
  if (trimmed === 'س') return '';
  return trimmed
    .replace(
      /^(?:س\s*(?:[0-9٠-٩]+\s*[/.:-]?\s*|[/.:-]\s*)|سؤال\s*[0-9٠-٩]+\s*[/.:-]?\s*)/u,
      '',
    )
    .trim();
}

/** إزالة تسمية فرع مكررة مثل "س1 (أ)" أو "أ/". */
export function stripBranchPrefix(text: string): string {
  return stripQuestionPrefix(text)
    .replace(
      /^(?:\(\s*[أبجدهوزحطي]\s*\)|[أبجدهوزحطي]\s*(?:\)|[/.:-]))\s*(?:[/.:-]\s*)?/u,
      '',
    )
    .trim();
}

function normalizeLine(line: string): string {
  return normalizeExamText(line).replace(/[ \t]+/g, ' ').trim();
}

function appendText(current: string, next: string): string {
  if (!current) return next;
  if (!next) return current;
  return `${current} ${next}`;
}

function isParenthesized(line: string): boolean {
  return /^\(.+\)$/.test(line.trim());
}

function listItemsFromParentheses(line: string): string[] {
  const inner = line.trim().slice(1, -1).trim();
  if (!/[،,؛;]/.test(inner)) return [];
  return inner
    .split(/[،,؛;]+/)
    .map(item => item.trim())
    .filter(Boolean);
}

function parseBranchLine(line: string): { label: string; text: string } | null {
  const withoutQuestionPrefix = stripQuestionPrefix(line);
  const match = withoutQuestionPrefix.match(
    /^(?:\(\s*([أبجدهوزحطي])\s*\)|([أبجدهوزحطي])\s*(?:\)|[/.:-]))\s*(.*)$/u,
  );
  const label = match?.[1] ?? match?.[2];
  if (!label) return null;
  return { label, text: stripBranchPrefix(withoutQuestionPrefix) };
}

function parseNumberedLine(line: string): string | null {
  const match = line.match(/^\(?\s*\d+\s*[-.)/]\s*(.+)$/u);
  return match?.[1]?.trim() || null;
}

function parseQuestionLine(line: string): { number: number; rest: string } | null {
  const match = line.match(/^س(?:ؤال)?\s*([0-9٠-٩]+)\s*[/.:-]?\s*(.*)$/u);
  if (!match) return null;
  const number = Number(toLatinDigits(match[1]!));
  if (!Number.isFinite(number) || number <= 0) return null;
  return { number, rest: match[2]?.trim() ?? '' };
}

function yearRange(value: string): string {
  const match = value.match(/(\d{4})\s*[/-]\s*(\d{4})/);
  if (!match) return value.trim();
  const first = Number(match[1]);
  const second = Number(match[2]);
  return first <= second ? `${first}/${second}` : `${second}/${first}`;
}

function normalizeSchoolName(value: string): string {
  return value
    .replace(/\s+ع(?=\s|$)/u, ' (ع)')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function extractHeader(lines: string[]): {
  header: Partial<ExamHeader>;
  title: string;
} {
  const all = lines.join(' ');
  const firstLine = lines[0] ?? '';
  const titleSegment = firstLine
    .split(/\s+(?=الصف|مدرسة|العام\s+الدراسي)/u)[0]
    ?.trim() ?? '';
  const titleMatch = titleSegment.match(/(?:أسئلة\s+)?(امتحان.+)$/u);
  const title = titleMatch?.[0]?.trim() ?? '';
  const roundMatch = all.match(/الدور\s+(الأول|الثاني|الثالث)/u);
  const schoolMatch = all.match(/(مدرسة\s+.+?)(?=\s+العام\s+الدراسي|$)/u);
  const gradeMatch = all.match(
    /الصف\s*[:：]?\s*(.+?)(?=\s+(?:مدرسة|العام\s+الدراسي)|$)/u,
  );
  const yearMatch = all.match(/العام\s+الدراسي\s*[:：]?\s*([0-9]{4}\s*[/-]\s*[0-9]{4})/u);
  const subjectMatch = all.match(/المادة\s*[:：]?\s*(.+?)(?=\s+(?:الصف|العام|التاريخ|$))/u);

  const header: Partial<ExamHeader> = {};
  if (title) header.examTitle = title;
  if (roundMatch?.[1]) header.round = roundMatch[1];
  if (schoolMatch?.[1]) header.schoolName = normalizeSchoolName(schoolMatch[1]);
  if (gradeMatch?.[1]) header.grade = gradeMatch[1].trim();
  if (yearMatch?.[1]) header.academicYear = yearRange(yearMatch[1]);
  if (subjectMatch?.[1]) header.subject = subjectMatch[1].trim();

  return { header, title };
}

function makeId(kind: string, index: number): string {
  return `parsed_${Date.now()}_${kind}_${index}`;
}

/**
 * يحوّل صيغة الامتحانات الشائعة (س1/أ/ ... والقوائم بين قوسين) إلى كتل.
 * يعيد null للنص الحر حتى يبقى الذكاء الاصطناعي خياراً احتياطياً له فقط.
 */
export function parseExamText(rawText: string): ParsedExamText | null {
  const lines = normalizeExamText(rawText)
    .split('\n')
    .map(normalizeLine)
    .filter(Boolean);
  if (!lines.length) return null;

  const preamble: string[] = [];
  const trailing: string[] = [];
  const questions: ParsedQuestion[] = [];
  let currentQuestion: ParsedQuestion | null = null;
  let currentBranch: QuestionBranch | null = null;

  const addBranch = (text: string): QuestionBranch | null => {
    if (!currentQuestion) return null;
    const branch: QuestionBranch = {
      text: stripBranchPrefix(text),
      score: '',
      subItems: [],
    };
    currentQuestion.branches.push(branch);
    return branch;
  };

  for (const line of lines) {
    const questionLine = parseQuestionLine(line);
    if (questionLine) {
      const inlineBranch = parseBranchLine(questionLine.rest);
      if (
        currentQuestion &&
        inlineBranch &&
        currentQuestion.number === questionLine.number
      ) {
        currentBranch = addBranch(inlineBranch.text);
        continue;
      }
      if (currentQuestion) questions.push(currentQuestion);
      currentQuestion = {
        number: questionLine.number,
        text: '',
        branches: [],
      };
      currentBranch = null;
      if (inlineBranch) {
        currentBranch = addBranch(inlineBranch.text);
      } else {
        currentQuestion.text = stripQuestionPrefix(questionLine.rest);
      }
      continue;
    }

    const branchLine = parseBranchLine(line);
    if (branchLine && currentQuestion) {
      currentBranch = addBranch(branchLine.text);
      continue;
    }

    if (/^علماً\s+أن/u.test(line)) {
      trailing.push(line);
      continue;
    }

    const numberedItem = parseNumberedLine(line);
    if (numberedItem && currentBranch) {
      currentBranch.subItems.push({ text: numberedItem });
      continue;
    }

    if (isParenthesized(line) && currentBranch) {
      const items = listItemsFromParentheses(line);
      if (items.length > 1) {
        currentBranch.subItems.push(...items.map(text => ({ text })));
      } else {
        currentBranch.text = appendText(currentBranch.text, line);
      }
      continue;
    }

    if (currentBranch) {
      currentBranch.text = appendText(currentBranch.text, line);
    } else if (currentQuestion) {
      currentQuestion.text = appendText(currentQuestion.text, line);
    } else {
      preamble.push(line);
    }
  }

  if (currentQuestion) questions.push(currentQuestion);
  if (!questions.length) return null;

  const { header, title } = extractHeader(preamble);
  const questionScore =
    preamble.join(' ').match(/لكل\s+سؤال\s+(\d+)\s+درجة/u)?.[1] ?? '';
  const blocks: EditorBlock[] = [];

  for (const line of preamble) {
    if (/^(?:أسئلة\s+)?امتحان|مدرسة|الصف|العام\s+الدراسي/u.test(line)) {
      continue;
    }
    blocks.push({
      id: makeId('intro', blocks.length),
      type: 'paragraph',
      text: line,
      align: /الإجابة\s+على/u.test(line) ? 'center' : 'right',
      style: /الإجابة\s+على/u.test(line) ? { bold: true } : undefined,
    });
  }

  for (const question of questions) {
    blocks.push({
      id: makeId('question', blocks.length),
      type: 'question',
      text: question.branches.length ? '' : stripQuestionPrefix(question.text),
      questionMode: question.branches.length ? 'branched' : 'direct',
      score: questionScore,
      format: 'generic',
      branches: question.branches,
    });
  }

  for (const line of trailing) {
    blocks.push({
      id: makeId('reference', blocks.length),
      type: 'paragraph',
      text: line,
      align: 'center',
      style: { bold: true },
    });
  }

  return {
    blocks,
    header,
    title,
    replaceHeader: Object.keys(header).length > 0,
  };
}
