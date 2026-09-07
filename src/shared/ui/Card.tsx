/**
 * بطاقة — حاوية سطحية موحدة بظل ناعم.
 */
import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { radius } from '../theme/tokens';
import { PressableScale } from './PressableScale';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function Card({ children, onPress, style }: CardProps) {
  const { colors } = useTheme();

  const content = <View style={[styles.card, { backgroundColor: colors.surface }, style]}>{children}</View>;

  if (onPress) {
    return (
      <PressableScale onPress={onPress} style={styles.wrapper} haptic>
        {content}
      </PressableScale>
    );
  }

  return <View style={styles.wrapper}>{content}</View>;
}

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 4,
    marginHorizontal: 8,
  },
  card: {
    borderRadius: radius.md,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
});
