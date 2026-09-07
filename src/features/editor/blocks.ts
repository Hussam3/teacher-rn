/**
 * مصانع كتل المحرر — دوال مساعدة لإنشاء الكتل.
 */
import type {
  DividerBlock,
  EditorBlock,
  HeadingBlock,
  ParagraphBlock,
  QuestionBlock,
  AnswerBlock,
  TableBlock,
  ListBlock,
  ImageBlock,
  FormulaBlock,
  EditorDocument,
} from '../../shared/types/editor';
import { DEFAULT_PRINT_SETTINGS, EMPTY_EXAM_HEADER } from '../../shared/types/editor';
import { newId } from '../../shared/utils/id';
import { todayISO } from '../../shared/utils/date';

export function createParagraph(text = ''): ParagraphBlock {
  return { id: newId(), type: 'paragraph', text };
}

export function createHeading(level: 1 | 2 | 3, text = ''): HeadingBlock {
  return { id: newId(), type: 'heading', level, text };
}

/** إنشاء سؤال مباشر؛ يمكن تحويله داخل المحرر إلى سؤال متفرع. */
export function createQuestion(text = ''): QuestionBlock {
  return {
    id: newId(),
    type: 'question',
    text,
    questionMode: 'direct',
    score: '',
    format: 'generic',
    branches: [],
  };
}

export function createMCQQuestion(): QuestionBlock {
  return createQuestion();
}

export function createTrueFalseQuestion(): QuestionBlock {
  return createQuestion();
}

export function createFillBlankQuestion(): QuestionBlock {
  return createQuestion();
}

export function createMatchingQuestion(): QuestionBlock {
  return createQuestion();
}

export function createFormula(text = ''): FormulaBlock {
  return { id: newId(), type: 'formula', text, align: 'center' };
}

export function createAnswer(text = ''): AnswerBlock {
  return { id: newId(), type: 'answer', text };
}

export function createDivider(): DividerBlock {
  return { id: newId(), type: 'divider' };
}

export function createTable(): TableBlock {
  return {
    id: newId(),
    type: 'table',
    headers: ['عمود 1', 'عمود 2'],
    rows: [['خلية 1', 'خلية 2']],
  };
}

export function createList(ordered = false): ListBlock {
  return { id: newId(), type: 'list', ordered, items: [''] };
}

export function createImage(uri: string): ImageBlock {
  return { id: newId(), type: 'image', uri };
}

/** مستند جديد فارغ */
export function createEmptyDocument(): EditorDocument {
  return {
    id: 'current',
    title: 'مستند جديد',
    header: { ...EMPTY_EXAM_HEADER },
    blocks: [createParagraph('')],
    printSettings: { ...DEFAULT_PRINT_SETTINGS },
    updatedAt: todayISO(),
  };
}

/** إدراج كتلة من نوع */
export function createBlock(type: EditorBlock['type']): EditorBlock {
  switch (type) {
    case 'heading':
      return createHeading(2);
    case 'question':
      return createQuestion();
    case 'answer':
      return createAnswer();
    case 'divider':
      return createDivider();
    case 'table':
      return createTable();
    case 'list':
      return createList();
    case 'image':
      return createImage('');
    case 'formula':
      return createFormula();
    case 'paragraph':
    default:
      return createParagraph();
  }
}
