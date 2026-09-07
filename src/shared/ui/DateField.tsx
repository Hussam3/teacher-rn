/**
 * حقل تاريخ — يفتح منتقي تاريخ نظامي.
 */
import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../theme/ThemeProvider';
import { FONT_FAMILY, radius } from '../theme/tokens';
import { PressableScale } from './PressableScale';
import { Icon } from './Icon';
import { formatDate, isValidISO } from '../utils/date';

interface DateFieldProps {
  label?: string;
  value: string;
  onChange: (iso: string) => void;
}

export function DateField({ label, value, onChange }: DateFieldProps) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);

  const date = value && isValidISO(value) ? new Date(value) : new Date();

  return (
    <View style={styles.container}>
      {label ? (
        <Text style={[styles.label, { color: colors.textPrimary }]}>{label}</Text>
      ) : null}
      <PressableScale
        onPress={() => setOpen(true)}
        animated={false}
        style={[styles.field, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <Text style={[styles.value, { color: colors.textPrimary }]}>{formatDate(date)}</Text>
        <Icon name="calendar-today" size={20} color={colors.textSecondary} />
      </PressableScale>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
          <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
            <DateTimePicker
              value={date}
              mode="date"
              display="spinner"
              onChange={(event, selected) => {
                setOpen(false);
                if (selected) onChange(selected.toISOString());
              }}
            />
            <TouchableOpacity onPress={() => setOpen(false)} style={styles.doneBtn}>
              <Text style={[styles.doneText, { color: colors.primary }]}>تم</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 6 },
  label: { fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '700', marginBottom: 6 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  value: { fontFamily: FONT_FAMILY, fontSize: 15 },
  backdrop: { flex: 1, justifyContent: 'center', padding: 24 },
  sheet: { borderRadius: radius.lg, padding: 16 },
  doneBtn: { alignItems: 'center', padding: 12 },
  doneText: { fontFamily: FONT_FAMILY, fontSize: 16, fontWeight: '700' },
});
