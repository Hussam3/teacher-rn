/**
 * محرر درجات الطالب — تعديل درجات جميع الأعمدة + طباعة التقرير.
 */
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../shared/theme/ThemeProvider';
import { FONT_FAMILY } from '../../shared/theme/tokens';
import { strings } from '../../shared/i18n/ar';
import { Dialog } from '../../shared/ui/Dialog';
import { Button } from '../../shared/ui/Button';
import { TextField } from '../../shared/ui/TextField';
import { showError } from '../../shared/ui/toast';
import type { GradeBook, Student, Subject } from '../../shared/types/domain';
import { columnValue } from '../../shared/utils/gradebook';
import { generateStudentReportPdf } from '../../services/pdfService';
import { printPdf } from '../../services/printService';

interface StudentEditorProps {
  student: Student;
  gradebook: GradeBook;
  subject?: Subject;
  onSave: (student: Student) => void;
  onDelete?: (studentId: string) => void;
  onClose: () => void;
}

export function StudentEditor({ student, gradebook, subject, onSave, onDelete, onClose }: StudentEditorProps) {
  const { colors } = useTheme();
  const [name, setName] = React.useState(student.name);
  const [grades, setGrades] = React.useState<Record<string, string>>({});
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  React.useEffect(() => {
    const initial: Record<string, string> = {};
    for (const col of gradebook.columns) {
      if (!col.isCalculated) {
        const v = student.grades[col.id];
        initial[col.id] = v != null && Number.isInteger(v) ? String(v) : v != null ? String(v) : '';
      }
    }
    setGrades(initial);
  }, [student, gradebook]);

  const normalColumns = useMemo(() => gradebook.columns.filter(c => !c.isCalculated), [gradebook.columns]);

  const handleSave = () => {
    const next = { ...student.grades };
    for (const col of normalColumns) {
      const raw = grades[col.id] ?? '';
      if (raw.trim() === '') {
        delete next[col.id];
      } else {
        const num = Number(raw);
        if (Number.isNaN(num) || num < 0 || num > col.maxScore) {
          showError(strings.gradebook.gradeInvalid.replace('{max}', String(col.maxScore)));
          return;
        }
        next[col.id] = num;
      }
    }
    onSave({ ...student, name: name.trim() || student.name, grades: next });
  };

  const handleReport = async () => {
    try {
      const path = await generateStudentReportPdf(gradebook, student, subject);
      await printPdf(path);
    } catch (e) {
      showError(String(e));
    }
  };

  return (
    <>
      <Dialog
        visible
        title={student.name}
        onClose={onClose}
      actions={
        <View style={styles.actions}>
          {onDelete ? (
            <Button label={strings.common.delete} variant="danger" icon={{ name: 'delete' }} onPress={() => setConfirmDelete(true)} />
          ) : null}
          <Button label={strings.gradebook.printReport} variant="secondary" icon={{ name: 'print' }} onPress={handleReport} />
          <Button label={strings.gradebook.done} onPress={handleSave} />
        </View>
      }
    >
      <View>
        <TextField label={strings.gradebook.studentName} value={name} onChangeText={setName} />
        {gradebook.columns.map(col => {
          if (col.isCalculated) {
            const val = columnValue(student, col);
            return (
              <View key={col.id} style={styles.calcRow}>
                <Text style={[styles.calcLabel, { color: colors.textSecondary }]}>{col.name}</Text>
                <Text style={[styles.calcValue, { color: colors.primary }]}>
                  {val} <Text style={{ fontSize: 11, color: colors.textSecondary }}>({strings.gradebook.calculatedBadge})</Text>
                </Text>
              </View>
            );
          }
          return (
            <TextField
              key={col.id}
              label={`${col.name} (${col.maxScore})`}
              value={grades[col.id] ?? ''}
              onChangeText={t => setGrades(prev => ({ ...prev, [col.id]: t }))}
              keyboardType="number-pad"
            />
          );
        })}
      </View>
    </Dialog>

    {confirmDelete ? (
      <Dialog
        visible
        title={strings.gradebook.deleteStudent}
        onClose={() => setConfirmDelete(false)}
        actions={
          <View style={styles.actions}>
            <Button label={strings.common.cancel} variant="ghost" onPress={() => setConfirmDelete(false)} />
            <Button
              label={strings.gradebook.deleteStudentYes}
              variant="danger"
              onPress={() => {
                setConfirmDelete(false);
                onDelete?.(student.id);
              }}
            />
          </View>
        }
      >
        <Text style={[styles.warningText, { color: colors.textSecondary }]}>
          {strings.gradebook.deleteStudentWarning}
        </Text>
      </Dialog>
    ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: 8 },
  calcRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  calcLabel: { fontFamily: FONT_FAMILY, fontSize: 14 },
  calcValue: { fontFamily: FONT_FAMILY, fontSize: 15, fontWeight: '700' },
  warningText: { fontFamily: FONT_FAMILY, fontSize: 14, lineHeight: 22 },
});
