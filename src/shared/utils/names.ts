/**
 * تحليل أسماء الطلاب — دالة نقية موحدة لتنظيف النصوص الملصوقة
 * وقوائم الأسماء المستخرجة بالذكاء الاصطناعي.
 */

/** تنظيف سطر اسم من الترقيم والرموز */
export function cleanNameLine(line: string): string {
  return line
    .replace(/^\s*[-\u2022•]\s*/, '')
    .replace(/^\s*\d+[.)ـ-]?\s*/, '')
    .trim();
}

/** تقسيم نص إلى قائمة أسماء بدون تكرار (يفصل بينها سطر أو فاصلة أو فاصلة منقوطة) */
export function parseNames(raw: string): string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const part of raw.split(/[\n,;،؛\t]/)) {
    const name = cleanNameLine(part);
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    names.push(name);
  }
  return names;
}
