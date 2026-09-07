/**
 * منطق توزيع المنهج السنوي على الأشهر — دالة نقية قابلة للاختبار.
 *
 * يمثل جوهر الخطة السنوية: توزيع الحصص الأسبوعية على الأشهر الدراسية
 * العراقية (أيلول ← أيار) مع خصم أسابيع العطل.
 */
import type { MonthDistribution } from '../types/domain';

/** أسماء الأشهر الدراسية العراقية بالترتيب */
export const IRAQI_MONTHS = [
  'أيلول',
  'تشرين الأول',
  'تشرين الثاني',
  'كانون الأول',
  'كانون الثاني',
  'شباط',
  'آذار',
  'نيسان',
  'أيار',
] as const;

/** عدد أسابيع الشهر الكامل */
const FULL_WEEK_COUNT = 4;
/** عدد أسابيع الشهر الذي يقع فيه عطلة */
const HOLIDAY_WEEK_COUNT = 2;

export interface MonthlyDistributionInput {
  startDate: Date;
  endDate: Date;
  weeklyPeriods: number;
  holidays: Date[];
  isManualAllocation: boolean;
}

/**
 * فهرس الشهر ضمن السنة الدراسية (أيلول=0 ... أيار=8).
 * الأشهر خارج النطاق (حزيران/تموز/آب) ترجع null.
 */
export function monthIndexOf(month: number): number | null {
  // month: 1-12 (يناير=1 ... ديسمبر=12)
  let index = month - 9; // أيلول(9) → 0
  if (index < 0) index += 12;
  return index >= 0 && index <= 8 ? index : null;
}

/** هل تقع أي عطلة ضمن شهر/سنة محددة؟ */
function hasHolidayInMonth(year: number, month: number, holidays: Date[]): boolean {
  return holidays.some(
    h => h.getFullYear() === year && h.getMonth() === month - 1,
  );
}

/**
 * حساب توزيع المنهج على الأشهر بين تاريخي البداية والنهاية.
 */
export function computeMonthlyDistribution(
  input: MonthlyDistributionInput,
): MonthDistribution[] {
  const { startDate, endDate, weeklyPeriods, holidays, isManualAllocation } =
    input;

  const result: MonthDistribution[] = [];

  const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const lastMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

  while (cursor <= lastMonth) {
    const monthIdx = monthIndexOf(cursor.getMonth() + 1);
    if (monthIdx != null) {
      const monthName = IRAQI_MONTHS[monthIdx];
      const hasHoliday = hasHolidayInMonth(
        cursor.getFullYear(),
        cursor.getMonth() + 1,
        holidays,
      );

      const weekCount = hasHoliday ? HOLIDAY_WEEK_COUNT : FULL_WEEK_COUNT;
      const rawPeriods = isManualAllocation ? 0 : weeklyPeriods * 4;
      const periodCount = hasHoliday ? Math.floor(rawPeriods / 2) : rawPeriods;

      result.push({
        month: `${monthName}`,
        weekCount,
        periodCount,
        topics: [],
        objectives: '',
        teachingMethods: '',
        evaluation: '',
        vocabulary: '',
      });
    }
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return result;
}

/** توليد مواضيع افتراضية لشهر (تُستخدم في الوضع اليدوي/الاسترشادي) */
export function defaultMonthTopics(
  monthName: string,
  index: number,
): string[] {
  return [`الفصل ${index + 1}: عنوان الفصل`, 'موضوعات فرعية...'];
}
