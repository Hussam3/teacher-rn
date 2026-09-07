jest.mock('react-native', () => ({
  __esModule: true,
  Platform: { OS: 'android' },
}));

jest.mock('react-native-blob-util', () => ({
  __esModule: true,
  default: {
    MediaCollection: {
      copyToMediaStore: jest.fn(),
    },
  },
}));

jest.mock('react-native-html-to-pdf', () => ({
  generatePDF: jest.fn().mockResolvedValue({ filePath: '/cache/Exam_exam.pdf' }),
}));

jest.mock('react-native-mmkv', () => ({
  createMMKV: jest.fn(() => ({
    getString: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
    contains: jest.fn(),
  })),
}));

jest.mock('../src/data/syncBridge', () => ({
  notifyLocalChange: jest.fn(),
}));

import {
  generateExamPdfToDownloads,
} from '../src/services/pdfExportService';
import { generateExamPdf } from '../src/services/pdfService';
import { generatePDF } from 'react-native-html-to-pdf';
import ReactNativeBlobUtil from 'react-native-blob-util';
import {
  DEFAULT_PRINT_SETTINGS,
  EMPTY_EXAM_HEADER,
  type EditorDocument,
} from '../src/shared/types/editor';

const exam: EditorDocument = {
  id: 'current',
  title: 'اختبار الفصل الأول',
  header: { ...EMPTY_EXAM_HEADER },
  blocks: [],
  printSettings: { ...DEFAULT_PRINT_SETTINGS },
  updatedAt: '2026-09-05T10:00:00.000Z',
};

const mockedCopy = ReactNativeBlobUtil.MediaCollection
  .copyToMediaStore as jest.Mock;
const mockedGeneratePdf = generatePDF as jest.Mock;

describe('تصدير ورقة الامتحان إلى مجلد التنزيلات', () => {
  beforeEach(() => {
    mockedCopy.mockReset();
    mockedGeneratePdf.mockReset();
    mockedGeneratePdf.mockResolvedValue({ filePath: '/cache/Exam_exam.pdf' });
  });

  it('ينسخ الملف المولّد إلى MediaStore (مجلد التنزيلات العام)', async () => {
    mockedCopy.mockResolvedValue(
      'content://media/external/downloads/1000000017',
    );

    const result = await generateExamPdfToDownloads(exam);

    expect(mockedCopy).toHaveBeenCalledWith(
      {
        name: 'Exam_اختبار الفصل الأول.pdf',
        parentFolder: '',
        mimeType: 'application/pdf',
      },
      'Download',
      '/cache/Exam_exam.pdf',
    );
    expect(result).toEqual({
      uri: 'content://media/external/downloads/1000000017',
      savedToDownloads: true,
    });
  });

  it('يسترجع المسار الأصلي إذا فشل النسخ إلى MediaStore', async () => {
    mockedCopy.mockRejectedValue(new Error('media store blocked'));

    const result = await generateExamPdfToDownloads(exam);

    expect(result).toEqual({
      uri: '/cache/Exam_exam.pdf',
      savedToDownloads: false,
    });
  });

  it('يَستدعي توليدPDF باسم ملف آمن', async () => {
    await generateExamPdfToDownloads(exam);

    expect(generateExamPdf).toBeDefined();
    expect(mockedGeneratePdf).toHaveBeenCalledWith(
      expect.objectContaining({ fileName: 'Exam_اختبار الفصل الأول' }),
    );
  });
});