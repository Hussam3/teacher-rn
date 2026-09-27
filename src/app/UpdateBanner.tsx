/**
 * زر التحديث العائم أعلى التطبيق.
 *
 * يظهر فقط عند وجود تحديث فوري جديد: بندل جديد على أندرويد، أو نشر أحدث على
 * الويب. يعرض رسالة «يوجد تحديث جديد» لمدة خمس ثوانٍ ثم ينكمش إلى سهم صغير قابل
 * للضغط، والضغط يفتح نافذة التحديث.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../shared/theme/ThemeProvider';
import { FONT_FAMILY, radius } from '../shared/theme/tokens';
import { strings } from '../shared/i18n/ar';
import { Button } from '../shared/ui/Button';
import { Dialog } from '../shared/ui/Dialog';
import { Icon } from '../shared/ui/Icon';
import { PressableScale } from '../shared/ui/PressableScale';
import { showError, showSuccess } from '../shared/ui/toast';
import { useAppUpdate } from '../features/settings/useAppUpdate';

/** مدة ظهور رسالة «يوجد تحديث جديد» قبل أن ينكمش الزر إلى سهم */
const MESSAGE_DURATION_MS = 5000;

const PILL_HEIGHT = 38;
const PILL_PADDING = 8;
const PILL_PADDING_EXPANDED = 20;
const LABEL_WIDTH = 104;
const COLLAPSE_DURATION_MS = 240;

export function UpdateBanner() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const {
    enabled,
    webUpdate,
    otaVersion,
    updateInfo,
    applying,
    progress,
    check,
    apply,
  } = useAppUpdate();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const announcedRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const expanded = useSharedValue(1);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    check().catch(() => {});
  }, [enabled, check]);

  useEffect(() => {
    if (!enabled) return;
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') check().catch(() => {});
    });
    return () => subscription.remove();
  }, [enabled, check]);

  // الرسالة تُعلن عن كل تحديث مرة واحدة فقط، مهما أُعيد الفحص لاحقاً.
  useEffect(() => {
    if (!updateInfo) {
      announcedRef.current = null;
      setShowMessage(false);
      clearTimer();
      return;
    }
    if (announcedRef.current === updateInfo.id) return;
    announcedRef.current = updateInfo.id;
    setShowMessage(true);
    timerRef.current = setTimeout(
      () => setShowMessage(false),
      MESSAGE_DURATION_MS,
    );
    return clearTimer;
  }, [updateInfo, clearTimer]);

  useEffect(() => {
    expanded.value = withTiming(showMessage ? 1 : 0, {
      duration: COLLAPSE_DURATION_MS,
    });
  }, [showMessage, expanded]);

  useEffect(() => clearTimer, [clearTimer]);

  const handleApply = useCallback(async () => {
    if (!updateInfo) return;
    const result = await apply(updateInfo);
    if (result.ok) {
      setDialogOpen(false);
      showSuccess(result.message);
    } else {
      showError(result.message);
    }
  }, [apply, updateInfo]);

  const pillStyle = useAnimatedStyle(() => ({
    paddingHorizontal:
      PILL_PADDING +
      (PILL_PADDING_EXPANDED - PILL_PADDING) * expanded.value,
  }));
  const labelClipStyle = useAnimatedStyle(() => ({
    width: LABEL_WIDTH * expanded.value,
  }));

  if (!enabled || !updateInfo) return null;

  return (
    <>
      <View
        style={[styles.host, { top: insets.top + 8 }]}
        pointerEvents="box-none"
      >
        <PressableScale
          onPress={() => setDialogOpen(true)}
          haptic
          animated={false}
          accessibilityRole="button"
          accessibilityLabel={strings.update.available}
          style={[styles.pill, { backgroundColor: colors.primary }]}
          contentStyle={styles.pillContent}
        >
          <Animated.View style={pillStyle}>
            <Icon
              name="arrow-downward"
              size={20}
              color={colors.textOnPrimary}
            />
            <Animated.View style={[styles.labelClip, labelClipStyle]}>
              <Text
                numberOfLines={1}
                style={[styles.label, { color: colors.textOnPrimary }]}
              >
                {strings.update.available}
              </Text>
            </Animated.View>
          </Animated.View>
        </PressableScale>
      </View>

      <Dialog
        visible={dialogOpen}
        title={strings.update.dialogTitle}
        onClose={() => {
          if (!applying) setDialogOpen(false);
        }}
        actions={
          <View style={styles.dialogActions}>
            <Button
              label={strings.common.close}
              variant="ghost"
              onPress={() => setDialogOpen(false)}
              disabled={applying}
            />
            <Button
              label={
                applying
                  ? webUpdate
                    ? strings.update.reloading
                    : strings.update.downloading.replace(
                        '{percent}',
                        String(Math.round(progress * 100)),
                      )
                  : strings.update.applyNow
              }
              icon={{ name: 'download-for-offline' }}
              onPress={handleApply}
              loading={applying}
              disabled={applying}
            />
          </View>
        }
      >
        <Text style={[styles.meta, { color: colors.textPrimary }]}>
          {strings.update.currentVersion.replace('{version}', otaVersion)}
        </Text>
        <Text style={[styles.meta, { color: colors.primary }]}>
          {strings.update.newVersion.replace('{version}', updateInfo.versionName)}
        </Text>
        {updateInfo.releaseNotes ? (
          <View
            style={[
              styles.notesBox,
              {
                backgroundColor: `${colors.primary}12`,
                borderColor: `${colors.primary}3D`,
              },
            ]}
          >
            <Text style={[styles.notesTitle, { color: colors.textPrimary }]}>
              {strings.update.releaseNotes}
            </Text>
            <Text style={[styles.notes, { color: colors.textSecondary }]}>
              {updateInfo.releaseNotes}
            </Text>
          </View>
        ) : null}
        {applying && !webUpdate ? (
          <View
            style={[styles.track, { backgroundColor: `${colors.primary}22` }]}
          >
            <View
              style={[
                styles.fill,
                {
                  width: `${Math.max(4, Math.round(progress * 100))}%`,
                  backgroundColor: colors.primary,
                },
              ]}
            />
          </View>
        ) : null}
      </Dialog>
    </>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
    elevation: 8,
  },
  pill: {
    borderRadius: PILL_HEIGHT / 2,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  pillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    height: PILL_HEIGHT,
  },
  labelClip: {
    overflow: 'hidden',
  },
  label: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
  },
  dialogActions: { flexDirection: 'row', gap: 8 },
  meta: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  notesBox: {
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: 10,
    marginTop: 10,
    gap: 4,
  },
  notesTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
  },
  notes: {
    fontFamily: FONT_FAMILY,
    fontSize: 12.5,
    lineHeight: 19,
    textAlign: 'right',
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 12,
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
});
