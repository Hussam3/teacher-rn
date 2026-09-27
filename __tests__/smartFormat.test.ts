import {
  compactSmartFormatBlocks,
  HORIZONTAL_ITEM_SPACER,
} from '../src/features/editor/smartFormat';
import type { EditorBlock, QuestionBlock } from '../src/shared/types/editor';

describe('التنسيق الذكي المتراص - التوزيع الأفقي الشامل', () => {
  it('يحوّل قائمة التعاريف القصيرة إلى سؤال مباشر بتوزيع أفقي وبمسافات متساوية', () => {
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
      text: `عرّف ما يأتي: (1) الآصرة الأيونية${HORIZONTAL_ITEM_SPACER}(2) الآصرة الهيدروجينية${HORIZONTAL_ITEM_SPACER}(3) الآصرة الفلزية`,
    });
  });

  it('يبقي الفروع المستقلة ذات الأسئلة المنفصلة كما هي', () => {
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

  it('يدمج فروع السؤال المتعددة إذا كانت عبارة عن نقاط قصيرة مرقمة في سطر أفقي واحد', () => {
    const blocks: EditorBlock[] = [
      {
        id: 'points_question',
        type: 'question',
        text: 'عرّف المصطلحات الآتية:',
        questionMode: 'branched',
        score: '20',
        format: 'generic',
        branches: [
          { text: '1- النقطة الأولى', score: '', subItems: [] },
          { text: '2- النقطة الثانية', score: '', subItems: [] },
          { text: '3- النقطة الثالثة', score: '', subItems: [] },
          { text: '4- النقطة الرابعة', score: '', subItems: [] },
        ],
      },
    ];

    const [result] = compactSmartFormatBlocks(blocks) as QuestionBlock[];

    expect(result.questionMode).toBe('direct');
    expect(result.branches).toHaveLength(0);
    expect(result.text).toBe(
      `عرّف المصطلحات الآتية: (1) النقطة الأولى${HORIZONTAL_ITEM_SPACER}(2) النقطة الثانية${HORIZONTAL_ITEM_SPACER}(3) النقطة الثالثة${HORIZONTAL_ITEM_SPACER}(4) النقطة الرابعة`,
    );
  });

  it('يدمج النقاط الفرعية subItems أفقياً داخل الفرع عند تعدد الفروع الرئيسية المستقلة', () => {
    const blocks: EditorBlock[] = [
      {
        id: 'multi_branch_with_subitems',
        type: 'question',
        text: 'أجب عن فرعين:',
        questionMode: 'branched',
        score: '20',
        format: 'generic',
        branches: [
          {
            text: 'أ/ عرّف ما يأتي:',
            score: '10',
            subItems: [
              { text: 'البروتين' },
              { text: 'الإنزيم' },
            ],
          },
          {
            text: 'ب/ علّل ما يأتي:',
            score: '10',
            subItems: [
              { text: 'تطاير الكحول' },
              { text: 'ذوبان الملح' },
            ],
          },
        ],
      },
    ];

    const [result] = compactSmartFormatBlocks(blocks) as QuestionBlock[];

    expect(result.questionMode).toBe('branched');
    expect(result.branches).toHaveLength(2);
    expect(result.branches[0]?.text).toBe(
      `عرّف ما يأتي: (1) البروتين${HORIZONTAL_ITEM_SPACER}(2) الإنزيم`,
    );
    expect(result.branches[0]?.subItems).toHaveLength(0);
    expect(result.branches[1]?.text).toBe(
      `علّل ما يأتي: (1) تطاير الكحول${HORIZONTAL_ITEM_SPACER}(2) ذوبان الملح`,
    );
    expect(result.branches[1]?.subItems).toHaveLength(0);
  });

  it('يحوّل النص متعدد الأسطر العمودية للنقاط القصيرة إلى سطر أفقي مدمج', () => {
    const blocks: EditorBlock[] = [
      {
        id: 'multiline_text_q',
        type: 'question',
        text: 'عرّف ما يأتي:\n1- النقطة الأولى\n2- النقطة الثانية\n3- النقطة الثالثة\n4- النقطة الرابعة',
        questionMode: 'direct',
        score: '10',
        format: 'generic',
        branches: [],
      },
    ];

    const [result] = compactSmartFormatBlocks(blocks) as QuestionBlock[];

    expect(result.text).toBe(
      `عرّف ما يأتي: (1) النقطة الأولى${HORIZONTAL_ITEM_SPACER}(2) النقطة الثانية${HORIZONTAL_ITEM_SPACER}(3) النقطة الثالثة${HORIZONTAL_ITEM_SPACER}(4) النقطة الرابعة`,
    );
  });

  it('يبقي النقاط الطويلة عمودياً إذا كانت تتجاوز سعة السطرين', () => {
    const longItem1 = 'هذا تعريف طويل جداً يشرح بالتفصيل نظرية فيزيائية معقدة ومعادلاتها الرياضية وتطبيقاتها الصناعية المختلفة';
    const longItem2 = 'وهذا تعريف آخر مطول جداً لا يمكن بأي حال من الأحوال وضعه في سطر أفقي واحد مع غيره لأنه يفيض عن الصفحة';

    const blocks: EditorBlock[] = [
      {
        id: 'long_items',
        type: 'question',
        text: '',
        questionMode: 'branched',
        score: '10',
        format: 'generic',
        branches: [
          {
            text: 'عرّف ما يأتي',
            score: '',
            subItems: [{ text: longItem1 }, { text: longItem2 }],
          },
        ],
      },
    ];

    const [result] = compactSmartFormatBlocks(blocks) as QuestionBlock[];

    // يبقى متفرعاً بدون دمج أفقي حتى لا يخرب تخطيط الصفحة
    expect(result.questionMode).toBe('branched');
    expect(result.branches).toHaveLength(1);
    expect(result.branches[0]?.subItems).toHaveLength(2);
  });

  it('يمنع دمج أسئلة التعاليل والجمل التفسيرية أفقياً ويبقيها رأسية', () => {
    const blocks: EditorBlock[] = [
      {
        id: 'reasoning_q',
        type: 'question',
        text: 'علل ثلاثة فقط:',
        questionMode: 'branched',
        score: '6',
        format: 'generic',
        branches: [
          {
            text: 'علل ما يأتي:',
            score: '',
            subItems: [
              { text: 'يمثل الجزء الأخير في معدة المجترات معدة حقيقية.' },
              { text: 'يجب استخدام الأسمدة الكيميائية بشكل موزون.' },
              { text: 'أغلب الضواري والمفترسات تسير على أطراف الأصابع.' },
            ],
          },
        ],
      },
    ];

    const [result] = compactSmartFormatBlocks(blocks) as QuestionBlock[];

    // يبقى عمودياً بدون دمج أفقي
    expect(result.questionMode).toBe('branched');
    expect(result.branches[0]?.subItems).toHaveLength(3);
  });

  it('يمنع دمج جمل الفراغات أفقياً ويبقيها رأسية', () => {
    const blocks: EditorBlock[] = [
      {
        id: 'fill_blank_q',
        type: 'question',
        text: 'املأ الفراغات التالية:',
        questionMode: 'branched',
        score: '4',
        format: 'generic',
        branches: [
          {
            text: 'أكمل:',
            score: '',
            subItems: [
              { text: 'تحتوي أقدام النعامة على ............ يرتكز عليها الطائر أثناء المشي.' },
              { text: 'تشمل ملوثات الهواء على نوعين هي ............' },
            ],
          },
        ],
      },
    ];

    const [result] = compactSmartFormatBlocks(blocks) as QuestionBlock[];

    expect(result.questionMode).toBe('branched');
    expect(result.branches[0]?.subItems).toHaveLength(2);
  });

  it('يحذف المفردات المتكررة المتطابقة في السؤال الواحد', () => {
    const blocks: EditorBlock[] = [
      {
        id: 'duplicate_terms',
        type: 'question',
        text: 'عرّف ما يأتي:',
        questionMode: 'branched',
        score: '10',
        format: 'generic',
        branches: [
          {
            text: 'عرّف:',
            score: '',
            subItems: [
              { text: 'السلوك' },
              { text: 'الأحياء المتكافئة' },
              { text: 'الترسبات' },
              { text: 'الأحياء المتكافئة' },
            ],
          },
        ],
      },
    ];

    const [result] = compactSmartFormatBlocks(blocks) as QuestionBlock[];

    expect(result.questionMode).toBe('direct');
    expect(result.text).toBe(
      `عرّف: (1) السلوك${HORIZONTAL_ITEM_SPACER}(2) الأحياء المتكافئة${HORIZONTAL_ITEM_SPACER}(3) الترسبات`,
    );
  });
});
