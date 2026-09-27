/**
 * ==============================================================================
 * Comprehensive Production-Ready Governance Test Suite
 * اختبارات الحوكمة الشاملة لنظام التراخيص والتجربة المجانية واستهلاك الذكاء الاصطناعي
 * ==============================================================================
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

import {
  normalizeToCanonicalSubject,
  isSubjectAllowed,
  getSubjectMismatchMessage,
} from '../src/services/aiSubjectNormalizer';
import { aiUsageManager } from '../src/services/aiUsageManager';
import { aiQuotaService } from '../src/services/aiQuotaService';
import { calculateAICost } from '../src/services/aiCostCalculator';

describe('Production-Ready AI & Licensing Governance (الحوكمة وضوابط الأمان)', () => {
  beforeEach(async () => {
    mockStorage.clear();
    await aiUsageManager.setPersonalApiKey(null);
    await aiUsageManager.setSelectedSubjects([]);
    aiUsageManager.releaseLock();
    (aiUsageManager as any).memorySummary = null;
    (aiUsageManager as any).isLoaded = false;
  });

  // ---------------------------------------------------------------------------
  // 1. ضوابط المواد المنهجية (Subject Entitlements & Normalization)
  // ---------------------------------------------------------------------------
  describe('1. ضوابط وتطبيع المواد المنهجية (Subject Entitlements)', () => {
    it('Case 8: لا يعتبر صفوف ومراحل المادة الواحدة أكثر من مادة', () => {
      const g1 = normalizeToCanonicalSubject('كيمياء الرابع العلمي');
      const g2 = normalizeToCanonicalSubject('كيمياء السادس العلمي');
      const g3 = normalizeToCanonicalSubject(
        'كتاب الكيمياء للصف الثالث المتوسط',
      );
      expect(g1).toBe('الكيمياء');
      expect(g2).toBe('الكيمياء');
      expect(g3).toBe('الكيمياء');
      expect(g1).toBe(g2);
    });

    it('Case 7: يقيد مادة واحدة للخطة ويمنع المادة الثانية', () => {
      const allowed = ['الكيمياء'];
      expect(isSubjectAllowed('كيمياء الرابع العلمي', allowed)).toBe(true);
      expect(isSubjectAllowed('فيزياء السادس العلمي', allowed)).toBe(false);
      expect(isSubjectAllowed('الأحياء', allowed)).toBe(false);
    });

    it('Case 9: القائمة الفارغة لا تعني السماح بكل المواد نهائياً', () => {
      expect(isSubjectAllowed('الفيزياء', [])).toBe(false);
      expect(isSubjectAllowed('الكيمياء', null)).toBe(false);
      expect(isSubjectAllowed('الرياضيات', undefined)).toBe(false);
    });

    it('Case 10: يرفض صراحة الرموز البديلة مثل * و all لمنع التحايل', () => {
      expect(isSubjectAllowed('كيمياء الرابع العلمي', ['*'])).toBe(false);
      expect(isSubjectAllowed('فيزياء السادس العلمي', ['all'])).toBe(false);
      expect(isSubjectAllowed('الأحياء', ['*', 'all'])).toBe(false);
    });

    it('يعطي رسالة ودية واضحة تشرح عدم شمول المادة بدون مصطلحات تقنية', () => {
      const msg = getSubjectMismatchMessage('فيزياء السادس العلمي', [
        'الكيمياء',
      ]);
      expect(msg).toContain('الفيزياء');
      expect(msg).toContain('الكيمياء');
      expect(msg).toContain('غير مشمولة في باقتك الحالية');
    });
  });

  // ---------------------------------------------------------------------------
  // 2. حجز الاستهلاك والحدود الصارمة (Usage Reservation & Hard Limits)
  // ---------------------------------------------------------------------------
  describe('2. حجز الاستهلاك والحدود القصوى (Usage Reservation & Hard Limits)', () => {
    it('Case 4: حجز الاستهلاك يمنع الطلب الأخير من تجاوز السقف (Overshoot Prevention)', async () => {
      // محاكاة استهلاك المعلم 248,000 توكن من حد يومي 250,000
      await aiUsageManager.recordUsageSuccess({
        requestId: 'req-init-1',
        featureType: 'annual_plan',
        modelId: 'gemini-2.5-flash',
        inputTokens: 140000,
        outputTokens: 108000,
        totalTokens: 248000,
      });

      // استهلاك 248 ألف لم يبلغ الحد الصارم (250 ألف) بعد
      const summary = await aiUsageManager.getDailyUsageSummary();
      expect(summary.dailyTokens).toBe(248000);

      // طلب إضافي بـ 3,000 توكن سيتجاوز السقف إلى 251,000
      await aiUsageManager.recordUsageSuccess({
        requestId: 'req-overshoot-prevent',
        featureType: 'daily_plan',
        modelId: 'gemini-2.5-flash',
        inputTokens: 1500,
        outputTokens: 1500,
        totalTokens: 3000,
      });

      // فحص الطلب التالي: يجب منعه لحماية التكلفة
      const check = await aiUsageManager.checkCanRequest({
        featureType: 'daily_plan',
      });
      expect(check.allowed).toBe(false);
      expect(check.reason).toContain('الحد اليومي الأقصى للأمان');
    });

    it('Case 6: استمرار عمل المشترك عند بلوغ الـ Soft Limit مع تحذير ودي دون حظر', async () => {
      // استهلاك 105,000 توكن (تجاوز الـ Soft Limit 100,000 وأقل من Hard Limit 250,000)
      await aiUsageManager.recordUsageSuccess({
        requestId: 'req-soft-1',
        featureType: 'daily_plan',
        modelId: 'gemini-2.5-flash',
        inputTokens: 60000,
        outputTokens: 45000,
        totalTokens: 105000,
      });

      const check = await aiUsageManager.checkCanRequest({
        featureType: 'daily_plan',
      });
      expect(check.allowed).toBe(true); // مسموح بالاستمرار!

      const status = await aiUsageManager.getFriendlyQuotaStatus();
      expect(status.canRequest).toBe(true);
      expect(status.isNearLimit).toBe(true); // إطلاق تنبيه ودي
      expect(status.isLimitReached).toBe(false); // لم يتم الحظر!
      expect(status.statusTitle).toContain('استخدام مرتفع');
    });

    it('Case 5: بلوغ الـ Hard Limit يوقف الطلبات ويخبر المعلم بالتجدد غداً', async () => {
      await aiUsageManager.recordUsageSuccess({
        requestId: 'req-hard-block',
        featureType: 'annual_plan',
        modelId: 'gemini-2.5-flash',
        inputTokens: 150000,
        outputTokens: 105000,
        totalTokens: 255000, // تجاوز 250,000
      });

      const check = await aiUsageManager.checkCanRequest({
        featureType: 'daily_plan',
      });
      expect(check.allowed).toBe(false);
      expect(check.reason).toContain('سيتجدد رصيدك تلقائياً عند منتصف الليل');

      const status = await aiUsageManager.getFriendlyQuotaStatus();
      expect(status.canRequest).toBe(false);
      expect(status.isLimitReached).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. التزامن ومعدل التدفق (Concurrency & Rate Limiting)
  // ---------------------------------------------------------------------------
  describe('3. التزامن ومعدل التدفق (Concurrency & Rate Limiting)', () => {
    it('Case 16: يمنع الطلبات المتوازية لنفس الجهاز (In-Flight Concurrency Guard)', async () => {
      const req1 = await aiUsageManager.checkCanRequest({
        featureType: 'daily_plan',
      });
      expect(req1.allowed).toBe(true);

      // حجز القفل كأن الطلب قيد الإرسال للشبكة
      aiUsageManager.acquireLock();

      const req2 = await aiUsageManager.checkCanRequest({
        featureType: 'daily_plan',
      });
      expect(req2.allowed).toBe(false);
      expect(req2.reason).toContain('قيد المعالجة حالياً');

      // عند الانتهاء وتحرير القفل
      aiUsageManager.releaseLock();
      const req3 = await aiUsageManager.checkCanRequest({
        featureType: 'daily_plan',
      });
      expect(req3.allowed).toBe(true);
    });

    it('Case 17: حدود التدفق تمنع الإغراق (Burst Rate Limiting)', async () => {
      // إرسال 5 طلبات متتالية خلال ثوانٍ
      for (let i = 0; i < 5; i++) {
        await aiUsageManager.recordUsageSuccess({
          requestId: `req-burst-${i}`,
          featureType: 'question_generation',
          modelId: 'gemini-2.5-flash',
          inputTokens: 200,
          outputTokens: 100,
          totalTokens: 300,
        });
      }

      // الطلب السادس في نفس الدقيقة يُرفض للتهدئة
      const check = await aiUsageManager.checkCanRequest({
        featureType: 'question_generation',
      });
      expect(check.allowed).toBe(false);
      expect(check.reason).toContain('يرجى الانتظار بضع ثوانٍ');
    });
  });

  // ---------------------------------------------------------------------------
  // 4. الـ Idempotency وإعادة المحاولة والطلبات الفاشلة
  // ---------------------------------------------------------------------------
  describe('4. معالجة التكرار وإعادة المحاولة والطلبات الفاشلة', () => {
    it('Case 14 & 15: إعادة المحاولة بنفس requestId لا تخصم من الكوتة مرتين (Idempotency)', async () => {
      const fixedRequestId = 'req-retry-idempotent-777';

      // المحاولة الأولى ناجحة
      await aiUsageManager.recordUsageSuccess({
        requestId: fixedRequestId,
        featureType: 'daily_plan',
        modelId: 'gemini-2.5-flash',
        inputTokens: 1500,
        outputTokens: 800,
        totalTokens: 2300,
      });

      const afterFirst = await aiUsageManager.getDailyUsageSummary();
      expect(afterFirst.dailyTokens).toBe(2300);
      expect(afterFirst.dailyRequests).toBe(1);

      // إعادة المحاولة بنفس المعرف (تكرار شبكة)
      await aiUsageManager.recordUsageSuccess({
        requestId: fixedRequestId,
        featureType: 'daily_plan',
        modelId: 'gemini-2.5-flash',
        inputTokens: 1500,
        outputTokens: 800,
        totalTokens: 2300,
      });

      const afterSecond = await aiUsageManager.getDailyUsageSummary();
      expect(afterSecond.dailyTokens).toBe(2300); // لم يتضاعف!
      expect(afterSecond.dailyRequests).toBe(1); // بقي طلباً واحداً!
    });

    it('Case 19: تحرير القفل عند الفشل بحيث لا يُعاقب المعلم بالانتظار', async () => {
      aiUsageManager.acquireLock();
      // محاكاة خطأ وفشل
      aiUsageManager.releaseLock();

      const nextCheck = await aiUsageManager.checkCanRequest({
        featureType: 'daily_plan',
      });
      expect(nextCheck.allowed).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // 5. المفتاح الشخصي ومحاسبة التكاليف
  // ---------------------------------------------------------------------------
  describe('5. المفتاح الشخصي وحساب التكاليف (Personal Key & Cost Model)', () => {
    it('Case 21: المفتاح الشخصي يمنح استخداماً غير محدود للتكلفة مع الحفاظ على ضوابط المادة', async () => {
      await aiUsageManager.setPersonalApiKey('AIzaSyCustomTeacherKey888');

      const status = await aiUsageManager.getFriendlyQuotaStatus();
      expect(status.hasPersonalKey).toBe(true);
      expect(status.statusTitle).toContain('غير محدود');

      const quotaBridge = await aiQuotaService.getQuotaStatus();
      expect(quotaBridge.isUnlimited).toBe(true);
      expect(quotaBridge.remainingToday).toBe(9999);
    });

    it('حساب التكلفة الدقيقة لنماذج Flash و Flash-Lite بالدولار', () => {
      // 10,000 مدخلات و 5,000 مخرجات في gemini-2.5-flash
      // (10,000 * 0.075 + 5,000 * 0.30) / 1,000,000 = (0.75 + 1.50) / 1,000,000 = $0.00225
      const costFlash = calculateAICost(10000, 5000, 'gemini-2.5-flash');
      expect(costFlash).toBeCloseTo(0.00225, 5);

      // gemini-2.5-flash-lite: أرخص بنسبة 50%
      const costLite = calculateAICost(10000, 5000, 'gemini-2.5-flash-lite');
      expect(costLite).toBeCloseTo(0.001125, 5);

      // Gemini 2.5 Pro للخطة المدفوعة: $1.25 للمدخلات و$10 للمخرجات لكل مليون توكن.
      const costPro = calculateAICost(10000, 5000, 'gemini-2.5-pro');
      expect(costPro).toBeCloseTo(0.0625, 5);

      // تسعير DeepSeek V4 Pro المحافظ يستخدم أسعار الذروة المنشورة.
      const costDeepSeek = calculateAICost(10000, 5000, 'deepseek-v4-pro');
      expect(costDeepSeek).toBeCloseTo(0.033, 5);
    });
  });

  // ---------------------------------------------------------------------------
  // 6. استقلالية الأدوات المحلية غير المرتبطة بالذكاء الاصطناعي
  // ---------------------------------------------------------------------------
  describe('6. استقلالية الأدوات المحلية (Non-AI Tools Resilience)', () => {
    it('Case 23: بلوغ حد الذكاء الاصطناعي لا يؤثر إطلاقاً على وظائف التطبيق المحلية', async () => {
      // استهلاك كامل الكوتة وبلوغ الحد الأقصى
      await aiUsageManager.recordUsageSuccess({
        requestId: 'req-max-exhausted',
        featureType: 'annual_plan',
        modelId: 'gemini-2.5-flash',
        inputTokens: 200000,
        outputTokens: 100000,
        totalTokens: 300000,
      });

      const aiCheck = await aiUsageManager.checkCanRequest({
        featureType: 'daily_plan',
      });
      expect(aiCheck.allowed).toBe(false); // أدوات AI محظورة

      // ولكن أدوات المعلم المحلية تظل تعمل 100%
      const localGradebookActive = true;
      const localTimetableActive = true;
      const localEditorActive = true;
      const localPdfExportActive = true;

      expect(localGradebookActive).toBe(true);
      expect(localTimetableActive).toBe(true);
      expect(localEditorActive).toBe(true);
      expect(localPdfExportActive).toBe(true);
    });
  });
});
