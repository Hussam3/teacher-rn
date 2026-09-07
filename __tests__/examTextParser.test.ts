import {
  parseExamText,
  stripBranchPrefix,
  stripQuestionPrefix,
} from '../src/features/editor/examTextParser';
import type { EditorBlock, QuestionBlock } from '../src/shared/types/editor';

const sourceExam = `اسئلة امتحان الدور الثاني الصف الخامس العلمي مدرسة الامام علي بن ابي طالب ع للبنين
العام الدراسي 2026/2025

الاجابة على اربعة اسئلة ولكل سؤال 25 درجة

س1/ أ/ عرف خمسا مما يأتي
(طاقة بلانك، ثلاثيات دوبرنير، المعقد المنشط، التركيز المولالي، الفوتون، تأثير تندل، الكم)
ب/ ماهي الذوبانية وماهي العوامل التي تؤثر على الذوبانية وضح ذلك؟

س٢/ أ/ ماهو الرنين ثم اكتب الاشكال الرنينية المحتملة للمركبين التاليين
(SO4-2, PO4-3)
ب/ بين نوع التهجين ثم اكتب الخواص المغناطيسية للمعقدات التالية
(نفس معقدات الدور الاول)

س٣/ أ/ هل تنطبق القاعدة الثمانية لثلاث من المركبات التالية ثم بين السبب
(HF, NH3, PCI5, BF3)
ب/ احسب التركيز المولاري لمحلول NaCl المحظر من إذابة 5.8g من الملح في الماء المقطر للحصول على محلول بحجم قدرة 100Ml

س٤/ أ/ بين نوع التهجين والشكل الهندسي وقياس الزاوية لثلاث من المركبات التالية
(HF, NH3, CH4, N2H2)
ب/ اجب عن واحدة فقط
1- اشتق العلاقة √=h/p
2- ماهي خواص الاشعة الكاثودية؟

س٥/ أ/ ماذا نقصد بالتأين الذاتي للماء؟ ثم اكتب معادلات التأين الذاتي حسب مفهوم برونشتد مرة وحسب مفهوم لويس مرة اخرى؟
ب/ اكتب الصفة القاعدية والصفة الحامضية والصيغة الكيميائية لاوكسيد المنغنيز عند حالات التأكسد المختلفة للمنغنيز؟
ج/ اكتب فقط وحدات ثابت سرعة التفاعل عند المراتب التالية
(الصفرية، الاولى، الثانية)

علما ان (S16, P15, H1, F9, N7, Cl1 7, B5, Fe26, Co27)`;

function questionsFrom(blocks: EditorBlock[]): QuestionBlock[] {
  return blocks.filter((block): block is QuestionBlock => block.type === 'question');
}

describe('تحليل نص الامتحان', () => {
  it('يحفظ كل الفروع والقوائم والصيغ بدلاً من حذفها', () => {
    const parsed = parseExamText(sourceExam);
    expect(parsed).not.toBeNull();
    const result = parsed!;
    const questions = questionsFrom(result.blocks);

    expect(result.header).toMatchObject({
      schoolName: 'مدرسة الإمام علي بن أبي طالب (ع) للبنين',
      grade: 'الخامس العلمي',
      examTitle: 'أسئلة امتحان الدور الثاني',
      academicYear: '2025/2026',
      round: 'الثاني',
    });
    expect(result.replaceHeader).toBe(true);
    expect(questions).toHaveLength(5);
    expect(questions.every(question => question.score === '25')).toBe(true);

    expect(questions[0]!.branches[0]!.subItems.map(item => item.text)).toEqual([
      'طاقة بلانك',
      'ثلاثيات دوبراينر',
      'المعقد المنشط',
      'التركيز المولالي',
      'الفوتون',
      'تأثير تندل',
      'الكم',
    ]);
    expect(questions[1]!.branches[0]!.subItems.map(item => item.text)).toEqual([
      'SO₄²⁻',
      'PO₄³⁻',
    ]);
    expect(questions[2]!.branches[0]!.subItems.map(item => item.text)).toEqual([
      'HF',
      'NH₃',
      'PCl₅',
      'BF₃',
    ]);
    expect(questions[3]!.branches[1]!.subItems.map(item => item.text)).toEqual([
      'اشتق العلاقة λ = h/p',
      'ما هي خواص الأشعة الكاثودية؟',
    ]);
    expect(questions[2]!.branches[1]!.text).toContain('المحضّر');
    expect(questions[2]!.branches[1]!.text).toContain('5.8 g');
    expect(questions[2]!.branches[1]!.text).toContain('بحجم قدره 100 mL');
    expect(questions[4]!.branches[2]!.subItems.map(item => item.text)).toEqual([
      'الصفرية',
      'الأولى',
      'الثانية',
    ]);
  });

  it('يعزل المراجع الذرية كفقرة مستقلة ولا يلحقها بآخر فرع', () => {
    const parsed = parseExamText(sourceExam)!;
    const reference = parsed.blocks.find(
      block => block.type === 'paragraph' && block.text.startsWith('علماً أن'),
    );

    expect(reference).toMatchObject({
      text: 'علماً أن (S₁₆, P₁₅, H₁, F₉, N₇, Cl₁₇, B₅, Fe₂₆, Co₂₇)',
      align: 'center',
    });
  });

  it('يجمع الفروع التي تكرر رقم السؤال ولا يحتفظ بعنوان رئيسي لها', () => {
    const parsed = parseExamText(`س1/أ/ عرّف المفهوم
س1/ب/ اذكر مثالاً`)!;
    const [question] = questionsFrom(parsed.blocks);

    expect(question).toMatchObject({ text: '', questionMode: 'branched' });
    expect(question!.branches.map(branch => branch.text)).toEqual([
      'عرّف المفهوم',
      'اذكر مثالاً',
    ]);
    expect(stripQuestionPrefix('س1/ سؤال مباشر')).toBe('سؤال مباشر');
    expect(stripBranchPrefix('س1/ (أ) نص الفرع')).toBe('نص الفرع');
  });
});
