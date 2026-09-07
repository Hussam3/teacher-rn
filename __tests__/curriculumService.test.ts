jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
  Linking: { openURL: jest.fn() },
}));

jest.mock('react-native-blob-util', () => {
  const fs = {
    dirs: { DocumentDir: '/documents' },
    exists: jest.fn(),
    mkdir: jest.fn(),
    unlink: jest.fn(),
    stat: jest.fn(),
    mv: jest.fn(),
  };
  return { __esModule: true, default: { fs, config: jest.fn() } };
});

jest.mock('../src/services/curriculumCatalog', () => ({
  findBook: jest.fn(() => ({
    driveId: 'book-id',
    viewUrl: 'https://drive.example/view/book-id',
    downloadUrl: 'https://drive.example/download/book-id',
  })),
  toGoogleDrivePreviewUrl: jest.fn(
    (_url: string, id: string) => `https://drive.example/preview/${id}`,
  ),
  toGoogleDriveDownloadUrl: jest.fn(
    (_url: string, id: string) => `https://files.example/${id}.pdf`,
  ),
}));

jest.mock('../src/services/pdfCurriculumLinks', () => ({
  findPdfLink: jest.fn(() => undefined),
}));

import {
  downloadBook,
  isRemotePdfUri,
} from '../src/services/curriculumService';

const mockBlobUtil = jest.requireMock('react-native-blob-util').default;
const mockFs = mockBlobUtil.fs;
const mockConfig = mockBlobUtil.config;
const mockResponse = { info: jest.fn() };
const mockRequest = { progress: jest.fn() };

const stage = 'الابتدائية';
const grade = 'الصف الخامس الابتدائي';
const subject = 'الرياضيات';
const localPath = '/documents/teacher_curriculum/الرياضيات_الصف_الخامس_الابتدائي.pdf';

describe('تنزيل المناهج دون اتصال', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFs.exists.mockResolvedValue(false);
    mockFs.mkdir.mockResolvedValue(undefined);
    mockFs.unlink.mockResolvedValue(undefined);
    mockFs.stat.mockResolvedValue({ size: 100 });
    mockFs.mv.mockResolvedValue(true);
    mockResponse.info.mockReturnValue({
      status: 200,
      headers: { 'Content-Type': 'application/pdf' },
    });
    mockRequest.progress.mockResolvedValue(mockResponse);
    mockConfig.mockReturnValue({ fetch: jest.fn(() => mockRequest) });
  });

  it('يعيد النسخة المحفوظة دون تنفيذ طلب شبكة جديد', async () => {
    mockFs.exists.mockResolvedValue(true);

    await expect(downloadBook(stage, grade, subject)).resolves.toEqual({
      path: `file://${localPath}`,
    });

    expect(mockConfig).not.toHaveBeenCalled();
  });

  it('يحفظ التنزيل المكتمل في مساحة التطبيق الدائمة', async () => {
    await expect(downloadBook(stage, grade, subject)).resolves.toEqual({
      path: `file://${localPath}`,
    });

    expect(mockConfig).toHaveBeenCalledWith(
      expect.objectContaining({ path: `${localPath}.tmp`, timeout: 120000 }),
    );
    expect(mockFs.mv).toHaveBeenCalledWith(`${localPath}.tmp`, localPath);
  });

  it('لا يستبدل التنزيل الفاشل برابط سحابي', async () => {
    mockResponse.info.mockReturnValue({ status: 503, headers: {} });

    await expect(downloadBook(stage, grade, subject)).rejects.toThrow(
      'استجاب الخادم برمز 503',
    );

    expect(mockFs.mv).not.toHaveBeenCalled();
  });

  it('يميّز روابط الإنترنت عن ملفات الجهاز', () => {
    expect(isRemotePdfUri('https://example.com/book.pdf')).toBe(true);
    expect(isRemotePdfUri(`file://${localPath}`)).toBe(false);
  });
});
