/** حفظ واسترجاع نسخ مسماة من ورقة المحرر الحالية. */
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { EditorDocument } from '../../shared/types/editor';
import { strings } from '../../shared/i18n/ar';
import { useTheme } from '../../shared/theme/ThemeProvider';
import { FONT_FAMILY, radius } from '../../shared/theme/tokens';
import { Button } from '../../shared/ui/Button';
import { Dialog } from '../../shared/ui/Dialog';
import { TextField } from '../../shared/ui/TextField';

interface DraftsDialogProps {
  visible: boolean;
  document: EditorDocument;
  drafts: EditorDocument[];
  onClose: () => void;
  onSave: (title: string) => void;
  onRestore: (draft: EditorDocument) => void;
}

function formatUpdatedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('ar-IQ', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

export function DraftsDialog({
  visible,
  document,
  drafts,
  onClose,
  onSave,
  onRestore,
}: DraftsDialogProps) {
  const { colors } = useTheme();
  const [title, setTitle] = useState('');
  const trimmedTitle = title.trim();

  useEffect(() => {
    if (!visible) return;
    setTitle(document.title === 'مستند جديد' ? '' : document.title);
  }, [document.title, visible]);

  return (
    <Dialog
      visible={visible}
      title={strings.editor.drafts}
      onClose={onClose}
      actions={
        <View style={styles.actions}>
          <Button
            label={strings.common.close}
            variant="ghost"
            onPress={onClose}
          />
          <Button
            label={strings.editor.saveDraft}
            icon={{ name: 'save' }}
            disabled={!trimmedTitle}
            onPress={() => onSave(trimmedTitle)}
          />
        </View>
      }
    >
      <TextField
        label={strings.editor.draftName}
        value={title}
        onChangeText={setTitle}
        placeholder={strings.editor.draftNamePlaceholder}
        returnKeyType="done"
        onSubmitEditing={() => {
          if (trimmedTitle) onSave(trimmedTitle);
        }}
        warning={
          title && !trimmedTitle ? strings.editor.draftNameRequired : undefined
        }
      />
      <Text style={[styles.hint, { color: colors.textSecondary }]}>
        {strings.editor.draftSaveHint}
      </Text>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
        {strings.editor.savedDrafts}
      </Text>

      {drafts.length ? (
        <View style={styles.drafts}>
          {drafts.map(draft => (
            <View
              key={draft.id}
              style={[
                styles.draftRow,
                {
                  backgroundColor: colors.surfaceElevated,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.draftInfo}>
                <Text
                  style={[styles.draftTitle, { color: colors.textPrimary }]}
                  numberOfLines={1}
                >
                  {draft.title || strings.editor.untitledDraft}
                </Text>
                <Text
                  style={[styles.draftDate, { color: colors.textSecondary }]}
                >
                  {formatUpdatedAt(draft.updatedAt)}
                </Text>
              </View>
              <Button
                label={strings.editor.restoreDraft}
                variant="outline"
                icon={{ name: 'history' }}
                onPress={() => onRestore(draft)}
                style={styles.restoreButton}
              />
            </View>
          ))}
        </View>
      ) : (
        <Text style={[styles.empty, { color: colors.textSecondary }]}>
          {strings.editor.noSavedDrafts}
        </Text>
      )}
    </Dialog>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: 8 },
  hint: { fontFamily: FONT_FAMILY, fontSize: 12, lineHeight: 18 },
  divider: { height: 1, marginVertical: 16 },
  sectionTitle: { fontFamily: FONT_FAMILY, fontSize: 14, fontWeight: '700' },
  drafts: { gap: 8, marginTop: 10 },
  draftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderWidth: 1,
    borderRadius: radius.md,
  },
  draftInfo: { flex: 1, minWidth: 0 },
  draftTitle: { fontFamily: FONT_FAMILY, fontSize: 14, fontWeight: '700' },
  draftDate: { fontFamily: FONT_FAMILY, fontSize: 11, marginTop: 3 },
  restoreButton: { minHeight: 40, paddingHorizontal: 12, paddingVertical: 8 },
  empty: { fontFamily: FONT_FAMILY, fontSize: 13, marginTop: 10 },
});
