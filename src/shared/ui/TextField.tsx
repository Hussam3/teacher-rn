/**
 * حقل نصي — بنمط الحقول المعبأة مع تركيز ملوّن.
 */
import React, { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  Text,
  type TextInputProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { FONT_FAMILY, radius } from '../theme/tokens';

interface TextFieldProps extends TextInputProps {
  label?: string;
  containerStyle?: StyleProp<ViewStyle>;
  /** عرض تحذير */
  warning?: string;
  required?: boolean;
}

export function TextField({
  label,
  containerStyle,
  warning,
  required,
  style,
  onFocus,
  onBlur,
  ...rest
}: TextFieldProps) {
  const { colors, isDark } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Text style={[styles.label, { color: colors.textPrimary }]}>
          {label}
          {required ? <Text style={{ color: colors.error }}> *</Text> : null}
        </Text>
      ) : null}
      <TextInput
        placeholderTextColor={`${colors.textSecondary}80`}
        onFocus={e => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={e => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[
          styles.input,
          {
            color: colors.textPrimary,
            backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : colors.surface,
            borderColor: focused ? colors.primary : 'transparent',
            textAlign: 'right',
          },
          style,
        ]}
        {...rest}
      />
      {warning ? (
        <Text style={[styles.warning, { color: colors.warning }]}>{warning}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
  },
  label: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    borderRadius: radius.md,
    borderWidth: 2,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  warning: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    marginTop: 4,
  },
});
