jest.mock('react-native-mmkv', () => ({
  createMMKV: jest.fn(() => ({
    getString: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
    contains: jest.fn(),
  })),
}));

import {
  buildExamHtml,
  buildExamHtmlWithMeta,
} from '../src/features/editor/examHtml';
import {
  DEFAULT_PRINT_SETTINGS,
  type EditorDocument,
} from '../src/shared/types/editor';

const doc: EditorDocument = {
  id: 'exam',
  title: 'امتحان الدور الثاني',
  header: {
    schoolName: 'مدرسة الإمام علي بن أبي طالب (ع) للبنين',
    subject: 'الكيمياء',
    grade: 'الخامس العلمي',
    examTitle: 'امتحان الدور الثاني',
    academicYear: '2025/2026',
    duration: '',
    date: '2026/9/',
    teacherName: 'سامر علوان',
    subjectId: null,
    round: 'الثاني',
    track: 'علمي',
    showBismillah: false,
    closingNote: '',
  },
  printSettings: { ...DEFAULT_PRINT_SETTINGS, autoFit: false },
  updatedAt: '2026-09-03',
  blocks: [
    {
      id: 'q1',
      type: 'question',
      questionMode: 'branched',
      text: 'س1/',
      score: '25',
      format: 'generic',
      branches: [
        {
          text: 'أ/ عرّف خمساً مما يأتي:',
          score: '',
          subItems: [{ text: 'طاقة بلانك' }, { text: 'SO₄²⁻' }],
        },
        {
          text: 'ب/ احسب تركيز محلول NaCl المحضّر من إذابة 5.8 g في 100 mL.',
          score: '',
          subItems: [],
        },
      ],
    },
  ],
};

describe('HTML ورقة الامتحان', () => {
  it('يعرض السؤال المتفرع من فروعه مباشرةً دون عنوان سؤال مستقل', () => {
    const html = buildExamHtml(doc);

    expect(html).toContain('<span class="branch-label">س1/أ/</span>');
    expect(html).toContain('<span class="branch-label">س1/ب/</span>');
    expect(html).not.toContain('class="question-label"');
    expect(html).toContain('طاقة بلانك');
    expect(html).toContain('SO₄²⁻');
    expect(html).toContain('5.8 g');
    expect(html).toContain('100 mL');
  });

  it('لا يطبع بادئة السؤال التي كتبها المستخدم مرتين', () => {
    const directDoc: EditorDocument = {
      ...doc,
      blocks: [
        {
          id: 'q-direct',
          type: 'question',
          questionMode: 'direct',
          text: 'س1/ اذكر قانون بلانك.',
          score: '10',
          format: 'generic',
          branches: [],
        },
      ],
    };

    const html = buildExamHtml(directDoc);
    expect(html.match(/س1\//g) ?? []).toHaveLength(1);
    expect(html).toContain('اذكر قانون بلانك.');
  });

  it('يبقي نص السؤال للصيغ المتخصصة مثل الاختيار المتعدد', () => {
    const mcqDoc: EditorDocument = {
      ...doc,
      blocks: [
        {
          id: 'q-mcq',
          type: 'question',
          questionMode: 'branched',
          text: 'اختر الإجابة الصحيحة:',
          score: '4',
          format: 'mcq',
          branches: [
            { text: 'الخيار الأول', score: '', subItems: [] },
            { text: 'الخيار الثاني', score: '', subItems: [] },
          ],
        },
      ],
    };

    const html = buildExamHtml(mcqDoc);
    expect(html).toContain('<span class="question-label">س1/</span>');
    expect(html).toContain('اختر الإجابة الصحيحة:');
    expect(html).toContain('<span class="branch-label">أ/</span>');
  });

  it('لا يكرر المسار أو الدور ولا يعرض تاريخاً غير مكتمل', () => {
    const html = buildExamHtml(doc);

    expect((html.match(/علمي/g) ?? [])).toHaveLength(1);
    expect((html.match(/الدور الثاني/g) ?? [])).toHaveLength(1);
    expect(html).not.toContain('2026/9/');
    expect(html).toContain('مدرس المادة: سامر علوان');
    expect(html).not.toContain('المدرس المادة');
  });

  it('يطبق الهوامش والخط والحجم والتباعد المختارة حتى مع الاحتواء التلقائي', () => {
    const customDoc: EditorDocument = {
      ...doc,
      printSettings: {
        ...DEFAULT_PRINT_SETTINGS,
        autoFit: true,
        fontFamily: 'Amiri',
        marginMm: 23,
        fontSize: 17,
        questionSpacing: 14,
      },
    };

    const { html, effectiveSettings } = buildExamHtmlWithMeta(customDoc);

    expect(effectiveSettings).toMatchObject({
      autoFit: true,
      fontFamily: 'Amiri',
      marginMm: 23,
      fontSize: 17,
      questionSpacing: 14,
    });
    expect(html).toContain('margin: 23mm;');
    expect(html).toContain("font-family: 'Amiri', 'Traditional Arabic', serif;");
    expect(html).toContain('font-size: 17pt;');
    expect(html).toContain('margin-bottom: 14pt;');
  });

  it('يترك حجم المعادلة ليرث حجم الخط المختار', () => {
    const formulaDoc: EditorDocument = {
      ...doc,
      printSettings: { ...DEFAULT_PRINT_SETTINGS, autoFit: false, fontSize: 17 },
      blocks: [{ id: 'formula-1', type: 'formula', text: 'E = mc²' }],
    };

    const html = buildExamHtml(formulaDoc);

    expect(html).toContain('font-size: 17pt;');
    expect(html).not.toContain('font-size:15pt');
  });

  it('يضع الدرجة مباشرة بعد نص السؤال دون سطر جديد عندما لا توجد درجات للأفرع', () => {
    const directDoc: EditorDocument = {
      ...doc,
      blocks: [
        {
          id: 'q-direct',
          type: 'question',
          questionMode: 'direct',
          text: 'س1/ اذكر قانون بلانك.',
          score: '10',
          format: 'generic',
          branches: [],
        },
      ],
    };

    const html = buildExamHtml(directDoc);
    const textIndex = html.indexOf('اذكر قانون بلانك.');
    const scoreIndex = html.indexOf('(10 درجة)');
    const newlineBetween = html.slice(textIndex, scoreIndex).includes('\n');

    expect(textIndex).not.toBe(-1);
    expect(scoreIndex).not.toBe(-1);
    expect(scoreIndex).toBeGreaterThan(textIndex);
    expect(newlineBetween).toBe(false);
  });

  it('يخفي درجة السؤال الكلية عندما تحمل الفروع درجاتها الخاصة', () => {
    const scoredBranchesDoc: EditorDocument = {
      ...doc,
      blocks: [
        {
          ...doc.blocks[0],
          score: '25',
          branches: [
            { text: 'أ/ فرع أول', score: '15', subItems: [] },
            { text: 'ب/ فرع ثانٍ', score: '10', subItems: [] },
          ],
        },
      ],
    };

    const html = buildExamHtml(scoredBranchesDoc);

    expect(html).not.toContain('(25 درجة)');
    expect(html).toContain('(15 د)');
    expect(html).toContain('(10 د)');
  });

  it('يطبق محاذاة النهايات المضبوطة (Justify) على الأسئلة والفروع', () => {
    const html = buildExamHtml(doc);

    expect(html).toContain('.q-head {\n      text-align: justify;');
    expect(html).toContain('.branch {\n      text-align: justify;');
    expect(html).toContain('.sub-item {\n      margin: 0.5mm 0;\n      text-align: justify;');
  });
});
