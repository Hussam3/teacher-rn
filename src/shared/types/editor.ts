/**
 * حقيبة المدرس — نماذج محرر الكتل (Block Editor Models)
 *
 * المحرر يعتمد نموذج كتل (Block) مبني خصيصاً لتطبيق حقيبة المدرس،
 * مصمم لتوليد أوراق الامتحانات والخطط بسهولة.
 */

/** محاذاة النص */
export type BlockAlign = 'right' | 'center' | 'left';

/** الأنماط المضمّنة (Inline) */
export interface InlineStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}

interface BaseBlock {
  id: string;
}

/** فقرة عادية */
export interface ParagraphBlock extends BaseBlock {
  type: 'paragraph';
  text: string;
  style?: InlineStyle;
  align?: BlockAlign;
}

/** عنوان (1-3) */
export interface HeadingBlock extends BaseBlock {
  type: 'heading';
  level: 1 | 2 | 3;
  text: string;
  align?: BlockAlign;
}

/** قائمة نقطية أو مرقمة */
export interface ListBlock extends BaseBlock {
  type: 'list';
  ordered: boolean;
  items: string[];
}

/** نمط بناء السؤال داخل محرر الامتحانات. */
export type QuestionMode = 'direct' | 'branched';

/** نقطة مرقمة تابعة لفرع السؤال. */
export interface QuestionSubItem {
  text: string;
}

/** فرع سؤال (أ/ب/ج/د...) مع نقاطه الفرعية المرقمة. */
export interface QuestionBranch {
  text: string;
  score: string;
  subItems: QuestionSubItem[];
}

/** يعالج الأسئلة المحفوظة قبل إضافة نمط البناء الجديد. */
export function getQuestionMode(question: QuestionBlock): QuestionMode {
  return question.questionMode ??
    ((question.branches?.length ?? 0) ? 'branched' : 'direct');
}

/** يعالج الفروع المحفوظة قبل إضافة النقاط الفرعية. */
export function getBranchSubItems(branch: QuestionBranch): QuestionSubItem[] {
  return branch.subItems ?? [];
}

/** سؤال امتحاني مباشر أو متفرع. */
export interface QuestionBlock extends BaseBlock {
  type: 'question';
  text: string;
  /** المباشر له درجة واحدة، والمتفرع توزع درجاته على الفروع. */
  questionMode: QuestionMode;
  score: string;
  branches: QuestionBranch[];
  /** نوع السؤال الحقيقي (اختياري — الغياب = الشكل العام القديم) */
  format?: QuestionFormat;
  /** خيارات سؤال الاختيار من متعدد */
  options?: string[];
  /** أزواج سؤال المطابقة: [الطرف الأول، الطرف الثاني] */
  pairs?: [string, string][];
}

/**
 * السؤال العام المتفرع يعرض فروعه مباشرةً، أما الصيغ المتخصصة فتحتاج نصاً
 * رئيسياً مثل: اختر الإجابة الصحيحة.
 */
export function shouldShowQuestionStem(question: QuestionBlock): boolean {
  return (
    getQuestionMode(question) !== 'branched' ||
    (question.format ?? 'generic') !== 'generic'
  );
}

/** أنواع الأسئلة الحقيقية */
export type QuestionFormat =
  | 'generic'
  | 'mcq'
  | 'trueFalse'
  | 'fillBlank'
  | 'matching'
  | 'short';

/** معادلة/صيغة علمية (يُدخلها المعلم بالأزرار لا بـ LaTeX) */
export interface FormulaBlock extends BaseBlock {
  type: 'formula';
  text: string;
  align?: BlockAlign;
}

/** إجابة نموذجية (نمط مخفي) */
export interface AnswerBlock extends BaseBlock {
  type: 'answer';
  text: string;
}

/** فاصل أفقي */
export interface DividerBlock extends BaseBlock {
  type: 'divider';
}

/** جدول */
export interface TableBlock extends BaseBlock {
  type: 'table';
  headers: string[];
  rows: string[][];
}

/** صورة */
export interface ImageBlock extends BaseBlock {
  type: 'image';
  uri: string;
}

/** اتحاد كل أنواع الكتل */
export type EditorBlock =
  | ParagraphBlock
  | HeadingBlock
  | ListBlock
  | QuestionBlock
  | AnswerBlock
  | DividerBlock
  | TableBlock
  | ImageBlock
  | FormulaBlock;

/** ترويسة الامتحان */
export interface ExamHeader {
  schoolName: string;
  subject: string;
  grade: string;
  examTitle: string;
  academicYear: string;
  duration: string;
  date: string;
  teacherName: string;
  /** معرف المادة المرتبطة (لتوليد الأسئلة) */
  subjectId: string | null;
  /** الدور: الأول / الثاني */
  round: string;
  /** المسار: علمي / أدبي / مختلطة ... */
  track: string;
  /** إظهار "بسم الله الرحمن الرحيم" أعلى الورقة */
  showBismillah: boolean;
  /** عبارة ختامية أسفل الورقة، مثل "مع دعواتكم بالنجاح والتوفيق" */
  closingNote: string;
}

/** عائلات الخطوط العربية المتاحة لأوراق الامتحانات */
export type ExamFontFamily =
  | 'Cairo'
  | 'Amiri'
  | 'Tajawal'
  | 'NotoNaskh'
  | 'Almarai'
  | 'NotoKufi'
  | 'Tahoma';

/** تعريف الخطوط مع أسمائها المعروضة وخصائص الـ CSS */
export interface FontOption {
  id: ExamFontFamily;
  name: string;
  cssFamily: string;
  description: string;
}

export const AVAILABLE_EXAM_FONTS: FontOption[] = [
  {
    id: 'Cairo',
    name: 'خط كايرو (Cairo)',
    cssFamily: "'Cairo', sans-serif",
    description: 'خط عصري فائق الوضوح ومثالي للامتحانات المدرسية',
  },
  {
    id: 'Amiri',
    name: 'خط أميري (Amiri)',
    cssFamily: "'Amiri', 'Traditional Arabic', serif",
    description: 'خط مطبعي كلاسيكي رصين ذو طابع رسمي',
  },
  {
    id: 'Tajawal',
    name: 'خط تجوال (Tajawal)',
    cssFamily: "'Tajawal', sans-serif",
    description: 'خط حديث متناسق ومريح جداً للقراءة',
  },
  {
    id: 'NotoNaskh',
    name: 'خط النسخ (Noto Naskh)',
    cssFamily: "'Noto Naskh Arabic', serif",
    description: 'خط النسخ العربي المعتمد في المناهج',
  },
  {
    id: 'Almarai',
    name: 'خط المراعي (Almarai)',
    cssFamily: "'Almarai', sans-serif",
    description: 'خط أنيق ومتوازن ذو مظهر جذاب',
  },
  {
    id: 'NotoKufi',
    name: 'خط كوفي (Noto Kufi)',
    cssFamily: "'NotoKufiArabic', 'Noto Kufi Arabic', sans-serif",
    description: 'خط كوفي هندسي حديث وواضح',
  },
  {
    id: 'Tahoma',
    name: 'الخط التقليدي (Tahoma)',
    cssFamily: "'Tahoma', 'Arial', sans-serif",
    description: 'الخط القياسي المألوف في المستندات',
  },
];

/** مسألة/خطأ مكتشف في التدقيق اللغوي أو العلمي */
export interface ProofreadIssue {
  id: string;
  category: 'spelling' | 'grammar' | 'scientific' | 'formula' | 'symbol' | 'format';
  categoryLabel: string;
  title: string;
  explanation: string;
  originalText: string;
  suggestedText: string;
  blockId?: string;
  fieldKey?: string;
}

/** إعدادات الطباعة */
export interface PrintSettings {
  /** نوع الخط العربي */
  fontFamily: ExamFontFamily;
  /** الهوامش بالمليمتر */
  marginMm: number;
  /** حجم الخط بالنقطة */
  fontSize: number;
  /** التباعد بين الأسئلة بالنقطة */
  questionSpacing: number;
  /** نسخة مزدوجة (مثال: نسخة الطالب + نسخة التصحيح) — حقل قديم، أُبقي عليه للتوافق */
  doubleCopy: boolean;
  /** إطار الورقة: 0 بلا، 1 كامل، 2 للأسئلة فقط */
  frameOption: 0 | 1 | 2;
  /** عدد مرات تكرار نفس المحتوى بالصفحة الواحدة (للاختبارات القصيرة التي تُقص بعد الطباعة) */
  repeatPerPage: 1 | 2 | 3 | 4;
  /** عدد أعمدة النص بالصفحة */
  columns: 1 | 2;
  /** رسم خطوط قص متقطعة بين النسخ عند التكرار */
  cutLines: boolean;
  /** تصغير الخط/الهوامش/التباعد تلقائيًا عند الحاجة ليتسع المحتوى داخل صفحة A4 واحدة */
  autoFit: boolean;
}

/** مستند المحرر الكامل */
export interface EditorDocument {
  id: string;
  title: string;
  header: ExamHeader;
  blocks: EditorBlock[];
  printSettings: PrintSettings;
  updatedAt: string;
}

/** ترويسة فارغة */
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

/** إعدادات طباعة افتراضية */
export const DEFAULT_PRINT_SETTINGS: PrintSettings = {
  fontFamily: 'Cairo',
  marginMm: 15,
  fontSize: 13,
  questionSpacing: 8,
  doubleCopy: false,
  frameOption: 0,
  repeatPerPage: 1,
  columns: 1,
  cutLines: true,
  autoFit: false,
};

/** يملأ الحقول التي لم تكن موجودة في المستندات والمسودات الأقدم. */
export function normalizeEditorDocument(document: EditorDocument): EditorDocument {
  const blocks = (document.blocks ?? []).map(block => {
    if (block.type !== 'question') return block;
    return {
      ...block,
      questionMode: getQuestionMode(block),
      branches: (block.branches ?? []).map(branch => ({
        ...branch,
        subItems: branch.subItems ?? [],
      })),
    };
  });

  return {
    ...document,
    title: document.title ?? 'مستند جديد',
    header: { ...EMPTY_EXAM_HEADER, ...(document.header ?? {}) },
    blocks,
    printSettings: {
      ...DEFAULT_PRINT_SETTINGS,
      ...(document.printSettings ?? {}),
    },
    updatedAt: document.updatedAt ?? '',
  };
}

/** تسميات فروع الأسئلة العربية */
export const BRANCH_LABELS = [
  'أ',
  'ب',
  'ج',
  'د',
  'هـ',
  'و',
  'ز',
  'ح',
  'ط',
  'ي',
] as const;
