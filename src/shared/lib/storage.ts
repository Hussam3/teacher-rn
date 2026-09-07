/**
 * طبقة التخزين المحلي (MMKV) — مثيل واحد مشترك.
 */
import { createMMKV } from 'react-native-mmkv';

/** المثيل العام للتخزين */
export const storage = createMMKV({ id: 'teacher-bag' });

/** أسماء مفاتيح التخزين المركزية */
export const StorageKeys = {
  subjects: 'tb:subjects',
  schedule: 'tb:schedule',
  dailyPlans: 'tb:dailyPlans',
  annualPlans: 'tb:annualPlans',
  gradebooks: 'tb:gradebooks',
  documents: 'tb:documents',
  settings: 'tb:settings',
  notificationMap: 'tb:notifMap',
  licenseInstallation: 'tb:licenseInstallation',
  licenseEntitlement: 'tb:licenseEntitlement',
} as const;

/** نوع أسماء مفاتيح التخزين */
export type StorageKeyName = (typeof StorageKeys)[keyof typeof StorageKeys];

/** قراءة قيمة JSON آمنة */
export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = storage.getString(key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** كتابة قيمة JSON آمنة */
export function writeJSON<T>(key: string, value: T): void {
  storage.set(key, JSON.stringify(value));
}

/** حذف مفتاح */
export function removeKey(key: string): void {
  storage.remove(key);
}

/** فحص وجود مفتاح */
export function hasKey(key: string): boolean {
  return storage.contains(key);
}
