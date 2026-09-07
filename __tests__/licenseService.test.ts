const mockStorage = new Map<string, string>();

jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
}));

jest.mock('react-native-mmkv', () => ({
  createMMKV: jest.fn(() => ({
    getString: jest.fn((key: string) => mockStorage.get(key)),
    set: jest.fn((key: string, value: string) => {
      mockStorage.set(key, value);
    }),
    remove: jest.fn((key: string) => {
      mockStorage.delete(key);
    }),
  })),
}));

jest.mock('../src/services/supabase', () => ({
  supabase: { functions: { invoke: jest.fn() } },
}));

import {
  getLicenseRefreshDeadline,
  getUsableCachedLicenseAccess,
} from '../src/services/licenseService';
import { StorageKeys, storage } from '../src/shared/lib/storage';

describe('فترة سماح الترخيص', () => {
  const deviceNow = Date.UTC(2026, 8, 1, 9, 0, 0);
  const serverOffsetMs = 3 * 60 * 60 * 1000;

  beforeEach(() => {
    mockStorage.clear();
  });

  function saveCachedLicense(options: { expiresAt?: string | null } = {}) {
    const graceDeadline = deviceNow + 7 * 24 * 60 * 60 * 1000;
    storage.set(
      StorageKeys.licenseEntitlement,
      JSON.stringify({
        kind: 'licensed',
        expiresAt: options.expiresAt ?? null,
        codeHint: 'ABCD',
        checkedAt: new Date(deviceNow + serverOffsetMs).toISOString(),
        offlineGraceUntil: new Date(
          graceDeadline + serverOffsetMs,
        ).toISOString(),
        serverTimeOffsetMs: serverOffsetMs,
        lastObservedDeviceAt: new Date(deviceNow).toISOString(),
      }),
    );
    return graceDeadline;
  }

  it('يحوّل نهاية فترة السماح من وقت الخادم إلى ساعة الجهاز', () => {
    const graceDeadline = saveCachedLicense();

    expect(getLicenseRefreshDeadline(null)).toBe(graceDeadline);
    expect(getUsableCachedLicenseAccess(graceDeadline - 1)?.kind).toBe(
      'licensed',
    );
    expect(getUsableCachedLicenseAccess(graceDeadline)).toBeNull();
  });

  it('يختار انتهاء الترخيص قبل نهاية فترة السماح', () => {
    const expiresAt = new Date(
      deviceNow + serverOffsetMs + 24 * 60 * 60 * 1000,
    ).toISOString();
    saveCachedLicense({ expiresAt });

    expect(getLicenseRefreshDeadline(expiresAt)).toBe(
      deviceNow + 24 * 60 * 60 * 1000,
    );
  });
});
