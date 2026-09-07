/**
 * نافذة دليل ورابط الحصول على مفتاح Gemini API المجاني من Google
 * توجيه خطوة بخطوة مع زر وصول مباشر إلى Google AI Studio.
 */
import React from 'react';
import {
  Linking,
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

export const GEMINI_API_STUDIO_URL = 'https://aistudio.google.com/app/apikey';

interface GeminiApiKeyHelpDialogProps {
  visible: boolean;
  onClose: () => void;
}

export function GeminiApiKeyHelpDialog({
  visible,
  onClose,
}: GeminiApiKeyHelpDialogProps) {
  const { colors } = useTheme();

  const handleOpenGoogleAIStudio = async () => {
    try {
      await Linking.openURL(GEMINI_API_STUDIO_URL);
    } catch {
      // Fallback
    }
  };

  return (
    <Dialog
      visible={visible}
      title="دليل الحصول على مفتاح Gemini مجاناً"
      onClose={onClose}
      actions={
        <View style={styles.actions}>
          <Button
            label="فتح صفحة المفاتيح في Google"
            icon={{ name: 'open-in-new' }}
            onPress={handleOpenGoogleAIStudio}
          />
          <Button label="إغلاق" variant="ghost" onPress={onClose} />
        </View>
      }
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* البانر التعريفي */}
        <View
          style={[
            styles.banner,
            { backgroundColor: `${colors.primary}15`, borderColor: `${colors.primary}35` },
          ]}
        >
          <Icon name="auto-awesome" size={24} color={colors.primary} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[styles.bannerTitle, { color: colors.textPrimary }]}>
              استخدام غير محدود ومجاني 100%
            </Text>
            <Text style={[styles.bannerText, { color: colors.textSecondary }]}>
              توفر Google مفاتيح API مجانية لنموذج Gemini لكل من يملك حساب Google (Gmail) بدون الحاجة لبطاقة بنكية.
            </Text>
          </View>
        </View>

        {/* زر الوصول السريع المباشر */}
        <PressableScale
          animated={false}
          style={[
            styles.directLinkBtn,
            { backgroundColor: colors.primary },
          ]}
          onPress={handleOpenGoogleAIStudio}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon family="community" name="google" size={20} color="#ffffff" />
            <Text style={styles.directLinkBtnText}>
              اضغط هنا لفتح Google AI Studio مباشرة
            </Text>
          </View>
          <Icon name="open-in-new" size={18} color="#ffffff" />
        </PressableScale>

        {/* الخطوة 1 */}
        <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.stepBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.stepBadgeText}>1</Text>
            </View>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              تسجيل الدخول بحساب Google
            </Text>
          </View>
          <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
            افتح الرابط في الأعلى وسجّل الدخول باستخدام حسابك في Google (بريدك في Gmail).
          </Text>
        </View>

        {/* الخطوة 2 */}
        <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.stepBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.stepBadgeText}>2</Text>
            </View>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              إنشاء المفتاح (Create API Key)
            </Text>
          </View>
          <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
            اضغط على زر <Text style={{ fontWeight: '700', color: colors.primary }}>Create API key</Text> أو <Text style={{ fontWeight: '700', color: colors.primary }}>Get API key</Text> في الصفحة.
          </Text>
        </View>

        {/* الخطوة 3 */}
        <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.stepBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.stepBadgeText}>3</Text>
            </View>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              اختيار المشروع وإنشاء المفتاح
            </Text>
          </View>
          <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
            اختر <Text style={{ fontWeight: '700' }}>Create API key in new project</Text>، وسيقوم الموقع بتوليد المفتاح لك خلال ثوانٍ.
          </Text>
        </View>

        {/* الخطوة 4 */}
        <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.stepBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.stepBadgeText}>4</Text>
            </View>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              نسخ المفتاح المتولد
            </Text>
          </View>
          <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
            اضغط على زر <Text style={{ fontWeight: '700' }}>Copy (نسخ)</Text> بجانب المفتاح المتولد (يبدأ عادةً بـ <Text style={{ fontFamily: 'monospace', color: colors.primary }}>AIzaSy...</Text>).
          </Text>
        </View>

        {/* الخطوة 5 */}
        <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.stepBadge, { backgroundColor: colors.success }]}>
              <Icon name="check" size={14} color="#ffffff" />
            </View>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              لصق المفتاح وحفظه في التطبيق
            </Text>
          </View>
          <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
            عُد إلى صفحة الإعدادات في هذا التطبيق، والصق المفتاح في خانة <Text style={{ fontWeight: '700' }}>مفتاح Gemini الشخصي</Text> ثم اضغط <Text style={{ fontWeight: '700', color: colors.primary }}>حفظ المفتاح</Text>.
          </Text>
        </View>

        {/* تنبيه الأمان والخصوصية */}
        <View
          style={[
            styles.noteBox,
            { backgroundColor: `${colors.textSecondary}10`, borderColor: colors.border },
          ]}
        >
          <Icon name="security" size={18} color={colors.textSecondary} />
          <Text style={[styles.noteText, { color: colors.textSecondary }]}>
            مفتاحك يُحفظ محلياً على ذاكرة هاتفك فقط ولا يُشارك مع أي طرف آخر.
          </Text>
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
    gap: 10,
    paddingBottom: 4,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  bannerTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 13.5,
    fontWeight: '700',
  },
  bannerText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    lineHeight: 18,
  },
  directLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: radius.md,
    marginTop: 2,
    marginBottom: 4,
  },
  directLinkBtnText: {
    color: '#ffffff',
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
  },
  card: {
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeText: {
    color: '#ffffff',
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '700',
  },
  cardTitle: {
    flex: 1,
    fontFamily: FONT_FAMILY,
    fontSize: 13.5,
    fontWeight: '700',
  },
  cardDesc: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    lineHeight: 18,
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: radius.sm,
    borderWidth: 1,
    marginTop: 4,
  },
  noteText: {
    flex: 1,
    fontFamily: FONT_FAMILY,
    fontSize: 11.5,
    lineHeight: 17,
  },
});
