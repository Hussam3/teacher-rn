/**
 * خدمة النسخ الاحتياطي — تصدير واستيراد كل البيانات بصيغة JSON (v2).
 */
import { backupSchema } from '../../shared/types/schemas';
import {
  annualPlanRepo,
  dailyPlanRepo,
  documentRepo,
  gradebookRepo,
  repositories,
  scheduleRepo,
  subjectRepo,
} from '../repositories';
import { settingsRepo } from '../repositories/settingsRepo';
import { cancelAllAlarms } from '../../services/notificationService';
import { StorageKeys, storage } from '../../shared/lib/storage';

const APP_ID = 'teacher-bag';
const FORMAT_VERSION = 2;

/** بناء نسخة احتياطية كاملة */
export function buildBackup(): string {
  return JSON.stringify(
    {
      app: APP_ID,
      version: FORMAT_VERSION,
      exportedAt: new Date().toISOString(),
      data: {
        subjects: subjectRepo.list(),
        schedule: scheduleRepo.list(),
        daily_plans: dailyPlanRepo.list(),
        annual_plans: annualPlanRepo.list(),
        gradebooks: gradebookRepo.list(),
        documents: documentRepo.list(),
        settings: settingsRepo.get(),
      },
    },
    null,
    2,
  );
}

/** هل المحتوى نسخة احتياطية صالحة؟ */
export function isValidBackup(json: string): boolean {
  try {
    return backupSchema.safeParse(JSON.parse(json)).success;
  } catch {
    return false;
  }
}

/** استعادة البيانات (تستبدل كل شيء) */
export function restoreBackup(json: string): void {
  if (!isValidBackup(json)) {
    throw new Error('ملف النسخة الاحتياطية غير صالح');
  }
  const payload = backupSchema.parse(JSON.parse(json));
  const data = payload.data as Record<string, unknown>;

  cancelAllAlarms();

  // مسح ثم كتابة
  subjectRepo.clear();
  scheduleRepo.clear();
  dailyPlanRepo.clear();
  annualPlanRepo.clear();
  gradebookRepo.clear();
  documentRepo.clear();

  subjectRepo.saveAll((data.subjects as [] | undefined) ?? []);
  scheduleRepo.saveAll((data.schedule as [] | undefined) ?? []);
  dailyPlanRepo.saveAll((data.daily_plans as [] | undefined) ?? []);
  annualPlanRepo.saveAll((data.annual_plans as [] | undefined) ?? []);
  gradebookRepo.saveAll((data.gradebooks as [] | undefined) ?? []);
  documentRepo.saveAll((data.documents as [] | undefined) ?? []);

  if (data.settings) {
    settingsRepo.replaceAll(
      data.settings as ReturnType<typeof settingsRepo.get>,
    );
  }
}

/** إعادة تعيين كامل — حذف كل البيانات والتنبيهات */
export function resetAll(): void {
  cancelAllAlarms();
  repositories.subjects.clear();
  repositories.schedule.clear();
  repositories.dailyPlans.clear();
  repositories.annualPlans.clear();
  repositories.gradebooks.clear();
  repositories.documents.clear();
  storage.remove(StorageKeys.settings);
  storage.remove(StorageKeys.notificationMap);
}
