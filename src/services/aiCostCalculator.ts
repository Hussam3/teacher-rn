/**
 * حاسبة تكاليف استهلاك نماذج الذكاء الاصطناعي (AI Cost Calculator)
 */
import type {
  AIModelPricing,
  AISystemPricingConfig,
} from '../shared/types/aiUsage';

export const DEFAULT_PRICING_CONFIG: AISystemPricingConfig = {
  pricingVersion: '2026-v2',
  models: {
    'gemini-2.5-flash': {
      inputPerMillion: 0.075, // $0.075 لكل مليون توكن مدخل
      outputPerMillion: 0.3, // $0.30 لكل مليون توكن مخرج
    },
    'gemini-2.5-flash-lite': {
      inputPerMillion: 0.0375, // $0.0375 لكل مليون توكن مدخل
      outputPerMillion: 0.15, // $0.15 لكل مليون توكن مخرج
    },
    'gemini-2.5-pro': {
      inputPerMillion: 1.25,
      outputPerMillion: 10.0,
    },
    'gemini-1.5-pro': {
      inputPerMillion: 1.25,
      outputPerMillion: 5.0,
    },
    // DeepSeek V4 Pro peak rates; server pricing remains the accounting authority.
    'deepseek-v4-pro': {
      inputPerMillion: 1.32,
      outputPerMillion: 3.96,
    },
    // OpenRouter hosted models; server pricing remains the accounting authority.
    'openrouter/openai/gpt-4o-mini': {
      inputPerMillion: 0.15,
      outputPerMillion: 0.6,
    },
    'openrouter/anthropic/claude-3.5-haiku': {
      inputPerMillion: 0.8,
      outputPerMillion: 4.0,
    },
    'openrouter/google/gemini-2.5-flash': {
      inputPerMillion: 0.075,
      outputPerMillion: 0.3,
    },
    'openrouter/meta-llama/llama-3.3-70b-instruct': {
      inputPerMillion: 0.12,
      outputPerMillion: 0.3,
    },
    'openrouter/qwen/qwen-2.5-72b-instruct': {
      inputPerMillion: 0.3,
      outputPerMillion: 0.7,
    },
    'openrouter/deepseek/deepseek-chat-v3-0324': {
      inputPerMillion: 0.14,
      outputPerMillion: 0.28,
    },
    // NVIDIA NIM hosted models (build.nvidia.com); verify actual billing with the owner.
    'nvidia_nim/meta/llama-3.3-70b-instruct': {
      inputPerMillion: 0,
      outputPerMillion: 0,
    },
    'nvidia_nim/meta/llama-3.1-8b-instruct': {
      inputPerMillion: 0,
      outputPerMillion: 0,
    },
    'nvidia_nim/qwen/qwen2.5-72b-instruct': {
      inputPerMillion: 0,
      outputPerMillion: 0,
    },
    'nvidia_nim/google/gemma-2-27b-it': {
      inputPerMillion: 0,
      outputPerMillion: 0,
    },
    'nvidia_nim/deepseek-ai/deepseek-r1': {
      inputPerMillion: 0,
      outputPerMillion: 0,
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
  const modelPricing: AIModelPricing = pricingConfig.models[modelId] ||
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
