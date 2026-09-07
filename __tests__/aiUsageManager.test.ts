/**
 * اختبارات وحدة إدارة استهلاك وموازنة الذكاء الاصطناعي المركزية (AIUsageManager)
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

import { aiUsageManager } from '../src/services/aiUsageManager';
import { useLicenseStore } from '../src/features/license/licenseStore';

describe('AIUsageManager - إدارة الاستهلاك وضوابط الأمان', () => {
  beforeEach(async () => {
    mockStorage.clear();
    await aiUsageManager.setPersonalApiKey(null);
    await aiUsageManager.setSelectedSubjects([]);
    aiUsageManager.releaseLock();
    // تصفير ملخص الذاكرة
    (aiUsageManager as any).memorySummary = null;
    (aiUsageManager as any).loaded = false;
  });

  describe('قفل التزامن اللحظي (Concurrency Guard)', () => {
    it('يمنع إرسال طلب جديد أثناء وجود طلب قيد التنفيذ', async () => {
      const firstCheck = await aiUsageManager.checkCanRequest({
        featureType: 'daily_plan',
      });
      expect(firstCheck.allowed).toBe(true);

      // حجز القفل
      aiUsageManager.acquireLock();

      const secondCheck = await aiUsageManager.checkCanRequest({
        featureType: 'question_generation',
      });
      expect(secondCheck.allowed).toBe(false);
      expect(secondCheck.reason).toContain('قيد المعالجة حالياً');

      // تحرير القفل
      aiUsageManager.releaseLock();

      const thirdCheck = await aiUsageManager.checkCanRequest({
        featureType: 'question_generation',
      });
      expect(thirdCheck.allowed).toBe(true);
    });
  });

  describe('التحقق المسبق من المواد المصرحة (Subject Policy Check)', () => {
    it('يسمح بالطلب إذا لم تكن هناك مواد محددة بعد', async () => {
      const check = await aiUsageManager.checkCanRequest({
        featureType: 'question_generation',
        subjectName: 'الفيزياء',
      });
      expect(check.allowed).toBe(true);
    });

    it('يسمح بالطلب للمادة المصرح بها فقط ويمنع المواد الأخرى', async () => {
      await aiUsageManager.setSelectedSubjects(['الكيمياء']);

      const allowedCheck = await aiUsageManager.checkCanRequest({
        featureType: 'question_generation',
        subjectName: 'كيمياء الرابع العلمي',
      });
      expect(allowedCheck.allowed).toBe(true);

      const blockedCheck = await aiUsageManager.checkCanRequest({
        featureType: 'question_generation',
        subjectName: 'فيزياء السادس العلمي',
      });
      expect(blockedCheck.allowed).toBe(false);
      expect(blockedCheck.reason).toContain('الكيمياء');
    });

    it('يدعم تعدد المواد المعتمدة للمشترك', async () => {
      await aiUsageManager.setSelectedSubjects(['الكيمياء', 'الرياضيات']);

      const chemCheck = await aiUsageManager.checkCanRequest({
        featureType: 'daily_plan',
        subjectName: 'الكيمياء',
      });
      expect(chemCheck.allowed).toBe(true);

      const mathCheck = await aiUsageManager.checkCanRequest({
        featureType: 'annual_plan',
        subjectName: 'رياضيات الثالث متوسط',
      });
      expect(mathCheck.allowed).toBe(true);

      const bioCheck = await aiUsageManager.checkCanRequest({
        featureType: 'question_generation',
        subjectName: 'أحياء الخامس العلمي',
      });
      expect(bioCheck.allowed).toBe(false);
    });
  });

  describe('منع الحساب المزدوج ومطابقة المعرّف (Idempotency & Accounting)', () => {
    it('يسجل استهلاك التوكنز والتكلفة بنجاح', async () => {
      const reqId = 'req-test-101';
      await aiUsageManager.recordUsageSuccess({
        requestId: reqId,
        featureType: 'question_generation',
        modelId: 'gemini-2.5-flash',
        inputTokens: 1000,
        outputTokens: 500,
        totalTokens: 1500,
      });

      const summary = (aiUsageManager as any).memorySummary;
      expect(summary.dailyTokens).toBe(1500);
      expect(summary.dailyRequests).toBe(1);
      expect(summary.totalEstimatedCost).toBeGreaterThan(0);
    });

    it('يتجاهل التكرار عند وصول نفس requestId مرتين (Idempotency)', async () => {
      const reqId = 'req-duplicate-202';
      await aiUsageManager.recordUsageSuccess({
        requestId: reqId,
        featureType: 'daily_plan',
        modelId: 'gemini-2.5-flash',
        inputTokens: 2000,
        outputTokens: 1000,
        totalTokens: 3000,
      });

      // استدعاء مكرر بنفس المعرف (مثلاً عند انقطاع الشبكة وإعادة المحاولة)
      await aiUsageManager.recordUsageSuccess({
        requestId: reqId,
        featureType: 'daily_plan',
        modelId: 'gemini-2.5-flash',
        inputTokens: 2000,
        outputTokens: 1000,
        totalTokens: 3000,
      });

      const summary = (aiUsageManager as any).memorySummary;
      expect(summary.dailyTokens).toBe(3000);
      expect(summary.dailyRequests).toBe(1);
    });
  });

  describe('حد الأمان اليومي الصارم (Hard Safety Limit)', () => {
    it('يمنع الطلبات إذا تجاوز الاستهلاك اليومي سقف الأمان (350 ألف توكن)', async () => {
      await aiUsageManager.recordUsageSuccess({
        requestId: 'req-heavy-load',
        featureType: 'annual_plan',
        modelId: 'gemini-2.5-flash',
        inputTokens: 200000,
        outputTokens: 160000,
        totalTokens: 360000, // تجاوز 350 ألف
      });

      const check = await aiUsageManager.checkCanRequest({
        featureType: 'daily_plan',
      });
      expect(check.allowed).toBe(false);
      expect(check.reason).toContain('الحد اليومي الأقصى للأمان');
    });
  });

  describe('حالة الحصة الودية للمستخدم (Friendly Quota Status)', () => {
    it('تعطي رسالة مطمئنة للاستخدام العادل للمستخدم المرخص', async () => {
      const status = await aiUsageManager.getFriendlyQuotaStatus();
      expect(status.canRequest).toBe(true);
      expect(status.isLimitReached).toBe(false);
      expect(status.statusTitle).toBeTruthy();
      expect(status.statusDescription).toBeTruthy();
    });

    it('توضح استخدام المفتاح الشخصي عند تفعيله', async () => {
      await aiUsageManager.setPersonalApiKey('AIzaSyCustomUserKey999');
      const status = await aiUsageManager.getFriendlyQuotaStatus();
      expect(status.hasPersonalKey).toBe(true);
      expect(status.statusTitle).toContain('غير محدود');
    });
  });
});

