import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  I18nManager,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import {
  callAdmin,
  dateInputValue,
  formatLicenseDate,
  type LicenseDetail,
  type LicenseStatus,
  type LicenseSummary,
  type ManagedLicense,
  statusLabel,
  SUBSCRIPTION_PLANS,
  type SubscriptionPlan,
} from './adminApi';
import { initAdminAuth, signInAdminWithGoogle } from './adminAuth';
import { copyActivationCode } from './adminClipboard';

if (!I18nManager.isRTL) {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}

const INITIAL_FORM = {
  label: '',
  subscriptionPlan: 'one_month' as SubscriptionPlan,
  expiresOn: '',
  maxDevices: '1',
  notes: '',
};

const INITIAL_EDIT_FORM = {
  label: '',
  status: 'active' as LicenseStatus,
  maxDevices: '1',
  expiresOn: '',
  notes: '',
};

function messageFromError(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function AppLoading() {
  return (
    <SafeAreaView style={styles.centered}>
      <ActivityIndicator color={colors.primary} size="large" />
      <Text style={styles.loadingText}>جارٍ التحقق من جلسة الإدارة...</Text>
    </SafeAreaView>
  );
}

export function LicenseAdminApp() {
  const [session, setSession] = useState<Session | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let removeLinkListener = () => {};
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (active) {
        setSession(nextSession);
        setCheckingSession(false);
      }
    });

    supabase.auth.getSession().then(({ data: sessionData }) => {
      if (active) {
        setSession(sessionData.session);
        setCheckingSession(false);
      }
    });

    initAdminAuth(message => {
      if (active) setAuthError(message);
    }).then(remove => {
      if (active) removeLinkListener = remove;
      else remove();
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
      removeLinkListener();
    };
  }, []);

  if (checkingSession) return <AppLoading />;
  if (!session) {
    return <LoginScreen error={authError} onError={setAuthError} />;
  }
  return <Dashboard session={session} />;
}

function LoginScreen({
  error,
  onError,
}: {
  error: string | null;
  onError: (message: string | null) => void;
}) {
  const [opening, setOpening] = useState(false);

  const login = async () => {
    onError(null);
    setOpening(true);
    try {
      await signInAdminWithGoogle();
    } catch (loginError) {
      onError(messageFromError(loginError, 'تعذر فتح تسجيل الدخول بجوجل.'));
    } finally {
      setOpening(false);
    }
  };

  return (
    <SafeAreaView style={styles.loginScreen} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.loginBrand}>
        <View style={styles.brandMark}>
          <Text style={styles.brandMarkText}>ح</Text>
        </View>
        <Text style={styles.eyebrow}>حقيبة المدرس</Text>
        <Text style={styles.loginTitle}>إدارة الاشتراكات</Text>
        <Text style={styles.loginDescription}>
          سجّل الدخول بحساب Google المخوّل لإدارة رموز التفعيل والأجهزة.
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        disabled={opening}
        onPress={() => {
          login();
        }}
        style={({ pressed }) => [
          styles.primaryButton,
          opening && styles.disabledButton,
          pressed && !opening && styles.pressedButton,
        ]}
      >
        {opening ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryButtonText}>الدخول بواسطة Google</Text>
        )}
      </Pressable>
      <Text style={styles.loginHint}>
        يجب إضافة رابط `teacherbagadmin://auth-callback` في Redirect URLs داخل
        Supabase.
      </Text>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </SafeAreaView>
  );
}

function Dashboard({ session }: { session: Session }) {
  const [summary, setSummary] = useState<LicenseSummary | null>(null);
  const [licenses, setLicenses] = useState<ManagedLicense[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [detail, setDetail] = useState<LicenseDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState(INITIAL_EDIT_FORM);

  const loadData = useCallback(async (searchValue: string) => {
    setLoading(true);
    setError(null);
    try {
      const [summaryResponse, listResponse] = await Promise.all([
        callAdmin<{ summary: LicenseSummary }>('admin-summary'),
        callAdmin<{ licenses: ManagedLicense[] }>('admin-list-licenses', {
          search: searchValue,
        }),
      ]);
      setSummary(summaryResponse.summary);
      setLicenses(listResponse.licenses);
    } catch (loadError) {
      setError(messageFromError(loadError, 'تعذر تحميل بيانات الاشتراكات.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData('');
  }, [loadData]);

  const openDetail = async (licenseId: string) => {
    setDetailLoading(true);
    setError(null);
    try {
      const result = await callAdmin<LicenseDetail>('admin-license-detail', {
        licenseId,
      });
      setDetail(result);
      setEditForm({
        label: result.license.label ?? '',
        status: result.license.status,
        maxDevices: String(result.license.maxDevices),
        expiresOn: dateInputValue(result.license.expiresAt),
        notes: result.license.notes ?? '',
      });
    } catch (detailError) {
      setError(messageFromError(detailError, 'تعذر تحميل تفاصيل الترخيص.'));
    } finally {
      setDetailLoading(false);
    }
  };

  const createLicense = async () => {
    setCreating(true);
    setError(null);
    setNotice(null);
    try {
      const result = await callAdmin<{ activationCode: string }>(
        'admin-create-license',
        {
          label: form.label,
          subscriptionPlan: form.subscriptionPlan,
          expiresOn:
            form.subscriptionPlan === 'custom' ? form.expiresOn || null : null,
          maxDevices: Number(form.maxDevices),
          notes: form.notes,
        },
      );
      setCreatedCode(result.activationCode);
      setForm(INITIAL_FORM);
      setShowCreate(false);
      setNotice(
        'تم إنشاء رمز التفعيل. يمكنك العثور عليه ونسخه لاحقاً من تفاصيل الترخيص.',
      );
      await loadData(search);
    } catch (createError) {
      setError(messageFromError(createError, 'تعذر إنشاء الترخيص.'));
    } finally {
      setCreating(false);
    }
  };

  const saveLicense = async () => {
    if (!detail) return;
    setSaving(true);
    setError(null);
    try {
      await callAdmin('admin-update-license', {
        licenseId: detail.license.id,
        label: editForm.label,
        status: editForm.status,
        maxDevices: Number(editForm.maxDevices),
        expiresOn: editForm.expiresOn || null,
        notes: editForm.notes,
      });
      setNotice('تم حفظ تعديلات الترخيص.');
      await openDetail(detail.license.id);
      await loadData(search);
    } catch (saveError) {
      setError(messageFromError(saveError, 'تعذر حفظ التعديلات.'));
    } finally {
      setSaving(false);
    }
  };

  const revokeActivation = async (activationId: string) => {
    if (!detail) return;
    setSaving(true);
    setError(null);
    try {
      await callAdmin('admin-revoke-activation', {
        licenseId: detail.license.id,
        activationId,
      });
      setNotice('تم إلغاء تفعيل الجهاز.');
      await openDetail(detail.license.id);
      await loadData(search);
    } catch (revokeError) {
      setError(messageFromError(revokeError, 'تعذر إلغاء تفعيل الجهاز.'));
    } finally {
      setSaving(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const shareCode = async () => {
    if (!createdCode) return;
    try {
      await Share.share({
        message: `رمز تفعيل حقيبة المدرس: ${createdCode}`,
      });
    } catch {
      setNotice('تعذرت مشاركة الرمز. يمكنك نسخه من تفاصيل الترخيص.');
    }
  };

  const copyCode = (code: string) => {
    try {
      copyActivationCode(code);
      setNotice('تم نسخ رمز التفعيل.');
    } catch (copyError) {
      setError(messageFromError(copyError, 'تعذر نسخ رمز التفعيل.'));
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.topBar}>
        <View>
          <Text style={styles.eyebrow}>حقيبة المدرس</Text>
          <Text style={styles.topTitle}>إدارة الاشتراكات</Text>
          <Text style={styles.accountText}>
            {session.user.email ?? 'حساب المالك'}
          </Text>
        </View>
        <Pressable
          onPress={() => {
            signOut();
          }}
          style={styles.signOutButton}
        >
          <Text style={styles.signOutText}>خروج</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => {
              loadData(search);
            }}
            tintColor={colors.primary}
          />
        }
      >
        {error ? <Text style={styles.errorBanner}>{error}</Text> : null}
        {notice ? <Text style={styles.noticeBanner}>{notice}</Text> : null}

        <View style={styles.statsGrid}>
          <StatCard label="كل التراخيص" value={summary?.licenses} />
          <StatCard label="النشطة" value={summary?.active} accent="blue" />
          <StatCard
            label="أجهزة مفعلة"
            value={summary?.activeDevices}
            accent="green"
          />
          <StatCard
            label="تجارب نشطة"
            value={summary?.activeTrials}
            accent="orange"
          />
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => setShowCreate(true)}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.pressedButton,
          ]}
        >
          <Text style={styles.primaryButtonText}>إنشاء اشتراك جديد</Text>
        </Pressable>

        {createdCode ? (
          <View style={styles.codeCard}>
            <Text style={styles.codeLabel}>رمز التفعيل الجديد</Text>
            <Text selectable style={styles.activationCode}>
              {createdCode}
            </Text>
            <View style={styles.codeActions}>
              <Pressable
                onPress={() => copyCode(createdCode)}
                style={[styles.secondaryButton, styles.codeAction]}
              >
                <Text style={styles.secondaryButtonText}>نسخ الرمز</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  shareCode();
                }}
                style={[styles.secondaryButton, styles.codeAction]}
              >
                <Text style={styles.secondaryButtonText}>مشاركة</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>التراخيص</Text>
            <Text style={styles.sectionSubtitle}>
              اضغط على الترخيص لتعديل الاشتراك أو أجهزته.
            </Text>
          </View>
        </View>
        <View style={styles.searchRow}>
          <TextInput
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={() => {
              loadData(search);
            }}
            placeholder="ابحث بالاسم أو رمز كامل"
            placeholderTextColor={colors.muted}
            returnKeyType="search"
            style={[styles.input, styles.searchInput]}
            textAlign="right"
          />
          <Pressable
            onPress={() => {
              loadData(search);
            }}
            style={styles.searchButton}
          >
            <Text style={styles.searchButtonText}>بحث</Text>
          </Pressable>
        </View>

        {loading && !licenses.length ? <AppLoading /> : null}
        {!loading && licenses.length === 0 ? (
          <Text style={styles.emptyText}>لا توجد تراخيص مطابقة.</Text>
        ) : null}
        {licenses.map(license => (
          <LicenseRow
            key={license.id}
            license={license}
            onPress={() => {
              openDetail(license.id);
            }}
          />
        ))}
      </ScrollView>

      <CreateLicenseModal
        creating={creating}
        form={form}
        visible={showCreate}
        onChange={setForm}
        onClose={() => setShowCreate(false)}
        onCreate={() => {
          createLicense();
        }}
      />

      <LicenseDetailModal
        detail={detail}
        detailLoading={detailLoading}
        editForm={editForm}
        saving={saving}
        onChange={setEditForm}
        onClose={() => setDetail(null)}
        onRevoke={activationId => {
          Alert.alert(
            'إلغاء تفعيل الجهاز؟',
            'سيفقد هذا الجهاز الوصول عند التحقق التالي.',
            [
              { text: 'تراجع', style: 'cancel' },
              {
                text: 'إلغاء التفعيل',
                style: 'destructive',
                onPress: () => {
                  revokeActivation(activationId);
                },
              },
            ],
          );
        }}
        onSave={() => {
          saveLicense();
        }}
        onCopy={copyCode}
      />
    </SafeAreaView>
  );
}

function StatCard({
  label,
  value,
  accent = 'slate',
}: {
  label: string;
  value?: number;
  accent?: 'slate' | 'blue' | 'green' | 'orange';
}) {
  const accentStyle =
    accent === 'blue'
      ? styles.statBlue
      : accent === 'green'
      ? styles.statGreen
      : accent === 'orange'
      ? styles.statOrange
      : styles.statSlate;
  return (
    <View style={[styles.statCard, accentStyle]}>
      <Text style={styles.statValue}>{value ?? '...'}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function LicenseRow({
  license,
  onPress,
}: {
  license: ManagedLicense;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.licenseCard,
        pressed && styles.pressedCard,
      ]}
    >
      <View style={styles.licenseTitleRow}>
        <View style={styles.licenseTitleCopy}>
          <Text numberOfLines={1} style={styles.licenseName}>
            {license.label || 'ترخيص بلا اسم'}
          </Text>
          <Text style={styles.codeHint}>****-{license.codeHint}</Text>
        </View>
        <StatusBadge status={license.status} />
      </View>
      <View style={styles.licenseMetaRow}>
        <Text style={styles.licenseMeta}>
          الأجهزة: {license.activeDevices} / {license.maxDevices}
        </Text>
        <Text style={styles.licenseMeta}>
          الانتهاء: {formatLicenseDate(license.expiresAt)}
        </Text>
      </View>
    </Pressable>
  );
}

function StatusBadge({ status }: { status: LicenseStatus }) {
  const style =
    status === 'active'
      ? styles.activeBadge
      : status === 'suspended'
      ? styles.suspendedBadge
      : styles.revokedBadge;
  return (
    <View style={[styles.statusBadge, style]}>
      <Text style={styles.statusText}>{statusLabel(status)}</Text>
    </View>
  );
}

function CreateLicenseModal({
  creating,
  form,
  visible,
  onChange,
  onClose,
  onCreate,
}: {
  creating: boolean;
  form: typeof INITIAL_FORM;
  visible: boolean;
  onChange: (form: typeof INITIAL_FORM) => void;
  onClose: () => void;
  onCreate: () => void;
}) {
  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      transparent={false}
      visible={visible}
    >
      <SafeAreaView style={styles.modalScreen} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <ScrollView
            contentContainerStyle={styles.modalContent}
            keyboardShouldPersistTaps="handled"
          >
            <ModalHeader title="اشتراك جديد" onClose={onClose} />
            <Text style={styles.fieldLabel}>اسم أو ملاحظة داخلية</Text>
            <TextInput
              editable={!creating}
              maxLength={120}
              onChangeText={label => onChange({ ...form, label })}
              placeholder="مثال: الأستاذة سارة - سنوي"
              placeholderTextColor={colors.muted}
              style={styles.input}
              textAlign="right"
              value={form.label}
            />

            <Text style={styles.fieldLabel}>مدة الاشتراك</Text>
            <View style={styles.planGrid}>
              {SUBSCRIPTION_PLANS.map(plan => {
                const selected = form.subscriptionPlan === plan.value;
                return (
                  <Pressable
                    disabled={creating}
                    key={plan.value}
                    onPress={() =>
                      onChange({ ...form, subscriptionPlan: plan.value })
                    }
                    style={[
                      styles.planButton,
                      selected && styles.planButtonSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.planText,
                        selected && styles.planTextSelected,
                      ]}
                    >
                      {plan.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {form.subscriptionPlan === 'custom' ? (
              <>
                <Text style={styles.fieldLabel}>ينتهي في (اختياري)</Text>
                <TextInput
                  editable={!creating}
                  keyboardType="numbers-and-punctuation"
                  maxLength={10}
                  onChangeText={expiresOn => onChange({ ...form, expiresOn })}
                  placeholder="YYYY-MM-DD أو اتركه دائماً"
                  placeholderTextColor={colors.muted}
                  style={styles.input}
                  textAlign="right"
                  value={form.expiresOn}
                />
              </>
            ) : (
              <Text style={styles.planNote}>
                يُحسب الانتهاء تلقائياً من وقت الخادم وبنهاية اليوم بتوقيت
                العراق.
              </Text>
            )}

            <Text style={styles.fieldLabel}>عدد الأجهزة (1 - 50)</Text>
            <TextInput
              editable={!creating}
              keyboardType="number-pad"
              maxLength={2}
              onChangeText={maxDevices => onChange({ ...form, maxDevices })}
              placeholder="1"
              placeholderTextColor={colors.muted}
              style={styles.input}
              textAlign="right"
              value={form.maxDevices}
            />

            <Text style={styles.fieldLabel}>ملاحظات</Text>
            <TextInput
              editable={!creating}
              maxLength={1000}
              multiline
              onChangeText={notes => onChange({ ...form, notes })}
              placeholder="معلومات داخلية لا تظهر للمستخدم"
              placeholderTextColor={colors.muted}
              style={[styles.input, styles.multilineInput]}
              textAlign="right"
              textAlignVertical="top"
              value={form.notes}
            />

            <Pressable
              disabled={creating}
              onPress={onCreate}
              style={[styles.primaryButton, creating && styles.disabledButton]}
            >
              {creating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>إنشاء رمز التفعيل</Text>
              )}
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

function LicenseDetailModal({
  detail,
  detailLoading,
  editForm,
  saving,
  onChange,
  onClose,
  onRevoke,
  onSave,
  onCopy,
}: {
  detail: LicenseDetail | null;
  detailLoading: boolean;
  editForm: typeof INITIAL_EDIT_FORM;
  saving: boolean;
  onChange: (form: typeof INITIAL_EDIT_FORM) => void;
  onClose: () => void;
  onRevoke: (activationId: string) => void;
  onSave: () => void;
  onCopy: (code: string) => void;
}) {
  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      transparent={false}
      visible={detail !== null || detailLoading}
    >
      <SafeAreaView style={styles.modalScreen} edges={['top', 'bottom']}>
        {detailLoading && !detail ? (
          <AppLoading />
        ) : detail ? (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.flex}
          >
            <ScrollView
              contentContainerStyle={styles.modalContent}
              keyboardShouldPersistTaps="handled"
            >
              <ModalHeader title="إدارة الترخيص" onClose={onClose} />
              <View style={styles.detailSummary}>
                <Text style={styles.detailLicenseName}>
                  {detail.license.label || 'ترخيص بلا اسم'}
                </Text>
                <Text style={styles.codeHint}>
                  ****-{detail.license.codeHint}
                </Text>
                <Text style={styles.detailMeta}>
                  الأجهزة المفعلة: {detail.license.activeDevices} /{' '}
                  {detail.license.maxDevices}
                </Text>
                <Text style={styles.detailMeta}>
                  الانتهاء الحالي: {formatLicenseDate(detail.license.expiresAt)}
                </Text>
              </View>

              <View style={styles.recoveryCodeCard}>
                <Text style={styles.recoveryCodeLabel}>رمز التفعيل</Text>
                {detail.activationCode ? (
                  <>
                    <Text selectable style={styles.activationCode}>
                      {detail.activationCode}
                    </Text>
                    <Pressable
                      onPress={() => onCopy(detail.activationCode as string)}
                      style={styles.secondaryButton}
                    >
                      <Text style={styles.secondaryButtonText}>
                        نسخ رمز التفعيل
                      </Text>
                    </Pressable>
                  </>
                ) : (
                  <Text style={styles.recoveryCodeUnavailable}>
                    هذا ترخيص قديم أُنشئ قبل تفعيل الحفظ المشفّر للرموز، لذلك لا
                    يمكن استرجاع رمزه. أنشئ رمزاً جديداً عند الحاجة.
                  </Text>
                )}
              </View>

              <Text style={styles.fieldLabel}>الاسم</Text>
              <TextInput
                editable={!saving}
                maxLength={120}
                onChangeText={label => onChange({ ...editForm, label })}
                placeholder="اسم الترخيص"
                placeholderTextColor={colors.muted}
                style={styles.input}
                textAlign="right"
                value={editForm.label}
              />
              <Text style={styles.fieldLabel}>الحالة</Text>
              <View style={styles.statusChoices}>
                {(['active', 'suspended', 'revoked'] as LicenseStatus[]).map(
                  status => (
                    <Pressable
                      disabled={saving}
                      key={status}
                      onPress={() => onChange({ ...editForm, status })}
                      style={[
                        styles.statusChoice,
                        editForm.status === status &&
                          styles.statusChoiceSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusChoiceText,
                          editForm.status === status &&
                            styles.statusChoiceTextSelected,
                        ]}
                      >
                        {statusLabel(status)}
                      </Text>
                    </Pressable>
                  ),
                )}
              </View>
              <Text style={styles.fieldLabel}>عدد الأجهزة (1 - 50)</Text>
              <TextInput
                editable={!saving}
                keyboardType="number-pad"
                maxLength={2}
                onChangeText={maxDevices =>
                  onChange({ ...editForm, maxDevices })
                }
                placeholder="1"
                placeholderTextColor={colors.muted}
                style={styles.input}
                textAlign="right"
                value={editForm.maxDevices}
              />
              <Text style={styles.fieldLabel}>تاريخ الانتهاء</Text>
              <TextInput
                editable={!saving}
                keyboardType="numbers-and-punctuation"
                maxLength={10}
                onChangeText={expiresOn => onChange({ ...editForm, expiresOn })}
                placeholder="YYYY-MM-DD أو اتركه دائماً"
                placeholderTextColor={colors.muted}
                style={styles.input}
                textAlign="right"
                value={editForm.expiresOn}
              />
              <Text style={styles.fieldLabel}>ملاحظات</Text>
              <TextInput
                editable={!saving}
                maxLength={1000}
                multiline
                onChangeText={notes => onChange({ ...editForm, notes })}
                placeholder="ملاحظات داخلية"
                placeholderTextColor={colors.muted}
                style={[styles.input, styles.multilineInput]}
                textAlign="right"
                textAlignVertical="top"
                value={editForm.notes}
              />
              <Pressable
                disabled={saving}
                onPress={onSave}
                style={[styles.primaryButton, saving && styles.disabledButton]}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryButtonText}>حفظ التعديلات</Text>
                )}
              </Pressable>

              <View style={styles.devicesSection}>
                <Text style={styles.sectionTitle}>الأجهزة المرتبطة</Text>
                {detail.activations.length === 0 ? (
                  <Text style={styles.emptyText}>
                    لم يُفعّل هذا الرمز على أي جهاز بعد.
                  </Text>
                ) : (
                  detail.activations.map(activation => (
                    <View key={activation.id} style={styles.activationCard}>
                      <View style={styles.activationCopy}>
                        <Text style={styles.activationTitle}>
                          {activation.installationHint}
                        </Text>
                        <Text style={styles.activationMeta}>
                          {activation.platform}
                          {activation.appVersion
                            ? ` - ${activation.appVersion}`
                            : ''}
                        </Text>
                        <Text style={styles.activationMeta}>
                          آخر تحقق:{' '}
                          {formatLicenseDate(activation.lastCheckedAt)}
                        </Text>
                      </View>
                      {activation.active ? (
                        <Pressable
                          disabled={saving}
                          onPress={() => onRevoke(activation.id)}
                          style={[
                            styles.revokeButton,
                            saving && styles.disabledButton,
                          ]}
                        >
                          <Text style={styles.revokeButtonText}>إلغاء</Text>
                        </Pressable>
                      ) : (
                        <Text style={styles.inactiveText}>غير نشط</Text>
                      )}
                    </View>
                  ))
                )}
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}

function ModalHeader({
  title,
  onClose,
}: {
  title: string;
  onClose: () => void;
}) {
  return (
    <View style={styles.modalHeader}>
      <Text style={styles.modalTitle}>{title}</Text>
      <Pressable onPress={onClose} style={styles.closeButton}>
        <Text style={styles.closeButtonText}>إغلاق</Text>
      </Pressable>
    </View>
  );
}

const colors = {
  background: '#F7F7F2',
  surface: '#FFFFFF',
  primary: '#155D54',
  primaryDark: '#0D463F',
  ink: '#14231F',
  muted: '#6F7A76',
  line: '#DDE4DF',
  error: '#A93636',
  errorBg: '#FCEBEC',
  success: '#166534',
  successBg: '#EAF7ED',
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: 24,
  },
  loadingText: {
    color: colors.muted,
    fontSize: 15,
    marginTop: 14,
    textAlign: 'center',
  },
  loginScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: 28,
  },
  loginBrand: { alignItems: 'center', marginBottom: 42, maxWidth: 330 },
  brandMark: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 28,
    height: 72,
    justifyContent: 'center',
    marginBottom: 18,
    width: 72,
  },
  brandMarkText: { color: '#fff', fontSize: 37, fontWeight: '800' },
  eyebrow: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
  },
  loginTitle: {
    color: colors.ink,
    fontSize: 30,
    fontWeight: '800',
    marginTop: 6,
    textAlign: 'center',
  },
  loginDescription: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 26,
    marginTop: 14,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  loginHint: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 16,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    justifyContent: 'center',
    minHeight: 54,
    paddingHorizontal: 20,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    writingDirection: 'rtl',
  },
  disabledButton: { opacity: 0.55 },
  pressedButton: {
    backgroundColor: colors.primaryDark,
    transform: [{ scale: 0.99 }],
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 18,
    textAlign: 'center',
  },
  topBar: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderBottomColor: colors.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  topTitle: {
    color: colors.ink,
    fontSize: 23,
    fontWeight: '800',
    marginTop: 2,
    textAlign: 'right',
  },
  accountText: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
  },
  signOutButton: { paddingHorizontal: 10, paddingVertical: 8 },
  signOutText: { color: colors.primary, fontSize: 14, fontWeight: '700' },
  content: { padding: 16, paddingBottom: 36 },
  errorBanner: {
    backgroundColor: colors.errorBg,
    borderColor: '#F3C5C7',
    borderRadius: 12,
    borderWidth: 1,
    color: colors.error,
    lineHeight: 22,
    marginBottom: 12,
    padding: 12,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  noticeBanner: {
    backgroundColor: colors.successBg,
    borderColor: '#BFE8CB',
    borderRadius: 12,
    borderWidth: 1,
    color: colors.success,
    lineHeight: 22,
    marginBottom: 12,
    padding: 12,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  statsGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  statCard: { borderRadius: 14, minHeight: 90, padding: 14, width: '47.8%' },
  statSlate: { backgroundColor: '#E9EFEC' },
  statBlue: { backgroundColor: '#E5F0FA' },
  statGreen: { backgroundColor: '#E3F3EB' },
  statOrange: { backgroundColor: '#FFF0DC' },
  statValue: {
    color: colors.ink,
    fontSize: 27,
    fontWeight: '800',
    textAlign: 'right',
  },
  statLabel: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 6,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  codeCard: {
    backgroundColor: '#E7F4ED',
    borderColor: '#B6DDC5',
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 16,
    padding: 16,
  },
  codeLabel: {
    color: colors.success,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  activationCode: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
    marginVertical: 10,
    textAlign: 'center',
  },
  codeActions: { flexDirection: 'row-reverse', gap: 8 },
  codeAction: { flex: 1 },
  secondaryButton: {
    alignItems: 'center',
    borderColor: colors.primary,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
    writingDirection: 'rtl',
  },
  sectionHeader: { marginTop: 26, marginBottom: 12 },
  sectionTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  sectionSubtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 3,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  searchRow: { flexDirection: 'row-reverse', gap: 8, marginBottom: 12 },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 16,
    minHeight: 50,
    paddingHorizontal: 14,
    writingDirection: 'rtl',
  },
  searchInput: { flex: 1 },
  searchButton: {
    alignItems: 'center',
    backgroundColor: '#E6EFEB',
    borderRadius: 12,
    justifyContent: 'center',
    minWidth: 70,
    paddingHorizontal: 12,
  },
  searchButtonText: {
    color: colors.primary,
    fontWeight: '800',
    writingDirection: 'rtl',
  },
  emptyText: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 24,
    paddingVertical: 18,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  licenseCard: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 15,
    borderWidth: 1,
    marginBottom: 10,
    padding: 15,
  },
  pressedCard: { backgroundColor: '#F1F6F3' },
  licenseTitleRow: {
    alignItems: 'flex-start',
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
  },
  licenseTitleCopy: { flex: 1, paddingLeft: 10 },
  licenseName: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  codeHint: {
    color: colors.muted,
    fontSize: 13,
    letterSpacing: 0.4,
    marginTop: 3,
    textAlign: 'right',
  },
  licenseMetaRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  licenseMeta: {
    color: colors.muted,
    fontSize: 13,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  statusBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  activeBadge: { backgroundColor: '#DDF2E5' },
  suspendedBadge: { backgroundColor: '#FFF0D8' },
  revokedBadge: { backgroundColor: '#FCE3E5' },
  statusText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '800',
    writingDirection: 'rtl',
  },
  modalScreen: { flex: 1, backgroundColor: colors.background },
  modalContent: { padding: 20, paddingBottom: 40 },
  modalHeader: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  modalTitle: {
    color: colors.ink,
    fontSize: 25,
    fontWeight: '800',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  closeButton: { paddingHorizontal: 10, paddingVertical: 8 },
  closeButtonText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '700',
    writingDirection: 'rtl',
  },
  fieldLabel: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 7,
    marginTop: 17,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  planGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  planButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 12,
    width: '47.8%',
  },
  planButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  planText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
    writingDirection: 'rtl',
  },
  planTextSelected: { color: '#fff' },
  planNote: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 21,
    marginTop: 15,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  multilineInput: { minHeight: 104, paddingTop: 12 },
  detailSummary: {
    backgroundColor: '#E9F1EE',
    borderRadius: 14,
    marginBottom: 6,
    padding: 15,
  },
  recoveryCodeCard: {
    backgroundColor: '#E7F4ED',
    borderColor: '#B6DDC5',
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 16,
    padding: 15,
  },
  recoveryCodeLabel: {
    color: colors.success,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  recoveryCodeUnavailable: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 21,
    marginTop: 8,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  detailLicenseName: {
    color: colors.ink,
    fontSize: 19,
    fontWeight: '800',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  detailMeta: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 7,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  statusChoices: { flexDirection: 'row-reverse', gap: 8 },
  statusChoice: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
  },
  statusChoiceSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  statusChoiceText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
    writingDirection: 'rtl',
  },
  statusChoiceTextSelected: { color: '#fff' },
  devicesSection: {
    borderTopColor: colors.line,
    borderTopWidth: 1,
    marginTop: 28,
    paddingTop: 22,
  },
  activationCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginTop: 10,
    padding: 13,
  },
  activationCopy: { flex: 1, paddingLeft: 10 },
  activationTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'right',
  },
  activationMeta: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  revokeButton: {
    backgroundColor: '#FCE3E5',
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 9,
  },
  revokeButtonText: {
    color: '#9A2E37',
    fontSize: 12,
    fontWeight: '800',
    writingDirection: 'rtl',
  },
  inactiveText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    writingDirection: 'rtl',
  },
});
