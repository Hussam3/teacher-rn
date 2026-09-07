/**
 * حوار توليد الأسئلة الذكي — المنهج والنطاق والأنواع والعدد والصعوبة.
 */
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Question, QuestionType } from '../../shared/types/domain';
import { strings } from '../../shared/i18n/ar';
import { useTheme } from '../../shared/theme/ThemeProvider';
import { FONT_FAMILY } from '../../shared/theme/tokens';
import { Dialog } from '../../shared/ui/Dialog';
import { Button } from '../../shared/ui/Button';
import { SelectField } from '../../shared/ui/SelectField';
import { TextField } from '../../shared/ui/TextField';
import { Chip } from '../../shared/ui/Chip';
import { PressableScale } from '../../shared/ui/PressableScale';
import { showError } from '../../shared/ui/toast';
import { subjectRepo } from '../../data/repositories';
import { useScheduleStore } from '../schedule/scheduleStore';
import { getAIService } from '../../services/aiService';
import { getChaptersList } from '../../services/curriculumRegistry';

const ALL_TYPES: QuestionType[] = [
  'mcq',
  'definition',
  'reasoning',
  'fill_blanks',
  'true_false',
  'enumerate',
  'calculation',
];

const DIFFICULTIES = ['سهل', 'متوسط', 'صعب', 'مزيج'];

interface QuestionGenerationDialogProps {
  visible: boolean;
  initialSubjectId: string | null;
  onClose: () => void;
  onQuestionsGenerated: (questions: Question[]) => void;
}

export function QuestionGenerationDialog({
  visible,
  initialSubjectId,
  onClose,
  onQuestionsGenerated,
}: QuestionGenerationDialogProps) {
  const { colors } = useTheme();
  const subjects = useScheduleStore(s => s.subjects);

  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
  const [scope, setScope] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<QuestionType[]>(['mcq']);
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState('مزيج');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (visible) {
      setSubjectId(initialSubjectId ?? Object.values(subjects)[0]?.id ?? null);
      setSelectedChapter(null);
      setScope('');
      setSelectedTypes(['mcq']);
      setCount(5);
      setDifficulty('مزيج');
    }
  }, [visible, initialSubjectId, subjects]);

  const subjectOptions = useMemo(
    () =>
      Object.values(subjects).map(s => ({
        label: `${s.name} - ${s.grade}`,
        value: s.id,
      })),
    [subjects],
  );

  const selectedSubject = subjectId ? subjectRepo.get(subjectId) : undefined;

  const availableChapters = useMemo(() => {
    if (!selectedSubject) return [];
    return getChaptersList(selectedSubject.name, selectedSubject.grade);
  }, [selectedSubject]);

  const toggleType = (t: QuestionType) => {
    setSelectedTypes(prev => {
      if (prev.includes(t)) {
        return prev.length > 1 ? prev.filter(x => x !== t) : prev;
      }
      return [...prev, t];
    });
  };

  const generate = async () => {
    if (!selectedSubject) return;
    setLoading(true);
    try {
      const ai = getAIService();
      const questions = await ai.generateQuestions({
        curriculumContent: `منهج ${selectedSubject.name} — ${selectedSubject.grade}`,
        types: selectedTypes,
        count,
        difficulty,
        chapterTitle: selectedChapter ?? undefined,
        scope: scope.trim() ? scope.trim() : undefined,
        subjectName: selectedSubject.name,
        subjectId: selectedSubject.id,
      });
      if (questions.length === 0) {
        showError(strings.questionGen.none);
        return;
      }
      onQuestionsGenerated(questions);
      onClose();
    } catch (e) {
      showError(strings.questionGen.error.replace('{error}', String(e)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      visible={visible}
      title={strings.questionGen.title}
      onClose={onClose}
      actions={
        <View style={styles.actions}>
          <Button
            label={strings.common.cancel}
            variant="ghost"
            onPress={onClose}
          />
          <Button
            label={strings.questionGen.generate}
            onPress={generate}
            loading={loading}
            disabled={!selectedSubject}
          />
        </View>
      }
    >
      <View>
        <Text style={styles.step}>{strings.questionGen.step1}</Text>
        <SelectField
          placeholder="اختر المنهج"
          value={subjectId}
          options={subjectOptions}
          onChange={id => {
            setSubjectId(id);
            setSelectedChapter(null);
          }}
        />

        <Text style={styles.step}>{strings.questionGen.step2}</Text>
        {availableChapters.length > 0 ? (
          <View style={{ marginBottom: 10 }}>
            <SelectField
              placeholder="اختر الفصل / الوحدة من المنهج (اختياري)..."
              value={selectedChapter}
              options={[
                { label: 'كامل المنهج / جميع الفصول', value: '' },
                ...availableChapters.map(ch => ({
                  label: `[ص ${ch.page}] ${ch.title}`,
                  value: ch.title,
                })),
              ]}
              onChange={v => setSelectedChapter(v || null)}
            />
          </View>
        ) : null}
        <TextField
          value={scope}
          onChangeText={setScope}
          placeholder={strings.questionGen.scopeHint}
        />

        <Text style={styles.step}>{strings.questionGen.step3}</Text>
        <View style={styles.typeChips}>
          {ALL_TYPES.map(t => (
            <Chip
              key={t}
              label={strings.questionGen.types[t]}
              selected={selectedTypes.includes(t)}
              onPress={() => toggleType(t)}
            />
          ))}
        </View>

        <Text style={styles.step}>{strings.questionGen.step4}</Text>
        <View style={styles.countRow}>
          <PressableScale
            onPress={() => setCount(c => Math.max(1, c - 1))}
            animated={false}
            style={styles.countBtn}
          >
            <Text style={{ color: colors.primary, fontSize: 22 }}>−</Text>
          </PressableScale>
          <Text style={[styles.countValue, { color: colors.textPrimary }]}>
            {count}
          </Text>
          <PressableScale
            onPress={() => setCount(c => Math.min(20, c + 1))}
            animated={false}
            style={styles.countBtn}
          >
            <Text style={{ color: colors.primary, fontSize: 22 }}>+</Text>
          </PressableScale>
        </View>

        <Text style={styles.step}>{strings.questionGen.step5}</Text>
        <SelectField
          value={difficulty}
          options={DIFFICULTIES.map(d => ({ label: d, value: d }))}
          onChange={setDifficulty}
        />

        {!selectedSubject?.pdfUri ? (
          <Text style={[styles.warning, { color: colors.warning }]}>
            {strings.questionGen.needPdf}
          </Text>
        ) : null}
      </View>
    </Dialog>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: 8 },
  step: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
    color: '#888',
    marginTop: 12,
    marginBottom: 4,
  },
  typeChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    justifyContent: 'center',
    paddingVertical: 8,
  },
  countBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eee',
  },
  countValue: {
    fontFamily: FONT_FAMILY,
    fontSize: 22,
    fontWeight: '700',
    minWidth: 40,
    textAlign: 'center',
  },
  warning: { fontFamily: FONT_FAMILY, fontSize: 12, marginTop: 10 },
});
