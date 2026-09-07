/**
 * الشاشة الافتراضية للمحرر — قائمة أسئلة الامتحان.
 *
 * تعرض المستند الجاري (آخر ما عمله المعلم) والمسودات المحفوظة، مع زر
 * للانتقال إلى المحرر لإنشاء/تحرير أسئلة امتحان جديدة.
 */
import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { EditorStackParamList } from '../../app/navigation/types';
import { useTheme } from '../../shared/theme/ThemeProvider';
import { FONT_FAMILY, radius } from '../../shared/theme/tokens';
import { strings } from '../../shared/i18n/ar';
import { AppScreen } from '../../shared/ui/AppScreen';
import { EmptyState } from '../../shared/ui/EmptyState';
import { Icon } from '../../shared/ui/Icon';
import { PressableScale } from '../../shared/ui/PressableScale';
import { Button } from '../../shared/ui/Button';
import { Dialog } from '../../shared/ui/Dialog';
import { documentRepo } from '../../data/repositories';
import { listNamedDrafts, restoreNamedDraft } from './drafts';
import { todayISO } from '../../shared/utils/date';
import { showSuccess } from '../../shared/ui/toast';
import type { EditorDocument } from '../../shared/types/editor';

type Navigation = NativeStackNavigationProp<EditorStackParamList>;

function formatUpdatedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('ar-IQ', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function hasContent(doc: EditorDocument): boolean {
  return doc.blocks.some(b => {
    if (b.type === 'paragraph' || b.type === 'heading') return b.text.trim() !== '';
    if (b.type === 'list') return b.items.some(i => i.trim() !== '');
    if (b.type === 'question') return (b.text ?? '').trim() !== '';
    return true;
  });
}

export function EditorHomeScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<Navigation>();
  const [drafts, setDrafts] = useState<EditorDocument[]>([]);
  const [current, setCurrent] = useState<EditorDocument | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EditorDocument | null>(null);

  const reload = useCallback(() => {
    const docs = documentRepo.list();
    setCurrent(documentRepo.get('current') ?? null);
    setDrafts(listNamedDrafts(docs));
  }, []);

  useFocusEffect(reload);

  const openEditor = () => {
    navigation.push('Editor', { fresh: true });
  };

  const openDraft = (draft: EditorDocument) => {
    const restored = restoreNamedDraft(draft, todayISO());
    documentRepo.save(restored);
    navigation.push('Editor');
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    documentRepo.remove(deleteTarget.id);
    setDeleteTarget(null);
    reload();
    showSuccess(strings.editor.deletedDraft);
  };

  const currentItem = current && hasContent(current) ? current : null;

  const allItems = [
    ...(currentItem ? [currentItem] : []),
    ...drafts.filter(d => d.id !== 'current'),
  ];

  return (
    <AppScreen edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {strings.editor.examHomeTitle}
        </Text>
      </View>

      <PressableScale
        onPress={openEditor}
        haptic
        style={[styles.newCard, { backgroundColor: colors.primary }]}
      >
        <View style={styles.newIcon}>
          <Icon name="note-add" size={24} color="#fff" />
        </View>
        <View style={styles.newTextWrap}>
          <Text style={styles.newText}>{strings.editor.newExam}</Text>
          <Icon name="chevron-left" size={22} color="rgba(255,255,255,0.9)" />
        </View>
      </PressableScale>

      {allItems.length ? (
        <Text style={[styles.recentTitle, { color: colors.textSecondary }]}>
          {currentItem
            ? strings.editor.recentQuestions
            : strings.editor.savedDrafts}
        </Text>
      ) : null}

      <FlatList
        data={allItems}
        keyExtractor={d => d.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={
          <EmptyState
            icon={{ name: 'note-edit-outline', family: 'community' }}
            title={strings.editor.noSavedDrafts}
            hint={strings.editor.newExam}
          />
        }
        renderItem={({ item }) => (
          <PressableScale
            onPress={() =>
              item.id === 'current' ? openEditor() : openDraft(item)
            }
            haptic
            style={styles.cardWrap}
          >
            <View
              style={[styles.card, { backgroundColor: colors.surface }]}
            >
              <View
                style={[
                  styles.iconBadge,
                  { backgroundColor: `${colors.primary}15` },
                ]}
              >
                <Icon
                  name={
                    item.id === 'current'
                      ? 'history'
                      : 'note-edit-outline'
                  }
                  family="community"
                  size={22}
                  color={colors.primary}
                />
              </View>
              <View style={styles.cardInfo}>
                <View style={styles.cardTitleRow}>
                  {item.id === 'current' ? (
                    <View
                      style={[
                        styles.currentBadge,
                        { backgroundColor: `${colors.primary}18` },
                      ]}
                    >
                      <Text
                        style={[
                          styles.currentBadgeText,
                          { color: colors.primary },
                        ]}
                      >
                        {strings.editor.recentQuestions}
                      </Text>
                    </View>
                  ) : null}
                  <Text
                    style={[styles.draftTitle, { color: colors.textPrimary }]}
                    numberOfLines={1}
                  >
                    {item.title || strings.editor.untitledDraft}
                  </Text>
                </View>
                <Text style={[styles.meta, { color: colors.textSecondary }]}>
                  {formatUpdatedAt(item.updatedAt) || strings.common.unknown}
                </Text>
              </View>
              <PressableScale
                onPress={() => setDeleteTarget(item)}
                animated={false}
                style={styles.moreBtn}
                disabled={item.id === 'current'}
              >
                <Icon
                  name="delete-outline"
                  family="community"
                  size={22}
                  color={colors.error}
                />
              </PressableScale>
            </View>
          </PressableScale>
        )}
      />

      <Dialog
        visible={deleteTarget !== null}
        title={strings.common.delete}
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
          {strings.editor.homeDeleteConfirm}
        </Text>
      </Dialog>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingVertical: 12 },
  title: { fontFamily: FONT_FAMILY, fontSize: 20, fontWeight: '700' },
  newCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: radius.lg,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  newIcon: { marginRight: 12 },
  newTextWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  newText: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  recentTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '700',
    marginHorizontal: 20,
    marginBottom: 4,
    marginTop: 12,
  },
  cardWrap: { paddingHorizontal: 8, marginVertical: 4 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: radius.md,
    padding: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { flex: 1, minWidth: 0, gap: 4 },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currentBadge: {
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  currentBadgeText: { fontFamily: FONT_FAMILY, fontSize: 10, fontWeight: '700' },
  draftTitle: { fontFamily: FONT_FAMILY, fontSize: 15, fontWeight: '700', flexShrink: 1 },
  meta: { fontFamily: FONT_FAMILY, fontSize: 12 },
  moreBtn: { padding: 8 },
  dialogActions: { flexDirection: 'row', gap: 8 },
  confirmText: { fontFamily: FONT_FAMILY, fontSize: 15, textAlign: 'center' },
});