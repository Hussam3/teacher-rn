/**
 * شاشة تسجيل الدخول — جوجل أو فيسبوك أو وضع الضيف.
 *
 * التصميم: علامة تجارية دائرية بلون العلامة + أيقونة المدرسة،
 * والأزرار داخل بطاقة سطحية ناعمة.
 */
import React, { useState } from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';
import { useTheme } from '../../shared/theme/ThemeProvider';
import { FONT_FAMILY, radius } from '../../shared/theme/tokens';
import { strings } from '../../shared/i18n/ar';
import { Button } from '../../shared/ui/Button';
import { PressableScale } from '../../shared/ui/PressableScale';
import { Icon } from '../../shared/ui/Icon';
import { useAuthStore } from './authStore';
import { showError, showSuccess } from '../../shared/ui/toast';
import { AppScreen } from '../../shared/ui/AppScreen';
import { getSyncState } from '../../data/syncBridge';
import appIcon from '../../assets/app_icon.png';

export function LoginScreen() {
  const { colors, isDark } = useTheme();
  const loginAsGuest = useAuthStore(s => s.loginAsGuest);
  const loginWithGoogle = useAuthStore(s => s.loginWithGoogle);
  const loginWithFacebook = useAuthStore(s => s.loginWithFacebook);
  const [loading, setLoading] = useState<
    'google' | 'facebook' | 'guest' | null
  >(null);

  const handleProvider = async (provider: 'google' | 'facebook') => {
    setLoading(provider);
    try {
      const user =
        provider === 'google'
          ? await loginWithGoogle()
          : await loginWithFacebook();
      // في الويب يبدأ التحويل إلى صفحة OAuth ثم تُستعاد الجلسة بعد العودة.
      if (!user) return;
      const syncState = getSyncState();
      if (syncState.available && syncState.active && !syncState.error) {
        showSuccess(strings.sync.synced);
      }
      showSuccess(
        strings.auth.welcome.replace('{name}', user.displayName ?? ''),
      );
    } catch (error) {
      showError(
        error instanceof Error && error.message
          ? error.message
          : strings.auth.loginFailed,
      );
    } finally {
      setLoading(null);
    }
  };

  const handleGuest = async () => {
    setLoading('guest');
    try {
      await loginAsGuest();
      showSuccess(strings.auth.welcomeGuest);
    } finally {
      setLoading(null);
    }
  };

  return (
    <AppScreen style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <View style={[styles.brand, { backgroundColor: colors.surface }]}>
          <Image
            source={appIcon}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {strings.app.shortName}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {strings.app.tagline}
        </Text>

        <View style={[styles.panel, { backgroundColor: colors.surface }]}>
          <PressableScale
            onPress={() => handleProvider('google')}
            disabled={loading !== null}
            style={[
              styles.googleBtn,
              {
                backgroundColor: isDark ? colors.surfaceElevated : '#F8F9FA',
                opacity: loading ? 0.6 : 1,
              },
            ]}
          >
            <Icon name="google" family="community" size={22} color="#EA4335" />
            <Text style={[styles.googleLabel, { color: colors.textPrimary }]}>
              {strings.auth.googleSignIn}
            </Text>
          </PressableScale>

          <PressableScale
            onPress={() => handleProvider('facebook')}
            disabled={loading !== null}
            style={[styles.facebookBtn, { opacity: loading ? 0.6 : 1 }]}
          >
            <Icon name="facebook" family="community" size={23} color="#fff" />
            <Text style={styles.facebookLabel}>
              {strings.auth.facebookSignIn}
            </Text>
          </PressableScale>

          <Button
            label={strings.auth.guestSignIn}
            variant="outline"
            icon={{ name: 'account-heart', family: 'community' }}
            onPress={handleGuest}
            loading={loading === 'guest'}
            style={styles.guestBtn}
          />
        </View>

        <Text style={[styles.footer, { color: colors.textSecondary }]}>
          {strings.auth.footer}
        </Text>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#F1F1F1',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  brand: {
    width: 110,
    height: 110,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  logoImage: {
    width: 100,
    height: 100,
  },
  title: {
    fontFamily: FONT_FAMILY,
    fontSize: 30,
    fontWeight: '700',
  },
  subtitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  panel: {
    width: '100%',
    gap: 12,
    marginTop: 40,
    padding: 16,
    borderRadius: radius.xl,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  googleIcon: {
    width: 22,
    height: 22,
  },
  googleLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '700',
  },
  facebookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 50,
    borderRadius: radius.md,
    backgroundColor: '#1877F2',
  },
  facebookLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  guestBtn: {
    height: 50,
  },
  footer: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 28,
  },
});
