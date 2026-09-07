/**
 * منطق حساب سجل الدرجات — دالة نقية موحدة تستخدمها الشاشة وخدمة PDF معاً.
 *
 * يوحّد منطق الأعمدة المحسوبة (كان متناقضاً في النسخة الأصلية بين الجدول
 * والمحرر والتقرير) ويصحّح طباعة القيم المحسوبة.
 */
import type { GradeBook, GradeColumn, Student } from '../types/domain';

/**
 * قيمة عمود لطالب: للعمود العادي = الدرجة المخزنة،
 * للمحسوب = AVG (تقريب لأقرب عدد صحيح) أو SUM.
 */
export function columnValue(student: Student, column: GradeColumn): number {
  if (!column.isCalculated) {
    return student.grades[column.id] ?? 0;
  }
  if (column.includedColumnIds.length === 0) {
    return 0;
  }
  const sum = column.includedColumnIds.reduce(
    (acc, id) => acc + (student.grades[id] ?? 0),
    0,
  );
  if (column.calculationType === 'SUM') {
    return sum;
  }
  return Math.round(sum / column.includedColumnIds.length);
}

/**
 * المجموع النهائي للطالب — مجموع درجات الأعمدة العادية فقط
 * (الأعمدة المحسوبة مشتقة ولا تُجمع لتجنّب الازدواج).
 */
export function studentTotal(student: Student, columns: GradeColumn[]): number {
  return columns.reduce((acc, col) => {
    if (col.isCalculated) return acc;
    return acc + (student.grades[col.id] ?? 0);
  }, 0);
}

/** هل الدرجة ناجحة (50% فأكثر)؟ */
export function isPassing(grade: number, maxScore: number): boolean {
  return grade >= maxScore / 2;
}

/** عرض درجة: عدد صحيح أو منزلة واحدة */
export function formatScore(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

/**
 * نسبة النجاح في عمود — تعيد -1 إذا لم توجد درجات (فارغ).
 */
export function columnPassRate(
  students: Student[],
  column: GradeColumn,
): number {
  const gradedStudents = students.filter(student => {
    if (!column.isCalculated) {
      return student.grades[column.id] != null;
    }
    return column.includedColumnIds.some(id => student.grades[id] != null);
  });
  if (gradedStudents.length === 0) return -1;
  let pass = 0;
  for (const s of gradedStudents) {
    if (isPassing(columnValue(s, column), column.maxScore)) pass++;
  }
  return (pass / gradedStudents.length) * 100;
}

/** إحصاءات سريعة للسجل */
export interface GradebookStats {
  studentCount: number;
  assessedCount: number;
  classAverage: number;
  passCount: number;
  failCount: number;
  passRate: number;
}

export function computeStats(gradebook: GradeBook): GradebookStats {
  const { columns, students } = gradebook;
  const normalColumns = columns.filter(c => !c.isCalculated);
  const assessedStudents = students.filter(student =>
    normalColumns.some(column => student.grades[column.id] != null),
  );
  const totals = assessedStudents.map(s => studentTotal(s, columns));
  const studentCount = students.length;
  const assessedCount = assessedStudents.length;
  const classAverage = assessedCount
    ? totals.reduce((a, b) => a + b, 0) / assessedCount
    : 0;

  const fullMarks = normalColumns
    .reduce((acc, c) => acc + c.maxScore, 0);

  const passCount = assessedStudents.filter(s => {
    const total = studentTotal(s, columns);
    return fullMarks > 0 && total >= fullMarks / 2;
  }).length;

  return {
    studentCount,
    assessedCount,
    classAverage,
    passCount,
    failCount: assessedCount - passCount,
    passRate: assessedCount ? (passCount / assessedCount) * 100 : 0,
  };
}
