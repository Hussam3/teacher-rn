import { compactSmartFormatBlocks } from '../src/features/editor/smartFormat';
import type { EditorBlock, QuestionBlock } from '../src/shared/types/editor';

describe('التنسيق الذكي المتراص', () => {
  it('يحوّل قائمة التعاريف القصيرة إلى سؤال مباشر في سطر متصل', () => {
    const blocks: EditorBlock[] = [
      {
        id: 'definitions',
        type: 'question',
        text: '',
        questionMode: 'branched',
        score: '10',
        format: 'generic',
        branches: [
          {
            text: 'عرّف ما يأتي',
            score: '',
            subItems: [
              { text: 'الآصرة الأيونية' },
              { text: 'الآصرة الهيدروجينية' },
              { text: 'الآصرة الفلزية' },
            ],
          },
        ],
      },
    ];

    const [result] = compactSmartFormatBlocks(blocks) as QuestionBlock[];

    expect(result).toMatchObject({
      questionMode: 'direct',
      branches: [],
      text:
        'عرّف ما يأتي: 1. الآصرة الأيونية، 2. الآصرة الهيدروجينية، 3. الآصرة الفلزية',
    });
  });

  it('يبقي الفروع المستقلة كما هي', () => {
    const blocks: EditorBlock[] = [
      {
        id: 'branches',
        type: 'question',
        text: '',
        questionMode: 'branched',
        score: '',
        format: 'generic',
        branches: [
          { text: 'عرّف المفهوم', score: '', subItems: [] },
          { text: 'علّل النتيجة', score: '', subItems: [] },
        ],
      },
    ];

    const [result] = compactSmartFormatBlocks(blocks) as QuestionBlock[];

    expect(result.questionMode).toBe('branched');
    expect(result.branches).toHaveLength(2);
  });
});
