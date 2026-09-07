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
  generateExamPdf,
} from '../src/services/pdfService';
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
});
