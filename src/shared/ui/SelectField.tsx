/**
 * حقل اختيار (Select) — يستعرض الخيارات في ورقة سفلية سلسة وسريعة الاستجابة.
 */
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { FONT_FAMILY, radius } from '../theme/tokens';
import { PressableScale } from './PressableScale';
import { Sheet } from './Sheet';
import { Icon } from './Icon';

export interface SelectOption<T> {
  label: string;
  value: T;
}

interface SelectFieldProps<T> {
  label?: string;
  placeholder?: string;
  options: SelectOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  disabled?: boolean;
}

export function SelectField<T extends string>({
  label,
  placeholder,
  options,
  value,
  onChange,
  disabled,
}: SelectFieldProps<T>) {
  const { colors, isDark } = useTheme();
  const [open, setOpen] = useState(false);

  const selected = options.find(o => o.value === value);

  return (
    <View style={styles.container}>
      {label ? (
        <Text style={[styles.label, { color: colors.textPrimary }]}>{label}</Text>
      ) : null}
      <PressableScale
        onPress={() => !disabled && setOpen(true)}
        animated={false}
        style={[
          styles.field,
          {
            backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : colors.surface,
            borderColor: colors.border,
            opacity: disabled ? 0.6 : 1,
          },
        ]}
      >
        <Text
          style={[
            styles.value,
            { color: selected ? colors.textPrimary : colors.textSecondary },
          ]}
        >
          {selected ? selected.label : placeholder ?? ''}
        </Text>
        <Icon name="arrow-drop-down" size={24} color={colors.textSecondary} />
      </PressableScale>

      <Sheet visible={open} title={label ?? placeholder ?? ''} onClose={() => setOpen(false)}>
        <View style={styles.optionsList}>
          {options.map(item => {
            const active = item.value === value;
            return (
              <PressableScale
                key={item.value}
                onPress={() => {
                  onChange(item.value);
                  setOpen(false);
                }}
                animated={false}
                style={[
                  styles.option,
                  {
                    backgroundColor: active ? `${colors.primary}18` : 'transparent',
                    borderColor: active ? `${colors.primary}30` : 'transparent',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.optionText,
                    {
                      color: active ? colors.primary : colors.textPrimary,
                      fontWeight: active ? '700' : '400',
                    },
                  ]}
                >
                  {item.label}
                </Text>
                {active ? <Icon name="check" size={20} color={colors.primary} /> : null}
              </PressableScale>
            );
          })}
        </View>
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 6 },
  label: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
  },
  value: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    flex: 1,
    textAlign: 'right',
  },
  optionsList: {
    gap: 4,
    paddingVertical: 4,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  optionText: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
  },
});

