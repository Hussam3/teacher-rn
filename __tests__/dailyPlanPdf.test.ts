/// <reference types="jest" />

jest.mock('react-native-html-to-pdf', () => ({
  generatePDF: jest.fn(),
}));

jest.mock('react-native-mmkv', () => ({
  createMMKV: jest.fn(() => ({
    getString: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
    contains: jest.fn(),
  })),
}));

import { generatePDF } from 'react-native-html-to-pdf';
import {
  buildDailyPlanHtml,
  examPdfFileName,
  generateDailyPlanPdf,
  generateExamPdf,
  sanitizePdfFileName,
} from '../src/services/pdfService';
import { sanitizeAndDistributeDailyPlanSections } from '../src/shared/utils/dailyPlanSections';
import { dailyPlanResponseSchema } from '../src/shared/types/schemas';
import type { DailyPlan } from '../src/shared/types/domain';
import {
  DEFAULT_PRINT_SETTINGS,
  EMPTY_EXAM_HEADER,
  type EditorDocument,
} from '../src/shared/types/editor';

const plan: DailyPlan = {
  id: 'daily-multiple-topics',
  subjectId: 'chemistry',
  topic: 'التهجين، الأشكال الهندسية',
  topics: ['التهجين', 'الأشكال الهندسية'],
  date: '2026-09-03',
  className: 'الخامس العلمي',
  duration: 45,
  objectives: 'هدف',
  introduction: 'تمهيد',
  presentation: 'عرض',
  activities: 'وسائل',
  evaluation: 'تقويم',
  homework: 'واجب',
  isEdited: false,
  createdAt: '2026-09-03',
};

const exam: EditorDocument = {
  id: 'exam',
  title: '2025/2026: اختبار',
  header: { ...EMPTY_EXAM_HEADER },
  blocks: [],
  printSettings: { ...DEFAULT_PRINT_SETTINGS },
  updatedAt: '2026-09-05T10:00:00.000Z',
};

const mockedGeneratePdf = generatePDF as jest.MockedFunction<typeof generatePDF>;

describe('PDF الخطة اليومية', () => {
  beforeEach(() => {
    mockedGeneratePdf.mockResolvedValue({ filePath: '/tmp/exam.pdf' });
  });

  it('يعرض الموضوعات المتعددة كقائمة داخل ترويسة الخطة', () => {
    const html = buildDailyPlanHtml(plan);

    expect(html).toContain('الموضوعات');
    expect(html).toContain('<li>التهجين</li>');
    expect(html).toContain('<li>الأشكال الهندسية</li>');
  });

  it('يولد ورقة الامتحان بمقاس A4 واسم ملف آمن', async () => {
    await generateExamPdf(exam);

    expect(mockedGeneratePdf).toHaveBeenCalledWith(
      expect.objectContaining({
        fileName: 'Exam_2025-2026- اختبار',
        width: 595,
        height: 842,
        padding: 0,
      }),
    );
    expect(examPdfFileName(' .اختبار/أ: ب? ')).toBe('Exam_اختبار-أ- ب');
  });

  it('يولد ملف PDF للخطة اليومية باسم آمن خالٍ من الفواصل المائلة المسببة للأخطاء', async () => {
    await generateDailyPlanPdf(plan);

    expect(mockedGeneratePdf).toHaveBeenCalledWith(
      expect.objectContaining({
        fileName: 'DailyPlan_2026-09-03',
      }),
    );
  });

  it('يعقم أسماء الملفات بإزالة الفواصل والرموز الممنوعة لنظام الملفات', () => {
    expect(sanitizePdfFileName('DailyPlan/2026/09/21')).toBe('DailyPlan-2026-09-21');
    expect(sanitizePdfFileName('Exam: Test <Final>')).toBe('Exam- Test -Final');
  });

  it('يفك دمج التمهيد وعرض الدرس والتقويم إذا كانت مدموجة داخل حقل الوسائل', () => {
    const mergedRaw = {
      objectives: '1. أن يتعرف الطالب على المفاهيم',
      activities: `الكتاب المنهجي المقرر، السبورة، الأقلام الملونة.
**التمهيد (5 دقائق):**
طرح سؤال استكشافي مشوق حول الموضوع.
**عرض الدرس (25 دقيقة):**
شرح مفصل للمفاهيم وحل الأمثلة المنهجية.
**التقويم (10 دقائق):**
س1: ما هو المفهوم؟
س2: حل المسألة.
**الواجب البيتي:**
حل تمارين ص 40`,
      introduction: '',
      presentation: '',
      evaluation: '',
      homework: '',
    };

    const result = sanitizeAndDistributeDailyPlanSections(mergedRaw);

    expect(result.objectives).toBe('1. أن يتعرف الطالب على المفاهيم');
    expect(result.activities).toBe('الكتاب المنهجي المقرر، السبورة، الأقلام الملونة.');
    expect(result.introduction).toContain('طرح سؤال استكشافي مشوق حول الموضوع.');
    expect(result.presentation).toContain('شرح مفصل للمفاهيم وحل الأمثلة المنهجية.');
    expect(result.evaluation).toContain('س1: ما هو المفهوم؟');
    expect(result.homework).toContain('حل تمارين ص 40');
  });

  it('ينظف حقل الوسائل التعليمية بشكل قاطع حتى وإن كانت باقي الحقول غير فارغة', () => {
    const rawWithBoth = {
      objectives: 'أهداف أولية',
      activities: `السبورة والأقلام الملونة
التمهيد: طرح سؤال سريع
عرض الدرس: شرح الخطوات
التقويم: أسئلة للمراجعة`,
      introduction: 'تمهيد موجز',
      presentation: 'عرض موجز',
      evaluation: 'تقويم موجز',
      homework: 'واجب',
    };

    const result = sanitizeAndDistributeDailyPlanSections(rawWithBoth);

    expect(result.activities).toBe('السبورة والأقلام الملونة');
    expect(result.activities).not.toContain('التمهيد');
    expect(result.activities).not.toContain('عرض الدرس');
    expect(result.activities).not.toContain('التقويم');
    expect(result.introduction).toContain('طرح سؤال سريع');
  });

  it('يتحقق بنجاح من مخطط JSON للخطة اليومية حتى عند ورود مصفوفات أو مفاتيح عربية', () => {
    const validJsonWithArrays = {
      objectives: ['1. أن يعرف الطالب المفهوم', '2. أن يطبق القاعدة'],
      teachingAids: ['السبورة', 'الكتاب المدرسي'],
      introduction: 'سؤال استكشافي',
      presentation: 'عرض الدرس',
      evaluation: 'أسئلة التقويم',
      homework: ['حل تمارين 1 و 2'],
    };

    const parsed = dailyPlanResponseSchema.safeParse(validJsonWithArrays);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.objectives).toBe('1. أن يعرف الطالب المفهوم\n2. أن يطبق القاعدة');
      expect(parsed.data.teachingAids).toBe('السبورة\nالكتاب المدرسي');
      expect(parsed.data.homework).toBe('حل تمارين 1 و 2');
    }

    const validJsonWithArabicKeys = {
      'الأهداف السلوكية': 'أهداف عربية',
      'الوسائل التعليمية': 'سبورة وكتاب',
      'التمهيد': 'تمهيد عربي',
      'عرض الدرس': 'عرض عربي',
      'التقويم': 'تقويم عربي',
      'الواجب البيتي': 'واجب عربي',
    };

    const parsedArabic = dailyPlanResponseSchema.safeParse(validJsonWithArabicKeys);
    expect(parsedArabic.success).toBe(true);
    if (parsedArabic.success) {
      expect(parsedArabic.data.objectives).toBe('أهداف عربية');
      expect(parsedArabic.data.teachingAids).toBe('سبورة وكتاب');
      expect(parsedArabic.data.introduction).toBe('تمهيد عربي');
    }
  });
});

