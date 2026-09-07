/**
 * شارة (Chip) — عنصر صغير لعرض معلومات أو فلترة.
 */
import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { FONT_FAMILY, radius } from '../theme/tokens';
import { Icon, type IconProps } from './Icon';
import { PressableScale } from './PressableScale';

interface ChipProps {
  label: string;
  icon?: IconProps;
  color?: string;
  onPress?: () => void;
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Chip({ label, icon, color, onPress, selected, style }: ChipProps) {
  const { colors } = useTheme();
  const tint = color ?? colors.primary;

  const content = (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: selected ? `${tint}22` : colors.surfaceElevated,
          borderColor: selected ? tint : colors.border,
        },
        style,
      ]}
    >
      {icon ? <Icon {...icon} size={icon.size ?? 16} color={selected ? tint : colors.textSecondary} /> : null}
      <Text style={[styles.label, { color: selected ? tint : colors.textPrimary }]}>{label}</Text>
    </View>
  );

  if (onPress) {
    return (
      <PressableScale onPress={onPress} haptic>
        {content}
      </PressableScale>
    );
  }
  return content;
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  label: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '600',
  },
});
