/**
 * زر قابل للضغط مع حركة تصغير ناعمة (Reanimated) وتغذية اهتزازية.
 */
import React from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { haptics } from '../lib/haptics';

interface PressableScaleProps extends PressableProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** تعطيل الحركة */
  animated?: boolean;
  /** تفعيل الاهتزاز الخفيف */
  haptic?: boolean;
}

export function PressableScale({
  children,
  style,
  animated = true,
  haptic = false,
  onPressIn,
  onPressOut,
  ...rest
}: PressableScaleProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(
    () => ({
      transform: [{ scale: scale.value }],
    }),
    []
  );

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Pressable
        {...rest}
        onPressIn={e => {
          if (animated) scale.value = withSpring(0.97, { damping: 20, stiffness: 300 });
          if (haptic) haptics.light();
          onPressIn?.(e);
        }}
        onPressOut={e => {
          if (animated) scale.value = withSpring(1, { damping: 20, stiffness: 300 });
          onPressOut?.(e);
        }}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
