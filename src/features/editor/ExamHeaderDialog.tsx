/**
 * حوار ترويسة الامتحان — الحقول الأساسية + الدور والمسار والبسملة والعبارة الختامية.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import type { ExamHeader } from '../../shared/types/editor';
import { strings } from '../../shared/i18n/ar';
import { useTheme } from '../../shared/theme/ThemeProvider';
import { FONT_FAMILY } from '../../shared/theme/tokens';
import { Dialog } from '../../shared/ui/Dialog';
import { Button } from '../../shared/ui/Button';
import { TextField } from '../../shared/ui/TextField';
import { SelectField } from '../../shared/ui/SelectField';
import { subjectRepo } from '../../data/repositories';
import { useScheduleStore } from '../schedule/scheduleStore';
import { teacherRoleLabel } from '../../shared/utils/teacherRole';

const ROUNDS = ['الأول', 'الثاني', 'الثالث'];
const TRACKS = ['علمي', 'أدبي', 'مختلطة'];

interface ExamHeaderDialogProps {
  visible: boolean;
  current: ExamHeader;
  onClose: () => void;
  onSave: (header: ExamHeader) => void;
}

export function ExamHeaderDialog({ visible, current, onClose, onSave }: ExamHeaderDialogProps) {
  const { colors } = useTheme();
  const subjects = useScheduleStore(s => s.subjects);
  const [schoolName, setSchoolName] = useState('');
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('');
  const [examTitle, setExamTitle] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [duration, setDuration] = useState('');
  const [date, setDate] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [round, setRound] = useState('');
  const [track, setTrack] = useState('');
  const [showBismillah, setShowBismillah] = useState(true);
  const [closingNote, setClosingNote] = useState('');

  useEffect(() => {
    if (visible) {
      setSchoolName(current.schoolName);
      setSubject(current.subject);
      setGrade(current.grade);
      setExamTitle(current.examTitle);
      setAcademicYear(current.academicYear);
      setDuration(current.duration);
      setDate(current.date);
      setTeacherName(current.teacherName);
      setSubjectId(current.subjectId ?? null);
      setRound(current.round ?? '');
      setTrack(current.track ?? '');
      setShowBismillah(current.showBismillah ?? true);
      setClosingNote(current.closingNote ?? '');
    }
  }, [visible, current]);

  const subjectOptions = useMemo(
    () => [
      { label: strings.editor.noLinkedSubject, value: '' },
      ...Object.values(subjects).map(item => ({
        label: `${item.name} - ${item.grade}`,
        value: item.id,
      })),
    ],
    [subjects],
  );
  const selectedSubject = subjectId ? subjectRepo.get(subjectId) : undefined;

  const clearAll = () => {
    setSchoolName('');
    setSubject('');
    setGrade('');
    setExamTitle('');
    setAcademicYear('');
    setDuration('');
    setDate('');
    setTeacherName('');
    setSubjectId(null);
    setRound('');
    setTrack('');
    setShowBismillah(true);
    setClosingNote('');
  };

  const save = () => {
    onSave({
      ...current,
      schoolName: schoolName.trim(),
      subject: subject.trim(),
      grade: grade.trim(),
      examTitle: examTitle.trim(),
      academicYear: academicYear.trim(),
      duration: duration.trim(),
      date: date.trim(),
      teacherName: teacherName.trim(),
      subjectId,
      round: round.trim(),
      track: track.trim(),
      showBismillah,
      closingNote: closingNote.trim(),
    });
    onClose();
  };

  return (
    <Dialog
      visible={visible}
      title={strings.editor.header}
      onClose={onClose}
      actions={
        <View style={styles.actions}>
          <Button label={strings.editor.clearAll} variant="ghost" onPress={clearAll} />
          <Button label={strings.common.cancel} variant="ghost" onPress={onClose} />
          <Button label={strings.common.save} onPress={save} />
        </View>
      }
    >
      <View>
        <TextField label={strings.editor.schoolName} value={schoolName} onChangeText={setSchoolName} placeholder={strings.editor.schoolHint} />
        <TextField label={strings.editor.examTitle} value={examTitle} onChangeText={setExamTitle} placeholder={strings.editor.examTitleHint} />
        <TextField label={strings.editor.academicYear} value={academicYear} onChangeText={setAcademicYear} placeholder={strings.editor.academicYearHint} />
        <SelectField
          label={strings.editor.linkedSubject}
          placeholder={strings.editor.linkedSubjectHint}
          value={subjectId}
          options={subjectOptions}
          onChange={id => {
            const nextId = id || null;
            setSubjectId(nextId);
            const linked = nextId ? subjectRepo.get(nextId) : undefined;
            if (linked) {
              setSubject(linked.name);
              setGrade(linked.grade);
            }
          }}
        />
        <TextField label={strings.editor.subject} value={subject} onChangeText={setSubject} placeholder={strings.editor.subjectHint} />
        <TextField label={strings.common.grade} value={grade} onChangeText={setGrade} placeholder={strings.editor.gradeHint} />
        <TextField label={strings.common.date} value={date} onChangeText={setDate} placeholder="مثال: 2025/03/01" />
        <TextField label={strings.editor.duration} value={duration} onChangeText={setDuration} placeholder={strings.editor.durationHint} />
        <TextField label={`اسم ${teacherRoleLabel(selectedSubject?.stage)}`} value={teacherName} onChangeText={setTeacherName} placeholder={strings.editor.teacherHint} />

        <SelectField
          label="الدور"
          value={ROUNDS.includes(round) ? round : ''}
          options={ROUNDS.map(r => ({ label: r, value: r }))}
          onChange={setRound}
        />

        <SelectField
          label="المسار"
          value={TRACKS.includes(track) ? track : ''}
          options={TRACKS.map(t => ({ label: t, value: t }))}
          onChange={setTrack}
        />

        <View style={styles.switchRow}>
          <Text style={[styles.switchLabel, { color: colors.textPrimary }]}>بسم الله الرحمن الرحيم</Text>
          <Switch value={showBismillah} onValueChange={setShowBismillah} trackColor={{ true: colors.primary }} />
        </View>

        <TextField
          label="العبارة الختامية"
          value={closingNote}
          onChangeText={setClosingNote}
          placeholder="مثال: مع دعواتكم بالنجاح والتوفيق"
        />
      </View>
    </Dialog>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: 4, flexWrap: 'wrap' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  switchLabel: { fontFamily: FONT_FAMILY, fontSize: 14, fontWeight: '600' },
});
