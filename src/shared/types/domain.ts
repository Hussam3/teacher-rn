/**
 * حقيبة المدرس — نماذج المجال (Domain Models)
 *
 * تعريفات TypeScript نقية 100% لكل كيانات التطبيق. هذه الأنواع هي المصدر
 * الوحيد للحقيقة، ولا تعتمد على أي مكتبة طرف ثالث (لا React ولا React Native).
 */

/** المراحل الدراسية العراقية */
export type Stage = 'الابتدائية' | 'المتوسطة' | 'الإعدادية';

/** أيام الأسبوع الدراسي العراقي (الأحد ← الخميس) */
export const IRAQI_WEEKDAYS = [
  'الأحد',
  'الإثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
] as const;

/** فهرس اليوم في الجدول (0-4) */
export type WeekdayIndex = 0 | 1 | 2 | 3 | 4;

/** فهرس الحصة (0-6) */
export type PeriodIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** عدد أيام وحصص الجدول */
export const SCHEDULE_DAYS = 5;
export const SCHEDULE_PERIODS = 7;

/** أوضاع الثيم */
export type ThemeMode = 'system' | 'light' | 'dark';

/** المادة الدراسية / المنهج */
export interface Subject {
  id: string;
  name: string;
  stage: Stage;
  grade: string;
  year: string;
  /** مسار ملف PDF محلي (منصات الجوال) */
  pdfUri?: string | null;
  /** بيانات PDF بصيغة Base64 (للويب — محفوظة للتوافق) */
  pdfBase64?: string | null;
  createdAt: string;
}

/** خلية في جدول الحصص (حصة واحدة) */
export interface ScheduleCell {
  id: string;
  day: WeekdayIndex;
  period: PeriodIndex;
  subjectId: string | null;
  /** الشعبة أو الصف */
  className: string | null;
  /** معرف خطة يومية مرتبطة */
  lessonPlanId: string | null;
  isAlarmEnabled: boolean;
  /** وقت التنبيه "HH:mm" */
  alarmTime: string | null;
}

/** الخطة اليومية */
export interface DailyPlan {
  id: string;
  subjectId: string;
  /** العنوان المختصر القديم للخطة؛ يُحفظ لتبقى الخطط السابقة متوافقة. */
  topic: string;
  /** موضوعات الحصة بالترتيب. الخطط المحفوظة القديمة قد لا تحتوي هذا الحقل. */
  topics?: string[];
  date: string;
  className: string;
  /** مدة الحصة بالدقائق */
  duration: number;
  /** الأهداف السلوكية */
  objectives: string;
  /** التمهيد */
  introduction: string;
  /** عرض الدرس */
  presentation: string;
  /** الوسائل التعليمية */
  activities: string;
  /** التقويم */
  evaluation: string;
  /** الواجب البيتي */
  homework: string;
  isEdited: boolean;
  createdAt: string;
}

/** توحيد الموضوعات وإزالة العناصر الفارغة أو المكررة. */
export function normalizeDailyPlanTopics(topics: readonly string[]): string[] {
  const seen = new Set<string>();
  return topics.filter(topic => {
    const normalized = topic.trim();
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  }).map(topic => topic.trim());
}

/** تحليل موضوعات يكتبها المعلم في سطور أو مفصولة بفواصل. */
export function parseDailyPlanTopics(value: string): string[] {
  return normalizeDailyPlanTopics(value.split(/[\n،,؛;]+/));
}

/** يعيد الموضوعات من النموذج الجديد أو من الحقل القديم للخطط المحفوظة. */
export function getDailyPlanTopics(
  plan: Pick<DailyPlan, 'topic' | 'topics'>,
): string[] {
  const topics = normalizeDailyPlanTopics(plan.topics ?? []);
  return topics.length ? topics : normalizeDailyPlanTopics([plan.topic]);
}

export function dailyPlanTopicLabel(
  plan: Pick<DailyPlan, 'topic' | 'topics'>,
): string {
  return getDailyPlanTopics(plan).join('، ');
}

/** توزيع شهر في الخطة السنوية */
export interface MonthDistribution {
  month: string;
  weekCount: number;
  periodCount: number;
  topics: string[];
  objectives: string;
  teachingMethods: string;
  evaluation: string;
  vocabulary: string;
}

/** الخطة السنوية */
export interface AnnualPlan {
  id: string;
  subjectId: string;
  teacherName: string;
  className: string;
  startDate: string;
  endDate: string;
  weeklyPeriods: number;
  holidays: string[];
  exams: string[];
  distribution: MonthDistribution[];
  generalObjectives: string;
  teachingAids: string;
  isEdited: boolean;
  createdAt: string;
}

/** عمود في سجل الدرجات */
export interface GradeColumn {
  id: string;
  name: string;
  maxScore: number;
  weight: number;
  isCalculated: boolean;
  includedColumnIds: string[];
  calculationType: 'AVG' | 'SUM';
}

/** طالب في سجل الدرجات */
export interface Student {
  id: string;
  name: string;
  order: number;
  /** columnId → الدرجة */
  grades: Record<string, number>;
}

/** سجل الدرجات */
export interface GradeBook {
  id: string;
  subjectId: string;
  /** اسم يميّز السجل عند وجود أكثر من سجل للمادة نفسها */
  title?: string;
  className: string;
  academicYear: string;
  columns: GradeColumn[];
  students: Student[];
  createdAt: string;
}

/** إعدادات التطبيق المحفوظة محلياً */
export interface AppSettings {
  themeMode: ThemeMode;
  isGuest: boolean;
}

/** مستخدم التطبيق */
export interface AppUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoUrl: string | null;
  isGuest: boolean;
}

/** أنواع الأسئلة المولّدة بالذكاء الاصطناعي */
export type QuestionType =
  | 'mcq'
  | 'definition'
  | 'reasoning'
  | 'fill_blanks'
  | 'true_false'
  | 'enumerate'
  | 'calculation';

/** سؤال مولّد */
export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  options?: string[];
  correctAnswer?: string;
  modelAnswer?: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'mix';
  source?: string;
}

/** طلب توليد خطة سنوية */
export interface AnnualPlanRequest {
  subjectId: string;
  teacherName: string;
  className: string;
  startDate: string;
  endDate: string;
  weeklyPeriods: number;
  curriculumContent: string;
  holidays: string[];
  isManualAllocation: boolean;
  midYearHolidayStart: string | null;
  midYearHolidayEnd: string | null;
}
