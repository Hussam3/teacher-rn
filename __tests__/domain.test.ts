/**
 * اختبارات منطق المجال — سجل الدرجات، التوزيع الشهري، التجزئة، التواريخ.
 */
import { columnValue, studentTotal, isPassing, computeStats, columnPassRate } from '../src/shared/utils/gradebook';
import { parseNames } from '../src/shared/utils/names';
import { computeMonthlyDistribution, monthIndexOf } from '../src/shared/utils/monthlyDistribution';
import { stableIndex, fnv1aHash } from '../src/shared/utils/hash';
import { todayWeekdayIndex } from '../src/shared/utils/date';
import { teacherRoleLabel } from '../src/shared/utils/teacherRole';
import {
  dailyPlanTopicLabel,
  getDailyPlanTopics,
  parseDailyPlanTopics,
} from '../src/shared/types/domain';
import type { GradeBook, GradeColumn, Student } from '../src/shared/types/domain';

function col(id: string, opts: Partial<GradeColumn> = {}): GradeColumn {
  return {
    id,
    name: id,
    maxScore: 100,
    weight: 10,
    isCalculated: false,
    includedColumnIds: [],
    calculationType: 'AVG',
    ...opts,
  };
}

describe('سجل الدرجات — حساب القيم', () => {
  const m1 = col('m1');
  const m2 = col('m2');
  const avg = col('avg', { isCalculated: true, includedColumnIds: ['m1', 'm2'], calculationType: 'AVG' });
  const sum = col('sum', { isCalculated: true, includedColumnIds: ['m1', 'm2'], calculationType: 'SUM' });

  const student: Student = { id: 's1', name: 'طالب', order: 0, grades: { m1: 80, m2: 90 } };

  it('يحسب المعدل بتقريب لأقرب عدد صحيح', () => {
    expect(columnValue(student, avg)).toBe(85);
  });

  it('يحسب المجموع', () => {
    expect(columnValue(student, sum)).toBe(170);
  });

  it('يعتبر الدرجة الناقصة صفراً في المعدل', () => {
    const s: Student = { id: 's2', name: 'طالب', order: 0, grades: { m1: 80 } };
    expect(columnValue(s, avg)).toBe(40);
  });

  it('المجموع النهائي يجمع الأعمدة العادية فقط', () => {
    const columns = [m1, m2, avg, sum];
    expect(studentTotal(student, columns)).toBe(170);
  });

  it('ناجح عند 50% فأكثر', () => {
    expect(isPassing(50, 100)).toBe(true);
    expect(isPassing(49, 100)).toBe(false);
  });

  it('إحصاءات السجل', () => {
    const gb: GradeBook = {
      id: 'g',
      subjectId: 'subj',
      className: 'الخامس',
      academicYear: '2026',
      columns: [m1, m2],
      students: [
        { id: 'a', name: 'ناجح', order: 0, grades: { m1: 80, m2: 90 } },
        { id: 'b', name: 'راسب', order: 1, grades: { m1: 30, m2: 20 } },
      ],
      createdAt: new Date().toISOString(),
    };
    const stats = computeStats(gb);
    expect(stats.studentCount).toBe(2);
    expect(stats.passCount).toBe(1);
    expect(stats.failCount).toBe(1);
    expect(stats.passRate).toBe(50);
    expect(stats.assessedCount).toBe(2);
  });

  it('لا يعد الطالب بلا درجة راسباً في الإحصاءات', () => {
    const gb: GradeBook = {
      id: 'g-empty',
      subjectId: 'subj',
      className: 'الخامس',
      academicYear: '2026',
      columns: [m1],
      students: [{ id: 'a', name: 'غير مقيم', order: 0, grades: {} }],
      createdAt: new Date().toISOString(),
    };
    const stats = computeStats(gb);
    expect(stats.assessedCount).toBe(0);
    expect(stats.passCount).toBe(0);
    expect(stats.failCount).toBe(0);
  });

  it('نسبة النجاح لكل عمود', () => {
    const students: Student[] = [
      { id: 'a', name: 'أ', order: 0, grades: { m1: 80, m2: 40 } },
      { id: 'b', name: 'ب', order: 1, grades: { m1: 20, m2: 60 } },
      { id: 'c', name: 'ج', order: 2, grades: { m1: 90, m2: 90 } },
    ];
    expect(columnPassRate(students, col('m1', { maxScore: 100 }))).toBeCloseTo(66.67, 1);
    expect(columnPassRate(students, col('m2', { maxScore: 100 }))).toBeCloseTo(66.67, 1);
  });

  it('نسبة النجاح -1 لعمود بدون درجات', () => {
    expect(columnPassRate([], col('m1'))).toBe(-1);
  });

  it('لا يعدّ الطلاب بلا درجة ضمن نسبة النجاح', () => {
    const students: Student[] = [
      { id: 'a', name: 'أ', order: 0, grades: {} },
      { id: 'b', name: 'ب', order: 1, grades: {} },
    ];
    expect(columnPassRate(students, col('m1'))).toBe(-1);
  });
});

describe('مسمى الكادر التربوي', () => {
  it('يستخدم المعلم للابتدائية والمدرس للمراحل الأخرى', () => {
    expect(teacherRoleLabel('الابتدائية')).toBe('المعلم');
    expect(teacherRoleLabel('المتوسطة')).toBe('المدرس');
    expect(teacherRoleLabel('الإعدادية')).toBe('المدرس');
  });
});

describe('تحليل أسماء الطلاب', () => {
  it('يستخرج الأسماء ويزيل الترقيم والرموز', () => {
    expect(parseNames('1. أحمد محمد\n- علي حسن، 2. زينب\nزينب،')).toEqual([
      'أحمد محمد',
      'علي حسن',
      'زينب',
    ]);
  });

  it('يتجاهل السطور الفارغة والتكرار', () => {
    expect(parseNames('\nحسين كريم\n\nحسين كريم\n')).toEqual(['حسين كريم']);
  });

  it('يدعم الفاصلة والفاصلة المنقوطة والتبويب', () => {
    expect(parseNames('سارة؛ليلى\tنور، رنا')).toEqual(['سارة', 'ليلى', 'نور', 'رنا']);
  });
});

describe('موضوعات الخطة اليومية', () => {
  it('يحلل الموضوعات المكتوبة في سطور أو مفصولة بفواصل ويزيل التكرار', () => {
    expect(
      parseDailyPlanTopics('الروابط الكيميائية\nالتهجين، الروابط الكيميائية؛ الأشكال الهندسية'),
    ).toEqual(['الروابط الكيميائية', 'التهجين', 'الأشكال الهندسية']);
  });

  it('يبقي الخطط القديمة ذات الموضوع الواحد قابلة للعرض', () => {
    expect(getDailyPlanTopics({ topic: 'جمع الكسور' })).toEqual(['جمع الكسور']);
    expect(
      dailyPlanTopicLabel({
        topic: 'جمع الكسور، تبسيط الكسور',
        topics: ['جمع الكسور', 'تبسيط الكسور'],
      }),
    ).toBe('جمع الكسور، تبسيط الكسور');
  });
});

describe('التوزيع الشهري للخطة السنوية', () => {
  it('يرسم فهرس الشهر أيلول=0 وأيار=8', () => {
    expect(monthIndexOf(9)).toBe(0);
    expect(monthIndexOf(5)).toBe(8);
    expect(monthIndexOf(6)).toBeNull();
    expect(monthIndexOf(1)).toBe(4);
  });

  it('يوزع 9 أشهر (أيلول-أيار) بحصص أسبوعية', () => {
    const dist = computeMonthlyDistribution({
      startDate: new Date(2025, 8, 1),
      endDate: new Date(2026, 5, 30),
      weeklyPeriods: 3,
      holidays: [],
      isManualAllocation: false,
    });
    expect(dist.length).toBe(9);
    expect(dist[0]!.month).toBe('أيلول');
    expect(dist[0]!.periodCount).toBe(12);
    expect(dist[0]!.weekCount).toBe(4);
    expect(dist[8]!.month).toBe('أيار');
  });

  it('يخفض حصص شهر العطلة للنصف مع أسبوعين', () => {
    const dist = computeMonthlyDistribution({
      startDate: new Date(2025, 8, 1),
      endDate: new Date(2026, 5, 30),
      weeklyPeriods: 4,
      holidays: [new Date(2026, 0, 15)],
      isManualAllocation: false,
    });
    const january = dist.find(d => d.month === 'كانون الثاني');
    expect(january?.periodCount).toBe(8);
    expect(january?.weekCount).toBe(2);
  });

  it('التوزيع اليدوي يجعل الحصص صفراً', () => {
    const dist = computeMonthlyDistribution({
      startDate: new Date(2025, 8, 1),
      endDate: new Date(2026, 5, 30),
      weeklyPeriods: 3,
      holidays: [],
      isManualAllocation: true,
    });
    expect(dist[0]!.periodCount).toBe(0);
  });
});

describe('التجزئة الحتمية', () => {
  it('تنتج فهرساً ثابتاً لنفس النص', () => {
    const a = stableIndex('الرياضيات', 8);
    const b = stableIndex('الرياضيات', 8);
    expect(a).toBe(b);
  });

  it('توزع القيم عبر المدى', () => {
    for (const name of ['الرياضيات', 'العلوم', 'الفيزياء', 'اللغة العربية']) {
      const idx = stableIndex(name, 8);
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(8);
    }
  });

  it('fnv1a مستقر عبر التشغيلات', () => {
    expect(fnv1aHash('اختبار')).toBe(fnv1aHash('اختبار'));
  });
});

describe('فهرس اليوم الحالي', () => {
  it('الأحد=0، الخميس=4، الجمعة/السبت=null', () => {
    expect(todayWeekdayIndex(new Date(2026, 7, 16))).toBe(0); // الأحد
    expect(todayWeekdayIndex(new Date(2026, 7, 13))).toBe(4); // الخميس
    expect(todayWeekdayIndex(new Date(2026, 7, 14))).toBeNull(); // الجمعة
    expect(todayWeekdayIndex(new Date(2026, 7, 15))).toBeNull(); // السبت
  });
});
