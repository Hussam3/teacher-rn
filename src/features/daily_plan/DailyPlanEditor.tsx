/**
 * محرر الخطة اليومية — معالج إنشاء (Wizard) + محرر الأقسام + الحفظ والطباعة.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
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
import { SegmentedControl } from '../../shared/ui/SegmentedControl';
import { PressableScale } from '../../shared/ui/PressableScale';
import { Icon } from '../../shared/ui/Icon';
import { showError, showSuccess } from '../../shared/ui/toast';
import { subjectRepo, dailyPlanRepo } from '../../data/repositories';
import { useScheduleStore } from '../schedule/scheduleStore';
import {
  dailyPlanTopicLabel,
  getDailyPlanTopics,
  parseDailyPlanTopics,
} from '../../shared/types/domain';
import type { DailyPlan } from '../../shared/types/domain';
import { generateFallbackDailyPlan, getAIService } from '../../services/aiService';
import { generateDailyPlanPdf } from '../../services/pdfService';
import { printPdf } from '../../services/printService';
import { getChaptersList } from '../../services/curriculumRegistry';
import { extractPagesContent } from '../../services/curriculumTextExtractor';

type EditorRoute = RouteProp<RootStackParamList, 'DailyPlanEditor'>;

interface SectionDef {
  key: keyof Pick<
    DailyPlan,
    | 'objectives'
    | 'introduction'
    | 'presentation'
    | 'activities'
    | 'evaluation'
    | 'homework'
  >;
  title: string;
  color: string;
  icon: string;
}

const PLAN_SECTIONS: SectionDef[] = [
  {
    key: 'objectives',
    title: strings.dailyPlan.planSections.objectives,
    color: '#4CAF50',
    icon: 'flag',
  },
  {
    key: 'introduction',
    title: strings.dailyPlan.planSections.introduction,
    color: '#FF9800',
    icon: 'lightbulb-outline',
  },
  {
    key: 'presentation',
    title: strings.dailyPlan.planSections.presentation,
    color: '#2196F3',
    icon: 'menu-book',
  },
  {
    key: 'activities',
    title: strings.dailyPlan.planSections.activities,
    color: '#9C27B0',
    icon: 'build-circle',
  },
  {
    key: 'evaluation',
    title: strings.dailyPlan.planSections.evaluation,
    color: '#E91E63',
    icon: 'quiz',
  },
  {
    key: 'homework',
    title: strings.dailyPlan.planSections.homework,
    color: '#009688',
    icon: 'home-work',
  },
];

const DURATIONS = [30, 35, 40, 45, 50, 55, 60];

export function DailyPlanEditor() {
  const route = useRoute<EditorRoute>();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors } = useTheme();
  const subjects = useScheduleStore(s => s.subjects);

  const [mode, setMode] = useState<'wizard' | 'editor'>('wizard');
  const [isGenerating, setIsGenerating] = useState(false);

  // نموذج المعالج
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [method, setMethod] = useState<string>(
    strings.dailyPlan.methods[0] ?? 'المناقشة والحوار',
  );
  const [sourceType, setSourceType] = useState<'chapter' | 'topic' | 'pages'>('chapter');
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
  const [topic, setTopic] = useState('');
  const [startPage, setStartPage] = useState('');
  const [endPage, setEndPage] = useState('');
  const [className, setClassName] = useState('');
  const [duration, setDuration] = useState(45);

  // حالة الخطة المولّدة
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [sections, setSections] = useState<Record<string, string>>({});
  // رسالة تعرّض الذكاء الاصطناعي؛ عند وجودها تكون الخطة قالباً احتياطياً وليس بوحي من الذكاء الاصطناعي
  const [aiError, setAiError] = useState<string | null>(null);

  const subjectOptions = useMemo(
    () =>
      Object.values(subjects).map(s => ({
        label: `${s.name} - ${s.grade}`,
        value: s.id,
      })),
    [subjects],
  );

  const selectedSubject = subjectId ? subjectRepo.get(subjectId) : undefined;
  const customTopics = useMemo(() => parseDailyPlanTopics(topic), [topic]);

  const availableChapters = useMemo(() => {
    if (!selectedSubject) return [];
    return getChaptersList(selectedSubject.name, selectedSubject.grade);
  }, [selectedSubject]);

  useEffect(() => {
    if (availableChapters.length > 0 && !selectedChapter) {
      setSelectedChapter(availableChapters[0]?.title ?? null);
    }
  }, [availableChapters, selectedChapter]);

  // تحميل حسب معاملات التنقل
  useEffect(() => {
    const params = route.params ?? {};
    if (params.planId) {
      const existing = dailyPlanRepo.get(params.planId);
      if (existing) {
        setSubjectId(existing.subjectId);
        setClassName(existing.className);
        setPlan(existing);
        setSections({
          objectives: existing.objectives,
          introduction: existing.introduction,
          presentation: existing.presentation,
          activities: existing.activities,
          evaluation: existing.evaluation,
          homework: existing.homework,
        });
        setMode('editor');
      }
      return;
    }
    if (params.subjectId) {
      setSubjectId(params.subjectId);
      const s = subjectRepo.get(params.subjectId);
      if (s) setClassName(s.grade);
    }
    if (params.className) setClassName(params.className);
  }, [route.params]);

  const canGenerate =
    !isGenerating &&
    subjectId != null &&
    (sourceType === 'chapter'
      ? selectedChapter != null
      : sourceType === 'topic'
      ? customTopics.length > 0
      : startPage.trim().length > 0 && endPage.trim().length > 0);

  const buildGenerateParams = async () => {
    const subject = subjectRepo.get(subjectId!);
    if (!subject) return null;
    let planTopics = customTopics;
    let chapterTitle = sourceType === 'chapter' ? selectedChapter ?? undefined : undefined;
    let pageRange: string | undefined;
    let textbookExcerpt: string | undefined;

    if (sourceType === 'chapter' && selectedChapter) {
      planTopics = [selectedChapter];
      chapterTitle = selectedChapter;
    } else if (sourceType === 'pages') {
      const sPage = parseInt(startPage, 10) || 1;
      const ePage = parseInt(endPage, 10) || sPage;
      pageRange = `من صفحة ${sPage} إلى صفحة ${ePage}`;

      const extracted = await extractPagesContent({
        subjectName: subject.name,
        grade: className || subject.grade || '',
        startPage: sPage,
        endPage: ePage,
      });

      if (extracted.topicTitle && planTopics.length === 0) {
        planTopics = [extracted.topicTitle];
      }
      if (extracted.textbookExcerpt) {
        textbookExcerpt = extracted.textbookExcerpt;
      }
    }

    if (planTopics.length === 0 && pageRange) {
      planTopics = [pageRange];
    }
    const normalizedTopics = parseDailyPlanTopics(planTopics.join('\n'));
    const topicName = normalizedTopics.join('، ') || 'مفردات الدرس المنهجي';

    return {
      subjectId: subjectId!,
      subjectName: subject.name,
      topic: topicName,
      topics: normalizedTopics,
      chapterTitle,
      pageRange,
      textbookExcerpt,
      className: className || subject.grade || 'المرحلة الدراسية',
      duration,
      teachingMethod: method,
    };
  };

  const applyPlan = (generated: DailyPlan, error: string | null) => {
    setPlan(generated);
    setSections({
      objectives: generated.objectives,
      introduction: generated.introduction,
      presentation: generated.presentation,
      activities: generated.activities,
      evaluation: generated.evaluation,
      homework: generated.homework,
    });
    setAiError(error);
    setMode('editor');
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const params = await buildGenerateParams();
      if (!params) {
        showError(strings.schedule.chooseSubjectFirst);
        return;
      }
      try {
        const generated = await getAIService().generateDailyPlan(params);
        applyPlan(generated, null);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'خطأ غير متوقع';
        showError(`${strings.dailyPlan.title}: ${msg}`);
        // نسخة احتياطية صريحة (وليس إخفاءً للفشل) مع تنبيه واضح أنها ليست من الذكاء الاصطناعي
        applyPlan(generateFallbackDailyPlan(params), msg);
      }
    } catch (e) {
      showError(e instanceof Error ? e.message : 'خطأ');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!plan) return;
    const updated: DailyPlan = {
      ...plan,
      objectives: sections.objectives ?? '',
      introduction: sections.introduction ?? '',
      presentation: sections.presentation ?? '',
      activities: sections.activities ?? '',
      evaluation: sections.evaluation ?? '',
      homework: sections.homework ?? '',
      isEdited: true,
    };
    dailyPlanRepo.save(updated);
    showSuccess(strings.dailyPlan.saved);
    navigation.goBack();
  };

  const handlePrint = async () => {
    if (!plan) return;
    try {
      const path = await generateDailyPlanPdf(plan, selectedSubject);
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
            ? strings.dailyPlan.newPlanTitle
            : strings.dailyPlan.editPlan}
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
          {selectedSubject && !selectedSubject.pdfUri ? (
            <Text style={[styles.warning, { color: colors.warning }]}>
              {strings.dailyPlan.noPdfWarning}
            </Text>
          ) : null}

          <SelectField
            label={strings.dailyPlan.teachingMethod}
            value={method}
            options={strings.dailyPlan.methods.map(m => ({
              label: m,
              value: m,
            }))}
            onChange={setMethod}
          />

          <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>
            مصدر الدرس
          </Text>
          <SegmentedControl
            options={
              availableChapters.length > 0
                ? [
                    { label: 'فصول المنهج', value: 'chapter' },
                    { label: strings.dailyPlan.sourceTopic, value: 'topic' },
                    { label: strings.dailyPlan.sourcePages, value: 'pages' },
                  ]
                : [
                    { label: strings.dailyPlan.sourceTopic, value: 'topic' },
                    { label: strings.dailyPlan.sourcePages, value: 'pages' },
                  ]
            }
            value={sourceType}
            onChange={v => setSourceType(v as 'chapter' | 'topic' | 'pages')}
          />

          {sourceType === 'chapter' && availableChapters.length > 0 ? (
            <SelectField
              label="اختر الفصل / الوحدة من المنهج المعتمد"
              placeholder="اختر فصلاً أو وحدة..."
              value={selectedChapter}
              options={availableChapters.map(ch => ({
                label: `[ص ${ch.page}] ${ch.title}`,
                value: ch.title,
              }))}
              onChange={setSelectedChapter}
            />
          ) : sourceType === 'topic' ? (
            <TextField
              label={strings.dailyPlan.topics}
              value={topic}
              onChangeText={setTopic}
              placeholder={strings.dailyPlan.topicsHint}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={styles.topicsInput}
            />
          ) : (
            <View style={styles.pagesRow}>
              <View style={{ flex: 1 }}>
                <TextField
                  label={strings.dailyPlan.fromPage}
                  value={startPage}
                  onChangeText={setStartPage}
                  keyboardType="number-pad"
                />
              </View>
              <View style={{ flex: 1 }}>
                <TextField
                  label={strings.dailyPlan.toPage}
                  value={endPage}
                  onChangeText={setEndPage}
                  keyboardType="number-pad"
                />
              </View>
            </View>
          )}

          <View style={styles.pagesRow}>
            <View style={{ flex: 2 }}>
              <TextField
                label={strings.common.grade}
                value={className}
                onChangeText={setClassName}
                placeholder={strings.schedule.classHint}
              />
            </View>
            <View style={{ flex: 1 }}>
              <SelectField
                label={strings.dailyPlan.duration}
                value={String(duration)}
                options={DURATIONS.map(d => ({
                  label: `${d} د`,
                  value: String(d),
                }))}
                onChange={v => setDuration(Number(v))}
              />
            </View>
          </View>

          <Button
            label={
              isGenerating
                ? strings.dailyPlan.generating
                : strings.dailyPlan.generate
            }
            onPress={handleGenerate}
            disabled={!canGenerate}
            loading={isGenerating}
            style={styles.generateBtn}
          />
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View
            style={[styles.docHeader, { backgroundColor: colors.primaryDark }]}
          >
            <Text style={styles.docTitle}>{strings.dailyPlan.title}</Text>
            <View style={styles.chipsRow}>
              <HeaderChip
                label={strings.common.subject}
                value={selectedSubject?.name ?? ''}
              />
              <HeaderChip
                label={strings.common.grade}
                value={plan?.className ?? ''}
              />
              <HeaderChip
                label={getDailyPlanTopics(plan ?? { topic: '' }).length > 1 ? 'الموضوعات' : 'الموضوع'}
                value={plan ? dailyPlanTopicLabel(plan) : ''}
              />
              <HeaderChip
                label={strings.dailyPlan.teachingMethod}
                value={method}
              />
            </View>
          </View>

          {aiError ? (
            <View
              style={[
                styles.aiFailBanner,
                { borderColor: colors.warning, backgroundColor: `${colors.warning}14` },
              ]}
            >
              <View style={styles.aiFailHeader}>
                <Icon name="warning" size={22} color={colors.warning} />
                <Text style={[styles.aiFailText, { color: colors.textPrimary }]}>
                  {strings.dailyPlan.aiFailedBanner.replace('{reason}', aiError)}
                </Text>
              </View>
              <Button
                label={strings.dailyPlan.retryGenerate}
                variant="outline"
                onPress={handleGenerate}
                disabled={isGenerating}
                loading={isGenerating}
              />
            </View>
          ) : null}

          {PLAN_SECTIONS.map((section, i) => (
            <View
              key={section.key}
              style={[styles.section, { borderColor: `${section.color}30` }]}
            >
              <View
                style={[
                  styles.sectionHeader,
                  { backgroundColor: `${section.color}18` },
                ]}
              >
                <View
                  style={[
                    styles.sectionIcon,
                    { backgroundColor: `${section.color}22` },
                  ]}
                >
                  <Icon name={section.icon} size={18} color={section.color} />
                </View>
                <Text style={[styles.sectionTitle, { color: section.color }]}>
                  {i + 1}. {section.title}
                </Text>
              </View>
              <TextInput
                multiline
                value={sections[section.key] ?? ''}
                onChangeText={t =>
                  setSections(prev => ({ ...prev, [section.key]: t }))
                }
                style={[styles.sectionInput, { color: colors.textPrimary }]}
                textAlignVertical="top"
              />
            </View>
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
  warning: { fontFamily: FONT_FAMILY, fontSize: 12, marginTop: 4 },
  fieldLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
  },
  pagesRow: { flexDirection: 'row', gap: 12 },
  generateBtn: { marginTop: 16 },
  topicsInput: { minHeight: 104 },
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
  aiFailBanner: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  aiFailHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  aiFailText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
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
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { fontFamily: FONT_FAMILY, fontSize: 14, fontWeight: '700' },
  sectionInput: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    minHeight: 84,
    padding: 12,
    lineHeight: 22,
  },
  bottomActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
});
