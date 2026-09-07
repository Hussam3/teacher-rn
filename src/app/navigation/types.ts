/**
 * أنماط مسارات التنقل — نظام تنقل آمن الأنواع (Typed Navigation).
 */
export type RootStackParamList = {
  License: undefined;
  Auth: undefined;
  Main: undefined;
  Settings: undefined;
  DailyPlanEditor:
    | { subjectId?: string; planId?: string; className?: string }
    | undefined;
  AnnualPlanEditor: { subjectId?: string; planId?: string } | undefined;
};

export type MainTabsParamList = {
  Schedule: undefined;
  DailyPlans: undefined;
  AnnualPlans: undefined;
  Gradebook: undefined;
  Editor: undefined;
  Library: undefined;
  Settings: undefined;
};

export type EditorStackParamList = {
  EditorHome: undefined;
  Editor: { fresh?: boolean } | undefined;
};
