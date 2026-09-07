/**
 * مخزن الإعدادات (Zustand) — بديل SettingsProvider في تطبيق Flutter.
 * يدير وضع الثيم وحالة الضيف، مع إصرار في MMKV.
 */
import { create } from 'zustand';
import type { AppSettings, ThemeMode } from '../../shared/types/domain';
import { settingsRepo } from '../../data/repositories/settingsRepo';

interface SettingsState extends AppSettings {
  setThemeMode: (mode: ThemeMode) => void;
  setIsGuest: (value: boolean) => void;
  applyAll: (settings: AppSettings) => void;
}

const initial = settingsRepo.get();

export const useSettingsStore = create<SettingsState>(set => ({
  themeMode: initial.themeMode,
  isGuest: initial.isGuest,

  setThemeMode: mode => {
    settingsRepo.setThemeMode(mode);
    set({ themeMode: mode });
  },

  setIsGuest: value => {
    settingsRepo.setIsGuest(value);
    set({ isGuest: value });
  },

  applyAll: settings => {
    settingsRepo.replaceAll(settings);
    set({
      themeMode: settings.themeMode,
      isGuest: settings.isGuest,
    });
  },
}));
