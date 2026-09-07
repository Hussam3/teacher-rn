/**
 * التبويبات الرئيسية — 6 أقسام (جدول، يومية، سنوية، درجات، محرر، مكتبة).
 *
 * التصميم: أيقونات MaterialCommunity (مملوءة عند التفعيل / محددة عند الخمول)
 * مع "حبة" (pill) ملوّنة خلف التبويب النشط.
 */
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MainTabsParamList } from './types';
import { Icon } from '../../shared/ui/Icon';
import { useTheme } from '../../shared/theme/ThemeProvider';
import { FONT_FAMILY, radius } from '../../shared/theme/tokens';
import { strings } from '../../shared/i18n/ar';
import { ScheduleScreen } from '../../features/schedule/ScheduleScreen';
import { DailyPlanScreen } from '../../features/daily_plan/DailyPlanScreen';
import { AnnualPlanScreen } from '../../features/annual_plan/AnnualPlanScreen';
import { GradebookScreen } from '../../features/gradebook/GradebookScreen';
import { EditorNavigator } from './EditorNavigator';
import { LibraryScreen } from '../../features/library/LibraryScreen';
import { SettingsScreen } from '../../features/settings/SettingsScreen';

const Tab = createBottomTabNavigator<MainTabsParamList>();

/** أيقونات التبويبات — زوج مملوء/محدد لكل قسم */
const TAB_ICONS: Record<
  keyof MainTabsParamList,
  { active: string; inactive: string }
> = {
  Schedule: { active: 'calendar-week', inactive: 'calendar-week' },
  DailyPlans: { active: 'file-document', inactive: 'file-document-outline' },
  AnnualPlans: { active: 'calendar-month', inactive: 'calendar-month-outline' },
  Gradebook: { active: 'chart-box', inactive: 'chart-box-outline' },
  Editor: { active: 'note-edit', inactive: 'note-edit-outline' },
  Library: { active: 'bookshelf', inactive: 'bookshelf' },
  Settings: { active: 'cog', inactive: 'cog-outline' },
};

export function MainTabs() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const pair = TAB_ICONS[route.name] ?? TAB_ICONS.Schedule;
        return {
          headerShown: false,
          tabBarShowLabel: true,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarActiveBackgroundColor: `${colors.primary}14`,
          tabBarItemStyle: {
            borderRadius: radius.lg,
            marginHorizontal: 3,
            marginVertical: 4,
            height: 52,
          },
          tabBarStyle: {
            backgroundColor: isDark ? '#1B2733' : '#FFFFFF',
            borderTopWidth: 0,
            shadowColor: '#000',
            shadowOpacity: 0.08,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: -2 },
            elevation: 10,
            height: 62 + bottomInset,
            paddingTop: 4,
            paddingBottom: Math.max(bottomInset, 8),
          },
          tabBarLabelStyle: {
            fontFamily: FONT_FAMILY,
            fontSize: 11,
            fontWeight: '700',
          },
          tabBarHideOnKeyboard: true,
          // eslint-disable-next-line react/no-unstable-nested-components -- واجهة react-navigation الرسمية
          tabBarIcon: ({ focused, color, size }) => (
            <Icon
              name={focused ? pair.active : pair.inactive}
              family="community"
              size={size}
              color={color}
            />
          ),
        };
      }}
    >
      <Tab.Screen
        name="Schedule"
        component={ScheduleScreen}
        options={{ title: strings.nav.scheduleShort }}
      />
      <Tab.Screen
        name="DailyPlans"
        component={DailyPlanScreen}
        options={{ title: strings.nav.dailyShort }}
      />
      <Tab.Screen
        name="AnnualPlans"
        component={AnnualPlanScreen}
        options={{ title: strings.nav.annualShort }}
      />
      <Tab.Screen
        name="Gradebook"
        component={GradebookScreen}
        options={{ title: strings.nav.gradebookShort }}
      />
      <Tab.Screen
        name="Editor"
        component={EditorNavigator}
        options={{ title: strings.nav.editorShort }}
      />
      <Tab.Screen
        name="Library"
        component={LibraryScreen}
        options={{ title: strings.nav.libraryShort }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: strings.nav.settingsShort }}
      />
    </Tab.Navigator>
  );
}
