/**
 * ستاك المحرر — القائمة الافتراضية ثم شاشة التحرير.
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { EditorStackParamList } from './types';
import { EditorHomeScreen } from '../../features/editor/EditorHomeScreen';
import { EditorScreen } from '../../features/editor/EditorScreen';

const Stack = createNativeStackNavigator<EditorStackParamList>();

export function EditorNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="EditorHome" component={EditorHomeScreen} />
      <Stack.Screen name="Editor" component={EditorScreen} />
    </Stack.Navigator>
  );
}