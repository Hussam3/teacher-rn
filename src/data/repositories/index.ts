/**
 * مستودعات البيانات — واجهة الوصول الوحيدة إلى التخزين المحلي.
 *
 * القاعدة الذهبية: مكوّنات الواجهة (features) لا تلمس MMKV مباشرة أبداً،
 * بل تمر عبر هذه المستودعات (أو عبر مخازن Zustand التي تغلّفها).
 */
import type {
  AnnualPlan,
  DailyPlan,
  GradeBook,
  ScheduleCell,
  Subject,
} from '../../shared/types/domain';
import type { EditorDocument } from '../../shared/types/editor';
import { StorageKeys } from '../../shared/lib/storage';
import { createCollectionRepo } from './collection';

export const subjectRepo = createCollectionRepo<Subject>(StorageKeys.subjects);
export const scheduleRepo = createCollectionRepo<ScheduleCell>(StorageKeys.schedule);
export const dailyPlanRepo = createCollectionRepo<DailyPlan>(StorageKeys.dailyPlans);
export const annualPlanRepo = createCollectionRepo<AnnualPlan>(
  StorageKeys.annualPlans,
);
export const gradebookRepo = createCollectionRepo<GradeBook>(
  StorageKeys.gradebooks,
);
export const documentRepo = createCollectionRepo<EditorDocument>(
  StorageKeys.documents,
);
export const repositories = {
  subjects: subjectRepo,
  schedule: scheduleRepo,
  dailyPlans: dailyPlanRepo,
  annualPlans: annualPlanRepo,
  gradebooks: gradebookRepo,
  documents: documentRepo,
} as const;
