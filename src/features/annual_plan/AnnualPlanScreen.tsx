/**
 * شاشة الخطة السنوية — قائمة الخطط السنوية المحفوظة.
 */
import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../app/navigation/types';
import { useTheme } from '../../shared/theme/ThemeProvider';
import { FONT_FAMILY, radius } from '../../shared/theme/tokens';
import { strings } from '../../shared/i18n/ar';
import { AppScreen } from '../../shared/ui/AppScreen';
import { EmptyState } from '../../shared/ui/EmptyState';
import { Icon } from '../../shared/ui/Icon';
import { PressableScale } from '../../shared/ui/PressableScale';
import { Dialog } from '../../shared/ui/Dialog';
import { Button } from '../../shared/ui/Button';
import { annualPlanRepo, subjectRepo } from '../../data/repositories';
import type { AnnualPlan } from '../../shared/types/domain';
import { showSuccess } from '../../shared/ui/toast';

export function AnnualPlanScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [plans, setPlans] = useState<AnnualPlan[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<AnnualPlan | null>(null);

  const reload = useCallback(() => {
    setPlans(annualPlanRepo.list().sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  }, []);

  useFocusEffect(reload);

  const confirmDelete = () => {
    if (!deleteTarget) return;
    annualPlanRepo.remove(deleteTarget.id);
    setDeleteTarget(null);
    reload();
    showSuccess(strings.annualPlan.deleted);
  };

  return (
    <AppScreen edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{strings.annualPlan.title}</Text>
      </View>

      <FlatList
        data={plans}
        keyExtractor={p => p.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={
          <EmptyState
            icon={{ name: 'calendar-month' }}
            title={strings.annualPlan.noPlans}
            hint={strings.annualPlan.noPlansHint}
          />
        }
        renderItem={({ item }) => {
          const subject = subjectRepo.get(item.subjectId);
          const academicYear = `${new Date(item.startDate).getFullYear()}-${new Date(item.endDate).getFullYear()}`;
          return (
            <PressableScale
              onPress={() => navigation.navigate('AnnualPlanEditor', { planId: item.id })}
              haptic
              style={styles.cardWrap}
            >
              <View style={[styles.card, { backgroundColor: colors.surface }]}>
                <View style={[styles.iconBadge, { backgroundColor: `${colors.success}18` }]}>
                  <Icon name="calendar-month" size={24} color={colors.success} />
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={[styles.topic, { color: colors.textPrimary }]} numberOfLines={1}>
                    {subject?.name ?? strings.common.unknown}
                  </Text>
                  <Text style={[styles.meta, { color: colors.textSecondary }]}>
                    {item.className} • السنة: {academicYear}
                  </Text>
                </View>
                <PressableScale onPress={() => setDeleteTarget(item)} animated={false} style={styles.moreBtn}>
                  <Icon name="delete-outline" size={22} color={colors.error} />
                </PressableScale>
              </View>
            </PressableScale>
          );
        }}
      />

      <PressableScale
        onPress={() => navigation.navigate('AnnualPlanEditor', {})}
        haptic
        style={[styles.fab, { backgroundColor: colors.success }]}
      >
        <Icon name="add" size={28} color="#fff" />
      </PressableScale>

      <Dialog
        visible={deleteTarget !== null}
        title={strings.common.delete}
        onClose={() => setDeleteTarget(null)}
        actions={
          <View style={styles.dialogActions}>
            <Button label={strings.common.cancel} variant="ghost" onPress={() => setDeleteTarget(null)} />
            <Button label={strings.common.delete} variant="danger" onPress={confirmDelete} />
          </View>
        }
      >
        <Text style={[styles.confirmText, { color: colors.textPrimary }]}>
          {strings.annualPlan.deleteConfirm}
        </Text>
      </Dialog>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingVertical: 12 },
  title: { fontFamily: FONT_FAMILY, fontSize: 20, fontWeight: '700' },
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
  iconBadge: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  topic: { fontFamily: FONT_FAMILY, fontSize: 15, fontWeight: '700' },
  meta: { fontFamily: FONT_FAMILY, fontSize: 12 },
  moreBtn: { padding: 8 },
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
});
