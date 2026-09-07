/** عناصر إعدادات الطباعة المتحكم بها؛ أي تعديل يصل للمعاينة فوراً. */
import React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import type { PrintSettings } from '../../shared/types/editor';
import { AVAILABLE_EXAM_FONTS } from '../../shared/types/editor';
import { strings } from '../../shared/i18n/ar';
import { useTheme } from '../../shared/theme/ThemeProvider';
import { FONT_FAMILY, radius } from '../../shared/theme/tokens';
import { Button } from '../../shared/ui/Button';
import { Icon } from '../../shared/ui/Icon';
import { PressableScale } from '../../shared/ui/PressableScale';
import { SelectField } from '../../shared/ui/SelectField';

interface PrintSettingsPanelProps {
  settings: PrintSettings;
  onChange: (patch: Partial<PrintSettings>) => void;
  onReset: () => void;
}

function Stepper({
  label,
  value,
  min,
  max,
  step,
  onChange,
  unit,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  unit: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.stepperRow}>
      <Text style={[styles.stepperLabel, { color: colors.textPrimary }]}>
        {label}
      </Text>
      <View style={styles.stepperControls}>
        <PressableScale
          onPress={() => onChange(Math.max(min, value - step))}
          animated={false}
          style={[styles.stepBtn, { backgroundColor: colors.surfaceElevated }]}
        >
          <Text
            style={{ color: colors.primary, fontSize: 18, fontWeight: '700' }}
          >
            -
          </Text>
        </PressableScale>
        <Text style={[styles.stepValue, { color: colors.textPrimary }]}>
          {value} {unit}
        </Text>
        <PressableScale
          onPress={() => onChange(Math.min(max, value + step))}
          animated={false}
          style={[styles.stepBtn, { backgroundColor: colors.surfaceElevated }]}
        >
          <Text
            style={{ color: colors.primary, fontSize: 18, fontWeight: '700' }}
          >
            +
          </Text>
        </PressableScale>
      </View>
    </View>
  );
}

export function PrintSettingsPanel({
  settings,
  onChange,
  onReset,
}: PrintSettingsPanelProps) {
  const { colors } = useTheme();

  return (
    <View>
      <View style={styles.sectionHeader}>
        <Icon name="font-download" size={16} color={colors.primary} />
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          نوع الخط لورقة الامتحان
        </Text>
      </View>
      <View style={styles.fontsGrid}>
        {AVAILABLE_EXAM_FONTS.map(font => {
          const isSelected = settings.fontFamily === font.id;
          return (
            <PressableScale
              key={font.id}
              onPress={() => onChange({ fontFamily: font.id })}
              animated={false}
              style={[
                styles.fontCard,
                {
                  backgroundColor: isSelected
                    ? `${colors.primary}15`
                    : colors.surfaceElevated,
                  borderColor: isSelected ? colors.primary : colors.border,
                },
              ]}
            >
              <View style={styles.fontCardHead}>
                <Text
                  style={[
                    styles.fontCardName,
                    { color: isSelected ? colors.primary : colors.textPrimary },
                  ]}
                >
                  {font.name}
                </Text>
                {isSelected ? (
                  <Icon name="check-circle" size={16} color={colors.primary} />
                ) : null}
              </View>
              <Text
                style={[styles.fontCardDesc, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {font.description}
              </Text>
            </PressableScale>
          );
        })}
      </View>

      <View
        style={[
          styles.highlightBox,
          {
            backgroundColor: settings.autoFit
              ? `${colors.primary}15`
              : colors.surfaceElevated,
            borderColor: settings.autoFit ? colors.primary : colors.border,
          },
        ]}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={[
              styles.highlightTitle,
              { color: settings.autoFit ? colors.primary : colors.textPrimary },
            ]}
          >
            احتواء تلقائي في صفحة واحدة (A4)
          </Text>
          <Text style={[styles.highlightSub, { color: colors.textSecondary }]}>
            يضبط الورقة مرة واحدة لتناسب صفحة A4. التعديل اليدوي يعطله تلقائياً.
          </Text>
        </View>
        <Switch
          value={settings.autoFit}
          onValueChange={autoFit => onChange({ autoFit })}
          trackColor={{ true: colors.primary }}
        />
      </View>

      <Stepper
        label={strings.editor.margins}
        value={settings.marginMm}
        min={5}
        max={30}
        step={1}
        unit="مم"
        onChange={marginMm => onChange({ marginMm })}
      />
      <View style={styles.presetsRow}>
        {[
          [8, 'ضيق (8 مم)'],
          [15, 'عادي (15 مم)'],
          [22, 'عريض (22 مم)'],
        ].map(([marginMm, label]) => (
          <PressableScale
            key={marginMm}
            animated={false}
            onPress={() => onChange({ marginMm: Number(marginMm) })}
            style={[
              styles.presetChip,
              {
                backgroundColor:
                  settings.marginMm === marginMm
                    ? colors.primary
                    : colors.surfaceElevated,
              },
            ]}
          >
            <Text
              style={[
                styles.presetChipText,
                {
                  color:
                    settings.marginMm === marginMm
                      ? '#fff'
                      : colors.textSecondary,
                },
              ]}
            >
              {label}
            </Text>
          </PressableScale>
        ))}
      </View>

      <Stepper
        label={strings.editor.fontSize}
        value={settings.fontSize}
        min={8}
        max={18}
        step={1}
        unit="pt"
        onChange={fontSize => onChange({ fontSize })}
      />
      <Stepper
        label={strings.editor.questionSpacing}
        value={settings.questionSpacing}
        min={0}
        max={20}
        step={1}
        unit="pt"
        onChange={questionSpacing => onChange({ questionSpacing })}
      />

      <SelectField
        label={strings.editor.frame}
        value={String(settings.frameOption)}
        options={[
          { label: strings.editor.frameNone, value: '0' },
          { label: strings.editor.frameFull, value: '1' },
          { label: strings.editor.frameQuestions, value: '2' },
        ]}
        onChange={value =>
          onChange({ frameOption: Number(value) as 0 | 1 | 2 })
        }
      />
      <SelectField
        label="عدد الأعمدة"
        value={String(settings.columns)}
        options={[
          { label: 'عمود واحد', value: '1' },
          { label: 'عمودان (للامتحانات المكثفة)', value: '2' },
        ]}
        onChange={value => onChange({ columns: Number(value) as 1 | 2 })}
      />
      <Stepper
        label="عدد النسخ بالصفحة"
        value={settings.repeatPerPage}
        min={1}
        max={4}
        step={1}
        unit="نسخة"
        onChange={repeatPerPage =>
          onChange({ repeatPerPage: repeatPerPage as 1 | 2 | 3 | 4 })
        }
      />
      {settings.repeatPerPage > 1 ? (
        <View style={styles.switchRow}>
          <Text style={[styles.switchLabel, { color: colors.textPrimary }]}>
            خطوط قص بين النسخ
          </Text>
          <Switch
            value={settings.cutLines}
            onValueChange={cutLines => onChange({ cutLines })}
            trackColor={{ true: colors.primary }}
          />
        </View>
      ) : null}

      <Button
        label={strings.editor.reset}
        variant="outline"
        icon={{ name: 'restart-alt' }}
        onPress={onReset}
        style={styles.resetButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  stepperLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  stepperControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    minWidth: 56,
    textAlign: 'center',
    fontWeight: '700',
  },
  presetsRow: { flexDirection: 'row', gap: 8, marginBottom: 8, marginTop: 2 },
  presetChip: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  presetChipText: { fontFamily: FONT_FAMILY, fontSize: 11, fontWeight: '700' },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  switchLabel: { fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '600' },
  highlightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: 10,
    gap: 10,
  },
  highlightTitle: { fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '700' },
  highlightSub: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    marginTop: 2,
    lineHeight: 17,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    marginTop: 4,
  },
  sectionTitle: { fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '700' },
  fontsGrid: { gap: 6, marginBottom: 12 },
  fontCard: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1.5,
    gap: 2,
  },
  fontCardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fontCardName: { fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '700' },
  fontCardDesc: { fontFamily: FONT_FAMILY, fontSize: 11 },
  resetButton: { marginTop: 12, marginBottom: 4 },
});
