/**
 * جسر المزامنة — يفصل طبقة التخزين المحلي عن خدمة السحابة لتجنّب
 * الاستيراد الدائري (repositories ← cloudSyncService ← repositories).
 *
 * المسؤوليات:
 * 1. إشعار خدمة السحابة بأي تغيير محلي (دفع للتغييرات).
 * 2. بثّ حدث "تغيّرت البيانات من السحابة" لطبقة الواجهة (إعادة تحميل المخازن).
 * 3. حالة المزامنة الحالية + اشتراكاتها (عرضها في الإعدادات).
 */
import { readJSON, writeJSON, type StorageKeyName } from '../shared/lib/storage';

type LocalChangeListener = (key: string, map: Record<string, unknown>) => void;
type RemoteChangeListener = () => void;
type SyncStateListener = (state: SyncState) => void;

export interface SyncState {
  /** هل قاعدة البيانات السحابية متاحة/مهيأة؟ */
  available: boolean;
  /** جلسة مزامنة نشطة حالياً (مستخدم غير ضيف)؟ */
  active: boolean;
  /** عملية مزامنة جارية؟ */
  syncing: boolean;
  /** آخر مزامنة ناجحة (ISO) */
  lastSyncAt: string | null;
  /** آخر خطأ */
  error: string | null;
}

const EMPTY_STATE: SyncState = {
  available: false,
  active: false,
  syncing: false,
  lastSyncAt: null,
  error: null,
};

let localChangeListener: LocalChangeListener | null = null;
const remoteChangeListeners = new Set<RemoteChangeListener>();
const syncStateListeners = new Set<SyncStateListener>();
let syncState: SyncState = { ...EMPTY_STATE };

/** تسجيل مستمع تغييرات المخازن المحلية (تُسجّله خدمة السحابة مرة واحدة) */
export function setLocalChangeListener(listener: LocalChangeListener | null): void {
  localChangeListener = listener;
}

/** تُستدعى من المستودعات بعد كل كتابة محلية */
export function notifyLocalChange(key: string, map: Record<string, unknown>): void {
  localChangeListener?.(key, map);
}

/** بثّ حدث: تغيّرت البيانات من السحابة (أعد تحميل المخازن) */
export function emitRemoteChanged(): void {
  remoteChangeListeners.forEach(fn => fn());
}

/** الاشتراك في أحداث التغيير القادمة من السحابة — تعيد دالة إلغاء الاشتراك */
export function onRemoteChanged(listener: RemoteChangeListener): () => void {
  remoteChangeListeners.add(listener);
  return () => remoteChangeListeners.delete(listener);
}

/** الحالة الحالية للمزامنة */
export function getSyncState(): SyncState {
  return { ...syncState };
}

/** تحديث حالة المزامنة وإعلام المشتركين */
export function setSyncState(patch: Partial<SyncState>): SyncState {
  syncState = { ...syncState, ...patch };
  syncStateListeners.forEach(fn => fn(getSyncState()));
  return getSyncState();
}

/** إعادة الحالة للوضع الافتراضي (تسجيل خروج / إعادة تعيين) */
export function resetSyncState(): void {
  syncState = { ...EMPTY_STATE };
  syncStateListeners.forEach(fn => fn(getSyncState()));
}

/** الاشتراك في تغيّر حالة المزامنة — تعيد دالة إلغاء الاشتراك */
export function onSyncStateChanged(listener: SyncStateListener): () => void {
  syncStateListeners.add(listener);
  listener(getSyncState());
  return () => syncStateListeners.delete(listener);
}

/** كتابة من السحابة مباشرة إلى التخزين المحلي (بدون إعادة دفع) */
export function applyCloudData(key: StorageKeyName, map: Record<string, unknown>): void {
  writeJSON(key, map);
}

/** قراءة بيانات محلية لإرسالها إلى السحابة */
export function readLocalMap(key: StorageKeyName): Record<string, unknown> {
  return readJSON<Record<string, unknown>>(key, {});
}