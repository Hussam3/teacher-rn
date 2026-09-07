/**
 * خدمة المزامنة السحابية — قاعدة بيانات Supabase لمعلومات المعلم.
 *
 * الجدول: teacher_data
 *   user_id   → معرّف حساب جوجل (auth.uid)
 *   collection→ اسم المجموعة (subjects, schedule, dailyPlans, ...)
 *   entity_id → معرّف الكيان المحلي
 *   entity    → JSON كامل للكيان
 *   updated_at→ آخر تحديث
 *
 * التدفق:
 *   - عند تسجيل الدخول بجوجل: سحب كل المجموعات من السحابة.
 *     - إن وُجدت بيانات → تُستبدل البيانات المحلية بها
 *       (هكذا تُحمَّل بيانات المعلم على أي جهاز جديد بنفس الحساب).
 *     - إن كانت السحابة فارغة → تُرفع البيانات المحلية أول مرة (الجهاز الأول).
 *   - أثناء الجلسة: أي تغيير محلي يُدفع تلقائياً (مع debounce)، وأي تغيير
 *     من جهاز آخر يصل عبر Supabase Realtime ويُطبَّق محلياً فوراً.
 *
 * دفاعية: إن انقطع الاتصال أو لم يُنشأ الجدول بعد، يبقى التخزين المحلي
 * يعمل دون أي خلل.
 */
import {
  setLocalChangeListener,
  setSyncState,
  applyCloudData,
  readLocalMap,
  resetSyncState,
  emitRemoteChanged,
} from '../data/syncBridge';
import { StorageKeys, type StorageKeyName } from '../shared/lib/storage';
import type { Subject } from '../shared/types/domain';
import type { EditorDocument } from '../shared/types/editor';
import { supabase } from './supabase';

/** اسم الجدول في Supabase */
export const TEACHER_DATA_TABLE = 'teacher_data';

/** مجموعات البيانات المتزامنة: مفتاح التخزين المحلي ← اسم المجموعة في السحابة */
export const SYNC_COLLECTIONS: { storageKey: StorageKeyName; cloudName: string }[] = [
  { storageKey: StorageKeys.subjects, cloudName: 'subjects' },
  { storageKey: StorageKeys.schedule, cloudName: 'schedule' },
  { storageKey: StorageKeys.dailyPlans, cloudName: 'dailyPlans' },
  { storageKey: StorageKeys.annualPlans, cloudName: 'annualPlans' },
  { storageKey: StorageKeys.gradebooks, cloudName: 'gradebooks' },
  { storageKey: StorageKeys.documents, cloudName: 'documents' },
];

const CLOUD_TO_STORAGE: Record<string, StorageKeyName> = Object.fromEntries(
  SYNC_COLLECTIONS.map(c => [c.cloudName, c.storageKey]),
);

interface TeacherDataRow {
  id: string;
  user_id: string;
  collection: string;
  entity_id: string;
  entity: Record<string, unknown>;
  updated_at: string;
}

let currentUid: string | null = null;
let channel: ReturnType<typeof supabase.channel> | null = null;
const pushTimers = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * ملفات PDF لا تُرفع إلى السحابة. عند استلام بيانات المادة من السحابة نحتفظ
 * بمرجع الملف الموجود على هذا الجهاز حتى يبقى قابلاً للقراءة دون إنترنت.
 */
function preserveLocalSubjectFiles(
  cloudSubjects: Record<string, unknown>,
): Record<string, unknown> {
  const localSubjects = readLocalMap(StorageKeys.subjects);

  return Object.fromEntries(
    Object.entries(cloudSubjects).map(([id, cloudSubject]) => {
      const localSubject = localSubjects[id] as Partial<Subject> | undefined;
      if (!localSubject || (localSubject.pdfUri == null && localSubject.pdfBase64 == null)) {
        return [id, cloudSubject];
      }

      const remoteSubject =
        cloudSubject && typeof cloudSubject === 'object'
          ? (cloudSubject as Record<string, unknown>)
          : {};
      return [
        id,
        {
          ...remoteSubject,
          pdfUri: localSubject.pdfUri,
          pdfBase64: localSubject.pdfBase64,
        },
      ];
    }),
  );
}

function applyIncomingCloudData(
  storageKey: StorageKeyName,
  map: Record<string, unknown>,
): void {
  applyCloudData(
    storageKey,
    storageKey === StorageKeys.subjects ? preserveLocalSubjectFiles(map) : map,
  );
}

/** تنظيف البيانات قبل الرفع (الملفات المحلية لا تُنقل بين الأجهزة) */
function sanitizeForUpload(cloudName: string, entity: unknown): Record<string, unknown> {
  const doc = { ...(entity as Record<string, unknown>) };
  if (cloudName === 'subjects') {
    const s = doc as Partial<Subject>;
    s.pdfUri = null;
    s.pdfBase64 = null;
  }
  if (cloudName === 'documents') {
    const docObj = doc as Partial<EditorDocument>;
    const blocks = (docObj.blocks ?? []) as Array<{ type: string; uri?: string }>;
    blocks.forEach(b => {
      if (b.type === 'image') b.uri = '';
    });
  }
  return doc;
}

/** سحب كل صفوف مستخدم من السحابة وتجميعها حسب المجموعة */
async function fetchAllRows(uid: string): Promise<Record<string, Record<string, unknown>>> {
  const { data, error } = await supabase
    .from(TEACHER_DATA_TABLE)
    .select('collection, entity_id, entity')
    .eq('user_id', uid);
  if (error) throw new Error(error.message);
  const grouped: Record<string, Record<string, unknown>> = {};
  for (const row of (data ?? []) as Array<Pick<TeacherDataRow, 'collection' | 'entity_id' | 'entity'>>) {
    (grouped[row.collection] ??= {})[row.entity_id] = row.entity;
  }
  return grouped;
}

/** رفع مجموعة كاملة (استبدال صفوف المجموعة في السحابة بما هو محلي) */
async function pushCollection(uid: string, cloudName: string, map: Record<string, unknown>): Promise<void> {
  const { data: existing, error: existingError } = await supabase
    .from(TEACHER_DATA_TABLE)
    .select('entity_id')
    .eq('user_id', uid)
    .eq('collection', cloudName);
  if (existingError) throw new Error(existingError.message);
  const remoteIds = new Set(
    (existing ?? [] as Array<Pick<TeacherDataRow, 'entity_id'>>).map(r => r.entity_id),
  );
  const localIds = Object.keys(map);
  const now = new Date().toISOString();
  const rows: Array<{
    user_id: string;
    collection: string;
    entity_id: string;
    entity: Record<string, unknown>;
    updated_at: string;
  }> = localIds.map(id => ({
    user_id: uid,
    collection: cloudName,
    entity_id: id,
    entity: sanitizeForUpload(cloudName, map[id]),
    updated_at: now,
  }));
  if (rows.length > 0) {
    const { error } = await supabase.from(TEACHER_DATA_TABLE).upsert(rows, {
      onConflict: 'user_id,collection,entity_id',
    });
    if (error) throw new Error(error.message);
  }
  for (const id of remoteIds) {
    if (!(id in map)) {
      const { error } = await supabase
        .from(TEACHER_DATA_TABLE)
        .delete()
        .eq('user_id', uid)
        .eq('collection', cloudName)
        .eq('entity_id', id);
      if (error) throw new Error(error.message);
    }
  }
}

/** رفع كل المجموعات المحلية إلى السحابة (لأول جهاز / زر المزامنة اليدوي) */
export async function pushAllToCloud(uid?: string): Promise<boolean> {
  const targetUid = uid ?? currentUid;
  if (!targetUid) return false;
  setSyncState({ syncing: true, error: null });
  try {
    for (const { storageKey, cloudName } of SYNC_COLLECTIONS) {
      await pushCollection(targetUid, cloudName, readLocalMap(storageKey));
    }
    setSyncState({ syncing: false, lastSyncAt: new Date().toISOString(), error: null });
    return true;
  } catch (e) {
    setSyncState({ syncing: false, error: e instanceof Error ? e.message : 'خطأ في الرفع' });
    return false;
  }
}

/** سحب كل المجموعات وتطبيقها محلياً (لجهاز جديد) */
async function pullAllFromCloud(uid: string): Promise<boolean> {
  const grouped = await fetchAllRows(uid);
  let hasAny = false;
  for (const { storageKey, cloudName } of SYNC_COLLECTIONS) {
    const cloudMap = grouped[cloudName] ?? {};
    applyIncomingCloudData(storageKey, cloudMap);
    if (Object.keys(cloudMap).length > 0) hasAny = true;
  }
  return hasAny;
}

/** ربط التغييرات المحلية بالسحابة (دفع تلقائي مع debounce) */
function registerLocalPushHook(): void {
  setLocalChangeListener((storageKey, map) => {
    if (!currentUid) return;
    const existing = pushTimers.get(storageKey);
    if (existing) clearTimeout(existing);
    pushTimers.set(
      storageKey,
      setTimeout(() => {
        pushTimers.delete(storageKey);
        const cloudName = SYNC_COLLECTIONS.find(c => c.storageKey === storageKey)?.cloudName;
        if (!cloudName || !currentUid) return;
        pushCollection(currentUid, cloudName, map).catch(() => {
          /* فشل الدفع: يبقى محلياً وسيُدفع في المزامنة التالية */
        });
      }, 800),
    );
  });
}

/** اشتراك لحظي: أي تغيير يصل من جهاز آخر يُطبَّق محلياً فوراً */
function startRealtimeListeners(uid: string): void {
  stopRealtimeListeners();
  channel = supabase
    .channel(`teacher-sync-${uid}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: TEACHER_DATA_TABLE,
        filter: `user_id=eq.${uid}`,
      },
      payload => {
        const row = (payload.new ?? payload.old) as Partial<TeacherDataRow> | null;
        if (!row?.collection) return;
        const storageKey = CLOUD_TO_STORAGE[row.collection];
        if (!storageKey) return;
        const map = readLocalMap(storageKey);
        if (payload.eventType === 'DELETE') {
          delete map[row.entity_id ?? ''];
        } else if (row.entity_id && row.entity) {
          map[row.entity_id] = row.entity;
        }
        applyIncomingCloudData(storageKey, map);
        emitRemoteChanged();
      },
    )
    .subscribe();
}

function stopRealtimeListeners(): void {
  if (channel) {
    supabase.removeChannel(channel).catch(() => {});
    channel = null;
  }
}

/** بدء جلسة المزامنة لحساب جوجل — تُستدعى بعد تسجيل الدخول */
export async function startCloudSync(uid: string): Promise<'downloaded' | 'uploaded' | 'error'> {
  currentUid = uid;
  setSyncState({ available: true, active: true, syncing: true, error: null });
  try {
    const hasCloudData = await pullAllFromCloud(uid);
    if (hasCloudData) {
      emitRemoteChanged();
      setSyncState({ syncing: false, lastSyncAt: new Date().toISOString(), error: null });
      startRealtimeListeners(uid);
      return 'downloaded';
    }
    // السحابة فارغة: هذه أول مرة — ارفع البيانات المحلية
    for (const { storageKey, cloudName } of SYNC_COLLECTIONS) {
      await pushCollection(uid, cloudName, readLocalMap(storageKey));
    }
    setSyncState({ syncing: false, lastSyncAt: new Date().toISOString(), error: null });
    startRealtimeListeners(uid);
    return 'uploaded';
  } catch (e) {
    currentUid = null;
    setSyncState({
      active: false,
      syncing: false,
      error: e instanceof Error ? e.message : 'خطأ في المزامنة',
    });
    return 'error';
  }
}

/** إيقاف المزامنة — تُستدعى عند تسجيل الخروج */
export function stopCloudSync(): void {
  stopRealtimeListeners();
  pushTimers.forEach(t => clearTimeout(t));
  pushTimers.clear();
  currentUid = null;
  resetSyncState();
}

/** زر "مزامنة الآن" اليدوي في الإعدادات */
export async function syncNow(uid?: string): Promise<boolean> {
  return pushAllToCloud(uid);
}

/** تهيئة الجسر مرة واحدة عند تشغيل التطبيق */
export function initCloudSync(): void {
  registerLocalPushHook();
}
