/**
 * لوحة الرموز العلمية — أزرار سريعة فوق لوحة المفاتيح تُدخل الرموز
 * (أُسس، سفلي، يونانية، رياضية، أسهم تفاعل) عند موضع المؤشر مباشرة،
 * بلا حاجة لتعلم أي لغة رموز.
 */
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../shared/theme/ThemeProvider';
import { FONT_FAMILY } from '../../shared/theme/tokens';
import { PressableScale } from '../../shared/ui/PressableScale';

const SYMBOL_GROUPS: Array<{ label: string; symbols: string[] }> = [
  { label: 'أُسس', symbols: ['²', '³', '¹', '⁰', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'] },
  { label: 'سفلي', symbols: ['₂', '₃', '₁', '₀', '₄', '₅', '₆', '₇', '₈', '₉'] },
  { label: 'يونانية', symbols: ['Δ', 'π', 'θ', 'α', 'β', 'γ', 'λ', 'μ', 'σ', 'ω', 'Ω', 'Φ'] },
  { label: 'رياضية', symbols: ['√', '∛', '½', '⅓', '¼', '¾', '°', '±', '×', '÷', '≤', '≥', '≠', '∞', '∑', '≈'] },
  { label: 'تفاعل', symbols: ['→', '⇌', '↔', '↑', '↓'] },
  { label: 'كيميائية', symbols: ['+', '−', '(aq)', '(s)', '(g)', '(l)'] },
];

interface SymbolPaletteProps {
  visible: boolean;
  onInsert: (symbol: string) => void;
}

export function SymbolPalette({ visible, onInsert }: SymbolPaletteProps) {
  const { colors } = useTheme();
  if (!visible) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.content}>
        {SYMBOL_GROUPS.map(group => (
          <View key={group.label} style={styles.group}>
            <Text style={[styles.groupLabel, { color: colors.textSecondary }]}>{group.label}</Text>
            {group.symbols.map(sym => (
              <PressableScale
                key={sym}
                animated={false}
                onPress={() => onInsert(sym)}
                style={[styles.symbolBtn, { backgroundColor: colors.surfaceElevated }]}
              >
                <Text style={[styles.symbolText, { color: colors.primary }]}>{sym}</Text>
              </PressableScale>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderTopWidth: 1 },
  content: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 6, gap: 12 },
  group: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  groupLabel: { fontFamily: FONT_FAMILY, fontSize: 11, fontWeight: '700', marginRight: 2 },
  symbolBtn: { minWidth: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  symbolText: { fontFamily: FONT_FAMILY, fontSize: 15, fontWeight: '700' },
});