/**
 * نظام الإشعارات اللحظية (Toast/Snackbar) — مخزن Zustand + مكوّن عرض.
 */
import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import { create } from 'zustand';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONT_FAMILY, radius } from '../theme/tokens';
import { useThemeColors } from '../theme/ThemeProvider';
import { Icon } from './Icon';

type ToastType = 'success' | 'error' | 'info';

interface ToastState {
  message: string;
  type: ToastType;
  visible: boolean;
}

const useToastStore = create<ToastState>(() => ({
  message: '',
  type: 'info',
  visible: false,
}));

let hideTimer: ReturnType<typeof setTimeout> | null = null;

/** عرض إشعار لحظي */
export function showToast(message: string, type: ToastType = 'info') {
  useToastStore.setState({ message, type, visible: true });
  if (hideTimer) clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    useToastStore.setState({ visible: false });
  }, 2600);
}

export function showSuccess(message: string) {
  showToast(message, 'success');
}
export function showError(message: string) {
  showToast(message, 'error');
}
export function showInfo(message: string) {
  showToast(message, 'info');
}

const TYPE_COLORS: Record<ToastType, string> = {
  success: '#34C759',
  error: '#FF3B30',
  info: '#24A1DE',
};

const TYPE_ICONS: Record<ToastType, string> = {
  success: 'check-circle',
  error: 'error',
  info: 'info',
};

export function ToastHost() {
  const { message, type, visible } = useToastStore();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-100);

  useEffect(() => {
    translateY.value = visible
      ? withSpring(0, { damping: 18, stiffness: 200 })
      : withTiming(-120, { duration: 200 });
  }, [visible, translateY]);

  const animatedStyle = useAnimatedStyle(
    () => ({
      transform: [{ translateY: translateY.value }],
    }),
    []
  );

  const tint = TYPE_COLORS[type];

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.container,
        { top: insets.top + 8, backgroundColor: colors.surface },
        animatedStyle,
      ]}
    >
      <Icon name={TYPE_ICONS[type]} size={20} color={tint} />
      <Text style={[styles.text, { color: colors.textPrimary }]}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radius.md,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  text: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
});
