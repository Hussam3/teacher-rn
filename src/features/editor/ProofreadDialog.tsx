/**
 * حوار التدقيق اللغوي والعلمي — يعرض الأخطاء اللغوية والعلمية
 * وصيغ المعادلات الكيميائية والرموز المكتشفة بالذكاء الاصطناعي
 * ويتيح للمعلم اختيار التعديلات وتطبيقها تفاعلياً.
 */
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTheme } from '../../shared/theme/ThemeProvider';
import { FONT_FAMILY, radius } from '../../shared/theme/tokens';
import { Dialog } from '../../shared/ui/Dialog';
import { Button } from '../../shared/ui/Button';
import { Icon } from '../../shared/ui/Icon';
import { PressableScale } from '../../shared/ui/PressableScale';
import type { ProofreadIssue } from '../../shared/types/editor';

interface ProofreadDialogProps {
  visible: boolean;
  loading: boolean;
  issues: ProofreadIssue[];
  onClose: () => void;
  onApply: (selectedIssues: ProofreadIssue[]) => void;
  onRecheck?: () => void;
}

export function ProofreadDialog({
  visible,
  loading,
  issues,
  onClose,
  onApply,
  onRecheck,
}: ProofreadDialogProps) {
  const { colors } = useTheme();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // عند تحميل أخطاء جديدة، يتم تحديدها افتراضياً
  useEffect(() => {
    if (visible && issues.length > 0) {
      setSelectedIds(new Set(issues.map(iss => iss.id)));
    } else {
      setSelectedIds(new Set());
    }
  }, [visible, issues]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(issues.map(iss => iss.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleApply = () => {
    const toApply = issues.filter(iss => selectedIds.has(iss.id));
    onApply(toApply);
    onClose();
  };

  const categoryColor = (cat: ProofreadIssue['category']) => {
    switch (cat) {
      case 'formula':
        return '#0284c7'; // أزرق كيميائي
      case 'scientific':
        return '#7c3aed'; // بنفسجي علمي
      case 'spelling':
      case 'grammar':
        return '#e11d48'; // أحمر لغوي
      case 'symbol':
        return '#d97706'; // كهرماني رموز
      case 'format':
        return '#059669'; // أخضر ترقيم وتنسيق
      default:
        return colors.primary;
    }
  };

  const categoryIcon = (cat: ProofreadIssue['category']) => {
    switch (cat) {
      case 'formula':
        return 'science';
      case 'scientific':
        return 'biotech';
      case 'spelling':
      case 'grammar':
        return 'spellcheck';
      case 'symbol':
        return 'functions';
      case 'format':
        return 'format-list-numbered';
      default:
        return 'check-circle';
    }
  };

  return (
    <Dialog
      visible={visible}
      title="التدقيق اللغوي والعلمي بالذكاء الاصطناعي"
      onClose={onClose}
      scrollable={false}
      actions={
        <View style={styles.actions}>
          <Button label="إلغاء" variant="ghost" onPress={onClose} />
          {issues.length > 0 ? (
            <Button
              label={`تطبيق التعديلات المختارة (${selectedIds.size})`}
              icon={{ name: 'done-all' }}
              disabled={selectedIds.size === 0 || loading}
              onPress={handleApply}
            />
          ) : null}
        </View>
      }
    >
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingTitle, { color: colors.textPrimary }]}>
            جاري فحص ورقة الامتحان...
          </Text>
          <Text style={[styles.loadingSub, { color: colors.textSecondary }]}>
            يقوم الذكاء الاصطناعي بالتحقق من الإملاء، النحو، المفاهيم العلمية،
            والصيغ الكيميائية والرموز.
          </Text>
        </View>
      ) : issues.length === 0 ? (
        <View style={styles.emptyBox}>
          <View
            style={[
              styles.emptyIconCircle,
              { backgroundColor: `${colors.success}18` },
            ]}
          >
            <Icon name="verified" size={40} color={colors.success} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
            ورقة الامتحان ممتازة وسليمة!
          </Text>
          <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
            لم يتم العثور على أخطاء إملائية أو علمية أو مشاكل في الصيغ الكيميائية.
          </Text>
          {onRecheck ? (
            <Button
              label="إعادة التدقيق"
              variant="outline"
              icon={{ name: 'refresh' }}
              onPress={onRecheck}
              style={{ marginTop: 16 }}
            />
          ) : null}
        </View>
      ) : (
        <View style={styles.contentWrapper}>
          {/* شريط الإحصائيات وأزرار التحديد السريع */}
          <View
            style={[
              styles.toolbar,
              { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
            ]}
          >
            <View style={styles.statsBadge}>
              <Icon name="error-outline" size={16} color={colors.error} />
              <Text style={[styles.statsText, { color: colors.textPrimary }]}>
                تم اكتشاف {issues.length} ملاحظات وتعديلات مقترحة
              </Text>
            </View>
            <View style={styles.quickSelectBtns}>
              <PressableScale
                onPress={selectAll}
                animated={false}
                style={[styles.smallBtn, { borderColor: colors.border }]}
              >
                <Text style={[styles.smallBtnText, { color: colors.primary }]}>
                  تحديد الكل
                </Text>
              </PressableScale>
              <PressableScale
                onPress={deselectAll}
                animated={false}
                style={[styles.smallBtn, { borderColor: colors.border }]}
              >
                <Text style={[styles.smallBtnText, { color: colors.textSecondary }]}>
                  إلغاء التحديد
                </Text>
              </PressableScale>
            </View>
          </View>

          {/* قائمة الملاحظات والتعديلات */}
          <ScrollView
            showsVerticalScrollIndicator={true}
            style={styles.issuesScroll}
          >
            {issues.map(iss => {
              const isSelected = selectedIds.has(iss.id);
              const color = categoryColor(iss.category);
              const iconName = categoryIcon(iss.category);

              return (
                <PressableScale
                  key={iss.id}
                  onPress={() => toggleSelect(iss.id)}
                  animated={false}
                  style={[
                    styles.issueCard,
                    {
                      backgroundColor: isSelected
                        ? `${color}08`
                        : colors.surfaceElevated,
                      borderColor: isSelected ? color : colors.border,
                    },
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderRight}>
                      <View
                        style={[
                          styles.checkboxCircle,
                          {
                            borderColor: isSelected ? color : colors.border,
                            backgroundColor: isSelected ? color : 'transparent',
                          },
                        ]}
                      >
                        {isSelected ? (
                          <Icon name="check" size={14} color="#ffffff" />
                        ) : null}
                      </View>
                      <View
                        style={[
                          styles.categoryBadge,
                          { backgroundColor: `${color}18` },
                        ]}
                      >
                        <Icon name={iconName} size={13} color={color} />
                        <Text style={[styles.categoryBadgeText, { color }]}>
                          {iss.categoryLabel || iss.category}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.issueTitle,
                          { color: colors.textPrimary },
                        ]}
                      >
                        {iss.title}
                      </Text>
                    </View>
                  </View>

                  {/* الشرح */}
                  {iss.explanation ? (
                    <Text
                      style={[
                        styles.explanationText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {iss.explanation}
                    </Text>
                  ) : null}

                  {/* مقارنة النص قبل وبعد */}
                  <View style={styles.diffContainer}>
                    <View
                      style={[
                        styles.diffBox,
                        styles.diffOld,
                        { backgroundColor: '#fee2e2', borderColor: '#fca5a5' },
                      ]}
                    >
                      <Text style={styles.diffLabelOld}>الأصل:</Text>
                      <Text style={styles.diffTextOld}>{iss.originalText}</Text>
                    </View>

                    <Icon name="arrow-back" size={18} color="#64748b" />

                    <View
                      style={[
                        styles.diffBox,
                        styles.diffNew,
                        { backgroundColor: '#dcfce7', borderColor: '#86efac' },
                      ]}
                    >
                      <Text style={styles.diffLabelNew}>التصحيح المقترح:</Text>
                      <Text style={styles.diffTextNew}>{iss.suggestedText}</Text>
                    </View>
                  </View>
                </PressableScale>
              );
            })}
          </ScrollView>
        </View>
      )}
    </Dialog>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  loadingBox: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 12,
  },
  loadingTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '700',
  },
  loadingSub: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 18,
  },
  emptyBox: {
    paddingVertical: 28,
    alignItems: 'center',
    gap: 10,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '700',
  },
  emptySub: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 18,
  },
  contentWrapper: {
    gap: 10,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  statsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statsText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '700',
  },
  quickSelectBtns: {
    flexDirection: 'row',
    gap: 6,
  },
  smallBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  smallBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '700',
  },
  issuesScroll: {
    maxHeight: 420,
  },
  issueCard: {
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1.5,
    marginBottom: 10,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    flexWrap: 'wrap',
  },
  checkboxCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  categoryBadgeText: {
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    fontWeight: '700',
  },
  issueTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  explanationText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11.5,
    lineHeight: 16,
  },
  diffContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  diffBox: {
    flex: 1,
    padding: 8,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  diffOld: {},
  diffNew: {},
  diffLabelOld: {
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    color: '#991b1b',
    fontWeight: '700',
    marginBottom: 2,
  },
  diffTextOld: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    color: '#b91c1c',
    textDecorationLine: 'line-through',
  },
  diffLabelNew: {
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    color: '#166534',
    fontWeight: '700',
    marginBottom: 2,
  },
  diffTextNew: {
    fontFamily: FONT_FAMILY,
    fontSize: 12.5,
    color: '#15803d',
    fontWeight: '700',
  },
});
