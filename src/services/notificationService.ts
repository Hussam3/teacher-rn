/**
 * خدمة التنبيهات — جدولة تنبيهات الحصص الفعلية عبر Notifee.
 *
 * تفعيل حقيقي لميزة كانت مجرد بيانات مخزنة في النسخة الأصلية:
 * جدولة إشعار أسبوعي متكرر قبل الحصة بعدد دقائق محدد.
 */
import notifee, {
  AlarmType,
  AndroidImportance,
  RepeatFrequency,
  TriggerType,
  type TimestampTrigger,
} from '@notifee/react-native';
import { readJSON, writeJSON, StorageKeys } from '../shared/lib/storage';

const CHANNEL_ID = 'lesson-alarms';
/** عدد دقائق التنبيه قبل الحصة */
const ALARM_OFFSET_MINUTES = 10;

/** خريطة ربط: cellId → notificationId */
type NotificationMap = Record<string, string>;

function readMap(): NotificationMap {
  return readJSON<NotificationMap>(StorageKeys.notificationMap, {});
}

async function ensureChannel(): Promise<void> {
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: 'حقيبة المدرس — تنبيهات الحصص',
    importance: AndroidImportance.HIGH,
  });
}

/** طلب صلاحية الإشعارات */
export async function requestNotificationPermission(): Promise<boolean> {
  await ensureChannel();
  const settings = await notifee.requestPermission();
  return settings.authorizationStatus >= 1;
}

/** حساب التاريخ القادم ليوم الأسبوع والوقت المحددين */
export function nextOccurrence(
  weekdayIndex: number,
  time: string,
  offsetMinutes = ALARM_OFFSET_MINUTES,
): Date {
  const [h, m] = time.split(':').map(Number);
  const now = new Date();
  const today = now.getDay(); // 0=Sunday ... 6=Saturday

  let daysUntil = (weekdayIndex - today + 7) % 7;
  const target = new Date(now);
  target.setDate(now.getDate() + daysUntil);
  target.setHours(h ?? 0, (m ?? 0) - offsetMinutes, 0, 0);

  if (target <= now) {
    target.setDate(target.getDate() + 7);
  }
  return target;
}

/**
 * جدولة تنبيه حصة أسبوعي متكرر.
 * @returns معرّف التنبيه أو null عند الفشل
 */
export async function scheduleLessonAlarm(params: {
  cellId: string;
  day: number;
  time: string;
  title: string;
  body: string;
}): Promise<string | null> {
  try {
    await ensureChannel();
    await notifee.requestPermission();

    const triggerDate = nextOccurrence(params.day, params.time);

    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: triggerDate.getTime(),
        repeatFrequency: RepeatFrequency.WEEKLY,
        alarmManager: {
          // Inexact alarms avoid the restricted exact-alarm permission in Play builds.
          type: AlarmType.SET,
        },
    };

    const id = await notifee.createTriggerNotification(
      {
        title: params.title,
        body: params.body,
        android: {
          channelId: CHANNEL_ID,
          pressAction: { id: 'default' },
          smallIcon: 'ic_launcher',
        },
      },
      trigger,
    );

    const map = readMap();
    map[params.cellId] = id;
    writeJSON(StorageKeys.notificationMap, map);
    return id;
  } catch {
    return null;
  }
}

/** إلغاء تنبيه حصة */
export async function cancelLessonAlarm(cellId: string): Promise<void> {
  try {
    const map = readMap();
    const id = map[cellId];
    if (id) {
      await notifee.cancelTriggerNotification(id);
      delete map[cellId];
      writeJSON(StorageKeys.notificationMap, map);
    }
  } catch {}
}

/** إلغاء جميع التنبيهات (عند إعادة التعيين) */
export async function cancelAllAlarms(): Promise<void> {
  try {
    await notifee.cancelAllNotifications();
    writeJSON(StorageKeys.notificationMap, {});
  } catch {}
}
