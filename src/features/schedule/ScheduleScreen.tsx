/**
 * شاشة الجدول الأسبوعي — الشاشة الرئيسية للتطبيق.
 *
 * تعرض حصص اليوم والغد أولاً، مع زر "عرض الجدول كاملاً"
 * لإظهار/إخفاء شبكة 5 أيام × 7 حصص.
 */
import React, { memo, useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../app/navigation/types';
import { useTheme } from '../../shared/theme/ThemeProvider';
import {
  FONT_FAMILY,
  SUBJECT_PALETTE,
  radius,
} from '../../shared/theme/tokens';
import { SCHEDULE_DAYS, SCHEDULE_PERIODS } from '../../shared/types/domain';
import type {
  PeriodIndex,
  ScheduleCell,
  Subject,
  WeekdayIndex,
} from '../../shared/types/domain';
import { IRAQI_WEEKDAYS } from '../../shared/types/domain';
import { stableIndex } from '../../shared/utils/hash';
import { todayWeekdayIndex } from '../../shared/utils/date';
import { strings } from '../../shared/i18n/ar';
import { AppScreen } from '../../shared/ui/AppScreen';
import { Icon } from '../../shared/ui/Icon';
import { PressableScale } from '../../shared/ui/PressableScale';
import { Sheet } from '../../shared/ui/Sheet';
import { Button } from '../../shared/ui/Button';
import { useScheduleStore } from './scheduleStore';
import { CellEditDialog } from './CellEditDialog';
import { haptics } from '../../shared/lib/haptics';
import { TrialStatusBanner } from '../license/TrialStatusBanner';

export function ScheduleScreen() {
  const { colors } = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const cells = useScheduleStore(s => s.cells);
  const subjects = useScheduleStore(s => s.subjects);

  const today = todayWeekdayIndex();
  const tomorrow: WeekdayIndex | null =
    today == null ? 0 : (((today + 1) % SCHEDULE_DAYS) as WeekdayIndex);

  /** فهرس O(1) للخلايا بدلاً من مسح Object.values في كل استدعاء */
  const cellIndex = useMemo(() => {
    const idx: Record<string, ScheduleCell> = {};
    for (const c of Object.values(cells)) {
      idx[`${c.day}-${c.period}`] = c;
    }
    return idx;
  }, [cells]);

  const lessonsFor = useCallback(
    (day: number) => {
      const lessons: { period: number; subject: Subject }[] = [];
      for (let period = 0; period < SCHEDULE_PERIODS; period++) {
        const cell = cellIndex[`${day}-${period}`];
        if (cell?.subjectId) {
          const subject = subjects[cell.subjectId];
          if (subject) lessons.push({ period, subject });
        }
      }
      return lessons;
    },
    [cellIndex, subjects],
  );

  const todayLessons = useMemo(
    () => (today == null ? [] : lessonsFor(today)),
    [lessonsFor, today],
  );
  const tomorrowLessons = useMemo(
    () => (tomorrow == null ? [] : lessonsFor(tomorrow)),
    [lessonsFor, tomorrow],
  );

  const [editTarget, setEditTarget] = useState<{
    day: WeekdayIndex;
    period: PeriodIndex;
  } | null>(null);
  const [optionsTarget, setOptionsTarget] = useState<{
    day: WeekdayIndex;
    period: PeriodIndex;
  } | null>(null);
  const [showAll, setShowAll] = useState(false);

  const handleCellPress = useCallback(
    (day: WeekdayIndex, period: PeriodIndex) => {
      haptics.light();
      setEditTarget({ day, period });
    },
    [],
  );

  const handleCellLongPress = useCallback(
    (day: WeekdayIndex, period: PeriodIndex) => {
      haptics.medium();
      const cell = cellIndex[`${day}-${period}`];
      if (cell) setOptionsTarget({ day, period });
      else setEditTarget({ day, period });
    },
    [cellIndex],
  );

  return (
    <AppScreen edges={['top']}>
      <View
        style={[
          styles.header,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          {strings.app.shortName}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <TrialStatusBanner />
        <LessonStrip
          title={strings.schedule.todaysLessons}
          lessons={todayLessons}
          emptyText={strings.schedule.noLessonsToday}
          tint={colors.primary}
          onPressLesson={subject =>
            navigation.navigate('DailyPlanEditor', { subjectId: subject.id })
          }
        />
        <LessonStrip
          title={strings.schedule.tomorrowsLessons}
          lessons={tomorrowLessons}
          emptyText={strings.schedule.noLessonsTomorrow}
          tint={colors.success}
          onPressLesson={subject =>
            navigation.navigate('DailyPlanEditor', { subjectId: subject.id })
          }
        />

        <View style={styles.toggleRow}>
          <Button
            label={
              showAll
                ? strings.schedule.hideSchedule
                : strings.schedule.showFullSchedule
            }
            variant="secondary"
            icon={{ name: showAll ? 'unfold-less' : 'unfold-more' }}
            onPress={() => setShowAll(a => !a)}
            style={styles.toggleBtn}
          />
        </View>

        {showAll ? (
          <>
            {/* رأس الجدول */}
            <View
              style={[styles.gridHeader, { backgroundColor: colors.primary }]}
            >
              <View style={styles.dayCol}>
                <Text style={styles.gridHeaderText}>
                  {strings.schedule.today}
                </Text>
              </View>
              {Array.from({ length: SCHEDULE_PERIODS }).map((_, p) => (
                <View key={p} style={styles.periodCol}>
                  <Text style={styles.gridHeaderText}>{p + 1}</Text>
                </View>
              ))}
            </View>

            {/* صفوف الأيام */}
            {Array.from({ length: SCHEDULE_DAYS }).map((_, day) => {
              const isToday = day === today;
              return (
                <View key={day} style={styles.dayRow}>
                  <View
                    style={[
                      styles.dayLabel,
                      {
                        backgroundColor: isToday
                          ? colors.primary
                          : colors.surface,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayLabelText,
                        {
                          color: isToday
                            ? colors.textOnPrimary
                            : colors.textPrimary,
                        },
                      ]}
                    >
                      {IRAQI_WEEKDAYS[day]}
                    </Text>
                  </View>
                  {Array.from({ length: SCHEDULE_PERIODS }).map((_, period) => {
                    const dayW = day as WeekdayIndex;
                    const periodW = period as PeriodIndex;
                    const cell = cellIndex[`${day}-${period}`];
                    const subject = cell?.subjectId
                      ? subjects[cell.subjectId]
                      : undefined;
                    return (
                      <CellView
                        key={period}
                        day={dayW}
                        period={periodW}
                        cell={cell}
                        subject={subject}
                        onPress={handleCellPress}
                        onLongPress={handleCellLongPress}
                      />
                    );
                  })}
                </View>
              );
            })}
          </>
        ) : null}

        <View style={{ height: 24 }} />
      </ScrollView>

      <CellEditDialog target={editTarget} onClose={() => setEditTarget(null)} />

      <Sheet
        visible={optionsTarget !== null}
        title={strings.schedule.editPeriod}
        onClose={() => setOptionsTarget(null)}
      >
        <View style={{ gap: 8 }}>
          <Button
            label={strings.schedule.editPeriod}
            icon={{ name: 'edit' }}
            onPress={() => {
              if (optionsTarget) {
                setEditTarget(optionsTarget);
                setOptionsTarget(null);
              }
            }}
          />
          <Button
            label={strings.schedule.deletePeriod}
            variant="danger"
            icon={{ name: 'delete' }}
            onPress={() => {
              if (optionsTarget) {
                useScheduleStore
                  .getState()
                  .clearCell(optionsTarget.day, optionsTarget.period);
                setOptionsTarget(null);
              }
            }}
          />
        </View>
      </Sheet>
    </AppScreen>
  );
}

/* ------------------------------- خلية الجدول ------------------------------- */

/** صيغة مختصرة للمرحلة داخل الخلية: "الخامس ابتدائية" → "الخامس" */
function shortGrade(grade: string): string {
  const cleaned = grade.replace(/^الصف\s+/, '').trim();
  return cleaned.split(/\s+/)[0] ?? grade;
}

interface CellViewProps {
  day: WeekdayIndex;
  period: PeriodIndex;
  cell: ScheduleCell | null | undefined;
  subject: Subject | undefined;
  onPress: (day: WeekdayIndex, period: PeriodIndex) => void;
  onLongPress: (day: WeekdayIndex, period: PeriodIndex) => void;
}

const CellView = memo(function CellViewInner({
  day,
  period,
  cell,
  subject,
  onPress,
  onLongPress,
}: CellViewProps) {
  const { colors } = useTheme();
  const isEmpty = !cell || !subject;

  const handlePress = useCallback(
    () => onPress(day, period),
    [onPress, day, period],
  );
  const handleLongPress = useCallback(
    () => onLongPress(day, period),
    [onLongPress, day, period],
  );

  const bg = subject
    ? SUBJECT_PALETTE[stableIndex(subject.name, SUBJECT_PALETTE.length)]
    : colors.surface;

  return (
    <PressableScale
      onPress={handlePress}
      onLongPress={handleLongPress}
      animated={false}
      style={styles.cellWrap}
    >
      <View
        style={[
          styles.cell,
          {
            backgroundColor: isEmpty ? colors.surface : bg,
            borderColor: colors.border,
          },
        ]}
      >
        {isEmpty ? (
          <Icon name="add" size={20} color={`${colors.textSecondary}55`} />
        ) : (
          <Text style={styles.cellText} numberOfLines={2}>
            {shortGrade(subject.grade)}
            {cell?.className ? ` ${cell.className}` : ''}
          </Text>
        )}
      </View>
    </PressableScale>
  );
});

/* --------------------------- شريط حصص اليوم والغد --------------------------- */

interface LessonStripProps {
  title: string;
  lessons: { period: number; subject: Subject }[];
  emptyText: string;
  tint: string;
  onPressLesson: (subject: Subject) => void;
}

function LessonStrip({
  title,
  lessons,
  emptyText,
  tint,
  onPressLesson,
}: LessonStripProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.todaySection}>
      <Text style={[styles.todayTitle, { color: colors.textPrimary }]}>
        {title}
      </Text>
      {lessons.length === 0 ? (
        <View
          style={[
            styles.emptyPill,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Icon
            name="calendar-blank-outline"
            family="community"
            size={20}
            color={colors.textSecondary}
          />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {emptyText}
          </Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.stripContent}
        >
          {lessons.map(item => (
            <PressableScale
              key={item.period}
              onPress={() => onPressLesson(item.subject)}
              haptic
              style={styles.todayCard}
            >
              <View
                style={[styles.todayBadge, { backgroundColor: `${tint}15` }]}
              >
                <Text
                  style={{
                    color: tint,
                    fontFamily: FONT_FAMILY,
                    fontWeight: '700',
                  }}
                >
                  {item.period + 1}
                </Text>
              </View>
              <Text
                style={[styles.todaySubject, { color: colors.textPrimary }]}
                numberOfLines={1}
              >
                {item.subject.name}
              </Text>
              <Text style={[styles.todayMeta, { color: colors.textSecondary }]}>
                {item.subject.grade}
              </Text>
            </PressableScale>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 20,
    fontWeight: '700',
  },
  content: {
    paddingBottom: 32,
  },
  gridHeader: {
    flexDirection: 'row',
    marginHorizontal: 8,
    borderRadius: radius.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  gridHeaderText: {
    color: '#fff',
    fontFamily: FONT_FAMILY,
    fontWeight: '700',
    fontSize: 14,
    textAlign: 'center',
  },
  dayCol: {
    width: 72,
    alignItems: 'center',
  },
  periodCol: {
    flex: 1,
    alignItems: 'center',
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginTop: 6,
  },
  dayLabel: {
    width: 72,
    marginHorizontal: 4,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 64,
  },
  dayLabelText: {
    fontFamily: FONT_FAMILY,
    fontWeight: '700',
    fontSize: 13,
  },
  cellWrap: {
    flex: 1,
    padding: 2,
  },
  cell: {
    minHeight: 64,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  cellText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '700',
    color: '#111',
    textAlign: 'center',
  },
  todaySection: {
    marginBottom: 12,
  },
  toggleRow: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  toggleBtn: {
    height: 46,
  },
  emptyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  emptyText: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
  },
  todayTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '700',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  todayCard: {
    width: 160,
    backgroundColor: '#fff',
    borderRadius: radius.md,
    padding: 12,
    gap: 6,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  stripContent: {
    gap: 10,
    paddingHorizontal: 8,
  },
  todayBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todaySubject: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '700',
  },
  todayMeta: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
  },
});
