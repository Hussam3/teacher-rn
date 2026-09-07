/**
 * حاسبة تكاليف استهلاك نماذج الذكاء الاصطناعي (AI Cost Calculator)
 */
import type {
  AIModelPricing,
  AISystemPricingConfig,
} from '../shared/types/aiUsage';

export const DEFAULT_PRICING_CONFIG: AISystemPricingConfig = {
  pricingVersion: '2026-v1',
  models: {
    'gemini-2.5-flash': {
      inputPerMillion: 0.075, // $0.075 لكل مليون توكن مدخل
      outputPerMillion: 0.30, // $0.30 لكل مليون توكن مخرج
    },
    'gemini-2.5-flash-lite': {
      inputPerMillion: 0.0375, // $0.0375 لكل مليون توكن مدخل
      outputPerMillion: 0.15, // $0.15 لكل مليون توكن مخرج
    },
    'gemini-1.5-pro': {
      inputPerMillion: 1.25,
      outputPerMillion: 5.0,
    },
  },
};

/**
 * احتساب التكلفة التقديرية بالدولار بناءً على التوكنات والنموذج
 */
export function calculateAICost(
  inputTokens: number,
  outputTokens: number,
  modelId: string,
  pricingConfig: AISystemPricingConfig = DEFAULT_PRICING_CONFIG,
): number {
  const modelPricing: AIModelPricing =
    pricingConfig.models[modelId] ||
    pricingConfig.models['gemini-2.5-flash'] || {
      inputPerMillion: 0.075,
      outputPerMillion: 0.3,
    };

  const inputCost = (inputTokens * modelPricing.inputPerMillion) / 1_000_000;
  const outputCost = (outputTokens * modelPricing.outputPerMillion) / 1_000_000;
  const total = inputCost + outputCost;

  // تقريب لـ 6 مراتب عشرية
  return Math.round(total * 1_000_000) / 1_000_000;
}

