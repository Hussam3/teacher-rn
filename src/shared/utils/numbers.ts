/**
 * أدوات رقمية — محاكاة سلوك toStringAsFixed في Dart وغيرها.
 */

/** تقريب رقم إلى منزلة عشرية واحدة */
export function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/** عرض رقم كعدد صحيح إذا كان صحيحاً، وإلا بمنزلة واحدة */
export function formatGrade(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

/** عرض رقم بدون كسور */
export function formatInt(value: number): string {
  return String(Math.round(value));
}

/** تحويل نص إلى رقم بأمان */
export function parseNum(value: string | undefined | null): number | null {
  if (value == null || value.trim() === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
