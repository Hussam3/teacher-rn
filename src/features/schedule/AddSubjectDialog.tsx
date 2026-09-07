/**
 * حوار إضافة مادة جديدة — المرحلة والصف والسنة.
 */
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { Stage } from '../../shared/types/domain';
import { strings } from '../../shared/i18n/ar';
import { Dialog } from '../../shared/ui/Dialog';
import { Button } from '../../shared/ui/Button';
import { TextField } from '../../shared/ui/TextField';
import { SelectField } from '../../shared/ui/SelectField';
import { newId } from '../../shared/utils/id';
import { todayISO } from '../../shared/utils/date';
import { useScheduleStore } from '../schedule/scheduleStore';
import { showSuccess } from '../../shared/ui/toast';

import { findBook, toGoogleDrivePreviewUrl } from '../../services/curriculumCatalog';

const STAGES: Stage[] = ['الابتدائية', 'المتوسطة', 'الإعدادية'];

const GRADES: Record<Stage, string[]> = {
  الابتدائية: ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس'],
  المتوسطة: ['الأول', 'الثاني', 'الثالث'],
  الإعدادية: ['الرابع', 'الخامس', 'السادس'],
};

interface AddSubjectDialogProps {
  visible: boolean;
  onClose: () => void;
  onAdded?: (id: string) => void;
}

export function AddSubjectDialog({ visible, onClose, onAdded }: AddSubjectDialogProps) {
  const [name, setName] = useState('');
  const [stage, setStage] = useState<Stage>('الابتدائية');
  const [grade, setGrade] = useState<string>('الأول');
  const [year, setYear] = useState('2025-2026');

  const addSubject = useScheduleStore(s => s.addSubject);

  const handleSave = () => {
    if (!name.trim()) return;
    const id = newId();
    const fullGrade = `${grade} ${stage.replace('ال', '')}`.trim();
    const matched = findBook({ subjectName: name.trim(), grade: fullGrade, stage });
    const autoPdfUri = matched?.viewUrl ? toGoogleDrivePreviewUrl(matched.viewUrl, matched.driveId) : null;

    addSubject({
      id,
      name: name.trim(),
      stage,
      grade: fullGrade,
      year,
      pdfUri: autoPdfUri,
      pdfBase64: null,
      createdAt: todayISO(),
    });
    showSuccess(`${strings.schedule.newSubject}: ${name.trim()}`);
    setName('');
    onAdded?.(id);
    onClose();
  };

  return (
    <Dialog
      visible={visible}
      title={strings.schedule.newSubject}
      onClose={onClose}
      actions={
        <View style={styles.actions}>
          <Button label={strings.common.cancel} variant="ghost" onPress={onClose} />
          <Button label={strings.common.save} onPress={handleSave} disabled={!name.trim()} />
        </View>
      }
    >
      <View>
        <TextField
          label={strings.common.subject}
          value={name}
          onChangeText={setName}
          placeholder="مثال: الرياضيات، اللغة العربية"
          required
        />
        <SelectField
          label="المرحلة الدراسية"
          placeholder="اختر المرحلة الدراسية"
          value={stage}
          options={STAGES.map(s => ({ label: s, value: s }))}
          onChange={s => {
            setStage(s);
            setGrade(GRADES[s][0] ?? 'الأول');
          }}
        />
        <SelectField
          label={strings.common.grade}
          placeholder="اختر الصف"
          value={grade}
          options={GRADES[stage].map(g => ({ label: g, value: g }))}
          onChange={setGrade}
        />
        <TextField label="السنة الدراسية" value={year} onChangeText={setYear} placeholder="2025-2026" />
      </View>
    </Dialog>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
});
