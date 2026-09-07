/**
 * مدير استهلاك الذكاء الاصطناعي المركزي (Central AI Usage Manager)
 *
 * المسؤول عن:
 * 1. الفحص القبلي (Pre-flight): المادة المسموحة، التزامن، حدود الاستخدام العادل، حدود التجربة.
 * 2. التوجيه وتحديد النماذج (Model Routing).
 * 3. المحاسبة البعدية (Post-flight): استخراج التوكنات الفعلية والتكلفة والتسجيل الذري لمنع الازدواجية.
 * 4. توليد واجهات حالة الاستخدام الودية للمعلم دون مصطلحات تقنية معقدة.
 */
import { storage, StorageKeys } from '../shared/lib/storage';
import { newId } from '../shared/utils/id';
import type {
  FeatureType,
  FriendlyQuotaStatus,
  AIPlan,
} from '../shared/types/aiUsage';
import {
  isSubjectAllowed,
  normalizeBaseSubject,
  getSubjectMismatchMessage,
} from './aiSubjectNormalizer';
import { aiModelRouter } from './aiModelRouter';
import { calculateAICost } from './aiCostCalculator';
import { supabase } from './supabase';

interface StoredAIUsageSummary {
  date: string; // YYYY-MM-DD
  month: string; // YYYY-MM
  dailyTokens: number;
  monthlyTokens: number;
  dailyRequests: number;
  monthlyRequests: number;
  totalEstimatedCost: number;
  timestamps: number[];
  recentRequestIds: string[];
}

const STORAGE_KEYS = {
  USAGE_SUMMARY: '@teacher_bag_ai_usage_summary_v2',
  PERSONAL_KEY: '@teacher_bag_ai_personal_gemini_key_v1',
  LOCAL_SELECTED_SUBJECTS: '@teacher_bag_ai_selected_subjects_v1',
};

export const AI_MANAGER_CONSTANTS = {
  BURST_LIMIT_PER_MINUTE: 5,
  BURST_WINDOW_MS: 60 * 1000,
  ESTIMATED_TOKENS_PER_REQ: 2500,
  TRIAL_TOKEN_BUDGET: 40000,
  TRIAL_DAILY_TOKEN_BUDGET: 15000,
  PAID_DAILY_SOFT_LIMIT: 100000,
  PAID_DAILY_HARD_LIMIT: 250000,
  PAID_MONTHLY_SOFT_LIMIT: 2000000,
  PAID_MONTHLY_HARD_LIMIT: 4500000,
} as const;

function getTodayKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getMonthKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

type AIUsageListener = (status: FriendlyQuotaStatus) => void;
const listeners = new Set<AIUsageListener>();

class AIUsageManager {
  private inFlight = false;
  private memorySummary: StoredAIUsageSummary | null = null;
  private personalApiKey: string | null = null;
  private localSelectedSubjects: string[] = [];
  private isLoaded = false;

  private async load(): Promise<void> {
    if (this.isLoaded) return;
    try {
      const summaryRaw = storage.getString(STORAGE_KEYS.USAGE_SUMMARY);
      const keyRaw = storage.getString(STORAGE_KEYS.PERSONAL_KEY);
      const subjectsRaw = storage.getString(STORAGE_KEYS.LOCAL_SELECTED_SUBJECTS);

      const today = getTodayKey();
      const month = getMonthKey();

      if (summaryRaw) {
        const parsed = JSON.parse(summaryRaw) as StoredAIUsageSummary;
        this.memorySummary = {
          date: today,
          month: month,
          dailyTokens: parsed.date === today ? parsed.dailyTokens : 0,
          dailyRequests: parsed.date === today ? parsed.dailyRequests : 0,
          monthlyTokens: parsed.month === month ? parsed.monthlyTokens : 0,
          monthlyRequests: parsed.month === month ? parsed.monthlyRequests : 0,
          totalEstimatedCost: parsed.totalEstimatedCost || 0,
          timestamps: parsed.date === today ? (parsed.timestamps || []) : [],
          recentRequestIds: (parsed.recentRequestIds || []).slice(-50),
        };
      } else {
        this.memorySummary = {
          date: today,
          month: month,
          dailyTokens: 0,
          monthlyTokens: 0,
          dailyRequests: 0,
          monthlyRequests: 0,
          totalEstimatedCost: 0,
          timestamps: [],
          recentRequestIds: [],
        };
      }

      this.personalApiKey = keyRaw ? keyRaw.trim() : null;
      this.localSelectedSubjects = subjectsRaw ? JSON.parse(subjectsRaw) : [];
      this.isLoaded = true;
    } catch (e) {
      console.warn('Failed to load AI usage state', e);
      this.memorySummary = {
        date: getTodayKey(),
        month: getMonthKey(),
        dailyTokens: 0,
        monthlyTokens: 0,
        dailyRequests: 0,
        monthlyRequests: 0,
        totalEstimatedCost: 0,
        timestamps: [],
        recentRequestIds: [],
      };
      this.isLoaded = true;
    }
  }

  private async save(): Promise<void> {
    if (!this.memorySummary) return;
    try {
      storage.set(STORAGE_KEYS.USAGE_SUMMARY, JSON.stringify(this.memorySummary));
      this.notifyListeners();
    } catch (e) {
      console.warn('Failed to save AI usage summary', e);
    }
  }

  private async notifyListeners(): Promise<void> {
    const status = await this.getFriendlyQuotaStatus();
    listeners.forEach(fn => fn(status));
  }

  /**
   * جلب معرف التثبيت للجهاز
   */
  getInstallationId(): string {
    let installationId = storage.getString(StorageKeys.licenseInstallation);
    if (!installationId) {
      installationId = newId();
      storage.set(StorageKeys.licenseInstallation, installationId);
    }
    return installationId;
  }

  /**
   * الحصول على المواد المحددة للمستخدم محلياً أو من الترخيص
   */
  async getSelectedSubjects(): Promise<string[]> {
    await this.load();
    return this.localSelectedSubjects;
  }

  /**
   * تعيين وتثبيت المواد للمستخدم
   */
  async setSelectedSubjects(subjects: string[]): Promise<void> {
    await this.load();
    const normalized = subjects
      .map(s => normalizeBaseSubject(s))
      .filter((s, i, arr) => arr.indexOf(s) === i);

    this.localSelectedSubjects = normalized;
    storage.set(STORAGE_KEYS.LOCAL_SELECTED_SUBJECTS, JSON.stringify(normalized));
    await this.notifyListeners();
  }

  /**
   * التحقق المسبق الصارم قبل إرسال طلب الذكاء الاصطناعي
   */
  async checkCanRequest(params: {
    featureType: FeatureType;
    subjectName?: string | null;
  }): Promise<{ allowed: boolean; reason?: string; requestId: string }> {
    await this.load();
    const requestId = newId();

    // 1. فحص التزامن اللحظي المباشر (Concurrency Guard)
    if (this.inFlight) {
      return {
        allowed: false,
        reason: 'يوجد طلب ذكاء اصطناعي قيد المعالجة حالياً. يرجى الانتظار حتى اكتماله.',
        requestId,
      };
    }

    // إذا كان للمستخدم مفتاح شخصي خاص به
    if (this.personalApiKey && this.personalApiKey.length > 10) {
      return { allowed: true, requestId };
    }

    // 2. التحقق من المادة الدراسية (Subject Check) — حماية التكلفة قبل أي استدعاء
    if (params.subjectName && params.subjectName.trim()) {
      const allowedSubjects = await this.getSelectedSubjects();
      // إذا كان لدى المعلم مواد محددة، نتحقق من شمولية المادة
      if (allowedSubjects.length > 0) {
        const isAllowed = isSubjectAllowed(params.subjectName, allowedSubjects);
        if (!isAllowed) {
          return {
            allowed: false,
            reason: getSubjectMismatchMessage(params.subjectName, allowedSubjects),
            requestId,
          };
        }
      }
    }

    // 3. فحص معدل التزامن السريع (Burst Rate Limiting)
    const now = Date.now();
    const recent = (this.memorySummary?.timestamps ?? []).filter(
      t => now - t < AI_MANAGER_CONSTANTS.BURST_WINDOW_MS,
    );
    if (recent.length >= AI_MANAGER_CONSTANTS.BURST_LIMIT_PER_MINUTE) {
      return {
        allowed: false,
        reason: 'يرجى الانتظار بضع ثوانٍ قبل إرسال طلب جديد.',
        requestId,
      };
    }

    // 4. فحص حد الأمان القاسي (Hard Safety Limit)
    const dailyUsed = this.memorySummary?.dailyTokens ?? 0;
    const monthlyUsed = this.memorySummary?.monthlyTokens ?? 0;

    if (dailyUsed >= AI_MANAGER_CONSTANTS.PAID_DAILY_HARD_LIMIT) {
      return {
        allowed: false,
        reason:
          'لقد وصلت إلى الحد اليومي الأقصى للأمان وفق سياسة الاستخدام العادل. سيتجدد رصيدك تلقائياً عند منتصف الليل.',
        requestId,
      };
    }

    if (monthlyUsed >= AI_MANAGER_CONSTANTS.PAID_MONTHLY_HARD_LIMIT) {
      return {
        allowed: false,
        reason:
          'لقد وصلت إلى الحد الشهري الأقصى للأمان. يرجى التواصل مع إدارة الترخيص للمساعدة.',
        requestId,
      };
    }

    return { allowed: true, requestId };
  }

  /**
   * بدء تنفيذ طلب ذكاء اصطناعي (حجز القفل)
   */
  acquireLock(): void {
    this.inFlight = true;
  }

  /**
   * تحرير قفل الطلب
   */
  releaseLock(): void {
    this.inFlight = false;
  }

  /**
   * تسجيل استهلاك الطلب بعد عودة النتيجة بنجاح
   */
  async recordUsageSuccess(params: {
    requestId: string;
    featureType: FeatureType;
    subjectName?: string | null;
    modelId: string;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    estimatedCost?: number;
  }): Promise<void> {
    await this.load();
    const today = getTodayKey();
    const month = getMonthKey();

    if (!this.memorySummary || this.memorySummary.date !== today) {
      this.memorySummary = {
        date: today,
        month: month,
        dailyTokens: 0,
        monthlyTokens: this.memorySummary?.month === month ? this.memorySummary.monthlyTokens : 0,
        dailyRequests: 0,
        monthlyRequests: this.memorySummary?.month === month ? this.memorySummary.monthlyRequests : 0,
        totalEstimatedCost: this.memorySummary?.totalEstimatedCost || 0,
        timestamps: [],
        recentRequestIds: [],
      };
    }

    // منع الحساب المزدوج عند إعادة المحاولة بنفس requestId
    if (this.memorySummary.recentRequestIds.includes(params.requestId)) {
      return;
    }

    const now = Date.now();
    const cost =
      params.estimatedCost !== undefined
        ? params.estimatedCost
        : calculateAICost(params.inputTokens, params.outputTokens, params.modelId);

    this.memorySummary.dailyTokens += params.totalTokens;
    this.memorySummary.monthlyTokens += params.totalTokens;
    this.memorySummary.dailyRequests += 1;
    this.memorySummary.monthlyRequests += 1;
    this.memorySummary.totalEstimatedCost += cost;
    this.memorySummary.recentRequestIds.push(params.requestId);
    if (this.memorySummary.recentRequestIds.length > 50) {
      this.memorySummary.recentRequestIds.shift();
    }
    this.memorySummary.timestamps = [
      ...this.memorySummary.timestamps.filter(
        t => now - t < AI_MANAGER_CONSTANTS.BURST_WINDOW_MS,
      ),
      now,
    ];

    await this.save();
  }

  /**
   * حالة الكوتة الودية للمستخدم (بدون مصطلحات توكن معقدة)
   */
  async getFriendlyQuotaStatus(): Promise<FriendlyQuotaStatus> {
    await this.load();
    const hasPersonalKey = Boolean(
      this.personalApiKey && this.personalApiKey.length > 10,
    );
    const selectedSubjects = await this.getSelectedSubjects();
    const dailyTokens = this.memorySummary?.dailyTokens ?? 0;

    const isNearDailySoftLimit = dailyTokens >= AI_MANAGER_CONSTANTS.PAID_DAILY_SOFT_LIMIT;
    const isHardLimitReached = dailyTokens >= AI_MANAGER_CONSTANTS.PAID_DAILY_HARD_LIMIT;

    if (hasPersonalKey) {
      return {
        isTrial: false,
        isLicensed: true,
        planName: 'مفتاح Gemini شخصي',
        maxSubjects: 99,
        selectedSubjects,
        statusTitle: 'استخدام مباشر غير محدود',
        statusDescription: 'أنت تستخدم مفتاح API خاص بك مباشرة.',
        isNearLimit: false,
        isLimitReached: false,
        canRequest: true,
        hasPersonalKey: true,
      };
    }

    if (isHardLimitReached) {
      return {
        isTrial: false,
        isLicensed: true,
        planName: 'الخطة المفعلة',
        maxSubjects: selectedSubjects.length || 1,
        selectedSubjects,
        statusTitle: 'الحد اليومي للأمان',
        statusDescription: 'وصلت إلى الحد اليومي الأقصى للأمان. سيتجدد الرصيد غداً تلقائياً.',
        isNearLimit: true,
        isLimitReached: true,
        canRequest: false,
        reasonIfBlocked: 'وصلت إلى الحد الأقصى للأمان لهذا اليوم.',
        hasPersonalKey: false,
      };
    }

    if (isNearDailySoftLimit) {
      return {
        isTrial: false,
        isLicensed: true,
        planName: 'الخطة المفعلة',
        maxSubjects: selectedSubjects.length || 1,
        selectedSubjects,
        statusTitle: 'استخدام مرتفع اليوم',
        statusDescription: 'أنت تقترب من حد الاستخدام العادل اليومي، يمكنك الاستمرار بشكل طبيعي.',
        isNearLimit: true,
        isLimitReached: false,
        canRequest: true,
        hasPersonalKey: false,
      };
    }

    return {
      isTrial: false,
      isLicensed: true,
      planName: 'استخدام عادل',
      maxSubjects: selectedSubjects.length || 1,
      selectedSubjects,
      statusTitle: 'الخدمة نشطة ومريحة',
      statusDescription: 'استهلاكك اليوم ضمن الحدود العادلة الممتازة.',
      isNearLimit: false,
      isLimitReached: false,
      canRequest: true,
      hasPersonalKey: false,
    };
  }

  /** الحصول على المفتاح الشخصي */
  async getPersonalApiKey(): Promise<string | null> {
    await this.load();
    return this.personalApiKey;
  }

  /** حفظ أو إزالة المفتاح الشخصي */
  async setPersonalApiKey(key: string | null): Promise<void> {
    await this.load();
    const trimmed = key ? key.trim() : null;
    this.personalApiKey = trimmed && trimmed.length > 5 ? trimmed : null;

    if (this.personalApiKey) {
      storage.set(STORAGE_KEYS.PERSONAL_KEY, this.personalApiKey);
    } else {
      storage.remove(STORAGE_KEYS.PERSONAL_KEY);
    }

    await this.notifyListeners();
  }

  /** الاشتراك في تحديثات الرصيد */
  subscribe(listener: AIUsageListener): () => void {
    listeners.add(listener);
    this.getFriendlyQuotaStatus().then(status => listener(status));
    return () => {
      listeners.delete(listener);
    };
  }
}

export const aiUsageManager = new AIUsageManager();

