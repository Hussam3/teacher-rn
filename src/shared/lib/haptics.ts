/**
 * اهتزازات اللمس — واجهة موحدة فوق react-native-haptic-feedback.
 */
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

const options = { enableVibrateFallback: true, ignoreAndroidSystemSettings: false };

export const haptics = {
  /** اهتزاز خفيف عند اللمسات المهمة */
  light() {
    try {
      ReactNativeHapticFeedback.trigger('impactLight', options);
    } catch {}
  },
  /** اهتزاز متوسط */
  medium() {
    try {
      ReactNativeHapticFeedback.trigger('impactMedium', options);
    } catch {}
  },
  /** اهتزاز نجاح */
  success() {
    try {
      ReactNativeHapticFeedback.trigger('notificationSuccess', options);
    } catch {}
  },
  /** اهتزاز خطأ */
  error() {
    try {
      ReactNativeHapticFeedback.trigger('notificationError', options);
    } catch {}
  },
};
