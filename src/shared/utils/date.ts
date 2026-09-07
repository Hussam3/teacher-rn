/**
 * أدوات التاريخ والتنسيق — مركزية لكل عمليات التاريخ في التطبيق.
 */
import { format, isValid, parseISO } from 'date-fns';

const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

/** تحويل الأرقام اللاتينية إلى أرقام عربية مشرقية */
export function toArabicDigits(input: string | number): string {
  return String(input).replace(/\d/g, d => ARABIC_DIGITS[Number(d)] ?? d);
}

/** تنسيق تاريخ بصيغة yyyy/MM/dd */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '';
  return format(d, 'yyyy/MM/dd');
}

/** تنسيق تاريخ بصيغة yyyy/MM/dd بأرقام عربية */
export function formatDateArabic(date: Date | string): string {
  return toArabicDigits(formatDate(date));
}

/** تنسيق وقت بصيغة HH:mm */
export function formatTime(time: string): string {
  return time;
}

/** بناء تاريخ اليوم بصيغة ISO */
export function todayISO(): string {
  return new Date().toISOString();
}

/** بناء كائن تاريخ من مكوّنات (السنة، الشهر، اليوم) بدون مشاكل المنطقة الزمنية */
export function buildDate(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day);
}

/** تحويل سلسلة "HH:mm" إلى كائن وقت دقائقي {hour, minute} */
export function parseTime(time: string): { hour: number; minute: number } {
  const [h, m] = time.split(':');
  return { hour: Number(h) ?? 0, minute: Number(m) ?? 0 };
}

/**
 * فهرس اليوم الحالي في جدول الحصص.
 * الأحد ← 0، الإثنين ← 1 ... الخميس ← 4.
 * الجمعة (5) والسبت (6) يرجعان null (عطلة نهاية الأسبوع العراقية).
 */
export function todayWeekdayIndex(now: Date = new Date()): number | null {
  const day = now.getDay(); // 0=Sunday ... 6=Saturday
  if (day === 5 || day === 6) return null;
  return day;
}

/** فحص صلاحية سلسلة تاريخ ISO */
export function isValidISO(value: string): boolean {
  return isValid(parseISO(value));
}
