/**
 * اختبارات نظام توزيع وإدارة حصص الذكاء الاصطناعي (Gemini Quota)
 */
const mockStorage = new Map<string, string>();
jest.mock('react-native-mmkv', () => ({
  createMMKV: jest.fn(() => ({
    getString: jest.fn((key: string) => mockStorage.get(key)),
    set: jest.fn((key: string, val: string) => {
      mockStorage.set(key, val);
    }),
    remove: jest.fn((key: string) => {
      mockStorage.delete(key);
    }),
    clearAll: jest.fn(() => {
      mockStorage.clear();
    }),
  })),
}));

import { aiQuotaService } from '../src/services/aiQuotaService';

describe('خدمة كوتة وتوزيع الذكاء الاصطناعي', () => {
  beforeEach(async () => {
    // تصفير المفتاح الشخصي للبدء بالحالة الافتراضية
    await aiQuotaService.setPersonalApiKey(null);
  });

  it('تبدأ بالحصة الافتراضية المحددة لـ 100 مجرب (15 طلب/يوم)', async () => {
    const status = await aiQuotaService.getQuotaStatus();
    expect(status.dailyLimit).toBe(15);
    expect(status.remainingToday).toBeGreaterThanOrEqual(0);
    expect(status.remainingToday).toBeLessThanOrEqual(15);
    expect(status.isUnlimited).toBe(false);
  });

  it('تسمح بالطلب عند توفر الرصيد وتخصم بعد التسجيل', async () => {
    const check = await aiQuotaService.checkCanRequest();
    expect(check.allowed).toBe(true);

    const initial = await aiQuotaService.getQuotaStatus();
    await aiQuotaService.recordUsage(2500);

    const updated = await aiQuotaService.getQuotaStatus();
    expect(updated.usedToday).toBe(initial.usedToday + 1);
    expect(updated.estimatedTokensUsed).toBe(initial.estimatedTokensUsed + 2500);
  });

  it('تدعم المفتاح الشخصي وتمنح استخداماً غير محدود (isUnlimited = true)', async () => {
    await aiQuotaService.setPersonalApiKey('AIzaSyTestKeyPersonal123456');

    const status = await aiQuotaService.getQuotaStatus();
    expect(status.hasPersonalKey).toBe(true);
    expect(status.isUnlimited).toBe(true);
    expect(status.remainingToday).toBe(9999);

    const check = await aiQuotaService.checkCanRequest();
    expect(check.allowed).toBe(true);
  });

  it('تعيد الحصة المشتركة عند إزالة المفتاح الشخصي', async () => {
    await aiQuotaService.setPersonalApiKey(null);

    const status = await aiQuotaService.getQuotaStatus();
    expect(status.hasPersonalKey).toBe(false);
    expect(status.isUnlimited).toBe(false);
    expect(status.dailyLimit).toBe(15);
  });
});
