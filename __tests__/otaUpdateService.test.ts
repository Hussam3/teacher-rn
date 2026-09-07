jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
  NativeModules: {
    UpdateManager: {
      documentDir: '/data/user/0/com.teacherbag/files',
      otaEnabled: true,
      restartApp: jest.fn(),
    },
  },
}));

jest.mock('react-native-blob-util', () => {
  const fs = {
    exists: jest.fn(),
    mkdir: jest.fn(),
    unlink: jest.fn(),
    stat: jest.fn(),
    hash: jest.fn(),
    mv: jest.fn(),
    writeFile: jest.fn(),
  };
  return { __esModule: true, default: { fs, config: jest.fn() } };
});

jest.mock('../src/shared/lib/storage', () => ({
  storage: { getString: jest.fn(), getNumber: jest.fn(), set: jest.fn() },
}));

jest.mock('../src/services/supabase', () => ({ supabase: { from: jest.fn() } }));

import {
  applyAppUpdate,
  checkForAppUpdate,
} from '../src/services/otaUpdateService';

const mockBlobUtil = jest.requireMock('react-native-blob-util').default;
const mockFs = mockBlobUtil.fs;
const mockConfig = mockBlobUtil.config;
const mockRestartApp = jest.requireMock('react-native').NativeModules.UpdateManager
  .restartApp;
const mockSupabase = jest.requireMock('../src/services/supabase').supabase;
const mockStorage = jest.requireMock('../src/shared/lib/storage').storage;
const UPDATE_HASH = 'a'.repeat(64);
const mockResponse = { info: jest.fn() };
const mockDownload = { progress: jest.fn() };
let updateQuery: Record<string, jest.Mock>;

describe('OTA updates', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFs.exists.mockResolvedValue(true);
    mockFs.unlink.mockResolvedValue(undefined);
    mockFs.stat.mockResolvedValue({ size: 1 });
    mockFs.hash.mockResolvedValue(UPDATE_HASH);
    mockFs.mv.mockResolvedValue(undefined);
    mockFs.writeFile.mockResolvedValue(undefined);
    mockRestartApp.mockResolvedValue(true);
    mockResponse.info.mockReturnValue({
      status: 200,
      headers: {
        'Content-Type': 'application/javascript',
        'Content-Length': '1',
      },
    });
    mockDownload.progress.mockReturnValue(Promise.resolve(mockResponse));
    mockConfig.mockReturnValue({ fetch: jest.fn(() => mockDownload) });
    updateQuery = {
      select: jest.fn(),
      eq: jest.fn(),
      order: jest.fn(),
      limit: jest.fn(),
      maybeSingle: jest.fn(),
    };
    updateQuery.select.mockReturnValue(updateQuery);
    updateQuery.eq.mockReturnValue(updateQuery);
    updateQuery.order.mockReturnValue(updateQuery);
    updateQuery.limit.mockReturnValue(updateQuery);
    mockSupabase.from.mockReturnValue(updateQuery);
  });

  it('uses the existing OTA directory instead of failing to create it again', async () => {
    const result = await applyAppUpdate({
      id: 'update-1',
      versionName: '1.0.5889',
      versionCode: 5889,
      bundleUrl: 'https://example.com/index.android.bundle',
      bundleHash: UPDATE_HASH,
      createdAt: '2026-08-30T00:00:00.000Z',
    });

    expect(result).toEqual({
      ok: true,
      needsRestart: true,
      restartScheduled: true,
    });
    expect(mockFs.exists).toHaveBeenCalledWith(
      '/data/user/0/com.teacherbag/files/ota',
    );
    expect(mockFs.mkdir).not.toHaveBeenCalled();
    expect(mockFs.hash).toHaveBeenCalledWith(
      '/data/user/0/com.teacherbag/files/ota/index.android.bundle.tmp',
      'sha256',
    );
  });

  it('reports an available update from the public updates table', async () => {
    updateQuery.maybeSingle.mockResolvedValue({
      data: {
        id: 'update-2',
        version_name: '9.0.0',
        version_code: 99,
        bundle_url: 'https://example.com/update.bundle',
        bundle_hash: 'new-hash',
        release_notes: 'إصلاح',
        is_mandatory: false,
        created_at: '2026-09-03T00:00:00.000Z',
      },
      error: null,
    });

    await expect(checkForAppUpdate()).resolves.toMatchObject({
      hasUpdate: true,
      update: { id: 'update-2', bundleHash: 'new-hash' },
    });
  });

  it('reports a connection error instead of claiming the app is current', async () => {
    updateQuery.maybeSingle.mockResolvedValue({
      data: null,
      error: { message: 'network unavailable' },
    });

    await expect(checkForAppUpdate()).resolves.toMatchObject({
      hasUpdate: false,
      error: 'تعذر الاتصال بخدمة التحديثات الفورية',
    });
  });

  it('does not downgrade a newer native release to an older OTA bundle', async () => {
    mockStorage.getString.mockImplementation((key: string) =>
      key === '@ota_installed_version' ? '2.0.0' : undefined,
    );
    mockStorage.getNumber.mockReturnValue(2000);
    updateQuery.maybeSingle.mockResolvedValue({
      data: {
        id: 'update-old',
        version_name: '1.0.7',
        version_code: 1788533138,
        bundle_url: 'https://example.com/old.bundle',
        bundle_hash: UPDATE_HASH,
        release_notes: 'قديم',
        is_mandatory: false,
        created_at: '2026-09-04T00:00:00.000Z',
      },
      error: null,
    });

    await expect(checkForAppUpdate()).resolves.toMatchObject({
      hasUpdate: false,
      update: null,
    });
  });

  it('keeps the installed update usable when automatic restart scheduling fails', async () => {
    mockRestartApp.mockRejectedValue(new Error('restart unavailable'));

    await expect(
      applyAppUpdate({
        id: 'update-3',
        versionName: '1.0.5',
        versionCode: 5900,
        bundleUrl: 'https://example.com/update.bundle',
        bundleHash: UPDATE_HASH,
        createdAt: '2026-09-04T00:00:00.000Z',
      }),
    ).resolves.toEqual({
      ok: true,
      needsRestart: true,
      restartScheduled: false,
    });
  });

  it('rejects an incomplete or invalid HTTP download before replacing the bundle', async () => {
    mockResponse.info.mockReturnValue({
      status: 503,
      headers: { 'Content-Type': 'text/html' },
    });

    await expect(
      applyAppUpdate({
        id: 'update-4',
        versionName: '1.0.7',
        versionCode: 5901,
        bundleUrl: 'https://example.com/update.bundle',
        bundleHash: UPDATE_HASH,
        createdAt: '2026-09-04T00:00:00.000Z',
      }),
    ).resolves.toMatchObject({
      ok: false,
      error: 'تعذر تنزيل الحزمة (رمز HTTP 503)',
    });
    expect(mockFs.mv).not.toHaveBeenCalled();
  });
});
