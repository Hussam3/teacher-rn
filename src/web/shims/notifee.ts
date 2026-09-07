/**
 * محاكي التنبيهات على الويب — واجهة فارغة آمنة (لا إشعارات مجدولة في المتصفح).
 */
export const AlarmType = {
  SET_ALARM: 'setAlarm',
  SET_EXACT: 'setExact',
  SET_AND_ALLOW_WHILE_IDLE: 'setExactAndAllowWhileIdle',
} as const;

export const AndroidImportance = {
  NONE: 0,
  MIN: 1,
  LOW: 2,
  DEFAULT: 3,
  HIGH: 4,
  MAX: 5,
} as const;

export const RepeatFrequency = {
  NONE: 0,
  HOURLY: 1,
  DAILY: 2,
  WEEKLY: 3,
} as const;

export const TriggerType = {
  TIMESTAMP: 0,
  INTERVAL: 1,
} as const;

let counter = 0;

const notifee = {
  async createChannel(): Promise<void> {
    /* لا قنوات على الويب */
  },
  async requestPermission(): Promise<{ authorizationStatus: number }> {
    return { authorizationStatus: 1 };
  },
  async createTriggerNotification(): Promise<string> {
    counter += 1;
    return `web-notif-${counter}`;
  },
  async cancelTriggerNotification(): Promise<void> {
    /* لا شيء */
  },
  async cancelAllNotifications(): Promise<void> {
    /* لا شيء */
  },
  async getInitialNotification(): Promise<null> {
    return null;
  },
  onForegroundEvent() {
    return () => {};
  },
  onBackgroundEvent() {
    return () => {};
  },
  async displayNotification(): Promise<string> {
    counter += 1;
    return `web-notif-${counter}`;
  },
};

export default notifee;