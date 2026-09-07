/**
 * شاشة الإعدادات — المظهر والمفاتيح والحساب والبيانات وحول.
 */
import React, { useEffect, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../app/navigation/types';
import { useTheme } from '../../shared/theme/ThemeProvider';
import { FONT_FAMILY } from '../../shared/theme/tokens';
import { strings } from '../../shared/i18n/ar';
import { AppScreen } from '../../shared/ui/AppScreen';
import { Card } from '../../shared/ui/Card';
import { SectionHeader } from '../../shared/ui/SectionHeader';
import { Button } from '../../shared/ui/Button';
import { Dialog } from '../../shared/ui/Dialog';
import { PressableScale } from '../../shared/ui/PressableScale';
import { Icon } from '../../shared/ui/Icon';
import { TextField } from '../../shared/ui/TextField';
import { showError, showSuccess } from '../../shared/ui/toast';
import type { ThemeMode } from '../../shared/types/domain';
import { useSettingsStore } from './settingsStore';
import {
  aiQuotaService,
  type AIQuotaStatus,
} from '../../services/aiQuotaService';
import { aiUsageManager } from '../../services/aiUsageManager';
import type { FriendlyQuotaStatus } from '../../shared/types/aiUsage';
import { useLicenseStore } from '../license/licenseStore';
import { SubjectSelectionDialog } from '../license/SubjectSelectionDialog';
import { useAuthStore } from '../auth/authStore';
import { useScheduleStore } from '../schedule/scheduleStore';
import {
  buildBackup,
  isValidBackup,
  resetAll,
  restoreBackup,
} from '../../data/backup/backupService';
import { exportTextFile, pickJson } from '../../services/fileService';
import {
  onSyncStateChanged,
  getSyncState,
  type SyncState,
} from '../../data/syncBridge';
import { syncNow } from '../../services/cloudSyncService';
import {
  checkForAppUpdate,
  getCurrentAppVersion,
  applyAppUpdate,
  isOtaEnabled,
  BASE_APP_VERSION,
  type AppUpdateInfo,
} from '../../services/otaUpdateService';
import { LEGAL_URL } from '../../services/legal';
import {
  GeminiApiKeyHelpDialog,
  GEMINI_API_STUDIO_URL,
} from './GeminiApiKeyHelpDialog';
import { TrialStatusBanner } from '../license/TrialStatusBanner';

export function SettingsScreen() {
  const { colors } = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const { themeMode, setThemeMode } = useSettingsStore();
  const { user, logout, deleteAccount } = useAuthStore();
  const otaEnabled = isOtaEnabled();

  const [confirm, setConfirm] = useState<null | {
    title: string;
    message: string;
    label: string;
    destructive: boolean;
    action: () => void;
  }>(null);
  const [sync, setSync] = useState<SyncState>(() => getSyncState());
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [applyingUpdate, setApplyingUpdate] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [otaVersion, setOtaVersion] = useState<string>(BASE_APP_VERSION);
  const [updateInfo, setUpdateInfo] = useState<AppUpdateInfo | null>(null);

  const access = useLicenseStore(s => s.access);
  const [aiQuota, setAiQuota] = useState<AIQuotaStatus | null>(null);
  const [friendlyQuota, setFriendlyQuota] =
    useState<FriendlyQuotaStatus | null>(null);
  const [showSubjectDialog, setShowSubjectDialog] = useState(false);
  const [personalKeyInput, setPersonalKeyInput] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [showGeminiHelp, setShowGeminiHelp] = useState(false);

  useEffect(() => {
    return aiQuotaService.subscribe(setAiQuota);
  }, []);

  useEffect(() => {
    return aiUsageManager.subscribe(setFriendlyQuota);
  }, [access]);

  useEffect(() => {
    aiQuotaService.getPersonalApiKey().then(k => {
      if (k) setPersonalKeyInput(k);
    });
  }, []);

  const handleSavePersonalKey = async () => {
    await aiQuotaService.setPersonalApiKey(personalKeyInput.trim() || null);
    showSuccess(
      personalKeyInput.trim()
        ? strings.settings.aiPersonalKeySaved
        : strings.settings.aiPersonalKeyRemoved,
    );
    setShowKeyInput(false);
  };

  const handleRemovePersonalKey = async () => {
    setPersonalKeyInput('');
    await aiQuotaService.setPersonalApiKey(null);
    showSuccess(strings.settings.aiPersonalKeyRemoved);
    setShowKeyInput(false);
  };

  useEffect(() => onSyncStateChanged(setSync), []);

  useEffect(() => {
    if (!otaEnabled) return;
    let active = true;
    getCurrentAppVersion().then(v => {
      if (active) setOtaVersion(v.versionName);
    });
    checkForAppUpdate().then(result => {
      if (active && result.hasUpdate && result.update) {
        setUpdateInfo(result.update);
      }
    });
    return () => {
      active = false;
    };
  }, [otaEnabled]);

  const handleCheckUpdates = async () => {
    if (!otaEnabled) return;
    setCheckingUpdate(true);
    try {
      const res = await checkForAppUpdate();
      if (res.error) {
        showError(res.error);
        return;
      }
      if (res.hasUpdate && res.update) {
        setUpdateInfo(res.update);
        showSuccess(`يوجد تحديث فوري متاح: الإصدار ${res.update.versionName}`);
      } else {
        showSuccess('تطبيقك يعمل بأحدث إصدار فوري');
      }
    } catch {
      showError('تعذر التحقق من التحديثات الفورية حالياً');
    } finally {
      setCheckingUpdate(false);
    }
  };

  const handleApplyUpdate = async () => {
    if (!updateInfo) return;
    setApplyingUpdate(true);
    setUpdateProgress(0);
    try {
      const result = await applyAppUpdate(updateInfo, p =>
        setUpdateProgress(p),
      );
      if (result.ok) {
        if (result.needsRestart) {
          setOtaVersion(updateInfo.versionName);
          setUpdateInfo(null);
          showSuccess(
            result.restartScheduled
              ? 'تم تثبيت التحديث. إن لم يُعد التطبيق تشغيل نفسه خلال ثوانٍ، أغلقه وافتحه يدويًا.'
              : 'تم تثبيت التحديث. أغلق التطبيق وافتحه يدويًا لتطبيقه.',
          );
        } else {
          setOtaVersion(updateInfo.versionName);
          setUpdateInfo(null);
          showSuccess(`تم تطبيق التحديث ${updateInfo.versionName} بنجاح!`);
        }
      } else {
        showError(`تعذر تطبيق التحديث: ${result.error || 'خطأ غير متوقع'}`);
      }
    } catch {
      showError('تعذر تطبيق التحديث');
    } finally {
      setApplyingUpdate(false);
    }
  };

  const themeOptions: {
    value: ThemeMode;
    label: string;
    subtitle: string;
    icon: string;
  }[] = [
    {
      value: 'system',
      label: strings.settings.system,
      subtitle: strings.settings.systemSubtitle,
      icon: 'settings-brightness',
    },
    {
      value: 'light',
      label: strings.settings.light,
      subtitle: strings.settings.lightSubtitle,
      icon: 'light-mode',
    },
    {
      value: 'dark',
      label: strings.settings.dark,
      subtitle: strings.settings.darkSubtitle,
      icon: 'dark-mode',
    },
  ];

  const handleSyncNow = async () => {
    const ok = await syncNow();
    if (ok) {
      showSuccess(strings.sync.synced);
    } else {
      showError(strings.sync.syncError.replace('{error}', sync.error ?? ''));
    }
  };

  const handleExport = async () => {
    try {
      await exportTextFile(buildBackup(), `teacher_backup_${Date.now()}.json`);
      showSuccess(strings.settings.exportSuccess);
    } catch {
      showError(strings.settings.exportError.replace('{error}', ''));
    }
  };

  const handleImport = async () => {
    const content = await pickJson();
    if (!content) return;
    if (!isValidBackup(content)) {
      showError(strings.settings.importInvalid);
      return;
    }
    setConfirm({
      title: strings.settings.import,
      message: strings.settings.importConfirm,
      label: strings.common.confirm,
      destructive: false,
      action: () => {
        restoreBackup(content);
        useScheduleStore.getState().load();
        showSuccess(strings.common.confirm);
      },
    });
  };

  const handleReset = () => {
    setConfirm({
      title: strings.settings.resetConfirmTitle,
      message: strings.settings.resetConfirm,
      label: strings.settings.resetConfirmLabel,
      destructive: true,
      action: () => {
        setConfirm({
          title: strings.settings.resetFinalTitle,
          message: strings.settings.resetFinal,
          label: strings.settings.resetFinalLabel,
          destructive: true,
          action: () => {
            resetAll();
            logout().then(() =>
              navigation.reset({ index: 0, routes: [{ name: 'Auth' }] }),
            );
          },
        });
      },
    });
  };

  const handleOpenLegal = async () => {
    try {
      await Linking.openURL(LEGAL_URL);
    } catch {
      showError(strings.settings.privacyPolicyError);
    }
  };

  const handleDeleteAccount = () => {
    setConfirm({
      title: strings.settings.deleteAccountTitle,
      message: strings.settings.deleteAccountConfirm,
      label: strings.settings.deleteAccountLabel,
      destructive: true,
      action: () => {
        deleteAccount()
          .then(() => {
            resetAll();
            showSuccess(strings.settings.deleteAccountSuccess);
            navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
          })
          .catch(error => {
            const message = error instanceof Error ? error.message : '';
            showError(
              strings.settings.deleteAccountError.replace('{error}', message),
            );
          });
      },
    });
  };

  return (
    <AppScreen edges={['top']}>
      <View
        style={[
          styles.header,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          {strings.common.settings}
        </Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <TrialStatusBanner />
        {/* المظهر */}
        <SectionHeader
          title={strings.settings.appearance}
          icon={{ name: 'palette' }}
        />
        <Card>
          {themeOptions.map(opt => (
            <PressableScale
              key={opt.value}
              onPress={() => setThemeMode(opt.value)}
              animated={false}
              style={styles.themeRow}
            >
              <Icon
                name={opt.icon}
                size={22}
                color={
                  themeMode === opt.value
                    ? colors.primary
                    : colors.textSecondary
                }
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.themeLabel, { color: colors.textPrimary }]}
                >
                  {opt.label}
                </Text>
                <Text
                  style={[styles.themeSub, { color: colors.textSecondary }]}
                >
                  {opt.subtitle}
                </Text>
              </View>
              <Icon
                name={
                  themeMode === opt.value
                    ? 'check-circle'
                    : 'radio-button-unchecked'
                }
                size={22}
                color={
                  themeMode === opt.value
                    ? colors.primary
                    : colors.textSecondary
                }
              />
            </PressableScale>
          ))}
        </Card>

        {/* خدمة الذكاء الاصطناعي المشتركة وتوزيع الحصص */}
        <SectionHeader
          title={strings.settings.aiService}
          icon={{ name: 'auto-awesome' }}
        />
        <Card>
          <View style={styles.aiHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.aiTitle, { color: colors.textPrimary }]}>
                {strings.settings.aiQuotaTitle}
              </Text>
              <Text
                style={[
                  styles.note,
                  { color: colors.textSecondary, marginTop: 2 },
                ]}
              >
                {friendlyQuota?.statusDescription || strings.settings.aiServiceNote}
              </Text>
            </View>
            <View
              style={[
                styles.quotaBadge,
                {
                  backgroundColor: friendlyQuota?.isLimitReached
                    ? '#EF444418'
                    : friendlyQuota?.isNearLimit
                    ? '#F59E0B18'
                    : '#10B98118',
                  borderColor: friendlyQuota?.isLimitReached
                    ? '#EF444440'
                    : friendlyQuota?.isNearLimit
                    ? '#F59E0B40'
                    : '#10B98140',
                },
              ]}
            >
              <Text
                style={[
                  styles.quotaBadgeText,
                  {
                    color: friendlyQuota?.isLimitReached
                      ? '#EF4444'
                      : friendlyQuota?.isNearLimit
                      ? '#F59E0B'
                      : '#10B981',
                  },
                ]}
              >
                {friendlyQuota?.statusTitle || 'الخدمة نشطة'}
              </Text>
            </View>
          </View>

          {/* قسم المواد المعتمدة في الترخيص */}
          {access.kind === 'licensed' && !friendlyQuota?.hasPersonalKey && (
            <View
              style={[
                styles.subjectCardSection,
                {
                  borderColor: colors.border,
                  backgroundColor: `${colors.primary}08`,
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Icon name="school" size={16} color={colors.primary} />
                  <Text
                    style={[
                      styles.subjectSectionTitle,
                      { color: colors.textPrimary },
                    ]}
                  >
                    المواد المشمولة بالترخيص
                  </Text>
                </View>
                <Text
                  style={[
                    styles.subjectSectionSub,
                    { color: colors.textSecondary },
                  ]}
                >
                  {access.selectedSubjects && access.selectedSubjects.length > 0
                    ? `المواد المعتمدة: ${access.selectedSubjects.join('، ')} (${access.selectedSubjects.length}/${access.maxSubjects || 1})`
                    : `لم يتم تحديد المواد بعد (المسموح: ${access.maxSubjects || 1})`}
                </Text>
              </View>
              <Button
                label="إدارة المواد"
                variant="outline"
                icon={{ name: 'tune' }}
                onPress={() => setShowSubjectDialog(true)}
              />
            </View>
          )}

          {/* خيار إضافة مفتاح خاص اختياري */}
          <View
            style={{
              marginTop: 12,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              paddingTop: 10,
            }}
          >
            <PressableScale
              onPress={() => setShowKeyInput(!showKeyInput)}
              style={styles.keyToggleRow}
            >
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
              >
                <Icon name="key" size={18} color={colors.primary} />
                <Text
                  style={[styles.keyToggleText, { color: colors.textPrimary }]}
                >
                  {strings.settings.aiPersonalKeyTitle}
                </Text>
              </View>
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
              >
                {!showKeyInput && (
                  <PressableScale
                    onPress={e => {
                      e.stopPropagation();
                      setShowGeminiHelp(true);
                    }}
                    style={[
                      styles.quickHelpBadge,
                      {
                        backgroundColor: `${colors.primary}18`,
                        borderColor: `${colors.primary}40`,
                      },
                    ]}
                  >
                    <Icon
                      name="help-outline"
                      size={14}
                      color={colors.primary}
                    />
                    <Text
                      style={[
                        styles.quickHelpBadgeText,
                        { color: colors.primary },
                      ]}
                    >
                      دليل المفتاح 🔗
                    </Text>
                  </PressableScale>
                )}
                <Icon
                  name={showKeyInput ? 'expand-less' : 'expand-more'}
                  size={20}
                  color={colors.textSecondary}
                />
              </View>
            </PressableScale>

            {showKeyInput && (
              <View style={{ marginTop: 8 }}>
                <Text
                  style={[
                    styles.note,
                    { color: colors.textSecondary, marginBottom: 8 },
                  ]}
                >
                  {strings.settings.aiPersonalKeySubtitle}
                </Text>

                {/* بطاقة روابط الدليل والوصول المباشر لـ Google AI Studio */}
                <View
                  style={[
                    styles.guideBox,
                    {
                      backgroundColor: `${colors.primary}10`,
                      borderColor: `${colors.primary}30`,
                    },
                  ]}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Icon name="lightbulb" size={16} color={colors.primary} />
                    <Text
                      style={[styles.guideBoxTitle, { color: colors.primary }]}
                    >
                      {strings.settings.aiPersonalKeyFreeNote}
                    </Text>
                  </View>
                  <View style={styles.guideButtonsRow}>
                    <PressableScale
                      animated={false}
                      style={[
                        styles.guideDirectBtn,
                        { backgroundColor: colors.primary },
                      ]}
                      onPress={async () => {
                        try {
                          await Linking.openURL(GEMINI_API_STUDIO_URL);
                        } catch {}
                      }}
                    >
                      <Icon
                        family="community"
                        name="google"
                        size={15}
                        color="#ffffff"
                      />
                      <Text style={styles.guideDirectBtnText}>
                        {strings.settings.aiPersonalKeyDirectLink}
                      </Text>
                      <Icon name="open-in-new" size={14} color="#ffffff" />
                    </PressableScale>
                    <PressableScale
                      animated={false}
                      style={[
                        styles.guideTutorialBtn,
                        {
                          borderColor: colors.primary,
                          backgroundColor: `${colors.primary}15`,
                        },
                      ]}
                      onPress={() => setShowGeminiHelp(true)}
                    >
                      <Icon name="menu-book" size={15} color={colors.primary} />
                      <Text
                        style={[
                          styles.guideTutorialBtnText,
                          { color: colors.primary },
                        ]}
                      >
                        {strings.settings.aiPersonalKeyHelpBtn}
                      </Text>
                    </PressableScale>
                  </View>
                </View>

                <TextField
                  value={personalKeyInput}
                  onChangeText={setPersonalKeyInput}
                  placeholder={strings.settings.aiPersonalKeyPlaceholder}
                  autoCapitalize="none"
                  autoCorrect={false}
                  secureTextEntry
                />
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                  <Button
                    label={strings.settings.aiPersonalKeySave}
                    variant="primary"
                    icon={{ name: 'save' }}
                    onPress={handleSavePersonalKey}
                  />
                  {aiQuota?.hasPersonalKey && (
                    <Button
                      label={strings.settings.aiPersonalKeyRemove}
                      variant="outline"
                      icon={{ name: 'delete' }}
                      onPress={handleRemovePersonalKey}
                    />
                  )}
                </View>
              </View>
            )}
          </View>
        </Card>

        {/* الحساب */}
        <SectionHeader
          title={strings.settings.account}
          icon={{ name: 'person' }}
        />
        <Card>
          <Text style={[styles.accountName, { color: colors.textPrimary }]}>
            {user?.displayName ?? strings.auth.anonymousUser}
          </Text>
          <Text style={[styles.accountEmail, { color: colors.textSecondary }]}>
            {user?.email ?? ''}
          </Text>
          <Button
            label={strings.auth.signOut}
            variant="danger"
            icon={{ name: 'logout' }}
            onPress={() =>
              setConfirm({
                title: strings.auth.signOut,
                message: strings.auth.signOutConfirm,
                label: strings.auth.signOut,
                destructive: true,
                action: () =>
                  logout().then(() =>
                    navigation.reset({ index: 0, routes: [{ name: 'Auth' }] }),
                  ),
              })
            }
            style={{ marginTop: 12 }}
          />
          <Button
            label={strings.settings.privacyPolicy}
            variant="outline"
            icon={{ name: 'policy' }}
            onPress={handleOpenLegal}
            style={{ marginTop: 8 }}
          />
          {user && !user.isGuest ? (
            <Button
              label={strings.settings.deleteAccount}
              variant="danger"
              icon={{ name: 'delete-forever' }}
              onPress={handleDeleteAccount}
              style={{ marginTop: 8 }}
            />
          ) : null}
        </Card>

        {/* المزامنة السحابية */}
        {!user?.isGuest && (
          <>
            <SectionHeader
              title={strings.sync.title}
              icon={{ name: 'cloud-sync' }}
            />
            <Card>
              <View style={styles.syncRow}>
                <Icon
                  name={
                    sync.available && sync.active
                      ? 'cloud-check'
                      : sync.error
                      ? 'cloud-alert'
                      : 'cloud-off-outline'
                  }
                  size={22}
                  color={
                    sync.available && sync.active
                      ? colors.primary
                      : sync.error
                      ? '#E53935'
                      : colors.textSecondary
                  }
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.syncStatus, { color: colors.textPrimary }]}
                  >
                    {sync.syncing
                      ? strings.sync.syncing
                      : sync.available && sync.active
                      ? strings.sync.active
                      : sync.error
                      ? strings.sync.syncError.replace('{error}', sync.error)
                      : strings.sync.available}
                  </Text>
                  <Text
                    style={[styles.syncMeta, { color: colors.textSecondary }]}
                  >
                    {sync.lastSyncAt
                      ? strings.sync.lastSync.replace(
                          '{time}',
                          new Date(sync.lastSyncAt).toLocaleString('ar-IQ', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          }),
                        )
                      : strings.sync.never}
                  </Text>
                </View>
              </View>
              <Button
                label={strings.sync.syncNow}
                icon={{ name: 'cloud-upload' }}
                variant="secondary"
                onPress={handleSyncNow}
                loading={sync.syncing}
                disabled={!sync.available || !sync.active || sync.syncing}
                style={{ marginTop: 8 }}
              />
              <Text style={[styles.note, { color: colors.textSecondary }]}>
                {strings.sync.note}
              </Text>
            </Card>
          </>
        )}

        {/* البيانات */}
        <SectionHeader
          title={strings.settings.data}
          icon={{ name: 'storage' }}
        />
        <Card>
          <Button
            label={strings.settings.export}
            icon={{ name: 'upload-file' }}
            variant="secondary"
            onPress={handleExport}
          />
          <Button
            label={strings.settings.import}
            icon={{ name: 'download' }}
            variant="outline"
            onPress={handleImport}
            style={{ marginTop: 8 }}
          />
          <Button
            label={strings.settings.reset}
            icon={{ name: 'delete-forever' }}
            variant="danger"
            onPress={handleReset}
            style={{ marginTop: 8 }}
          />
        </Card>

        {otaEnabled ? (
          <>
            {/* التحديثات الفورية */}
            <SectionHeader
              title="التحديثات الفورية (Live OTA Updates)"
              icon={{ name: 'system-update' }}
            />
            <Card>
              <View style={styles.updateHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.updateTitle, { color: colors.textPrimary }]}
                  >
                    الإصدار الفوري: {otaVersion}
                  </Text>
                  <Text
                    style={[styles.updateSub, { color: colors.textSecondary }]}
                  >
                    تصلك التحديثات الفورية وإصلاحات المحرر مباشرة عبر السحابة
                  </Text>
                </View>
                <Button
                  label="فحص التحديثات"
                  icon={{ name: 'refresh' }}
                  variant="outline"
                  loading={checkingUpdate}
                  onPress={handleCheckUpdates}
                />
              </View>

              {updateInfo ? (
                <View
                  style={[
                    styles.newUpdateBox,
                    {
                      backgroundColor: `${colors.primary}15`,
                      borderColor: colors.primary,
                    },
                  ]}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Icon name="verified" size={18} color={colors.primary} />
                    <Text
                      style={[styles.newUpdateTitle, { color: colors.primary }]}
                    >
                      إصدار جديد متوفر: {updateInfo.versionName}
                    </Text>
                  </View>
                  {updateInfo.releaseNotes ? (
                    <Text
                      style={[
                        styles.newUpdateNotes,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {updateInfo.releaseNotes}
                    </Text>
                  ) : null}
                  <Button
                    label={
                      applyingUpdate
                        ? `جارٍ التنزيل ${Math.round(updateProgress * 100)}٪`
                        : 'تطبيق التحديث الآن'
                    }
                    icon={{ name: 'download-for-offline' }}
                    onPress={handleApplyUpdate}
                    loading={applyingUpdate}
                    disabled={applyingUpdate}
                    style={{ marginTop: 8 }}
                  />
                  {applyingUpdate ? (
                    <View
                      style={{
                        marginTop: 10,
                        height: 6,
                        borderRadius: 3,
                        overflow: 'hidden',
                        backgroundColor: `${colors.primary}22`,
                      }}
                    >
                      <View
                        style={{
                          width: `${Math.max(
                            4,
                            Math.round(updateProgress * 100),
                          )}%`,
                          height: '100%',
                          borderRadius: 3,
                          backgroundColor: colors.primary,
                        }}
                      />
                    </View>
                  ) : null}
                </View>
              ) : null}
            </Card>
          </>
        ) : null}

        {/* حول */}
        <SectionHeader title={strings.settings.about} icon={{ name: 'info' }} />
        <Card>
          <Text style={[styles.aboutName, { color: colors.textPrimary }]}>
            {strings.app.name}
          </Text>
          <Text style={[styles.aboutMeta, { color: colors.textSecondary }]}>
            {otaEnabled
              ? `${strings.app.version} (بناء ${otaVersion})`
              : strings.app.version}
          </Text>
          <Text style={[styles.aboutDesc, { color: colors.textSecondary }]}>
            {strings.app.description}
          </Text>
        </Card>
      </ScrollView>

      <Dialog
        visible={confirm !== null}
        title={confirm?.title ?? ''}
        onClose={() => setConfirm(null)}
        actions={
          <View style={styles.dialogActions}>
            <Button
              label={strings.common.cancel}
              variant="ghost"
              onPress={() => setConfirm(null)}
            />
            <Button
              label={confirm?.label ?? ''}
              variant={confirm?.destructive ? 'danger' : 'primary'}
              onPress={() => {
                const action = confirm?.action;
                setConfirm(null);
                action?.();
              }}
            />
          </View>
        }
      >
        <Text style={[styles.confirmText, { color: colors.textPrimary }]}>
          {confirm?.message}
        </Text>
      </Dialog>

      <GeminiApiKeyHelpDialog
        visible={showGeminiHelp}
        onClose={() => setShowGeminiHelp(false)}
      />

      <SubjectSelectionDialog
        visible={showSubjectDialog}
        onClose={() => setShowSubjectDialog(false)}
        onSuccess={() => {
          aiUsageManager.getFriendlyQuotaStatus().then(setFriendlyQuota);
        }}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 20,
    fontWeight: '700',
  },
  content: { padding: 8, paddingBottom: 40 },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  themeLabel: { fontFamily: FONT_FAMILY, fontSize: 15, fontWeight: '600' },
  themeSub: { fontFamily: FONT_FAMILY, fontSize: 12 },
  note: { fontFamily: FONT_FAMILY, fontSize: 12, lineHeight: 18 },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  syncStatus: { fontFamily: FONT_FAMILY, fontSize: 14, fontWeight: '600' },
  syncMeta: { fontFamily: FONT_FAMILY, fontSize: 12, marginTop: 2 },
  accountName: { fontFamily: FONT_FAMILY, fontSize: 16, fontWeight: '700' },
  accountEmail: { fontFamily: FONT_FAMILY, fontSize: 13, marginTop: 2 },
  aboutName: { fontFamily: FONT_FAMILY, fontSize: 16, fontWeight: '700' },
  aboutMeta: { fontFamily: FONT_FAMILY, fontSize: 12, marginTop: 2 },
  aboutDesc: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },
  dialogActions: { flexDirection: 'row', gap: 8 },
  confirmText: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
  },
  updateHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  updateTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '700',
  },
  updateSub: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 18,
  },
  newUpdateBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
  },
  newUpdateTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
  },
  newUpdateNotes: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    marginTop: 4,
    lineHeight: 18,
  },
  aiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  aiTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '700',
  },
  quotaBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  quotaBadgeText: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
  },
  subjectCardSection: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  subjectSectionTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
  },
  subjectSectionSub: {
    fontFamily: FONT_FAMILY,
    fontSize: 11.5,
    marginTop: 3,
  },
  progressContainer: {
    marginTop: 12,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  progressSubText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
  },
  keyToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  keyToggleText: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '600',
  },
  quickHelpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  quickHelpBadgeText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '700',
  },
  guideBox: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    marginBottom: 10,
  },
  guideBoxTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  guideButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  guideDirectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 6,
  },
  guideDirectBtnText: {
    color: '#ffffff',
    fontFamily: FONT_FAMILY,
    fontSize: 11.5,
    fontWeight: '700',
  },
  guideTutorialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 6,
    borderWidth: 1,
  },
  guideTutorialBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11.5,
    fontWeight: '700',
  },
});
