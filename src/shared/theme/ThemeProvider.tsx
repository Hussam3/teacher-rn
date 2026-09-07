/**
 * مزوّد الثيم — يوفّر الألوان الدلالية حسب الوضع (نظام/فاتح/داكن)
 * ويزامن NativeWind عبر colorScheme.set().
 */
import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { colorScheme } from 'nativewind';
import type { ThemeMode } from '../types/domain';
import { darkColors, lightColors, type Theme, type ThemeColors } from './tokens';
import { useSettingsStore } from '../../features/settings/settingsStore';

const ThemeContext = createContext<Theme>({
  mode: 'system',
  isDark: false,
  colors: lightColors,
});

export function useTheme(): Theme {
  return useContext(ThemeContext);
}

export function useThemeColors(): ThemeColors {
  return useContext(ThemeContext).colors;
}

/** حساب الوضع الفعلي (مع مراعاة وضع النظام) */
export function resolveTheme(mode: ThemeMode, system: 'light' | 'dark'): 'light' | 'dark' {
  if (mode === 'system') return system;
  return mode;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const themeMode = useSettingsStore(s => s.themeMode);
  const systemScheme = useColorScheme();
  const system = systemScheme === 'dark' ? 'dark' : 'light';

  const resolved = resolveTheme(themeMode, system);
  const isDark = resolved === 'dark';

  useEffect(() => {
    colorScheme.set(isDark ? 'dark' : 'light');
  }, [isDark]);

  const value = useMemo<Theme>(
    () => ({
      mode: themeMode,
      isDark,
      colors: isDark ? darkColors : lightColors,
    }),
    [themeMode, isDark],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
