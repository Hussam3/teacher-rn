import { NativeModules } from 'react-native';

type ClipboardBridge = {
  setString: (value: string) => void;
};

export function copyActivationCode(value: string): void {
  const clipboard = NativeModules.TeacherBagClipboard as
    | ClipboardBridge
    | undefined;
  if (!clipboard) {
    throw new Error(
      'تعذر الوصول إلى الحافظة. أعد تثبيت أحدث نسخة من تطبيق الإدارة.',
    );
  }
  clipboard.setString(value);
}
