/**
 * بوابة التفعيل الأولى. لا تتضمن شراءً أو دفعاً؛ فقط رمز قائم أو تجربة مجانية.
 */
import React, { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTheme } from '../../shared/theme/ThemeProvider';
import { FONT_FAMILY, radius } from '../../shared/theme/tokens';
import { strings } from '../../shared/i18n/ar';
import { AppScreen } from '../../shared/ui/AppScreen';
import { Button } from '../../shared/ui/Button';
import { TextField } from '../../shared/ui/TextField';
import {
  isLicenseAccessAllowed,
  messageForLicenseAccess,
} from '../../services/licenseService';
import appIcon from '../../assets/app_icon.png';
import { useLicenseStore } from './licenseStore';

export function LicenseScreen() {
  const { colors } = useTheme();
  const access = useLicenseStore(s => s.access);
  const notice = useLicenseStore(s => s.notice);
  const activate = useLicenseStore(s => s.activate);
  const beginTrial = useLicenseStore(s => s.beginTrial);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<'activate' | 'trial' | null>(null);

  const handleActivate = async () => {
    setMessage(null);
    setLoading('activate');
    try {
      const result = await activate(code);
      if (!isLicenseAccessAllowed(result)) {
        setMessage(messageForLicenseAccess(result));
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : strings.license.activationUnavailable,
      );
    } finally {
      setLoading(null);
    }
  };

  const handleTrial = async () => {
    setMessage(null);
    setLoading('trial');
    try {
      const result = await beginTrial();
      if (!isLicenseAccessAllowed(result)) {
        setMessage(messageForLicenseAccess(result));
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : strings.license.activationUnavailable,
      );
    } finally {
      setLoading(null);
    }
  };

  const statusMessage = message || messageForLicenseAccess(access) || notice;
  const canStartTrial = access.kind === 'none';

  return (
    <AppScreen edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            <View style={[styles.brand, { backgroundColor: colors.surface }]}>
              <Image
                source={appIcon}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={[styles.appName, { color: colors.textPrimary }]}>
              {strings.app.shortName}
            </Text>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              {strings.license.welcome}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {strings.license.subtitle}
            </Text>

            <View
              style={[
                styles.panel,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <TextField
                label={strings.license.codeLabel}
                placeholder={strings.license.codePlaceholder}
                value={code}
                onChangeText={text => {
                  setCode(text);
                  if (message) setMessage(null);
                }}
                onSubmitEditing={handleActivate}
                autoCapitalize="characters"
                autoCorrect={false}
                returnKeyType="done"
                editable={loading === null}
                style={styles.codeInput}
              />
              <Button
                label={strings.license.activate}
                icon={{ name: 'check-circle-outline' }}
                onPress={handleActivate}
                loading={loading === 'activate'}
                disabled={loading !== null}
                style={styles.actionButton}
              />

              {statusMessage ? (
                <Text style={[styles.message, { color: colors.error }]}>
                  {statusMessage}
                </Text>
              ) : null}

              {canStartTrial ? (
                <>
                  <View style={styles.dividerRow}>
                    <View
                      style={[
                        styles.divider,
                        { backgroundColor: colors.divider },
                      ]}
                    />
                    <Text style={[styles.or, { color: colors.textSecondary }]}>
                      {strings.license.or}
                    </Text>
                    <View
                      style={[
                        styles.divider,
                        { backgroundColor: colors.divider },
                      ]}
                    />
                  </View>
                  <Button
                    label={strings.license.freeTrial}
                    variant="outline"
                    icon={{ name: 'timer-outline' }}
                    onPress={handleTrial}
                    loading={loading === 'trial'}
                    disabled={loading !== null}
                  />
                </>
              ) : null}
            </View>

            <Text style={[styles.footer, { color: colors.textSecondary }]}>
              {strings.license.footer}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 24,
  },
  container: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  brand: {
    width: 96,
    height: 96,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  logo: {
    width: 88,
    height: 88,
  },
  appName: {
    fontFamily: FONT_FAMILY,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 14,
  },
  title: {
    fontFamily: FONT_FAMILY,
    fontSize: 24,
    fontWeight: '800',
    marginTop: 24,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    lineHeight: 24,
    marginTop: 8,
    textAlign: 'center',
  },
  panel: {
    width: '100%',
    borderWidth: 1,
    borderRadius: radius.xl,
    marginTop: 28,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  codeInput: {
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  actionButton: {
    marginTop: 12,
  },
  message: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    lineHeight: 20,
    marginTop: 12,
    textAlign: 'center',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  or: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
  },
  footer: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    lineHeight: 20,
    marginTop: 22,
    textAlign: 'center',
  },
});
