/**
 * محرر الخطة السنوية — معالج الإعداد + محرر التوزيع الشهري.
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  useRoute,
  useNavigation,
  type RouteProp,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../app/navigation/types';
import { useTheme } from '../../shared/theme/ThemeProvider';
import { FONT_FAMILY, radius } from '../../shared/theme/tokens';
import { strings } from '../../shared/i18n/ar';
import { AppScreen } from '../../shared/ui/AppScreen';
import { Button } from '../../shared/ui/Button';
import { TextField } from '../../shared/ui/TextField';
import { SelectField } from '../../shared/ui/SelectField';
import { DateField } from '../../shared/ui/DateField';
import { PressableScale } from '../../shared/ui/PressableScale';
import { Icon } from '../../shared/ui/Icon';
import { showError, showSuccess } from '../../shared/ui/toast';
import { subjectRepo, annualPlanRepo } from '../../data/repositories';
import { useScheduleStore } from '../schedule/scheduleStore';
import type { AnnualPlan, MonthDistribution } from '../../shared/types/domain';
import { getAIService } from '../../services/aiService';
import { generateAnnualPlanPdf } from '../../services/pdfService';
import { printPdf } from '../../services/printService';
import { teacherRoleLabel } from '../../shared/utils/teacherRole';

type EditorRoute = RouteProp<RootStackParamList, 'AnnualPlanEditor'>;

export function AnnualPlanEditor() {
  const route = useRoute<EditorRoute>();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors } = useTheme();
  const subjects = useScheduleStore(s => s.subjects);

  const [mode, setMode] = useState<'wizard' | 'editor'>('wizard');
  const [isGenerating, setIsGenerating] = useState(false);

  // نموذج
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [teacherName, setTeacherName] = useState('');
  const [className, setClassName] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const y = new Date().getFullYear();
    return new Date(y, 8, 1).toISOString();
  });
  const [endDate, setEndDate] = useState(() => {
    const y = new Date().getFullYear();
    return new Date(y + 1, 5, 30).toISOString();
  });
  const [weeklyPeriods, setWeeklyPeriods] = useState('3');
  const [isManual, setIsManual] = useState(false);
  const [includeHoliday, setIncludeHoliday] = useState(true);
  const [holidayStart, setHolidayStart] = useState(() => {
    const y = new Date().getFullYear();
    return new Date(y + 1, 0, 15).toISOString();
  });
  const [holidayEnd, setHolidayEnd] = useState(() => {
    const y = new Date().getFullYear();
    return new Date(y + 1, 0, 30).toISOString();
  });

  // الخطة المولّدة
  const [plan, setPlan] = useState<AnnualPlan | null>(null);
  const [generalObjectives, setGeneralObjectives] = useState('');
  const [teachingAids, setTeachingAids] = useState('');
  const [distribution, setDistribution] = useState<MonthDistribution[]>([]);

  const subjectOptions = useMemo(
    () =>
      Object.values(subjects).map(s => ({
        label: `${s.name} - ${s.grade}`,
        value: s.id,
      })),
    [subjects],
  );

  useEffect(() => {
    const params = route.params ?? {};
    if (params.planId) {
      const existing = annualPlanRepo.get(params.planId);
      if (existing) {
        setSubjectId(existing.subjectId);
        setClassName(existing.className);
        setPlan(existing);
        setGeneralObjectives(existing.generalObjectives);
        setTeachingAids(existing.teachingAids);
        setDistribution(existing.distribution);
        setMode('editor');
      }
      return;
    }
    if (params.subjectId) {
      setSubjectId(params.subjectId);
      const s = subjectRepo.get(params.subjectId);
      if (s) setClassName(s.grade);
    }
  }, [route.params]);

  const selectedSubject = subjectId ? subjectRepo.get(subjectId) : undefined;

  const canGenerate =
    !isGenerating && subjectId != null && teacherName.trim().length > 0;

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const subject = subjectRepo.get(subjectId!);
      const ai = getAIService();
      const generated = await ai.generateAnnualPlan({
        subjectId: subjectId!,
        teacherName: teacherName.trim(),
        className,
        startDate,
        endDate,
        weeklyPeriods: Number(weeklyPeriods) || 3,
        curriculumContent: `الخطة السنوية لمادة ${subject?.name ?? ''}`,
        holidays: includeHoliday ? [holidayStart, holidayEnd] : [],
        isManualAllocation: isManual,
        midYearHolidayStart: includeHoliday ? holidayStart : null,
        midYearHolidayEnd: includeHoliday ? holidayEnd : null,
      });
      setPlan(generated);
      setGeneralObjectives(generated.generalObjectives);
      setTeachingAids(generated.teachingAids);
      setDistribution(generated.distribution);
      setMode('editor');
    } catch (e) {
      showError(e instanceof Error ? e.message : 'خطأ');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    if (!plan) return;
    const updated: AnnualPlan = {
      ...plan,
      generalObjectives,
      teachingAids,
      distribution,
      isEdited: true,
    };
    annualPlanRepo.save(updated);
    showSuccess(strings.annualPlan.saved);
    navigation.goBack();
  };

  const handlePrint = async () => {
    if (!plan) return;
    try {
      const path = await generateAnnualPlanPdf(plan, selectedSubject);
      await printPdf(path);
    } catch (e) {
      showError(strings.dailyPlan.printError.replace('{error}', String(e)));
    }
  };

  return (
    <AppScreen edges={['top', 'bottom']}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <PressableScale
          onPress={() => navigation.goBack()}
          animated={false}
          style={styles.backBtn}
        >
          <Icon name="arrow-forward" size={24} color={colors.textPrimary} />
        </PressableScale>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          {mode === 'wizard'
            ? strings.annualPlan.smartTitle
            : strings.annualPlan.title}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {mode === 'wizard' ? (
        <ScrollView contentContainerStyle={styles.content}>
          <SelectField
            label={strings.dailyPlan.subject}
            placeholder={strings.schedule.selectSubject}
            value={subjectId}
            options={subjectOptions}
            onChange={setSubjectId}
          />
          <TextField
            label={`اسم ${teacherRoleLabel(selectedSubject?.stage)}`}
            value={teacherName}
            onChangeText={setTeacherName}
            placeholder={strings.annualPlan.teacherHint}
          />
          <TextField
            label={strings.common.grade}
            value={className}
            onChangeText={setClassName}
          />
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <DateField
                label={strings.annualPlan.startDate}
                value={startDate}
                onChange={setStartDate}
              />
            </View>
            <View style={{ flex: 1 }}>
              <DateField
                label={strings.annualPlan.endDate}
                value={endDate}
                onChange={setEndDate}
              />
            </View>
          </View>
          <TextField
            label={strings.annualPlan.weeklyPeriods}
            value={weeklyPeriods}
            onChangeText={setWeeklyPeriods}
            keyboardType="number-pad"
          />

          <View style={styles.switchRow}>
            <Text style={[styles.switchLabel, { color: colors.textPrimary }]}>
              {strings.annualPlan.autoAllocate}
            </Text>
            <Switch
              value={!isManual}
              onValueChange={v => setIsManual(!v)}
              trackColor={{ true: colors.success }}
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={[styles.switchLabel, { color: colors.textPrimary }]}>
              {strings.annualPlan.includeHoliday}
            </Text>
            <Switch
              value={includeHoliday}
              onValueChange={setIncludeHoliday}
              trackColor={{ true: colors.success }}
            />
          </View>
          {includeHoliday ? (
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <DateField
                  label={strings.annualPlan.midYearFrom}
                  value={holidayStart}
                  onChange={setHolidayStart}
                />
              </View>
              <View style={{ flex: 1 }}>
                <DateField
                  label={strings.annualPlan.midYearTo}
                  value={holidayEnd}
                  onChange={setHolidayEnd}
                />
              </View>
            </View>
          ) : null}

          <Button
            label={
              isGenerating
                ? strings.annualPlan.generating
                : strings.annualPlan.generate
            }
            onPress={handleGenerate}
            disabled={!canGenerate}
            loading={isGenerating}
            style={styles.generateBtn}
            icon={{ name: 'auto-awesome' }}
          />
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={[styles.docHeader, { backgroundColor: '#2E7D32' }]}>
            <Text style={styles.docTitle}>{strings.annualPlan.title}</Text>
            <View style={styles.chipsRow}>
              <HeaderChip
                label={strings.common.subject}
                value={selectedSubject?.name ?? ''}
              />
              <HeaderChip
                label={teacherRoleLabel(selectedSubject?.stage)}
                value={plan?.teacherName ?? ''}
              />
              <HeaderChip
                label={strings.common.grade}
                value={plan?.className ?? ''}
              />
              <HeaderChip
                label="السنة الدراسية"
                value={
                  plan
                    ? `${new Date(plan.startDate).getFullYear()}-${new Date(
                        plan.endDate,
                      ).getFullYear()}`
                    : ''
                }
              />
            </View>
          </View>

          <SectionCard
            title={strings.annualPlan.generalObjectives}
            value={generalObjectives}
            onChange={setGeneralObjectives}
            color="#2E7D32"
            icon="flag"
          />
          <SectionCard
            title={strings.annualPlan.teachingAids}
            value={teachingAids}
            onChange={setTeachingAids}
            color="#009688"
            icon="build"
          />

          <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>
            {strings.annualPlan.distributionTitle}
          </Text>

          {distribution.map((month, i) => (
            <MonthCard
              key={`${month.month}-${i}`}
              month={month}
              index={i}
              onChange={updated => {
                const next = [...distribution];
                next[i] = updated;
                setDistribution(next);
              }}
            />
          ))}

          <View style={styles.bottomActions}>
            <Button
              label={strings.dailyPlan.newPlan}
              variant="outline"
              onPress={() => {
                setPlan(null);
                setMode('wizard');
              }}
            />
            <Button
              label={strings.common.print}
              variant="secondary"
              icon={{ name: 'print' }}
              onPress={handlePrint}
            />
            <Button
              label={strings.common.save}
              icon={{ name: 'save' }}
              onPress={handleSave}
            />
          </View>
        </ScrollView>
      )}
    </AppScreen>
  );
}

function HeaderChip({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.headerChip}>
      <Text style={styles.headerChipLabel}>{label}</Text>
      <Text style={styles.headerChipValue}>{value || '—'}</Text>
    </View>
  );
}

interface SectionCardProps {
  title: string;
  value: string;
  onChange: (v: string) => void;
  color: string;
  icon: string;
}

function SectionCard({
  title,
  value,
  onChange,
  color,
  icon,
}: SectionCardProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.section, { borderColor: `${color}30` }]}>
      <View style={[styles.sectionHeader, { backgroundColor: `${color}18` }]}>
        <Icon name={icon} size={18} color={color} />
        <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
      </View>
      <TextInput
        multiline
        value={value}
        onChangeText={onChange}
        style={[styles.sectionInput, { color: colors.textPrimary }]}
        textAlignVertical="top"
      />
    </View>
  );
}

interface MonthCardProps {
  month: MonthDistribution;
  index: number;
  onChange: (updated: MonthDistribution) => void;
}

function MonthCard({ month, index, onChange }: MonthCardProps) {
  const { colors } = useTheme();
  const color = index % 2 === 0 ? '#2E7D32' : '#1976D2';

  const update = (patch: Partial<MonthDistribution>) =>
    onChange({ ...month, ...patch });

  return (
    <View style={[styles.monthCard, { borderColor: `${color}30` }]}>
      <View style={[styles.monthHeader, { backgroundColor: `${color}18` }]}>
        <Text style={[styles.monthTitle, { color }]}>{month.month}</Text>
        <View style={styles.monthPeriods}>
          <TextInput
            value={String(month.periodCount)}
            onChangeText={t => update({ periodCount: Number(t) || 0 })}
            keyboardType="number-pad"
            style={[
              styles.monthPeriodInput,
              { color, borderColor: `${color}40` },
            ]}
          />
          <Text
            style={[styles.monthPeriodLabel, { color: colors.textSecondary }]}
          >
            {strings.annualPlan.periodSuffix}
          </Text>
        </View>
      </View>

      <TextField
        label={strings.annualPlan.topics}
        value={month.topics.join('\n')}
        onChangeText={t => update({ topics: t.split('\n').filter(Boolean) })}
        multiline
        placeholder={strings.annualPlan.topicsHint}
      />
      <TextField
        label={strings.annualPlan.vocabulary}
        value={month.vocabulary}
        onChangeText={t => update({ vocabulary: t })}
        multiline
        placeholder={strings.annualPlan.vocabularyHint}
      />
      <TextField
        label={strings.annualPlan.methodsField}
        value={month.teachingMethods}
        onChangeText={t => update({ teachingMethods: t })}
        multiline
        placeholder={strings.annualPlan.methodsHint}
      />
      <TextField
        label={strings.annualPlan.evaluation}
        value={month.evaluation}
        onChangeText={t => update({ evaluation: t })}
        multiline
        placeholder={strings.annualPlan.evaluationHint}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontFamily: FONT_FAMILY, fontSize: 18, fontWeight: '700' },
  content: { padding: 16, paddingBottom: 40, gap: 4 },
  row: { flexDirection: 'row', gap: 12 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  switchLabel: { fontFamily: FONT_FAMILY, fontSize: 14, fontWeight: '600' },
  generateBtn: { marginTop: 16 },
  docHeader: { borderRadius: radius.lg, padding: 20, marginBottom: 12 },
  docTitle: {
    color: '#fff',
    fontFamily: FONT_FAMILY,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  headerChip: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 80,
  },
  headerChipLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontFamily: FONT_FAMILY,
    fontSize: 10,
  },
  headerChipValue: {
    color: '#fff',
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
  },
  fieldLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
  },
  section: {
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
  },
  sectionTitle: { fontFamily: FONT_FAMILY, fontSize: 14, fontWeight: '700' },
  sectionInput: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    minHeight: 70,
    padding: 12,
    lineHeight: 22,
  },
  monthCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: 10,
    padding: 12,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radius.sm,
    padding: 8,
    marginBottom: 6,
  },
  monthTitle: { fontFamily: FONT_FAMILY, fontSize: 15, fontWeight: '700' },
  monthPeriods: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  monthPeriodInput: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '700',
    borderWidth: 1,
    borderRadius: radius.sm,
    width: 44,
    textAlign: 'center',
    paddingVertical: 4,
  },
  monthPeriodLabel: { fontFamily: FONT_FAMILY, fontSize: 12 },
  bottomActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
});
