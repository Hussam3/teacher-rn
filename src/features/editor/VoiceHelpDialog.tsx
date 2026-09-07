/**
 * نافذة دليل تفعيل الكتابة بالصوت (Speech Services by Google)
 * توجيه خطوة بخطوة مع أزرار مباشرة لفتح متجر Google Play وإعدادات الهاتف.
 */
import React from 'react';
import {
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTheme } from '../../shared/theme/ThemeProvider';
import { FONT_FAMILY, radius } from '../../shared/theme/tokens';
import { Dialog } from '../../shared/ui/Dialog';
import { Button } from '../../shared/ui/Button';
import { Icon } from '../../shared/ui/Icon';
import { PressableScale } from '../../shared/ui/PressableScale';

interface VoiceHelpDialogProps {
  visible: boolean;
  onClose: () => void;
  onRetry?: () => void;
}

export function VoiceHelpDialog({
  visible,
  onClose,
  onRetry,
}: VoiceHelpDialogProps) {
  const { colors } = useTheme();

  // فتح صفحة خدمات تحويل الصوت إلى نص من Google في متجر Play
  const openSpeechServicesStore = async () => {
    const pkg = 'com.google.android.tts';
    const marketUrl = `market://details?id=${pkg}`;
    const webUrl = `https://play.google.com/store/apps/details?id=${pkg}`;
    try {
      const supported = await Linking.canOpenURL(marketUrl);
      if (supported) {
        await Linking.openURL(marketUrl);
      } else {
        await Linking.openURL(webUrl);
      }
    } catch {
      await Linking.openURL(webUrl).catch(() => {});
    }
  };

  // فتح صفحة تطبيق Google الأساسي في متجر Play
  const openGoogleAppStore = async () => {
    const pkg = 'com.google.android.googlequicksearchbox';
    const marketUrl = `market://details?id=${pkg}`;
    const webUrl = `https://play.google.com/store/apps/details?id=${pkg}`;
    try {
      const supported = await Linking.canOpenURL(marketUrl);
      if (supported) {
        await Linking.openURL(marketUrl);
      } else {
        await Linking.openURL(webUrl);
      }
    } catch {
      await Linking.openURL(webUrl).catch(() => {});
    }
  };

  // فتح إعدادات التطبيق لإعطاء إذن الميكروفون
  const openAppSettings = async () => {
    try {
      if (Platform.OS === 'android' || Platform.OS === 'ios') {
        await Linking.openSettings();
      }
    } catch {}
  };

  return (
    <Dialog
      visible={visible}
      title="دليل تفعيل الإدخال الصوتي"
      onClose={onClose}
      actions={
        <View style={styles.actions}>
          {onRetry ? (
            <Button
              label="تجربة الكتابة بالصوت الآن"
              onPress={() => {
                onClose();
                onRetry();
              }}
            />
          ) : null}
          <Button label="إغلاق" variant="ghost" onPress={onClose} />
        </View>
      }
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.banner,
            { backgroundColor: `${colors.primary}15`, borderColor: `${colors.primary}35` },
          ]}
        >
          <Icon name="mic" size={24} color={colors.primary} />
          <Text style={[styles.bannerText, { color: colors.textPrimary }]}>
            تعتمد ميزة الإملاء الصوتي على محرك Google للتعرف على الصوت العربي بدقة وسرعة. اتبع الخطوات التالية لتفعيلها:
          </Text>
        </View>

        {/* قسم الأوامر الصوتية الذكية لمحرر الامتحانات */}
        <View style={[styles.card, { borderColor: `${colors.primary}50`, backgroundColor: `${colors.primary}08` }]}>
          <View style={styles.cardHeader}>
            <Icon name="auto-awesome" size={20} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.primary }]}>
              الأوامر الصوتية الذكية (تُنفذ تلقائياً أثناء الإملاء)
            </Text>
          </View>
          <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
            يمكنك نطق هذه العبارات أثناء التحدث ليقوم المحرر بتنفيذها فوراً:
          </Text>

          <View style={styles.commandsGrid}>
            <View style={[styles.cmdItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.cmdSay, { color: colors.primary }]}>«سؤال جديد ...»</Text>
              <Text style={[styles.cmdAction, { color: colors.textSecondary }]}>إدراج سؤال جديد وكتابة نصه مباشرة</Text>
            </View>

            <View style={[styles.cmdItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.cmdSay, { color: colors.primary }]}>«فرع أ / فرع ب / فرع ج ...»</Text>
              <Text style={[styles.cmdAction, { color: colors.textSecondary }]}>الانتقال للفرع المحدد داخل السؤال وكتابته</Text>
            </View>

            <View style={[styles.cmdItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.cmdSay, { color: colors.primary }]}>«نقطة / فارزة / علامة استفهام»</Text>
              <Text style={[styles.cmdAction, { color: colors.textSecondary }]}>إدراج علامات الترقيم (. ، ؟)</Text>
            </View>

            <View style={[styles.cmdItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.cmdSay, { color: colors.primary }]}>«سطر جديد / خط فاصل»</Text>
              <Text style={[styles.cmdAction, { color: colors.textSecondary }]}>إنشاء سطر جديد أو فاصل</Text>
            </View>

            <View style={[styles.cmdItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.cmdSay, { color: colors.primary }]}>«تراجع / احذف»</Text>
              <Text style={[styles.cmdAction, { color: colors.textSecondary }]}>التراجع عن آخر إدخال أو حذف السؤال</Text>
            </View>
          </View>
        </View>

        {/* الخطوة 1 */}
        <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.stepBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.stepBadgeText}>1</Text>
            </View>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              تثبيت أو تحديث خدمات تحويل الصوت من Google
            </Text>
          </View>
          <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
            تأكد من وجود تطبيق خدمات تحويل الصوت (Speech Services by Google) أو تطبيق Google الرسمي على هاتفك.
          </Text>
          <View style={styles.buttonsRow}>
            <PressableScale
              animated={false}
              style={[styles.actionBtn, { backgroundColor: colors.primary }]}
              onPress={openSpeechServicesStore}
            >
              <Icon family="community" name="google-play" size={16} color="#ffffff" />
              <Text style={styles.actionBtnText}>تثبيت Speech Services</Text>
            </PressableScale>
            <PressableScale
              animated={false}
              style={[
                styles.actionBtn,
                { backgroundColor: `${colors.primary}20`, borderColor: colors.primary, borderWidth: 1 },
              ]}
              onPress={openGoogleAppStore}
            >
              <Icon family="community" name="google" size={16} color={colors.primary} />
              <Text style={[styles.actionBtnText, { color: colors.primary }]}>تطبيق Google</Text>
            </PressableScale>
          </View>
        </View>

        {/* الخطوة 2 */}
        <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.stepBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.stepBadgeText}>2</Text>
            </View>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              تفعيل الإدخال الصوتي في إعدادات الهاتف
            </Text>
          </View>
          <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
            1. افتح <Text style={{ fontWeight: '700' }}>إعدادات الهاتف (Settings)</Text>.{'\n'}
            2. اختر <Text style={{ fontWeight: '700' }}>النظام / الإعدادات الإضافية</Text> ⬅️ <Text style={{ fontWeight: '700' }}>اللغة والإدخال (Language & Input)</Text>.{'\n'}
            3. اضغط على <Text style={{ fontWeight: '700' }}>تحويل الصوت إلى نص / الإدخال الصوتي</Text> واختر محرك <Text style={{ fontWeight: '700', color: colors.primary }}>Google</Text>.
          </Text>
        </View>

        {/* الخطوة 3 */}
        <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.stepBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.stepBadgeText}>3</Text>
            </View>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              منح إذن الميكروفون للتطبيق
            </Text>
          </View>
          <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
            تأكد من السماح للتطبيق بالوصول إلى الميكروفون لتسجيل صوتك وتحويله إلى أسئلة ونصوص.
          </Text>
          {Platform.OS !== 'web' ? (
            <PressableScale
              animated={false}
              style={[
                styles.actionBtn,
                { backgroundColor: `${colors.primary}20`, borderColor: colors.primary, borderWidth: 1, alignSelf: 'flex-start' },
              ]}
              onPress={openAppSettings}
            >
              <Icon name="settings" size={16} color={colors.primary} />
              <Text style={[styles.actionBtnText, { color: colors.primary }]}>فتح إعدادات التطبيق والأذونات</Text>
            </PressableScale>
          ) : null}
        </View>
      </ScrollView>
    </Dialog>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    width: '100%',
  },
  scroll: {
    maxHeight: 460,
  },
  content: {
    gap: 12,
    paddingBottom: 4,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  bannerText: {
    flex: 1,
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    lineHeight: 19,
  },
  card: {
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeText: {
    color: '#ffffff',
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
  },
  cardTitle: {
    flex: 1,
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '700',
  },
  cardDesc: {
    fontFamily: FONT_FAMILY,
    fontSize: 12.5,
    lineHeight: 19,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  actionBtnText: {
    color: '#ffffff',
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '600',
  },
  commandsGrid: {
    gap: 6,
    marginTop: 4,
  },
  cmdItem: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radius.sm,
    borderWidth: 1,
    gap: 2,
  },
  cmdSay: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
  },
  cmdAction: {
    fontFamily: FONT_FAMILY,
    fontSize: 11.5,
    textAlign: 'right',
  },
});
