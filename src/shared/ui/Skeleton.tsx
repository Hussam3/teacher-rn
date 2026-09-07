/**
 * هيكل تحميل (Skeleton) — مستطيل نابض.
 */
import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeProvider';
import { radius } from '../theme/tokens';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  radiusValue?: number;
  style?: StyleProp<ViewStyle>;
}

export function Skeleton({ width = '100%', height = 16, radiusValue = radius.sm, style }: SkeletonProps) {
  const { colors } = useTheme();
  const opacity = useSharedValue(0.5);

  React.useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 700 }), -1, true);
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }), []);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radiusValue, backgroundColor: colors.skeleton },
        animatedStyle,
        style,
      ]}
    />
  );
}

export function SkeletonCard() {
  return (
    <View style={styles.card}>
      <Skeleton width={48} height={48} radiusValue={24} />
      <View style={styles.lines}>
        <Skeleton width="80%" />
        <Skeleton width="55%" height={12} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  lines: {
    flex: 1,
    gap: 8,
  },
});
