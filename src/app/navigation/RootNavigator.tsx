/**
 * الملاح الجذري — تبديل بين شاشة الدخول والتبويبات الرئيسية حسب حالة المصادقة،
 * مع الشاشات المدفوعة (الإعدادات، محررات الخطة اليومية/السنوية).
 */
import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { useAuthStore } from '../../features/auth/authStore';
import { LoginScreen } from '../../features/auth/LoginScreen';
import { LicenseScreen } from '../../features/license/LicenseScreen';
import {
  initLicense,
  useLicenseStore,
} from '../../features/license/licenseStore';
import { SettingsScreen } from '../../features/settings/SettingsScreen';
import { DailyPlanEditor } from '../../features/daily_plan/DailyPlanEditor';
import { AnnualPlanEditor } from '../../features/annual_plan/AnnualPlanEditor';
import { MainTabs } from './MainTabs';
import { initAuth } from '../../features/auth/authStore';
import {
  initSupabaseAuth,
  onWebAuthSignedIn,
} from '../../services/authService';
import { useScheduleStore } from '../../features/schedule/scheduleStore';
import { onRemoteChanged } from '../../data/syncBridge';
import {
  ActivityIndicator,
  AppState,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { useTheme } from '../../shared/theme/ThemeProvider';
import {
  getLicenseRefreshDeadline,
  isLicenseAccessAllowed,
} from '../../services/licenseService';

const Stack = createNativeStackNavigator<RootStackParamList>();
const LICENSE_REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000;

export function RootNavigator() {
  const { user, initializing } = useAuthStore();
  const licenseInitializing = useLicenseStore(s => s.initializing);
  const licenseAccess = useLicenseStore(s => s.access);
  const licenseAllowed = isLicenseAccessAllowed(licenseAccess);
  const licenseExpiresAt = licenseAccess.expiresAt;
  const licenseRefreshDeadline = getLicenseRefreshDeadline(licenseExpiresAt);
  const { colors } = useTheme();

  useEffect(() => {
    // عند وصول بيانات من السحابة (جهاز آخر بنفس الحساب) → إعادة تحميل المخازن
    const unsubRemote = onRemoteChanged(() => {
      useScheduleStore.setState({ loaded: false });
      useScheduleStore.getState().load();
    });
    const appStateSubscription = AppState.addEventListener('change', state => {
      if (state === 'active') initLicense().catch(() => {});
    });
    let active = true;
    let unsubDeepLink: (() => void) | null = null;
    let unsubWebAuth: (() => void) | null = null;

    const bootstrap = async () => {
      // على الويب: الاستماع لحدث SIGNED_IN من Supabase SDK
      // (عندما يُعالج SDK رابط callback تلقائياً بعد العودة من Google)
      if (Platform.OS === 'web') {
        unsubWebAuth = onWebAuthSignedIn();
      }
      // أكمل callback الخاص بـ OAuth أولاً، ثم استعد الجلسة الناتجة عنه.
      unsubDeepLink = await initSupabaseAuth();
      if (!active) {
        unsubDeepLink();
        return;
      }
      await Promise.all([initAuth(), initLicense()]);
      if (active) useScheduleStore.getState().load();
    };

    bootstrap().catch(() => {
      initAuth().catch(() => {});
      initLicense().catch(() => {});
    });

    return () => {
      active = false;
      unsubDeepLink?.();
      unsubWebAuth?.();
      unsubRemote();
      appStateSubscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!licenseAllowed) return;

    const refresh = () => {
      initLicense().catch(() => {});
    };
    const periodicRefresh = setInterval(refresh, LICENSE_REFRESH_INTERVAL_MS);
    const expiryRefresh =
      licenseRefreshDeadline !== null
        ? setTimeout(
            refresh,
            Math.max(
              0,
              Math.min(
                licenseRefreshDeadline - Date.now() + 250,
                2_147_000_000,
              ),
            ),
          )
        : null;

    return () => {
      clearInterval(periodicRefresh);
      if (expiryRefresh !== null) clearTimeout(expiryRefresh);
    };
  }, [licenseAllowed, licenseRefreshDeadline]);

  if (initializing || licenseInitializing) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!licenseAllowed ? (
        <Stack.Screen name="License" component={LicenseScreen} />
      ) : user ? (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              headerShown: true,
              title: 'الإعدادات',
              headerBackTitle: 'رجوع',
            }}
          />
          <Stack.Screen
            name="DailyPlanEditor"
            component={DailyPlanEditor}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AnnualPlanEditor"
            component={AnnualPlanEditor}
            options={{ headerShown: false }}
          />
        </>
      ) : (
        <Stack.Screen name="Auth" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
