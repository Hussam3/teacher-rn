/**
 * مكوّن الأيقونة — واجهة موحدة فوق react-native-vector-icons.
 */
import React from 'react';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Platform, StyleSheet, type StyleProp, type TextStyle } from 'react-native';

type MaterialIconName = React.ComponentProps<typeof MaterialIcons>['name'];
type CommunityIconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

export interface IconProps {
  name: MaterialIconName | CommunityIconName;
  family?: 'material' | 'community';
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
}

export function Icon({
  name,
  family = 'material',
  size = 24,
  color,
  style,
}: IconProps) {
  const common = [styles.icon, style];
  if (family === 'community') {
    return (
      <MaterialCommunityIcons
        name={name as CommunityIconName}
        size={size}
        color={color}
        style={[Platform.OS === 'web' ? { lineHeight: size } : undefined, common]}
      />
    );
  }
  return (
    <MaterialIcons
      name={name as MaterialIconName}
      size={size}
      color={color}
      style={[Platform.OS === 'web' ? { lineHeight: size } : undefined, common]}
    />
  );
}

const styles = StyleSheet.create({
  icon: { textAlign: 'center' },
});
