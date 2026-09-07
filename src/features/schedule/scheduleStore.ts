/**
 * مخزن الجدول الأسبوعي (Zustand) — بديل ScheduleProvider في Flutter.
 *
 * يدير خلايا الجدول (5×7) والمواد، مع الإصرار في MMKV عبر المستودعات،
 * ويدمج جدولة تنبيهات الحصص عبر Notifee.
 */
import { create } from 'zustand';
import type { PeriodIndex, ScheduleCell, Subject, WeekdayIndex } from '../../shared/types/domain';
import { SCHEDULE_DAYS, SCHEDULE_PERIODS } from '../../shared/types/domain';
import { scheduleRepo, subjectRepo } from '../../data/repositories';
import { newId } from '../../shared/utils/id';
import { todayWeekdayIndex } from '../../shared/utils/date';
import { cancelLessonAlarm, scheduleLessonAlarm } from '../../services/notificationService';

type CellMap = Record<string, ScheduleCell>;
type SubjectMap = Record<string, Subject>;

export interface TodayLesson {
  period: number;
  subject: Subject;
  cell: ScheduleCell;
}

interface ScheduleState {
  cells: CellMap;
  subjects: SubjectMap;
  loaded: boolean;
  load: () => void;
  getCell: (day: WeekdayIndex, period: PeriodIndex) => ScheduleCell | null;
  getSubject: (id: string | null | undefined) => Subject | undefined;
  updateCell: (params: {
    day: WeekdayIndex;
    period: PeriodIndex;
    subjectId: string | null;
    className: string | null;
    lessonPlanId: string | null;
    isAlarmEnabled: boolean;
    alarmTime: string | null;
  }) => void;
  clearCell: (day: WeekdayIndex, period: PeriodIndex) => void;
  addSubject: (subject: Subject) => void;
  deleteSubject: (id: string) => void;
  getTodayLessons: () => TodayLesson[];
}

function loadData(): { cells: CellMap; subjects: SubjectMap } {
  const cells: CellMap = {};
  for (const c of scheduleRepo.list()) {
    if (c.day >= 0 && c.day < SCHEDULE_DAYS && c.period >= 0 && c.period < SCHEDULE_PERIODS) {
      cells[c.id] = c;
    }
  }
  const subjects: SubjectMap = {};
  for (const s of subjectRepo.list()) {
    subjects[s.id] = s;
  }
  return { cells, subjects };
}

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  cells: {},
  subjects: {},
  loaded: false,

  load: () => {
    if (get().loaded) return;
    set({ ...loadData(), loaded: true });
  },

  getCell: (day, period) => {
    const cells = get().cells;
    return Object.values(cells).find(c => c.day === day && c.period === period) ?? null;
  },

  getSubject: id => (id ? get().subjects[id] : undefined),

  updateCell: params => {
    const { day, period, subjectId, className, lessonPlanId, isAlarmEnabled, alarmTime } =
      params;
    const existing = get().getCell(day, period);
    const cell: ScheduleCell = {
      id: existing?.id ?? newId(),
      day,
      period,
      subjectId,
      className,
      lessonPlanId,
      isAlarmEnabled,
      alarmTime,
    };

    scheduleRepo.save(cell);

    // إدارة التنبيهات الفعلية
    cancelLessonAlarm(cell.id);
    if (isAlarmEnabled && alarmTime) {
      const subject = get().getSubject(subjectId);
      const title = subject?.name ?? 'حصة دراسية';
      const body = `حصة ${title}${className ? ` (${className})` : ''} تبدأ قريباً`;
      scheduleLessonAlarm({
        cellId: cell.id,
        day,
        time: alarmTime,
        title,
        body,
      });
    }

    set(state => ({ cells: { ...state.cells, [cell.id]: cell } }));
  },

  clearCell: (day, period) => {
    const cell = get().getCell(day, period);
    if (!cell) return;
    scheduleRepo.remove(cell.id);
    cancelLessonAlarm(cell.id);
    set(state => {
      const cells = { ...state.cells };
      delete cells[cell.id];
      return { cells };
    });
  },

  addSubject: subject => {
    subjectRepo.save(subject);
    set(state => ({ subjects: { ...state.subjects, [subject.id]: subject } }));
  },

  deleteSubject: id => {
    subjectRepo.remove(id);
    // حذف شلالي لخلايا الجدول المرتبطة بالمادة
    const cells = get().cells;
    const remaining: CellMap = {};
    for (const [cellId, cell] of Object.entries(cells)) {
      if (cell.subjectId === id) {
        scheduleRepo.remove(cellId);
        cancelLessonAlarm(cellId);
      } else {
        remaining[cellId] = cell;
      }
    }
    set(state => {
      const subjects = { ...state.subjects };
      delete subjects[id];
      return { cells: remaining, subjects };
    });
  },

  getTodayLessons: () => {
    const dayIndex = todayWeekdayIndex();
    if (dayIndex == null) return [];
    const lessons: TodayLesson[] = [];
    for (let period = 0; period < SCHEDULE_PERIODS; period++) {
      const cell = get().getCell(dayIndex as WeekdayIndex, period as PeriodIndex);
      if (!cell || !cell.subjectId) continue;
      const subject = get().getSubject(cell.subjectId);
      if (subject) {
        lessons.push({ period, subject, cell });
      }
    }
    return lessons;
  },
}));
