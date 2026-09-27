/**
 * قاعدة أيقونات الويب — رسم الحروف (glyphs) من خرائط الأيقونات عبر خطوط الويب
 * مع دعم الاحتياط الذكي (Smart Fallback) لمنع ظهور علامات الاستفهام (?) في الواجهة.
 */
import React from 'react';
import { Text } from 'react-native';
import type { StyleProp, TextStyle } from 'react-native';
import CommunityGlyphs from 'react-native-vector-icons/dist/glyphmaps/MaterialCommunityIcons.json';
import MaterialGlyphs from 'react-native-vector-icons/dist/glyphmaps/MaterialIcons.json';

const communityMap = CommunityGlyphs as Record<string, number>;
const materialMap = MaterialGlyphs as Record<string, number>;

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
  let resolvedFontFamily = fontFamily;
  let code: string | null = null;

  if (glyphs && glyphs[name] != null) {
    code = String.fromCodePoint(glyphs[name]);
  } else if (fontFamily === 'Material Icons' && communityMap[name] != null) {
    // احتياط ذكي: الرمز موجود في MaterialCommunityIcons
    resolvedFontFamily = 'Material Design Icons';
    code = String.fromCodePoint(communityMap[name]);
  } else if (fontFamily === 'Material Design Icons' && materialMap[name] != null) {
    // احتياط ذكي: الرمز موجود في MaterialIcons
    resolvedFontFamily = 'Material Icons';
    code = String.fromCodePoint(materialMap[name]);
  }

  // إذا لم يتوفر الرمز في أي عائلة، لا نطبع علامة استفهام تشوه الواجهة
  if (!code) {
    return <Text style={[{ fontSize: size, width: size, height: size }, style]} />;
  }

  return (
    <Text
      style={[
        {
          fontFamily: resolvedFontFamily,
          fontSize: size,
          color,
          textAlign: 'center',
          lineHeight: size,
        },
        style,
      ]}
      allowFontScaling={false}
    >
      {code}
    </Text>
  );
}