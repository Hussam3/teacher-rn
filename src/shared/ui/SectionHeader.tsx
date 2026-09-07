/**
 * عنوان قسم — أيقونة + نص بلون العلامة التجارية.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { FONT_FAMILY } from '../theme/tokens';
import { Icon, type IconProps } from './Icon';

interface SectionHeaderProps {
  title: string;
  icon?: IconProps;
  action?: React.ReactNode;
}

export function SectionHeader({ title, icon, action }: SectionHeaderProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      <View style={styles.titleGroup}>
        {icon ? <Icon {...icon} size={20} color={colors.primary} /> : null}
        <Text style={[styles.title, { color: colors.primary }]}>{title}</Text>
      </View>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '700',
  },
});
