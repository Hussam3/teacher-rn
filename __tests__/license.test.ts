import {
  normalizeActivationCode,
  trialRemainingMessage,
} from '../src/shared/utils/license';

describe('نظام الترخيص', () => {
  const now = Date.UTC(2026, 7, 31, 9, 0, 0);

  it('يوحد الرمز دون التأثر بالشرطات أو المسافات', () => {
    expect(normalizeActivationCode(' tb-abcd - efgh ijkl - mnpq ')).toBe(
      'TBABCDEFGHIJKLMNPQ',
    );
  });

  it('يعرض الأيام المتبقية للتجربة بصياغة عربية واضحة', () => {
    expect(
      trialRemainingMessage(
        new Date(now + 3 * 24 * 60 * 60 * 1000).toISOString(),
        now,
      ),
    ).toBe('متبقي 3 أيام من الفترة التجريبية');
    expect(
      trialRemainingMessage(
        new Date(now + 2 * 24 * 60 * 60 * 1000).toISOString(),
        now,
      ),
    ).toBe('متبقي يومان من الفترة التجريبية');
  });

  it('يوضح انتهاء التجربة اليوم وبعد انتهائها', () => {
    expect(
      trialRemainingMessage(
        new Date(now + 23 * 60 * 60 * 1000).toISOString(),
        now,
      ),
    ).toBe('تنتهي تجربتك المجانية اليوم');
    expect(trialRemainingMessage(new Date(now).toISOString(), now)).toBe(
      'انتهت الفترة التجريبية',
    );
  });
});
