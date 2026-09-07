/**
 * المصطلح التربوي المناسب للمرحلة الدراسية العراقية.
 * المعلم خاص بالمرحلة الابتدائية، والمدرس للمراحل الأخرى.
 */
import type { Stage } from '../types/domain';

export function teacherRoleLabel(stage?: Stage | null): 'المعلم' | 'المدرس' {
  return stage === 'الابتدائية' ? 'المعلم' : 'المدرس';
}
