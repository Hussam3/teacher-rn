/**
 * بانر تثبيت تطبيق الويب (PWA) على الشاشة الرئيسية.
 * يظهر فقط لمستخدمي متصفح الويب (إذا لم يكن التطبيق مثبتاً كـ Standalone).
 */
import React from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { usePwaInstall } from '../hooks/usePwaInstall';
import { useTheme } from '../theme/ThemeProvider';
import { FONT_FAMILY, radius } from '../theme/tokens';
import { Icon } from './Icon';
import { Button } from './Button';
import { Sheet } from './Sheet';

export function IosInstallGuideSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { colors } = useTheme();

  return (
    <Sheet
      visible={visible}
      title="تثبيت التطبيق على آيفون"
      onClose={onClose}
    >
      <View style={styles.guideContent}>
        <Text style={[styles.guideIntro, { color: colors.textPrimary }]}>
          لتثبيت «حقيبة المدرس» كتطبيق على شاشتك الرئيسية عبر متصفح Safari:
        </Text>

        <View style={styles.guideStep}>
          <View
            style={[
              styles.stepNum,
              { backgroundColor: `${colors.primary}20` },
            ]}
          >
            <Text style={[styles.stepNumText, { color: colors.primary }]}>
              1
            </Text>
          </View>
          <View style={styles.stepTextCol}>
            <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>
              اضغط على زر المشاركة (Share)
            </Text>
            <Text
              style={[styles.stepDesc, { color: colors.textSecondary }]}
            >
              الموجود في شريط متصفح Safari بالأسفل (أيقونة المربع مع السهم للأعلى).
            </Text>
          </View>
        </View>

        <View style={styles.guideStep}>
          <View
            style={[
              styles.stepNum,
              { backgroundColor: `${colors.primary}20` },
            ]}
          >
            <Text style={[styles.stepNumText, { color: colors.primary }]}>
              2
            </Text>
          </View>
          <View style={styles.stepTextCol}>
            <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>
              اختر «إضافة إلى الصفحة الرئيسية»
            </Text>
            <Text
              style={[styles.stepDesc, { color: colors.textSecondary }]}
            >
              مرر القائمة لأسفل واضغط على (Add to Home Screen ➕).
            </Text>
          </View>
        </View>

        <View style={styles.guideStep}>
          <View
            style={[
              styles.stepNum,
              { backgroundColor: `${colors.primary}20` },
            ]}
          >
            <Text style={[styles.stepNumText, { color: colors.primary }]}>
              3
            </Text>
          </View>
          <View style={styles.stepTextCol}>
            <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>
              اضغط «إضافة» (Add)
            </Text>
            <Text
              style={[styles.stepDesc, { color: colors.textSecondary }]}
            >
              في الزاوية العلوية لتأكيد ظهور التطبيق على شاشتك الرئيسية.
            </Text>
          </View>
        </View>

        <Button
          label="فهمت ذلك"
          variant="primary"
          onPress={onClose}
          style={{ marginTop: 12 }}
        />
      </View>
    </Sheet>
  );
}

export function PwaInstallBanner() {
  const { colors, isDark } = useTheme();
  const {
    canInstall,
    isInstalled,
    isDismissed,
    showIosGuide,
    setShowIosGuide,
    promptInstall,
    dismiss,
  } = usePwaInstall();

  // لا يظهر إلا على منصة الويب وعندما لا يكون التطبيق مثبتاً بالفعل ولم يغلق المستخدم البانر
  if (Platform.OS !== 'web' || isInstalled || isDismissed || !canInstall) {
    return null;
  }

  return (
    <>
      <View
        style={[
          styles.container,
          {
            backgroundColor: isDark ? '#162b3d' : '#f0f9ff',
            borderColor: `${colors.primary}40`,
          },
        ]}
      >
        <TouchableOpacity
          onPress={dismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.closeBtn}
          accessibilityLabel="إغلاق التنبيه"
        >
          <Icon name="close" size={16} color={colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.contentRow}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: `${colors.primary}20` },
            ]}
          >
            <Icon
              name="cellphone-arrow-down"
              family="community"
              size={24}
              color={colors.primary}
            />
          </View>

          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              تثبيت التطبيق على جهازك
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              أضف حقيبة المدرس إلى الشاشة الرئيسية لفتحه بسرعة دون متصفح
            </Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <Button
            label="تثبيت التطبيق الآن"
            icon={{ name: 'download', size: 16 }}
            variant="primary"
            onPress={promptInstall}
            style={styles.installBtn}
          />
        </View>
      </View>

      <IosInstallGuideSheet
        visible={showIosGuide}
        onClose={() => setShowIosGuide(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 6,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    position: 'relative',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  closeBtn: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 2,
    padding: 4,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 20,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'right',
  },
  subtitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'right',
    marginTop: 2,
  },
  actionRow: {
    marginTop: 10,
    alignItems: 'stretch',
  },
  installBtn: {
    height: 38,
  },
  guideContent: {
    gap: 12,
    paddingBottom: 8,
  },
  guideIntro: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: 4,
  },
  guideStep: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 10,
  },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNumText: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '800',
  },
  stepTextCol: {
    flex: 1,
  },
  stepTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
  },
  stepDesc: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'right',
    marginTop: 2,
  },
});
