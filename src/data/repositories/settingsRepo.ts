/**
 * مستودع إعدادات التطبيق (كائن مفرد، وليس مجموعة).
 */
import type { AppSettings, ThemeMode } from '../../shared/types/domain';
import { StorageKeys, readJSON, writeJSON } from '../../shared/lib/storage';

const DEFAULT_SETTINGS: AppSettings = {
  themeMode: 'system',
  isGuest: false,
};

/** المفاتيح القديمة تُحذف عند القراءة حتى لا تظهر في النسخ الاحتياطية لاحقاً. */
type StoredSettings = Partial<AppSettings> & { geminiApiKey?: unknown };

function normalizeSettings(settings: StoredSettings): AppSettings {
  return {
    themeMode: settings.themeMode ?? DEFAULT_SETTINGS.themeMode,
    isGuest: settings.isGuest ?? DEFAULT_SETTINGS.isGuest,
  };
}

export const settingsRepo = {
  get(): AppSettings {
    const stored = readJSON<StoredSettings>(StorageKeys.settings, {});
    const settings = normalizeSettings(stored);
    if ('geminiApiKey' in stored) writeJSON(StorageKeys.settings, settings);
    return settings;
  },
  setThemeMode(mode: ThemeMode): void {
    const current = settingsRepo.get();
    current.themeMode = mode;
    writeJSON(StorageKeys.settings, current);
  },
  setIsGuest(value: boolean): void {
    const current = settingsRepo.get();
    current.isGuest = value;
    writeJSON(StorageKeys.settings, current);
  },
  /** استبدال كامل للإعدادات (عند الاستيراد) */
  replaceAll(settings: AppSettings | StoredSettings): void {
    writeJSON(StorageKeys.settings, normalizeSettings(settings));
  },
};
