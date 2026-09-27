/**
 * جذر التطبيق — مزوّدات الخدمات والتنقل.
 */
import React, { useEffect } from 'react';
import { StatusBar, I18nManager, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, useTheme } from '../shared/theme/ThemeProvider';
import { queryClient } from '../shared/lib/queryClient';
import { ToastHost } from '../shared/ui/toast';
import { RootNavigator } from './navigation/RootNavigator';
import { UpdateBanner } from './UpdateBanner';
import {
  confirmUpdateInstalled,
  isOtaEnabled,
} from '../services/otaUpdateService';

// فرض اتجاه RTL على مستوى التطبيق
if (!I18nManager.isRTL) {
  // يُضبط RTL عبر android:supportsRtl في AndroidManifest؛ هذا سطر أمان فقط
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}

function AppShell() {
  const { isDark, colors } = useTheme();

  const navTheme = isDark
    ? { ...DarkTheme, colors: { ...DarkTheme.colors, background: colors.background, card: colors.surface, primary: colors.primary } }
    : { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.background, card: colors.surface, primary: colors.primary } };

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={styles.root}>
        <RootNavigator />
        <UpdateBanner />
      </View>
      <ToastHost />
    </NavigationContainer>
  );
}

export function App() {
  useEffect(() => {
    if (!isOtaEnabled()) return;
    // فحص التحديثات الفورية ومتابعة تطبيقها يتولاها الزر العائم (UpdateBanner).
    confirmUpdateInstalled();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AppShell />
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
