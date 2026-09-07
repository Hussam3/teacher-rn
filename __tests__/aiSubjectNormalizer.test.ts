/**
 * اختبارات تطبيع ومطابقة المواد الدراسية المعيارية للمناهج العراقية
 */
import {
  normalizeToCanonicalSubject,
  isSubjectAllowed,
} from '../src/services/aiSubjectNormalizer';

describe('aiSubjectNormalizer - تطبيع وفحص المواد الدراسية', () => {
  describe('normalizeToCanonicalSubject', () => {
    it('يطبع مشتقات مادة الكيمياء للمادة المعيارية', () => {
      expect(normalizeToCanonicalSubject('كيمياء')).toBe('الكيمياء');
      expect(normalizeToCanonicalSubject('الكيمياء')).toBe('الكيمياء');
      expect(normalizeToCanonicalSubject('كيمياء الرابع العلمي')).toBe('الكيمياء');
      expect(normalizeToCanonicalSubject('كتاب الكيمياء للصف السادس الإعدادي')).toBe('الكيمياء');
    });

    it('يطبع مشتقات الفيزياء', () => {
      expect(normalizeToCanonicalSubject('فيزياء')).toBe('الفيزياء');
      expect(normalizeToCanonicalSubject('الفيزياء')).toBe('الفيزياء');
      expect(normalizeToCanonicalSubject('فيزياء الثالث متوسط')).toBe('الفيزياء');
      expect(normalizeToCanonicalSubject('منهج الفيزياء للصف الخامس التطبيقي')).toBe('الفيزياء');
    });

    it('يطبع مشتقات الرياضيات', () => {
      expect(normalizeToCanonicalSubject('رياضيات')).toBe('الرياضيات');
      expect(normalizeToCanonicalSubject('الرياضيات')).toBe('الرياضيات');
      expect(normalizeToCanonicalSubject('رياضيات السادس الأدبي')).toBe('الرياضيات');
      expect(normalizeToCanonicalSubject('كتاب الرياضيات الأول متوسط')).toBe('الرياضيات');
    });

    it('يطبع مشتقات اللغة العربية والإنكليزية والإسلامية', () => {
      expect(normalizeToCanonicalSubject('اللغة العربية')).toBe('اللغة العربية');
      expect(normalizeToCanonicalSubject('قواعد اللغة العربية')).toBe('اللغة العربية');
      expect(normalizeToCanonicalSubject('عربي')).toBe('اللغة العربية');

      expect(normalizeToCanonicalSubject('اللغة الإنكليزية')).toBe('اللغة الإنكليزية');
      expect(normalizeToCanonicalSubject('اللغة الانكليزية')).toBe('اللغة الإنكليزية');
      expect(normalizeToCanonicalSubject('انكليزي')).toBe('اللغة الإنكليزية');
      expect(normalizeToCanonicalSubject('English')).toBe('اللغة الإنكليزية');

      expect(normalizeToCanonicalSubject('التربية الإسلامية')).toBe('التربية الإسلامية');
      expect(normalizeToCanonicalSubject('إسلامية')).toBe('التربية الإسلامية');
      expect(normalizeToCanonicalSubject('التربية الاسلامية والقرآن الكريم')).toBe('التربية الإسلامية');
    });

    it('يطبع مشتقات الاجتماعيات والعلوم والأحياء والحاسوب', () => {
      expect(normalizeToCanonicalSubject('أحياء')).toBe('الأحياء');
      expect(normalizeToCanonicalSubject('الأحياء للصف الخامس العلمي')).toBe('الأحياء');
      expect(normalizeToCanonicalSubject('علوم')).toBe('العلوم');
      expect(normalizeToCanonicalSubject('علوم الثاني متوسط')).toBe('العلوم');
      expect(normalizeToCanonicalSubject('اجتماعيات')).toBe('الاجتماعيات');
      expect(normalizeToCanonicalSubject('تاريخ وجغرافية')).toBe('الاجتماعيات');
      expect(normalizeToCanonicalSubject('حاسوب')).toBe('الحاسوب');
    });

    it('يعيد النص المنظف إذا لم يكن ضمن المواد المعروفة مع إزالة البادئات', () => {
      expect(normalizeToCanonicalSubject('مادة تجريبية خاصة')).toBe('تجريبية خاصة');
      expect(normalizeToCanonicalSubject('منهج التمريض السريري')).toBe('التمريض السريري');
    });
  });

  describe('isSubjectAllowed', () => {
    it('يسمح بكافة المواد عند تفعيل خيار كافة المواد (*)', () => {
      expect(isSubjectAllowed('كيمياء الرابع العلمي', ['*'])).toBe(true);
      expect(isSubjectAllowed('فيزياء السادس العلمي', ['*'])).toBe(true);
    });

    it('يرفض عند خلو قائمة المواد المصرح بها', () => {
      expect(isSubjectAllowed('كيمياء الرابع العلمي', [])).toBe(false);
      expect(isSubjectAllowed('فيزياء السادس العلمي', null)).toBe(false);
    });

    it('يسمح بالمادة عندما تطابق إحدى المواد المصرح بها', () => {
      const allowed = ['الكيمياء'];
      expect(isSubjectAllowed('الكيمياء', allowed)).toBe(true);
      expect(isSubjectAllowed('كيمياء الرابع العلمي', allowed)).toBe(true);
      expect(isSubjectAllowed('كتاب الكيمياء السادس الإحيائي', allowed)).toBe(true);
    });

    it('يرفض المادة عندما لا تطابق المواد المصرح بها', () => {
      const allowed = ['الكيمياء'];
      expect(isSubjectAllowed('الفيزياء', allowed)).toBe(false);
      expect(isSubjectAllowed('فيزياء الثالث متوسط', allowed)).toBe(false);
      expect(isSubjectAllowed('الرياضيات', allowed)).toBe(false);
    });

    it('يدعم تعدد المواد المعتمدة للمشتركين ذوي المادتين أو الباقة الشاملة', () => {
      const allowed = ['الكيمياء', 'الفيزياء'];
      expect(isSubjectAllowed('كيمياء الرابع العلمي', allowed)).toBe(true);
      expect(isSubjectAllowed('فيزياء الثالث متوسط', allowed)).toBe(true);
      expect(isSubjectAllowed('أحياء الخامس العلمي', allowed)).toBe(false);
    });
  });
});
