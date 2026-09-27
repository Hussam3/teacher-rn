/**
 * روابط التواصل — شعار تليغرام وشعار واتساب يفتحان المحادثة مباشرة.
 *
 * يُستخدم في شاشة تسجيل الدخول وشاشة إدخال الرمز وشريط التجربة المجانية والإعدادات.
 */
import React from 'react';
import {
  Linking,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { FONT_FAMILY, radius } from '../theme/tokens';
import { useTheme } from '../theme/ThemeProvider';
import { strings } from '../i18n/ar';
import { CONTACT, TELEGRAM_COLOR, WHATSAPP_COLOR } from '../constants/contact';
import { PressableScale } from './PressableScale';
import { showError } from './toast';

/** شعار تليغرام الرسمي (مسار واحد). */
const TELEGRAM_PATH =
  'M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z';

/** شعار واتساب الرسمي (مسار واحد). */
const WHATSAPP_PATH =
  'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.174.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z';

function TelegramLogo({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={TELEGRAM_PATH} fill={color} />
    </Svg>
  );
}

function WhatsAppLogo({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={WHATSAPP_PATH} fill={color} />
    </Svg>
  );
}

function openExternal(url: string) {
  Linking.openURL(url).catch(() => showError(strings.contact.openError));
}

/** زر دائري بلون العلامة التجارية مع شعار أبيض — للشاشات الرئيسية. */
function ContactBubble({
  brandColor,
  label,
  logo,
  onPress,
}: {
  brandColor: string;
  label: string;
  logo: React.ReactNode;
  onPress: () => void;
}) {
  return (
    <PressableScale
      onPress={onPress}
      haptic
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.bubble, { backgroundColor: brandColor }]}
      contentStyle={styles.bubbleContent}
    >
      {logo}
    </PressableScale>
  );
}

/** شريحة صغيرة تُلتف مع الأسطر المجاورة — لشريط الاستخدام الضيق. */
function ContactChip({
  borderColor,
  backgroundColor,
  label,
  logo,
  onPress,
}: {
  borderColor: string;
  backgroundColor: string;
  label: string;
  logo: React.ReactNode;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      haptic
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.chip, { backgroundColor, borderColor }]}
      contentStyle={styles.chipContent}
    >
      {logo}
      <Text style={[styles.chipText, { color: colors.textPrimary }]}>
        {label}
      </Text>
    </PressableScale>
  );
}

export type ContactLinksVariant = 'row' | 'compact';

interface ContactLinksProps {
  /**
   * row: تسمية «تواصل معنا» مع زرّي الشعارين — للشاشات المتاحة.
   * compact: شريحتان نصّيتان تلتفّان مع المحتوى — للأشرطة الضيقة.
   */
  variant?: ContactLinksVariant;
  style?: StyleProp<ViewStyle>;
}

export function ContactLinks({
  variant = 'row',
  style,
}: ContactLinksProps) {
  const { colors } = useTheme();

  const telegram = () => openExternal(CONTACT.TELEGRAM_URL);
  const whatsapp = () => openExternal(CONTACT.WHATSAPP_URL);

  if (variant === 'compact') {
    return (
      <View style={[styles.compactRow, style]}>
        <ContactChip
          backgroundColor={`${TELEGRAM_COLOR}14`}
          borderColor={`${TELEGRAM_COLOR}3D`}
          label={`${strings.contact.infoLabel}: ${CONTACT.TELEGRAM_DISPLAY}`}
          logo={<TelegramLogo size={13} color={TELEGRAM_COLOR} />}
          onPress={telegram}
        />
        <ContactChip
          backgroundColor={`${WHATSAPP_COLOR}14`}
          borderColor={`${WHATSAPP_COLOR}3D`}
          label={`${strings.contact.whatsapp} ${CONTACT.WHATSAPP_DISPLAY}`}
          logo={<WhatsAppLogo size={13} color={WHATSAPP_COLOR} />}
          onPress={whatsapp}
        />
      </View>
    );
  }

  return (
    <View style={[styles.row, style]}>
      <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>
        {strings.contact.title}
      </Text>
      <ContactBubble
        brandColor={TELEGRAM_COLOR}
        label={strings.contact.telegram}
        logo={<TelegramLogo size={20} color="#FFFFFF" />}
        onPress={telegram}
      />
      <ContactBubble
        brandColor={WHATSAPP_COLOR}
        label={strings.contact.whatsapp}
        logo={<WhatsAppLogo size={20} color="#FFFFFF" />}
        onPress={whatsapp}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  rowLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '600',
  },
  bubble: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  bubbleContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  chipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  chipText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '700',
  },
});
