/**
 * زر النظام — بأنماط متعددة (أساسي، ثانوي، محدد، خطر، شبح).
 */
import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { FONT_FAMILY, radius } from '../theme/tokens';
import { PressableScale } from './PressableScale';
import { Icon, type IconProps } from './Icon';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: IconProps;
  iconRight?: IconProps;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  iconRight,
  disabled = false,
  loading = false,
  style,
  labelStyle,
}: ButtonProps) {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;

  const bg =
    variant === 'primary'
      ? colors.primary
      : variant === 'danger'
        ? colors.error
        : 'transparent';

  const fg =
    variant === 'primary' || variant === 'danger'
      ? colors.textOnPrimary
      : variant === 'ghost'
        ? colors.primary
        : colors.primary;

  const border =
    variant === 'outline' || variant === 'secondary'
      ? { borderWidth: 1, borderColor: colors.primary }
      : variant === 'ghost'
        ? {}
        : {};

  return (
    <PressableScale
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.base,
        { backgroundColor: bg, opacity: isDisabled ? 0.5 : 1 },
        border,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} size="small" />
      ) : (
        <React.Fragment>
          {icon ? <Icon {...icon} size={icon.size ?? 20} color={fg} /> : null}
          <Text style={[styles.label, { color: fg }, labelStyle]}>{label}</Text>
          {iconRight ? (
            <Icon {...iconRight} size={iconRight.size ?? 20} color={fg} />
          ) : null}
        </React.Fragment>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: radius.md,
    minHeight: 48,
  },
  label: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '700',
  },
});
