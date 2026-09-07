/** حالة الوصول إلى التطبيق بحسب الترخيص أو التجربة. */
import { create } from 'zustand';
import {
  activateLicense,
  fetchCurrentLicenseAccess,
  getStoredLicenseAccess,
  getUsableCachedLicenseAccess,
  noLicenseAccess,
  saveLicenseAccess,
  saveSelectedSubjects,
  startFreeTrial,
  type LicenseAccess,
} from '../../services/licenseService';

interface LicenseState {
  access: LicenseAccess;
  initializing: boolean;
  notice: string | null;
  initialize: () => Promise<void>;
  refresh: () => Promise<LicenseAccess>;
  activate: (code: string) => Promise<LicenseAccess>;
  beginTrial: () => Promise<LicenseAccess>;
  updateSubjects: (subjects: string[]) => Promise<LicenseAccess>;
}

// كل تحقق يأخذ رقماً متزايداً كي لا يعيد رد متأخر وصولاً تم رفضه برد أحدث.
let latestLicenseRequest = 0;

function nextLicenseRequest(): number {
  latestLicenseRequest += 1;
  return latestLicenseRequest;
}

function isLatestLicenseRequest(requestId: number): boolean {
  return requestId === latestLicenseRequest;
}

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'تعذر التحقق من الترخيص حالياً.';
}

function expiredStateFromStoredAccess(): LicenseAccess {
  const stored = getStoredLicenseAccess();
  if (
    stored?.kind === 'trial_expired' ||
    stored?.kind === 'license_expired' ||
    stored?.kind === 'license_revoked'
  ) {
    return stored;
  }
  if (
    stored?.kind === 'trial' &&
    stored.expiresAt &&
    Date.parse(stored.expiresAt) <= Date.now()
  ) {
    return { ...stored, kind: 'trial_expired' };
  }
  if (
    stored?.kind === 'licensed' &&
    stored.expiresAt &&
    Date.parse(stored.expiresAt) <= Date.now()
  ) {
    return { ...stored, kind: 'license_expired' };
  }
  return noLicenseAccess();
}

export const useLicenseStore = create<LicenseState>((set, get) => ({
  access: noLicenseAccess(),
  initializing: true,
  notice: null,

  initialize: async () => {
    const requestId = nextLicenseRequest();
    const cached = getUsableCachedLicenseAccess();
    if (cached) {
      // لا نؤخر فتح التطبيق عند وجود قرار حديث؛ التحقق الخلفي يحدّثه فوراً.
      set({ access: cached, initializing: false, notice: null });
      fetchCurrentLicenseAccess()
        .then(access => {
          if (!isLatestLicenseRequest(requestId)) return;
          saveLicenseAccess(access);
          set({ access, notice: null });
        })
        .catch(error => {
          if (!isLatestLicenseRequest(requestId)) return;
          set({
            notice: errorMessage(error),
          });
        });
      return;
    }

    try {
      const access = await fetchCurrentLicenseAccess();
      if (!isLatestLicenseRequest(requestId)) return;
      saveLicenseAccess(access);
      set({ access, initializing: false, notice: null });
    } catch (error) {
      if (!isLatestLicenseRequest(requestId)) return;
      set({
        access: expiredStateFromStoredAccess(),
        initializing: false,
        notice: errorMessage(error),
      });
    }
  },

  refresh: async (): Promise<LicenseAccess> => {
    const requestId = nextLicenseRequest();
    const access = await fetchCurrentLicenseAccess();
    if (!isLatestLicenseRequest(requestId)) {
      return get().access;
    }
    saveLicenseAccess(access);
    set({ access, notice: null });
    return access;
  },

  activate: async (code: string): Promise<LicenseAccess> => {
    const requestId = nextLicenseRequest();
    const access = await activateLicense(code);
    if (!isLatestLicenseRequest(requestId)) {
      return get().access;
    }
    saveLicenseAccess(access);
    set({ access, notice: null });
    return access;
  },

  beginTrial: async (): Promise<LicenseAccess> => {
    const requestId = nextLicenseRequest();
    const access = await startFreeTrial();
    if (!isLatestLicenseRequest(requestId)) {
      return get().access;
    }
    saveLicenseAccess(access);
    set({ access, notice: null });
    return access;
  },

  updateSubjects: async (subjects: string[]): Promise<LicenseAccess> => {
    const requestId = nextLicenseRequest();
    const access = await saveSelectedSubjects(subjects);
    if (!isLatestLicenseRequest(requestId)) {
      return get().access;
    }
    saveLicenseAccess(access);
    set({ access, notice: null });
    return access;
  },
}));

export async function initLicense(): Promise<void> {
  await useLicenseStore.getState().initialize();
}
