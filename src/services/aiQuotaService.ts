/**
 * خدمة إدارة وتوزيع كوتة الذكاء الاصطناعي (طبقة توافقية مع AIUsageManager المركزي).
 *
 * تحتفظ بنفس الواجهات العامة السابقة لحماية أي كود واختبارات قائمة دون كسر،
 * بينما توكل المنطق الحقيقي إلى aiUsageManager المركزي.
 */
import { aiUsageManager, AI_MANAGER_CONSTANTS } from './aiUsageManager';

export const AI_QUOTA_CONSTANTS = {
  DAILY_REQUEST_LIMIT: 15,
  BURST_LIMIT_PER_MINUTE: AI_MANAGER_CONSTANTS.BURST_LIMIT_PER_MINUTE,
  BURST_WINDOW_MS: AI_MANAGER_CONSTANTS.BURST_WINDOW_MS,
  MIN_COOLDOWN_MS: 3000,
  ESTIMATED_TOKENS_PER_REQ: AI_MANAGER_CONSTANTS.ESTIMATED_TOKENS_PER_REQ,
} as const;

export interface AIQuotaStatus {
  dailyLimit: number;
  usedToday: number;
  remainingToday: number;
  estimatedTokensUsed: number;
  resetsAt: string;
  hoursUntilReset: number;
  hasPersonalKey: boolean;
  isUnlimited: boolean;
}

type QuotaListener = (status: AIQuotaStatus) => void;

function getHoursUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diffMs = midnight.getTime() - now.getTime();
  return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60)));
}

class AIQuotaServiceBridge {
  async getQuotaStatus(): Promise<AIQuotaStatus> {
    const personalKey = await aiUsageManager.getPersonalApiKey();
    const hasPersonalKey = Boolean(personalKey && personalKey.length > 10);
    const friendly = await aiUsageManager.getFriendlyQuotaStatus();

    const dailyLimit = AI_QUOTA_CONSTANTS.DAILY_REQUEST_LIMIT;
    const remainingToday = hasPersonalKey ? 9999 : friendly.isLimitReached ? 0 : 25;

    return {
      dailyLimit,
      usedToday: 0,
      remainingToday,
      estimatedTokensUsed: 0,
      resetsAt: '12:00 منتصف الليل',
      hoursUntilReset: getHoursUntilMidnight(),
      hasPersonalKey,
      isUnlimited: hasPersonalKey,
    };
  }

  async checkCanRequest(): Promise<{ allowed: boolean; reason?: string }> {
    const check = await aiUsageManager.checkCanRequest({
      featureType: 'other_ai',
    });
    return {
      allowed: check.allowed,
      reason: check.reason,
    };
  }

  async recordUsage(estimatedTokens = AI_QUOTA_CONSTANTS.ESTIMATED_TOKENS_PER_REQ): Promise<void> {
    await aiUsageManager.recordUsageSuccess({
      requestId: `compat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      featureType: 'other_ai',
      modelId: 'gemini-2.5-flash',
      inputTokens: Math.round(estimatedTokens * 0.7),
      outputTokens: Math.round(estimatedTokens * 0.3),
      totalTokens: estimatedTokens,
    });
  }

  async getPersonalApiKey(): Promise<string | null> {
    return aiUsageManager.getPersonalApiKey();
  }

  async setPersonalApiKey(key: string | null): Promise<void> {
    return aiUsageManager.setPersonalApiKey(key);
  }

  subscribe(listener: QuotaListener): () => void {
    return aiUsageManager.subscribe(async () => {
      const status = await this.getQuotaStatus();
      listener(status);
    });
  }
}

export const aiQuotaService = new AIQuotaServiceBridge();
