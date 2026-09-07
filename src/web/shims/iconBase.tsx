/**
 * قاعدة أيقونات الويب — رسم الحروف (glyphs) من خرائط الأيقونات عبر خطوط الويب.
 */
import React from 'react';
import { Text } from 'react-native';
import type { StyleProp, TextStyle } from 'react-native';

export interface WebIconProps {
  name: string;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
}

interface BaseProps extends WebIconProps {
  fontFamily: string;
  glyphs: Record<string, number>;
}

export function renderGlyph({ name, size = 24, color, style, fontFamily, glyphs }: BaseProps) {
  const code = glyphs[name] != null ? String.fromCodePoint(glyphs[name]) : '?';
  return (
    <Text style={[{ fontFamily, fontSize: size, color, textAlign: 'center' }, style]} allowFontScaling={false}>
      {code}
    </Text>
  );
}