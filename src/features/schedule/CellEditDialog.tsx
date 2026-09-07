/**
 * حوار تحرير حصة — المادة والشعبة وربط الخطة اليومية والتنبيه.
 */
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Switch } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../app/navigation/types';
import { dailyPlanTopicLabel } from '../../shared/types/domain';
import type { DailyPlan, PeriodIndex, WeekdayIndex } from '../../shared/types/domain';
import { IRAQI_WEEKDAYS } from '../../shared/types/domain';
import { strings } from '../../shared/i18n/ar';
import { Dialog } from '../../shared/ui/Dialog';
import { Button } from '../../shared/ui/Button';
import { TextField } from '../../shared/ui/TextField';
import { SelectField } from '../../shared/ui/SelectField';
import { Sheet } from '../../shared/ui/Sheet';
import { PressableScale } from '../../shared/ui/PressableScale';
import { useTheme } from '../../shared/theme/ThemeProvider';
import { FONT_FAMILY, radius } from '../../shared/theme/tokens';
import { useScheduleStore } from './scheduleStore';
import { AddSubjectDialog } from './AddSubjectDialog';
import { dailyPlanRepo } from '../../data/repositories';
import { formatDate } from '../../shared/utils/date';

interface CellEditDialogProps {
  target: { day: WeekdayIndex; period: PeriodIndex } | null;
  onClose: () => void;
}

export function CellEditDialog({ target, onClose }: CellEditDialogProps) {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { subjects, getCell } = useScheduleStore();

  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [className, setClassName] = useState('');
  const [lessonPlanId, setLessonPlanId] = useState<string | null>(null);
  const [isAlarmEnabled, setIsAlarmEnabled] = useState(false);
  const [alarmTime, setAlarmTime] = useState('08:00');
  const [addSubjectOpen, setAddSubjectOpen] = useState(false);
  const [planSheetOpen, setPlanSheetOpen] = useState(false);

  const subjectOptions = Object.values(subjects).map(s => ({
    label: `${s.name} - ${s.grade}`,
    value: s.id,
  }));

  // تعبئة القيم عند فتح الحوار
  useEffect(() => {
    if (!target) return;
    const cell = getCell(target.day, target.period);
    setSubjectId(cell?.subjectId ?? null);
    setClassName(cell?.className ?? '');
    setLessonPlanId(cell?.lessonPlanId ?? null);
    setIsAlarmEnabled(cell?.isAlarmEnabled ?? false);
    setAlarmTime(cell?.alarmTime ?? '08:00');
  }, [target, getCell]);

  // إعادة قراءة الخطط عند العودة من إنشاء خطة (ربط تلقائي لأحدث خطة)
  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      if (!subjectId) return;
      const plans = dailyPlanRepo
        .list()
        .filter(p => p.subjectId === subjectId)
        .sort((a, b) => b.date.localeCompare(a.date));
      const newest = plans[0];
      if (newest) setLessonPlanId(newest.id);
    });
    return unsub;
  }, [navigation, subjectId]);

  if (!target) return null;

  const linkedPlan = lessonPlanId ? dailyPlanRepo.get(lessonPlanId) : undefined;
  const plansForSubject = dailyPlanRepo
    .list()
    .filter(p => p.subjectId === subjectId)
    .sort((a, b) => b.date.localeCompare(a.date));

  const save = () => {
    useScheduleStore.getState().updateCell({
      day: target.day,
      period: target.period,
      subjectId,
      className: className.trim() || null,
      lessonPlanId,
      isAlarmEnabled,
      alarmTime: isAlarmEnabled ? alarmTime : null,
    });
    onClose();
  };

  const deleteCell = () => {
    useScheduleStore.getState().clearCell(target.day, target.period);
    onClose();
  };

  return (
    <Dialog
      visible
      title={`${IRAQI_WEEKDAYS[target.day]} - ${target.period + 1}`}
      onClose={onClose}
      actions={
        <View style={styles.actions}>
          {subjectId ? (
            <Button label={strings.common.delete} variant="danger" onPress={deleteCell} />
          ) : null}
          <Button label={strings.common.cancel} variant="ghost" onPress={onClose} />
          <Button label={strings.common.save} onPress={save} />
        </View>
      }
    >
      <View>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <SelectField
              label={strings.common.subject}
              placeholder={strings.schedule.selectSubject}
              value={subjectId}
              options={subjectOptions}
              onChange={setSubjectId}
            />
          </View>
          <PressableScale
            onPress={() => setAddSubjectOpen(true)}
            animated={false}
            style={[
              styles.addBtn,
              {
                backgroundColor: `${colors.primary}12`,
                borderColor: `${colors.primary}40`,
              },
            ]}
          >
            <Text style={[styles.addBtnText, { color: colors.primary }]}>+</Text>
          </PressableScale>
        </View>

        <TextField
          label={strings.common.className}
          value={className}
          onChangeText={setClassName}
          placeholder={strings.schedule.classHint}
        />

        {/* قسم الخطة اليومية */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          {strings.nav.dailyPlan}
        </Text>
        {linkedPlan ? (
          <View style={[styles.linkedCard, { backgroundColor: `${colors.success}18` }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.linkedTopic, { color: colors.textPrimary }]}>
                {dailyPlanTopicLabel(linkedPlan)}
              </Text>
              <Text style={{ color: colors.textSecondary, fontFamily: FONT_FAMILY, fontSize: 12 }}>
                {formatDate(linkedPlan.date)}
              </Text>
            </View>
            <PressableScale onPress={() => setLessonPlanId(null)} animated={false}>
              <Text style={{ color: colors.error, fontSize: 18 }}>✕</Text>
            </PressableScale>
          </View>
        ) : (
          <View style={styles.planButtons}>
            <Button
              label={strings.schedule.createPlan}
              icon={{ name: 'add' }}
              variant="secondary"
              disabled={!subjectId}
              onPress={() =>
                navigation.navigate('DailyPlanEditor', {
                  subjectId: subjectId ?? undefined,
                  className: className || undefined,
                })
              }
            />
            <Button
              label={strings.schedule.linkPlan}
              icon={{ name: 'link' }}
              variant="outline"
              disabled={!subjectId}
              onPress={() => setPlanSheetOpen(true)}
            />
          </View>
        )}

        {/* قسم التنبيه */}
        <View style={styles.alarmRow}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary, flex: 1 }]}>
            {strings.schedule.alarm}
          </Text>
          <Switch
            value={isAlarmEnabled}
            onValueChange={setIsAlarmEnabled}
            trackColor={{ true: colors.primary }}
          />
        </View>
        {isAlarmEnabled ? (
          <TextField
            label={strings.schedule.alarmOn.replace('{time}', '')}
            value={alarmTime}
            onChangeText={setAlarmTime}
            placeholder="08:00"
          />
        ) : null}
      </View>

      <AddSubjectDialog
        visible={addSubjectOpen}
        onClose={() => setAddSubjectOpen(false)}
        onAdded={setSubjectId}
      />

      <Sheet
        visible={planSheetOpen}
        title={strings.schedule.selectPlan}
        onClose={() => setPlanSheetOpen(false)}
      >
        {plansForSubject.length === 0 ? (
          <Text style={{ textAlign: 'center', color: colors.textSecondary, padding: 20, fontFamily: FONT_FAMILY }}>
            {strings.schedule.noPlansForSubject}
          </Text>
        ) : (
          plansForSubject.map((p: DailyPlan) => (
            <PressableScale
              key={p.id}
              onPress={() => {
                setLessonPlanId(p.id);
                setPlanSheetOpen(false);
              }}
              animated={false}
              style={[styles.planOption, { borderBottomColor: colors.divider }]}
            >
              <Text style={{ color: colors.textPrimary, fontFamily: FONT_FAMILY, fontWeight: '700' }}>
                {dailyPlanTopicLabel(p)}
              </Text>
              <Text style={{ color: colors.textSecondary, fontFamily: FONT_FAMILY, fontSize: 12 }}>
                {formatDate(p.date)}
              </Text>
            </PressableScale>
          ))
        )}
      </Sheet>
    </Dialog>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: 8 },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  addBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 28,
  },
  sectionTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 12,
  },
  linkedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: radius.sm,
    padding: 10,
    marginTop: 6,
  },
  linkedTopic: {
    fontFamily: FONT_FAMILY,
    fontWeight: '700',
    fontSize: 14,
  },
  planButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  alarmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  planOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 2,
  },
});
