import {
  getBranchSubItems,
  getQuestionMode,
} from '../../shared/types/editor';
import type { EditorBlock, QuestionBlock } from '../../shared/types/editor';
import { stripBranchPrefix } from './examTextParser';

const MAX_INLINE_ITEM_LENGTH = 80;

function compactQuestionList(question: QuestionBlock): QuestionBlock {
  if (
    (question.format ?? 'generic') !== 'generic' ||
    getQuestionMode(question) !== 'branched' ||
    question.text.trim() ||
    question.branches.length !== 1
  ) {
    return question;
  }

  const branch = question.branches[0]!;
  const heading = stripBranchPrefix(branch.text).trim();
  const items = getBranchSubItems(branch).map(item => item.text.trim());
  if (
    branch.score.trim() ||
    !heading ||
    items.length < 2 ||
    items.some(item => !item || item.length > MAX_INLINE_ITEM_LENGTH)
  ) {
    return question;
  }

  const separator = /[:؛،]$/u.test(heading) ? ' ' : ': ';
  const list = items.map((item, index) => `${index + 1}. ${item}`).join('، ');
  return {
    ...question,
    text: `${heading}${separator}${list}`,
    questionMode: 'direct',
    branches: [],
  };
}

/** يحوّل القائمة القصيرة المتجانسة إلى سطر متصل عند التنسيق الذكي فقط. */
export function compactSmartFormatBlocks(blocks: EditorBlock[]): EditorBlock[] {
  return blocks.map(block =>
    block.type === 'question' ? compactQuestionList(block) : block,
  );
}
