/**
 * شاشة المكتبة والمناهج — شبكة كتب المنهج مع رفع/تنزيل/معاينة PDF (محلي وسحابي).
 */
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  StyleSheet,
  Text,
  View,
  FlatList,
} from 'react-native';
import Pdf from 'react-native-pdf';
import { WebView } from 'react-native-webview';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../shared/theme/ThemeProvider';
import { FONT_FAMILY, radius, stageColor } from '../../shared/theme/tokens';
import { strings } from '../../shared/i18n/ar';
import { AppScreen } from '../../shared/ui/AppScreen';
import { EmptyState } from '../../shared/ui/EmptyState';
import { Icon, type IconProps } from '../../shared/ui/Icon';
import { PressableScale } from '../../shared/ui/PressableScale';
import { Dialog } from '../../shared/ui/Dialog';
import { Button } from '../../shared/ui/Button';
import { showError, showSuccess } from '../../shared/ui/toast';
import { subjectRepo } from '../../data/repositories';
import { useScheduleStore } from '../schedule/scheduleStore';
import type { Subject } from '../../shared/types/domain';
import { useResponsive } from '../../shared/hooks/useResponsive';
import { AddBookSheet } from './AddBookSheet';
import { pickPdf } from '../../services/fileService';
import { findBook, toGoogleDrivePreviewUrl } from '../../services/curriculumCatalog';
import { downloadBook, isRemotePdfUri } from '../../services/curriculumService';

/** اختيار أيقونة مناسبة لاسم المادة */
export function subjectIcon(name: string): IconProps['name'] {
  if (/رياض|حساب/.test(name)) return 'calculate';
  if (/علوم|أحياء|كيمياء|فيزياء/.test(name)) return 'science';
  if (/إنكليزي|إنجليزي|English/.test(name)) return 'language';
  if (/عربي|لغة|قراءة|قواعد|أدب/.test(name)) return 'menu-book';
  if (/تاريخ|جغراف|اجتماع/.test(name)) return 'public';
  if (/دين|إسلام|قرآن/.test(name)) return 'mosque';
  if (/رياضة|بدنية/.test(name)) return 'sports-soccer';
  if (/رسم|فنية/.test(name)) return 'palette';
  if (/حاسوب|كمبيوتر/.test(name)) return 'computer';
  return 'book';
}

export function LibraryScreen() {
  const { colors } = useTheme();
  const { gridColumns } = useResponsive();
  const subjects = useScheduleStore(s => s.subjects);
  const deleteSubject = useScheduleStore(s => s.deleteSubject);

  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Subject | null>(null);
  const [viewer, setViewer] = useState<Subject | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const reload = useCallback(() => {
    useScheduleStore.getState().load();
  }, []);
  useFocusEffect(reload);

  const subjectList = Object.values(subjects);

  const handleUpload = async (subject: Subject) => {
    try {
      const result = await pickPdf();
      if (!result) return;
      const updated = { ...subject, pdfUri: result.uri, pdfBase64: null };
      subjectRepo.save(updated);
      useScheduleStore.setState(state => ({
        subjects: { ...state.subjects, [subject.id]: updated },
      }));
      showSuccess(strings.library.linked);
    } catch (e) {
      showError(strings.library.uploadError.replace('{error}', String(e)));
    }
  };

  const handleDownloadForSubject = async (subject: Subject) => {
    try {
      setDownloadingId(subject.id);
      const res = await downloadBook(
        subject.stage,
        subject.grade,
        subject.name,
      );
      const updated = { ...subject, pdfUri: res.path };
      subjectRepo.save(updated);
      useScheduleStore.setState(state => ({
        subjects: { ...state.subjects, [subject.id]: updated },
      }));
      showSuccess(`تم حفظ كتاب ${subject.name} على الجهاز ويمكن قراءته دون إنترنت`);
    } catch (e) {
      showError(e instanceof Error ? e.message : 'فشل في التنزيل');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleOpenBook = (item: Subject) => {
    if (item.pdfUri) {
      const targetUri = isRemotePdfUri(item.pdfUri)
        ? toGoogleDrivePreviewUrl(item.pdfUri)
        : item.pdfUri;
      setViewer({ ...item, pdfUri: targetUri });
      return;
    }
    // محاولة مطابقة الكتاب تلقائياً من الفهرس
    const matched = findBook({ subjectName: item.name, grade: item.grade, stage: item.stage });
    if (matched?.viewUrl || matched?.driveId) {
      const previewUri = toGoogleDrivePreviewUrl(matched.viewUrl, matched.driveId);
      const updated = { ...item, pdfUri: previewUri };
      subjectRepo.save(updated);
      useScheduleStore.setState(state => ({
        subjects: { ...state.subjects, [item.id]: updated },
      }));
      setViewer(updated);
    } else {
      showError('لم يتم ربط ملف PDF بهذا الكتاب، يمكنك رفعه أو تنزيله من القائمة');
    }
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteSubject(deleteTarget.id);
    setDeleteTarget(null);
  };

  const isViewerLocalPdf =
    viewer?.pdfUri &&
    !isRemotePdfUri(viewer.pdfUri);

  return (
    <AppScreen edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {strings.library.title}
        </Text>
      </View>

      {subjectList.length === 0 ? (
        <EmptyState
          icon={{ name: 'menu-book' }}
          title={strings.library.empty}
          hint={strings.library.emptyHint}
        />
      ) : (
        <>
          <Text style={[styles.stats, { color: colors.textSecondary }]}>
            {strings.library.stats.replace(
              '{count}',
              String(subjectList.length),
            )}
          </Text>
          <FlatList
            data={subjectList}
            keyExtractor={s => s.id}
            numColumns={gridColumns}
            columnWrapperStyle={{ gap: 12, paddingHorizontal: 12 }}
            contentContainerStyle={{ gap: 12, paddingBottom: 100 }}
            renderItem={({ item }) => (
              <BookCard
                subject={item}
                isDownloading={downloadingId === item.id}
                onOpen={() => handleOpenBook(item)}
                onUpload={() => handleUpload(item)}
                onDownload={() => handleDownloadForSubject(item)}
                onDelete={() => setDeleteTarget(item)}
              />
            )}
          />
        </>
      )}

      <PressableScale
        onPress={() => setAddOpen(true)}
        haptic
        style={[styles.fab, { backgroundColor: colors.primary }]}
      >
        <Icon name="add" size={28} color="#fff" />
      </PressableScale>

      <AddBookSheet visible={addOpen} onClose={() => setAddOpen(false)} />

      <Dialog
        visible={deleteTarget !== null}
        title={strings.library.deleteSubject}
        onClose={() => setDeleteTarget(null)}
        actions={
          <View style={styles.dialogActions}>
            <Button
              label={strings.common.cancel}
              variant="ghost"
              onPress={() => setDeleteTarget(null)}
            />
            <Button
              label={strings.common.delete}
              variant="danger"
              onPress={confirmDelete}
            />
          </View>
        }
      >
        <Text style={[styles.confirmText, { color: colors.textPrimary }]}>
          {strings.library.deleteConfirm.replace(
            '{name}',
            deleteTarget?.name ?? '',
          )}
        </Text>
      </Dialog>

      {/* معاينة وقراءة PDF */}
      <Modal
        visible={viewer !== null}
        animationType="slide"
        onRequestClose={() => setViewer(null)}
      >
        <View
          style={[styles.viewerHeader, { backgroundColor: colors.surface }]}
        >
          <PressableScale onPress={() => setViewer(null)} animated={false} style={{ padding: 6 }}>
            <Icon name="close" size={26} color={colors.textPrimary} />
          </PressableScale>
          <Text
            style={[styles.viewerTitle, { color: colors.textPrimary }]}
            numberOfLines={1}
          >
            {viewer?.name} {viewer?.grade ? `(${viewer.grade})` : ''}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            {isRemotePdfUri(viewer?.pdfUri) ? (
              <PressableScale
                onPress={() => viewer?.pdfUri && Linking.openURL(viewer.pdfUri)}
                animated={false}
                style={styles.headerActionBtn}
                accessibilityLabel="فتح في المتصفح"
              >
                <Icon name="open-in-browser" size={24} color={colors.primary} />
              </PressableScale>
            ) : null}
          </View>
        </View>

        {viewer?.pdfUri ? (
          isViewerLocalPdf ? (
            <Pdf
              source={{ uri: viewer.pdfUri }}
              style={styles.pdf}
              trustAllCerts={false}
            />
          ) : (
            <WebView
              source={{ uri: toGoogleDrivePreviewUrl(viewer.pdfUri) }}
              style={styles.pdf}
              startInLoadingState
              renderLoading={() => (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text
                    style={[
                      styles.loadingText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    جاري تحميل الكتاب المنهجي...
                  </Text>
                </View>
              )}
            />
          )
        ) : null}
      </Modal>
    </AppScreen>
  );
}

interface BookCardProps {
  subject: Subject;
  isDownloading?: boolean;
  onOpen: () => void;
  onUpload: () => void;
  onDownload: () => void;
  onDelete: () => void;
}

function BookCard({
  subject,
  isDownloading,
  onOpen,
  onUpload,
  onDownload,
  onDelete,
}: BookCardProps) {
  const { colors } = useTheme();
  const coverColor = stageColor(subject.stage);
  const isSavedOnDevice = Boolean(subject.pdfUri && !isRemotePdfUri(subject.pdfUri));

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <PressableScale
        onPress={onOpen}
        animated={false}
        style={[styles.cover, { backgroundColor: coverColor }]}
      >
        <Icon
          name={subjectIcon(subject.name)}
          size={40}
          color={colors.textSecondary}
        />
        {subject.pdfUri ? (
          <View
            style={[
              styles.pdfBadge,
              {
                backgroundColor: isRemotePdfUri(subject.pdfUri)
                  ? colors.primary
                  : '#2E7D32',
              },
            ]}
          >
            <Text style={styles.pdfBadgeText}>
              {isRemotePdfUri(subject.pdfUri) ? 'عرض PDF' : 'محفوظ دون إنترنت'}
            </Text>
          </View>
        ) : null}
      </PressableScale>
      <View style={styles.cardInfo}>
        <Text
          style={[styles.cardName, { color: colors.textPrimary }]}
          numberOfLines={2}
        >
          {subject.name}
        </Text>
        <Text
          style={[styles.cardMeta, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          {subject.grade}
        </Text>
        <View style={styles.cardActions}>
          {isDownloading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : isSavedOnDevice ? (
            <View
              style={styles.actionBtn}
              accessibilityLabel="الكتاب محفوظ للقراءة دون إنترنت"
            >
              <Icon name="download-done" size={20} color="#2E7D32" />
            </View>
          ) : (
            <PressableScale
              onPress={onDownload}
              animated={false}
              style={styles.actionBtn}
              accessibilityLabel="تنزيل الكتاب"
            >
              <Icon name="cloud-download" size={20} color={colors.primary} />
            </PressableScale>
          )}
          <PressableScale
            onPress={onUpload}
            animated={false}
            style={styles.actionBtn}
            accessibilityLabel="ربط ملف من الهاتف"
          >
            <Icon
              name={subject.pdfUri ? 'edit-document' : 'upload-file'}
              size={20}
              color={colors.textSecondary}
            />
          </PressableScale>
          <PressableScale
            onPress={onDelete}
            animated={false}
            style={styles.actionBtn}
          >
            <Icon name="delete-outline" size={20} color={colors.error} />
          </PressableScale>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingVertical: 12 },
  title: { fontFamily: FONT_FAMILY, fontSize: 20, fontWeight: '700' },
  stats: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  card: {
    flex: 1,
    maxWidth: 200,
    borderRadius: radius.md,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  cover: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  pdfBadgeText: {
    color: '#fff',
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    fontWeight: '700',
  },
  cardInfo: { padding: 10, gap: 4 },
  cardName: { fontFamily: FONT_FAMILY, fontSize: 14, fontWeight: '700' },
  cardMeta: { fontFamily: FONT_FAMILY, fontSize: 12 },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 4,
  },
  actionBtn: { padding: 4 },
  fab: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  dialogActions: { flexDirection: 'row', gap: 8 },
  confirmText: { fontFamily: FONT_FAMILY, fontSize: 15, textAlign: 'center' },
  viewerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  viewerTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  headerActionBtn: { padding: 4 },
  pdf: { flex: 1 },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: { fontFamily: FONT_FAMILY, fontSize: 14 },
});
