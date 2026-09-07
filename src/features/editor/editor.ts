/**
 * أنواع بيانات محرر الأسئلة والمستندات.
 *
 * ملاحظة مهمة: هذا الملف أُعيد بناؤه اعتمادًا على طريقة استخدام هذه الأنواع في
 * blocks.ts و BlockView.tsx و ExamHeaderDialog.tsx و PrintSettingsPanel.tsx
 * (لم يكن لدي الملف الأصلي). إن كانت هناك حقول أخرى في نسختك الحالية، أضفها
 * بعد الدمج ولا تحذفها — الحقول الجديدة الخاصة بمحرك الطباعة (المرحلة 1)
 * موضّحة بتعليق فوق كل واحدة منها.
 */

export type BlockAlign = 'right' | 'center' | 'left';

export interface ParagraphBlock {
  id: string;
  type: 'paragraph';
  text: string;
  align?: BlockAlign;
  style?: { bold?: boolean; italic?: boolean; underline?: boolean };
}

export interface HeadingBlock {
  id: string;
  type: 'heading';
  level: 1 | 2 | 3;
  text: string;
  align?: BlockAlign;
}

export interface QuestionBranch {
  text: string;
  score: string;
}

export interface QuestionBlock {
  id: string;
  type: 'question';
  text: string;
  score: string;
  branches: QuestionBranch[];
}

export interface AnswerBlock {
  id: string;
  type: 'answer';
  text: string;
}

export interface DividerBlock {
  id: string;
  type: 'divider';
}

export interface TableBlock {
  id: string;
  type: 'table';
  headers: string[];
  rows: string[][];
}

export interface ListBlock {
  id: string;
  type: 'list';
  ordered: boolean;
  items: string[];
}

export interface ImageBlock {
  id: string;
  type: 'image';
  uri: string;
}

export type EditorBlock =
  | ParagraphBlock
  | HeadingBlock
  | QuestionBlock
  | AnswerBlock
  | DividerBlock
  | TableBlock
  | ListBlock
  | ImageBlock;

/** حروف فروع السؤال (أ، ب، ج ...) */
export const BRANCH_LABELS = ['أ', 'ب', 'ج', 'د', 'هـ', 'و', 'ز', 'ح'];

export interface ExamHeader {
  schoolName: string;
  subject: string;
  grade: string;
  examTitle: string;
  academicYear: string;
  duration: string;
  date: string;
  teacherName: string;
  subjectId?: string | null;

  // ── إضافات المرحلة 1 (محرك الطباعة) ─────────────────────────────
  /** الدور: الأول / الثاني */
  round?: string;
  /** المسار: علمي / أدبي / مختلطة ... */
  track?: string;
  /** إظهار "بسم الله الرحمن الرحيم" أعلى الورقة */
  showBismillah?: boolean;
  /** عبارة ختامية أسفل الورقة، مثل "مع دعواتكم بالنجاح والتوفيق" */
  closingNote?: string;
}

export const EMPTY_EXAM_HEADER: ExamHeader = {
  schoolName: '',
  subject: '',
  grade: '',
  examTitle: '',
  academicYear: '',
  duration: '',
  date: '',
  teacherName: '',
  subjectId: null,
  round: '',
  track: '',
  showBismillah: true,
  closingNote: 'مع دعواتكم بالنجاح والتوفيق',
};

export interface PrintSettings {
  marginMm: number;
  fontSize: number;
  questionSpacing: number;
  /** نسخة مزدوجة (مثال: نسخة الطالب + نسخة التصحيح) — حقل قديم، أُبقي عليه للتوافق */
  doubleCopy: boolean;
  frameOption: 0 | 1 | 2;

  // ── إضافات المرحلة 1 (محرك الطباعة) ─────────────────────────────
  /** عدد مرات تكرار نفس المحتوى بالصفحة الواحدة (للاختبارات القصيرة التي تُقص بعد الطباعة) */
  repeatPerPage: 1 | 2 | 3 | 4;
  /** عدد أعمدة النص بالصفحة */
  columns: 1 | 2;
  /** رسم خطوط قص متقطعة بين النسخ عند التكرار */
  cutLines: boolean;
  /** تصغير الخط/الهوامش/التباعد تلقائيًا عند الحاجة ليتسع المحتوى داخل صفحة A4 واحدة */
  autoFit: boolean;
}

export const DEFAULT_PRINT_SETTINGS: PrintSettings = {
  marginMm: 15,
  fontSize: 13,
  questionSpacing: 8,
  doubleCopy: false,
  frameOption: 0,
  repeatPerPage: 1,
  columns: 1,
  cutLines: true,
  autoFit: true,
};

export interface EditorDocument {
  id: string;
  title: string;
  header: ExamHeader;
  blocks: EditorBlock[];
  printSettings: PrintSettings;
  updatedAt: string;
}
