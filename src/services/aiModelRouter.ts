/**
 * موجه النماذج الذكي (AI Model Router)
 *
 * يوجه العمليات الخفيفة والتنسيق إلى نماذج اقتصادية وسريعة،
 * والعمليات المعقدة والخطط والأسئلة إلى نماذج قوية.
 */
import type { FeatureType } from '../shared/types/aiUsage';

export const DEFAULT_MODEL_ROUTING: Record<FeatureType, string> = {
  daily_plan: 'gemini-2.5-flash',
  annual_plan: 'gemini-2.5-flash',
  question_generation: 'gemini-2.5-flash',
  question_regeneration: 'gemini-2.5-flash',
  curriculum_analysis: 'gemini-2.5-flash',
  lesson_summary: 'gemini-2.5-flash',
  question_formatting: 'gemini-2.5-flash-lite',
  question_improvement: 'gemini-2.5-flash',
  other_ai: 'gemini-2.5-flash',
};

class AIModelRouter {
  private routingMap: Record<FeatureType, string> = { ...DEFAULT_MODEL_ROUTING };

  /**
   * استخراج معرف النموذج المناسب لنوع العملية
   */
  resolveModel(featureType: FeatureType): string {
    return this.routingMap[featureType] || 'gemini-2.5-flash';
  }

  /**
   * تحديث خريطة التوجيه ديناميكياً من إعدادات السيرفر
   */
  updateRouting(newRouting: Partial<Record<FeatureType, string>>): void {
    this.routingMap = {
      ...this.routingMap,
      ...newRouting,
    };
  }

  /**
   * إعادة ضبط التوجيه للقيم الافتراضية
   */
  resetToDefault(): void {
    this.routingMap = { ...DEFAULT_MODEL_ROUTING };
  }
}

export const aiModelRouter = new AIModelRouter();

