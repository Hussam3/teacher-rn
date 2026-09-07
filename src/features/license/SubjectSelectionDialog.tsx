/**
 * نافذة اختيار وتثبيت المواد الدراسية المشمولة بالترخيص
 */
import React, { useState, useEffect } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
} from 'react-native';
import { useTheme } from '../../shared/theme/ThemeProvider';
import { FONT_FAMILY, radius } from '../../shared/theme/tokens';
import { Button } from '../../shared/ui/Button';
import { Icon } from '../../shared/ui/Icon';
import { showError, showSuccess } from '../../shared/ui/toast';
import {
  CANONICAL_BASE_SUBJECTS,
  type CanonicalBaseSubject,
} from '../../shared/types/aiUsage';
import { useLicenseStore } from './licenseStore';

interface SubjectSelectionDialogProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function SubjectSelectionDialog({
  visible,
  onClose,
  onSuccess,
}: SubjectSelectionDialogProps) {
  const { colors } = useTheme();
  const access = useLicenseStore(s => s.access);
  const updateSubjects = useLicenseStore(s => s.updateSubjects);

  const maxAllowed = access.maxSubjects || 1;
  const initialSubjects = access.selectedSubjects || [];

  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setSelected(initialSubjects);
    }
  }, [visible, initialSubjects]);

  const toggleSubject = (subject: string) => {
    if (selected.includes(subject)) {
      setSelected(prev => prev.filter(s => s !== subject));
    } else {
      if (selected.length >= maxAllowed) {
        showError(`باقتك الحالية تسمح باختيار ${maxAllowed} مواد فقط.`);
        return;
      }
      setSelected(prev => [...prev, subject]);
    }
  };

  const handleSave = async () => {
    if (selected.length === 0) {
      showError('يرجى اختيار مادة واحدة على الأقل.');
      return;
    }
    setLoading(true);
    try {
      await updateSubjects(selected);
      showSuccess('تم حفظ وتثبيت المواد المعتمدة بنجاح');
      onSuccess?.();
      onClose();
    } catch (e) {
      showError(e instanceof Error ? e.message : 'تعذر حفظ المواد.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.dialog, { backgroundColor: colors.surface }]}>
          <View style={styles.header}>
            <View style={[styles.iconWrap, { backgroundColor: `${colors.primary}18` }]}>
              <Icon name="book" size={24} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              تحديد المواد المشمولة بالترخيص
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              تسمح باقتك باختيار ({maxAllowed}) {maxAllowed > 1 ? 'مواد أساسية' : 'مادة أساسية'}. تشمل المادة جميع الصفوف والمراحل الدراسية الخاصة بها.
            </Text>
          </View>

          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            <View style={styles.grid}>
              {CANONICAL_BASE_SUBJECTS.map(subj => {
                const isSelected = selected.includes(subj);
                return (
                  <Pressable
                    key={subj}
                    onPress={() => toggleSubject(subj)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: isSelected ? `${colors.primary}20` : colors.background,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Icon
                      name={isSelected ? 'check-circle' : 'circle-outline'}
                      size={18}
                      color={isSelected ? colors.primary : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.chipText,
                        {
                          color: isSelected ? colors.primary : colors.textPrimary,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}
                    >
                      {subj}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <Button
              label="إلغاء"
              variant="ghost"
              onPress={onClose}
              disabled={loading}
            />
            <Button
              label={`تثبيت (${selected.length}/${maxAllowed})`}
              onPress={handleSave}
              loading={loading}
              disabled={selected.length === 0}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  dialog: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '80%',
    borderRadius: radius.lg,
    padding: 20,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontFamily: FONT_FAMILY,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  list: {
    maxHeight: 320,
  },
  listContent: {
    paddingVertical: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1.5,
    minWidth: '45%',
  },
  chipText: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150,150,150,0.2)',
  },
});
