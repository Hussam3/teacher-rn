/**
 * نماذج وتعريفات نظام إدارة واستهلاك الذكاء الاصطناعي (AI Usage Management Models)
 */

export const AI_FEATURE_TYPES = [
  'daily_plan',
  'annual_plan',
  'question_generation',
  'question_regeneration',
  'question_formatting',
  'question_improvement',
  'curriculum_analysis',
  'lesson_summary',
  'other_ai',
] as const;

export type FeatureType = (typeof AI_FEATURE_TYPES)[number];

export type AIProviderId =
  | 'gemini'
  | 'deepseek'
  | 'openrouter'
  | 'nvidia_nim';

export const FEATURE_TYPE_LABELS: Record<FeatureType, string> = {
  daily_plan: 'خطة يومية',
  annual_plan: 'خطة سنوية',
  question_generation: 'توليد أسئلة',
  question_regeneration: 'إعادة توليد أسئلة',
  question_formatting: 'تنسيق الأسئلة',
  question_improvement: 'تدقيق وتحسين الأسئلة',
  curriculum_analysis: 'تحليل المنهج',
  lesson_summary: 'تلخيص الدرس',
  other_ai: 'عمليات أخرى',
};

/** قائمة المواد الأساسية المعيارية في المناهج العراقية */
export const CANONICAL_BASE_SUBJECTS = [
  'الكيمياء',
  'الفيزياء',
  'الأحياء',
  'الرياضيات',
  'اللغة العربية',
  'اللغة الإنكليزية',
  'التربية الإسلامية',
  'الاجتماعيات',
  'العلوم',
  'الحاسوب',
  'التربية الفنية',
  'التربية الرياضية',
  'اللغة الفرنسية',
  'الاقتصاد',
  'الفلسفة وعلم النفس',
] as const;

export type CanonicalBaseSubject = (typeof CANONICAL_BASE_SUBJECTS)[number];

export interface AIModelPricing {
  inputPerMillion: number;
  outputPerMillion: number;
}

export interface AISystemPricingConfig {
  pricingVersion: string;
  models: Record<string, AIModelPricing>;
}

export interface AIRateLimitsConfig {
  burstPerMinute: number;
  requestsPerHour: number;
  concurrencyLockSeconds: number;
}

export interface AIAnomalyRulesConfig {
  maxAnnualPlansPerDay: number;
  maxQuestionsBurstPerHour: number;
  cooldownMinutesOnAnomaly: number;
}

export interface AISubjectPolicyConfig {
  maxChangesAllowed: number;
  cooldownDaysBetweenChanges: number;
}

export interface AISystemConfig {
  pricing: AISystemPricingConfig;
  modelRouting: Record<FeatureType, string>;
  rateLimits: AIRateLimitsConfig;
  anomalyRules: AIAnomalyRulesConfig;
  subjectPolicy: AISubjectPolicyConfig;
}

export interface AIPlan {
  id: string;
  name: string;
  description?: string;
  trialDurationDays: number;
  maxSubjects: number;
  maxDevices: number;
  trialMaxTotalTokens: number;
  trialMaxDailyTokens: number;
  trialMaxCost: number;
  dailySoftLimit: number;
  monthlySoftLimit: number;
  dailyHardLimit: number;
  monthlyHardLimit: number;
  allowedFeatures: FeatureType[];
  featureDailyLimits?: Partial<Record<FeatureType, number>>;
}

export type AIErrorCode =
  | 'trial_expired'
  | 'trial_usage_limit'
  | 'trial_daily_limit'
  | 'trial_daily_plan_limit'
  | 'trial_proofread_limit'
  | 'trial_formatting_limit'
  | 'trial_feature_not_allowed'
  | 'trial_feature_limit'
  | 'daily_hard_limit'
  | 'monthly_hard_limit'
  | 'subject_not_allowed'
  | 'subject_cooldown_active'
  | 'feature_not_allowed'
  | 'concurrency_in_flight'
  | 'rate_limit_burst'
  | 'rate_limit_hourly'
  | 'license_inactive'
  | 'license_expired'
  | 'max_subjects_exceeded'
  | 'provider_busy'
  | 'provider_error';

export interface AIUsageRecord {
  id?: number;
  requestId: string;
  userId?: string | null;
  installationId: string;
  licenseId?: string | null;
  isTrial: boolean;
  featureType: FeatureType;
  subjectId?: string | null;
  subjectName?: string | null;
  providerId?: AIProviderId;
  modelId: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number;
  providerCost?: number;
  estimatedTokens?: number;
  status: 'processing' | 'success' | 'failed' | 'cancelled';
  errorMessage?: string | null;
  failureReason?: string | null;
  providerErrorType?: string | null;
  pricingVersion?: string | null;
  createdAt: string;
  completedAt?: string | null;
  latencyMs?: number | null;
}

export interface FriendlyQuotaStatus {
  isTrial: boolean;
  isLicensed: boolean;
  planName: string;
  maxSubjects: number;
  selectedSubjects: string[];
  statusTitle: string;
  statusDescription: string;
  isNearLimit: boolean;
  isLimitReached: boolean;
  canRequest: boolean;
  reasonIfBlocked?: string;
  hasPersonalKey: boolean;
  daysRemaining?: number;
  trialFeatureUsage?: TrialFeatureUsage[];
}

export interface TrialFeatureUsage {
  featureType: 'daily_plan' | 'question_improvement' | 'question_formatting';
  label: string;
  used: number;
  limit: number;
  remaining: number;
}

export interface FeatureMetrics {
  featureType: FeatureType;
  totalCalls: number;
  totalTokens: number;
  avgInputTokens: number;
  avgOutputTokens: number;
  avgTotalTokens: number;
  totalCost: number;
  avgCost: number;
}

export interface AIConsumptionOverview {
  totalUsers: number;
  activeTrialUsers: number;
  activePaidUsers: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalCost: number;
  trialCost: number;
  paidCost: number;
  avgCostPerTrialUser: number;
  avgCostPerPaidUser: number;
  todayCost: number;
  thisMonthCost: number;
}
