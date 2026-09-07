/**
 * ورقة إضافة كتاب جديد — اختيار دقيق (المرحلة ← الصف ← المادة) + تنزيل/عرض/رفع.
 * مصدر البيانات: فهرس المناهج العراقي الشامل المعتمد.
 */
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../shared/theme/ThemeProvider';
import { FONT_FAMILY, radius } from '../../shared/theme/tokens';
import { strings } from '../../shared/i18n/ar';
import { Sheet } from '../../shared/ui/Sheet';
import { Button } from '../../shared/ui/Button';
import { SelectField } from '../../shared/ui/SelectField';
import { showSuccess } from '../../shared/ui/toast';
import {
  STAGES_LIST,
  GRADES_BY_STAGE,
  getBooksForGrade,
  toGoogleDrivePreviewUrl,
  type StageName,
  type CurriculumBook,
} from '../../services/curriculumCatalog';
import { downloadBook } from '../../services/curriculumService';
import { pickPdf } from '../../services/fileService';
import { subjectRepo } from '../../data/repositories';
import { useScheduleStore } from '../schedule/scheduleStore';
import { newId } from '../../shared/utils/id';
import { todayISO } from '../../shared/utils/date';

interface AddBookSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function AddBookSheet({ visible, onClose }: AddBookSheetProps) {
  const { colors } = useTheme();
  const addSubject = useScheduleStore(s => s.addSubject);

  const [stage, setStage] = useState<StageName | null>(null);
  const [grade, setGrade] = useState<string | null>(null);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const stageOptions = useMemo(
    () => STAGES_LIST.map(s => ({ label: s, value: s })),
    [],
  );

  const gradeOptions = useMemo(() => {
    if (!stage) return [];
    const list = GRADES_BY_STAGE[stage] ?? [];
    return list.map(g => ({ label: g, value: g }));
  }, [stage]);

  const availableBooks = useMemo(() => {
    if (!stage || !grade) return [];
    return getBooksForGrade(stage, grade);
  }, [stage, grade]);

  const subjectOptions = useMemo(() => {
    return availableBooks.map(b => ({
      label: b.title,
      value: b.id,
    }));
  }, [availableBooks]);

  const selectedBook: CurriculumBook | undefined = useMemo(() => {
    return availableBooks.find(b => b.id === selectedBookId);
  }, [availableBooks, selectedBookId]);

  const resetError = () => setError('');

  // إضافة المادة مع رابط العرض السحابي عند عدم الحاجة إلى نسخة دون إنترنت.
  const handleAddDirect = () => {
    if (!stage || !grade || !selectedBook) return;
    try {
      const previewUri = toGoogleDrivePreviewUrl(selectedBook.viewUrl, selectedBook.driveId);
      const newSubject = {
        id: newId(),
        name: selectedBook.title,
        stage: stage.includes('ابتدائي')
          ? ('الابتدائية' as const)
          : stage.includes('متوسط')
          ? ('المتوسطة' as const)
          : ('الإعدادية' as const),
        grade,
        year: String(new Date().getFullYear()),
        pdfUri: previewUri,
        pdfBase64: null,
        createdAt: todayISO(),
      };
      subjectRepo.save(newSubject);
      addSubject(newSubject);
      showSuccess(strings.library.added.replace('{name}', selectedBook.title));
      reset();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطأ في إضافة المادة');
    }
  };

  // تنزيل الكتاب محلياً على الجهاز ليبقى قابلاً للقراءة دون إنترنت.
  const handleDownload = async () => {
    if (!stage || !grade || !selectedBook) return;
    setIsDownloading(true);
    setError('');
    setProgress(0);
    try {
      const { path } = await downloadBook(
        stage,
        grade,
        selectedBook.title,
        p => setProgress(p),
      );
      const newSubject = {
        id: newId(),
        name: selectedBook.title,
        stage: stage.includes('ابتدائي')
          ? ('الابتدائية' as const)
          : stage.includes('متوسط')
          ? ('المتوسطة' as const)
          : ('الإعدادية' as const),
        grade,
        year: String(new Date().getFullYear()),
        pdfUri: path,
        pdfBase64: null,
        createdAt: todayISO(),
      };
      subjectRepo.save(newSubject);
      addSubject(newSubject);
      showSuccess(strings.library.added.replace('{name}', selectedBook.title));
      reset();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : strings.library.downloadFailed);
    } finally {
      setIsDownloading(false);
    }
  };

  // رفع ملف من جهاز المعلم.
  const handleUpload = async () => {
    try {
      const file = await pickPdf();
      if (!file || !stage || !grade) return;
      const titleName = selectedBook ? selectedBook.title : 'مادة مخصصة';
      const newSubject = {
        id: newId(),
        name: titleName,
        stage: stage.includes('ابتدائي')
          ? ('الابتدائية' as const)
          : stage.includes('متوسط')
          ? ('المتوسطة' as const)
          : ('الإعدادية' as const),
        grade,
        year: String(new Date().getFullYear()),
        pdfUri: file.uri,
        pdfBase64: null,
        createdAt: todayISO(),
      };
      subjectRepo.save(newSubject);
      addSubject(newSubject);
      showSuccess(strings.library.added.replace('{name}', titleName));
      reset();
      onClose();
    } catch (e) {
      setError(strings.library.uploadError.replace('{error}', String(e)));
    }
  };

  const reset = () => {
    setStage(null);
    setGrade(null);
    setSelectedBookId(null);
    setProgress(0);
    setError('');
  };

  const ready = stage != null && grade != null && selectedBookId != null;

  return (
    <Sheet visible={visible} title={strings.library.addBook} onClose={onClose}>
      <View style={{ gap: 8 }}>
        <SelectField
          label="المرحلة الدراسية"
          placeholder="اختر المرحلة (ابتدائية، متوسطة، إعدادية)"
          value={stage}
          options={stageOptions}
          onChange={s => {
            setStage(s as StageName);
            setGrade(null);
            setSelectedBookId(null);
            resetError();
          }}
        />

        <SelectField
          label="الصف الدراسي"
          placeholder={stage ? 'اختر الصف' : 'يرجى اختيار المرحلة أولاً'}
          value={grade}
          options={gradeOptions}
          onChange={g => {
            setGrade(g);
            setSelectedBookId(null);
            resetError();
          }}
        />

        <SelectField
          label="المادة / الكتاب المنهجي"
          placeholder={
            grade
              ? availableBooks.length > 0
                ? 'اختر الكتاب المنهجي'
                : 'لا توجد كتب مسجلة لهذا الصف'
              : 'يرجى اختيار الصف أولاً'
          }
          value={selectedBookId}
          options={subjectOptions}
          onChange={b => {
            setSelectedBookId(b);
            resetError();
          }}
        />

        {error ? (
          <View
            style={[styles.errorBox, { backgroundColor: `${colors.error}18` }]}
          >
            <Text style={[styles.errorText, { color: colors.error }]}>
              {error}
            </Text>
          </View>
        ) : null}

        {isDownloading ? (
          <View style={{ alignItems: 'center', paddingVertical: 16, gap: 8 }}>
            <Text
              style={{ fontFamily: FONT_FAMILY, color: colors.textSecondary }}
            >
              {strings.library.downloading.replace(
                '{percent}',
                String(Math.round(progress * 100)),
              )}
            </Text>
            <View
              style={[
                styles.progressTrack,
                { backgroundColor: colors.border },
              ]}
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: colors.primary,
                    width: `${Math.round(progress * 100)}%`,
                  },
                ]}
              />
            </View>
          </View>
        ) : ready ? (
          <View style={styles.actionColumn}>
            <Button
              label="تنزيل وإضافة للقراءة دون إنترنت"
              icon={{ name: 'cloud-download' }}
              onPress={handleDownload}
            />
            <Button
              label="إضافة للقراءة عبر الإنترنت"
              icon={{ name: 'menu-book' }}
              variant="outline"
              onPress={handleAddDirect}
            />
            <Button
              label="رفع ملف من جهازي"
              icon={{ name: 'upload-file' }}
              variant="ghost"
              onPress={handleUpload}
            />
          </View>
        ) : (
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            {strings.library.selectAll}
          </Text>
        )}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  errorBox: { borderRadius: radius.sm, padding: 10, marginTop: 8 },
  errorText: { fontFamily: FONT_FAMILY, fontSize: 13 },
  actionColumn: { gap: 8, marginTop: 12 },
  hint: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 16,
  },
  progressTrack: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: { height: 8 },
});
