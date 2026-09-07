/**
 * رموز التصميم (Design Tokens) — الألوان الدلالية والمسافات والأقطار والخطوط.
 */
import type { ThemeMode } from '../types/domain';

/** الألوان الدلالية للثيم */
export interface ThemeColors {
  primary: string;
  primaryDark: string;
  background: string;
  surface: string;
  surfaceElevated: string;
  textPrimary: string;
  textSecondary: string;
  textOnPrimary: string;
  error: string;
  success: string;
  warning: string;
  border: string;
  divider: string;
  overlay: string;
  skeleton: string;
  /** ألوان أقسام الخطة اليومية */
  planObjectives: string;
  planIntroduction: string;
  planPresentation: string;
  planActivities: string;
  planEvaluation: string;
  planHomework: string;
}

/** لوحة الألوان الفاتحة */
export const lightColors: ThemeColors = {
  primary: '#24A1DE',
  primaryDark: '#1A81B0',
  background: '#F1F1F1',
  surface: '#FFFFFF',
  surfaceElevated: '#F7F9FA',
  textPrimary: '#222222',
  textSecondary: '#707579',
  textOnPrimary: '#FFFFFF',
  error: '#FF3B30',
  success: '#34C759',
  warning: '#FF9500',
  border: '#E4E7EA',
  divider: '#E4E7EA',
  overlay: 'rgba(0,0,0,0.4)',
  skeleton: '#E6E9EC',
  planObjectives: '#4CAF50',
  planIntroduction: '#FF9800',
  planPresentation: '#2196F3',
  planActivities: '#9C27B0',
  planEvaluation: '#E91E63',
  planHomework: '#009688',
};

/** لوحة الألوان الداكنة */
export const darkColors: ThemeColors = {
  primary: '#2FB3F0',
  primaryDark: '#24A1DE',
  background: '#17212B',
  surface: '#232E3C',
  surfaceElevated: '#2B3849',
  textPrimary: '#FFFFFF',
  textSecondary: '#7F91A4',
  textOnPrimary: '#FFFFFF',
  error: '#FF6B61',
  success: '#34C759',
  warning: '#FFB340',
  border: '#2E3B4A',
  divider: 'rgba(0,0,0,0.2)',
  overlay: 'rgba(0,0,0,0.6)',
  skeleton: '#2E3B4A',
  planObjectives: '#66BB6A',
  planIntroduction: '#FFB74D',
  planPresentation: '#64B5F6',
  planActivities: '#BA68C8',
  planEvaluation: '#F06292',
  planHomework: '#4DB6AC',
};

/** المسافات */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

/** الأقطار */
export const radius = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

/** نقاط التوقف للتصميم المتجاوب */
export const breakpoints = {
  mobile: 600,
  tablet: 1024,
} as const;

/** عرض الشريط الجانبي لسطح المكتب */
export const SIDEBAR_WIDTH = 260;

/** حجم خط الأساس */
export const FONT_FAMILY = 'NotoKufiArabic';

/** ألوان المواد في جدول الحصص (8 ألوان باستيل ثابتة) */
export const SUBJECT_PALETTE = [
  '#E3F2FD',
  '#F3E5F5',
  '#E8F5E9',
  '#FFF3E0',
  '#FFEBEE',
  '#E0F7FA',
  '#FFF8E1',
  '#FCE4EC',
] as const;

/** ألوان تدرجات الأقسام (الخطة اليومية/السنوية) */
export const SECTION_COLORS = {
  objectives: '#4CAF50',
  introduction: '#FF9800',
  presentation: '#2196F3',
  activities: '#9C27B0',
  evaluation: '#E91E63',
  homework: '#009688',
} as const;

/** ألوان المراحل الدراسية في المكتبة */
export function stageColor(stage: string): string {
  switch (stage) {
    case 'الابتدائية':
      return '#E8F5E9';
    case 'المتوسطة':
      return '#E3F2FD';
    case 'الإعدادية':
      return '#FFF3E0';
    default:
      return '#F1F1F1';
  }
}

export interface Theme {
  mode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
}
