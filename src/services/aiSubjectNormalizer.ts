/**
 * خدمة تطبيع ومطابقة المواد المنهجية العراقية (Subject Normalizer & Authorization)
 *
 * تحول أسماء المناهج بمختلف الصفوف والمراحل إلى المادة الأساسية:
 * مثال: "كيمياء الرابع العلمي" ← "الكيمياء"
 * ومطابقتها مع المواد المسموح بها في ترخيص المستخدم.
 */
import {
  CANONICAL_BASE_SUBJECTS,
  type CanonicalBaseSubject,
} from '../shared/types/aiUsage';

/**
 * تطبيع اسم المادة وإرجاع المادة الأساسية المعيارية
 */
export function normalizeBaseSubject(raw: string | null | undefined): string {
  if (!raw || typeof raw !== 'string') return 'أخرى';

  const cleaned = raw
    .trim()
    .replace(/[ـ\u0640]/g, '') // إزالة التطويل
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة\b/g, 'ه')
    .toLowerCase();

  // فحص الكلمات المفتاحية الدقيقة للمواد
  if (/كيميا|chem/i.test(cleaned)) return 'الكيمياء';
  if (/فيزيا|phys/i.test(cleaned)) return 'الفيزياء';
  if (/احيا|علوم الحياة|بيولوج|bio/i.test(cleaned)) return 'الأحياء';
  if (/رياضيات|حساب|جبر|هندسه|math/i.test(cleaned)) return 'الرياضيات';
  if (/انكليز|انجليز|english/i.test(cleaned)) return 'اللغة الإنكليزية';
  if (/عرب|قواعد|ادب|نصوص|بلاغه|قراءه|املا/i.test(cleaned)) return 'اللغة العربية';
  if (/اسلام|دين|قران|عقيد/i.test(cleaned)) return 'التربية الإسلامية';
  if (/اجتماع|تاريخ|جغرافي|وطنيه/i.test(cleaned)) return 'الاجتماعيات';
  if (/حاسوب|كمبيوتر|برمج|computer/i.test(cleaned)) return 'الحاسوب';
  if (/فرنس|french/i.test(cleaned)) return 'اللغة الفرنسية';
  if (/اقتصاد/i.test(cleaned)) return 'الاقتصاد';
  if (/فلسف|علم النفس/i.test(cleaned)) return 'الفلسفة وعلم النفس';
  if (/فني|رسم/i.test(cleaned)) return 'التربية الفنية';
  if (/رياضه|بدني/i.test(cleaned)) return 'التربية الرياضية';
  if (/علوم|science/i.test(cleaned)) return 'العلوم';

  // إذا كانت مطابقة مباشرة لأحد الأسماء المعيارية
  const exactMatch = CANONICAL_BASE_SUBJECTS.find(
    s => s === raw.trim() || raw.includes(s),
  );
  if (exactMatch) return exactMatch;

  // تنظيف البادئات واللاحقات الشائعة للدروس والصفوف
  return raw
    .replace(/^(كتاب|منهج|مادة|درس|ملزمة|دفتر)\s+/gi, '')
    .replace(/\s+(للصف|الصف|المرحلة|الاول|الثاني|الثالث|الرابع|الخامس|السادس).*$/gi, '')
    .trim() || raw.trim();
}

/** اسم مستعار مطابق */
export const normalizeToCanonicalSubject = normalizeBaseSubject;

/**
 * التحقق مما إذا كانت المادة المستهدفة مسموحة في ترخيص المستخدم
 */
export function isSubjectAllowed(
  targetSubject: string | null | undefined,
  allowedSubjects: readonly string[] | null | undefined,
): boolean {
  // إذا لم تحدد مادة مستهدفة (مثل عمليات الرؤية العامة أو الأدوات المستقلة)
  if (!targetSubject || !targetSubject.trim()) {
    return true;
  }

  // إذا كانت قائمة المواد المسموحة غير محددة أو فارغة
  if (!allowedSubjects || allowedSubjects.length === 0) {
    return false;
  }

  // إذا كان الترخيص يسمح بكافة المواد
  if (allowedSubjects.includes('*') || allowedSubjects.includes('all')) {
    return true;
  }

  const normalizedTarget = normalizeBaseSubject(targetSubject);

  return allowedSubjects.some(allowed => {
    const normalizedAllowed = normalizeBaseSubject(allowed);
    return (
      normalizedTarget === normalizedAllowed ||
      normalizedTarget.includes(normalizedAllowed) ||
      normalizedAllowed.includes(normalizedTarget)
    );
  });
}

/**
 * رسالة ودية تشرح سبب الرفض عند محاولة استخدام مادة غير مشمولة
 */
export function getSubjectMismatchMessage(
  targetSubject: string,
  allowedSubjects: readonly string[],
): string {
  const targetBase = normalizeBaseSubject(targetSubject);
  const allowedList = allowedSubjects.length > 0
    ? allowedSubjects.map(s => `"${s}"`).join(' و ')
    : 'لم يتم تحديد مادة بعد';

  return `هذه المادة (${targetBase}) غير مشمولة في باقتك الحالية (${allowedList}). ترخيصك مخصص لمواد محددة وفق سياسة الاشتراك، يمكنك ترقية باقتك لإضافة المزيد من المواد.`;
}
