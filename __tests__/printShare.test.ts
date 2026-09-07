jest.mock('react-native', () => ({
  __esModule: true,
  Platform: { OS: 'android' },
}));

jest.mock('react-native-blob-util', () => ({
  __esModule: true,
  default: {
    fs: {
      dirs: { CacheDir: '/data/user/0/teacher/cache' },
      readFile: jest.fn().mockResolvedValue('base64content'),
      writeFile: jest.fn().mockResolvedValue(undefined),
    },
  },
}));

jest.mock('react-native-share', () => ({
  __esModule: true,
  default: { open: jest.fn() },
}));

jest.mock('react-native-print', () => ({
  __esModule: true,
  default: { print: jest.fn() },
}));

import ReactNativeBlobUtil from 'react-native-blob-util';
import RNShare from 'react-native-share';
import { sharePdf } from '../src/services/printService';

const mockedReadFile = ReactNativeBlobUtil.fs.readFile as jest.Mock;
const mockedWriteFile = ReactNativeBlobUtil.fs.writeFile as jest.Mock;
const mockedOpen = RNShare.open as jest.Mock;

describe('مشاركة ورقة الامتحان PDF', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedReadFile.mockResolvedValue('base64content');
    mockedWriteFile.mockResolvedValue(undefined);
    mockedOpen.mockResolvedValue({ success: true });
  });

  it('ينسخ ملف PDF إلى ذاكرة التخزين المؤقت قبل المشاركة على أندرويد', async () => {
    await sharePdf('/storage/emulated/0/Android/data/teacher/Documents/Exam_exam.pdf');

    expect(mockedReadFile).toHaveBeenCalledWith(
      '/storage/emulated/0/Android/data/teacher/Documents/Exam_exam.pdf',
      'base64',
    );
    expect(mockedWriteFile).toHaveBeenCalledWith(
      expect.stringMatching(/^\/data\/user\/0\/teacher\/cache\/share_\d+\.pdf$/),
      'base64content',
      'base64',
    );
    expect(mockedOpen).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'application/pdf',
        failOnCancel: false,
      }),
    );
  });
});
