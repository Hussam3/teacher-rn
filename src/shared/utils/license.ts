/** منطق عرض الترخيص النقي والقابل للاختبار. */

/** توحيد صيغة الرمز مع السماح بالمجموعات المفصولة بشرطات أو مسافات. */
export function normalizeActivationCode(input: string): string {
  return input
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

/** عبارة قصيرة قابلة للعرض داخل التطبيق أثناء التجربة. */
export function trialRemainingMessage(
  expiresAt: string,
  now = Date.now(),
): string {
  const expiresAtMs = Date.parse(expiresAt);
  if (!Number.isFinite(expiresAtMs) || expiresAtMs <= now) {
    return 'انتهت الفترة التجريبية';
  }

  const days = Math.ceil((expiresAtMs - now) / (24 * 60 * 60 * 1000));
  if (days <= 1) return 'تنتهي تجربتك المجانية اليوم';
  if (days === 2) return 'متبقي يومان من الفترة التجريبية';
  return `متبقي ${days} أيام من الفترة التجريبية`;
}
