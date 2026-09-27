/**
 * المصطلح التربوي المناسب للمرحلة الدراسية العراقية.
 * المعلم خاص بالمرحلة الابتدائية، والمدرس للمراحل الأخرى.
 */
import type { Stage } from '../types/domain';

export function teacherRoleLabel(stage?: Stage | null): 'المعلم' | 'المدرس' {
  return stage === 'الابتدائية' ? 'المعلم' : 'المدرس';
}

/** استنباط المرحلة الدراسية من اسم الصف المكتوب (مثل: الخامس الابتدائي، الرابع المتوسط). */
export function stageFromClassName(
  className?: string | null,
): Stage | null {
  if (!className) return null;
  if (className.includes('ابتدائي')) return 'الابتدائية';
  if (className.includes('متوسط')) return 'المتوسطة';
  if (className.includes('إعدادي') || className.includes('اعدادي')) {
    return 'الإعدادية';
  }
  return null;
}

/** مسمى الكادر التربوي المستنبط من اسم الصف مباشرة. */
export function roleLabelFromClassName(
  className?: string | null,
): 'المعلم' | 'المدرس' {
  return teacherRoleLabel(stageFromClassName(className));
}
