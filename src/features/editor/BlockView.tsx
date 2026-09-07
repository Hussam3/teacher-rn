/**
 * عرض كتلة المحرر — عرض تحرير ومعاينة لكل أنواع الكتل.
 *
 * يدعم أنواع الأسئلة الحقيقية (اختيار من متعدد، صح/خطأ، أكمل الفراغ،
 * مطابقة، مقالي) وكتلة المعادلة العلمية، ويتتبع موضع المؤشر في كل حقل
 * نصي لتمكين لوحة الرموز من الإدراج عند المؤشر (EditorScreen)،
 * ويدعم الخطوط المخصصة وإدارة الفروع والخيارات دون اختفاء النصوص.
 */
import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { useTheme } from '../../shared/theme/ThemeProvider';
import { FONT_FAMILY, radius } from '../../shared/theme/tokens';
import { PressableScale } from '../../shared/ui/PressableScale';
import {
  BRANCH_LABELS,
  getBranchSubItems,
  getQuestionMode,
  shouldShowQuestionStem,
} from '../../shared/types/editor';
import type {
  EditorBlock,
  ExamFontFamily,
  QuestionBlock,
  QuestionBranch,
  TableBlock,
} from '../../shared/types/editor';
import { stripBranchPrefix, stripQuestionPrefix } from './examTextParser';

/** حالة حقل نصي داخل كتلة (للإدراج عند المؤشر) */
export interface FieldFocusInfo {
  blockId: string;
  key: string;
  start: number;
  end: number;
}

/** أسماء حقول الكتلة النصية (مفاتيح مستقرة لخريطة المؤشر) */
export const FIELD_TEXT = 'text';
export const FIELD_SCORE = 'score';
export const fieldBranch = (i: number) => `branch:${i}`;
export const fieldBranchScore = (i: number) => `branchScore:${i}`;
export const fieldSubItem = (branchIndex: number, itemIndex: number) =>
  `subItem:${branchIndex}:${itemIndex}`;
export const fieldPairLeft = (i: number) => `pairL:${i}`;
export const fieldPairRight = (i: number) => `pairR:${i}`;
export const fieldItem = (i: number) => `item:${i}`;
export const fieldCell = (r: number, c: number) => `cell:${r}:${c}`;

/** تحويل عائلة خط الامتحان إلى خط متوافق مع العرض المباشر */
export function getEditorFontFamily(family?: ExamFontFamily): string {
  switch (family) {
    case 'Cairo':
      return 'Cairo';
    case 'Amiri':
      return 'Amiri';
    case 'Tajawal':
      return 'Tajawal';
    case 'NotoNaskh':
      return 'NotoNaskhArabic';
    case 'Almarai':
      return 'Almarai';
    case 'NotoKufi':
      return 'NotoKufiArabic';
    case 'Tahoma':
      return 'Tahoma';
    default:
      return FONT_FAMILY;
  }
}

interface BlockViewProps {
  block: EditorBlock;
  preview: boolean;
  selected: boolean;
  /** الخط المحدد في إعدادات المستند */
  fontFamily?: ExamFontFamily;
  /** الفقرة الوحيدة في المستند تتحول إلى مساحة كتابة بحجم الورقة */
  fullPage?: boolean;
  /** ترتيب السؤال بين أسئلة المستند */
  questionNumber?: number;
  onSelect: () => void;
  onChange: (block: EditorBlock) => void;
  onAddQuestionAfter?: () => void;
  onRequestDeleteQuestion?: () => void;
  onFieldFocus?: (info: FieldFocusInfo) => void;
  onLayout?: (event: LayoutChangeEvent) => void;
}

/** TextInput يتتبع المؤشر ويفيد لوحة الرموز */
function SymTextInput(
  props: TextInputProps & {
    fieldKey: string;
    blockId: string;
    onFieldFocus?: (i: FieldFocusInfo) => void;
    autoGrow?: boolean;
    minHeight?: number;
  },
) {
  const {
    fieldKey,
    blockId,
    onFieldFocus,
    onFocus,
    onSelectionChange,
    onContentSizeChange,
    style,
    scrollEnabled,
    autoGrow = false,
    minHeight = 0,
    ...rest
  } = props;
  const [height, setHeight] = React.useState(minHeight);

  return (
    <TextInput
      {...rest}
      style={[
        style,
        autoGrow
          ? { height: Math.max(minHeight, height), minHeight }
          : undefined,
      ]}
      scrollEnabled={autoGrow ? false : scrollEnabled}
      onFocus={e => {
        onFieldFocus?.({ blockId, key: fieldKey, start: -1, end: -1 });
        onFocus?.(e);
      }}
      onSelectionChange={e => {
        const sel = e.nativeEvent.selection;
        onFieldFocus?.({
          blockId,
          key: fieldKey,
          start: sel.start,
          end: sel.end,
        });
        onSelectionChange?.(e);
      }}
      onContentSizeChange={e => {
        if (autoGrow) setHeight(Math.ceil(e.nativeEvent.contentSize.height));
        onContentSizeChange?.(e);
      }}
    />
  );
}

export function BlockView({
  block,
  preview,
  selected,
  fontFamily,
  fullPage = false,
  questionNumber,
  onSelect,
  onChange,
  onAddQuestionAfter,
  onRequestDeleteQuestion,
  onFieldFocus,
  onLayout,
}: BlockViewProps) {
  const { colors } = useTheme();
  const activeFont = getEditorFontFamily(fontFamily);

  if (preview) {
    return (
      <PreviewBlock
        block={block}
        activeFont={activeFont}
        questionNumber={questionNumber}
      />
    );
  }

  const wrapper = (children: React.ReactNode) => (
    <PressableScale
      onPress={onSelect}
      onLayout={onLayout}
      animated={false}
      style={[
        styles.block,
        fullPage && styles.fullPageBlock,
        selected && { borderColor: colors.primary, borderWidth: 1 },
      ]}
    >
      {children}
    </PressableScale>
  );

  switch (block.type) {
    case 'paragraph':
    case 'heading':
    case 'answer': {
      const size = block.type === 'heading' ? 20 - block.level * 2 : 15;
      const weight = block.type === 'heading' ? '700' : '400';
      const fontStyle =
        block.type === 'paragraph' && block.style?.italic ? 'italic' : 'normal';
      const decoration =
        block.type === 'paragraph' && block.style?.underline
          ? 'underline'
          : 'none';
      const color =
        block.type === 'answer' ? colors.textSecondary : colors.textPrimary;
      const align =
        block.type === 'paragraph' || block.type === 'heading'
          ? block.align === 'center'
            ? 'center'
            : block.align === 'left'
            ? 'left'
            : 'right'
          : 'right';
      return wrapper(
        <SymTextInput
          blockId={block.id}
          fieldKey={FIELD_TEXT}
          onFieldFocus={onFieldFocus}
          multiline
          value={stripQuestionPrefix(block.text)}
          onChangeText={t => onChange({ ...block, text: t } as EditorBlock)}
          placeholder={
            fullPage
              ? 'اكتب أو الصق نص الأسئلة هنا بالكامل...\n\nيمكنك كتابة الأسئلة دفعة واحدة، ثم الضغط على «تنسيق ذكي» من تبويب (ذكاء اصطناعي) لتنظيمها وتوزيع درجاتها وفروعها تلقائياً.'
              : block.type === 'answer'
              ? 'الإجابة النموذجية...'
              : 'اكتب هنا...'
          }
          placeholderTextColor={`${colors.textSecondary}80`}
          autoGrow={fullPage}
          minHeight={fullPage ? 640 : 0}
          style={[
            styles.input,
            fullPage && styles.fullPageInput,
            {
              fontFamily: activeFont,
              color,
              fontSize: size,
              fontWeight: weight as '700' | '400',
              fontStyle,
              textDecorationLine: decoration,
              textAlign: align,
            },
          ]}
          textAlignVertical="top"
        />,
      );
    }

    case 'formula': {
      const align =
        block.align === 'left'
          ? 'left'
          : block.align === 'right'
          ? 'right'
          : 'center';
      return wrapper(
        <View style={styles.formulaContainer}>
          <SymTextInput
            blockId={block.id}
            fieldKey={FIELD_TEXT}
            onFieldFocus={onFieldFocus}
            multiline
            value={block.text}
            onChangeText={t => onChange({ ...block, text: t })}
            placeholder="اكتب الصيغة هنا... مثال: H₂SO₄ + 2NaOH → Na₂SO₄ + 2H₂O"
            placeholderTextColor={`${colors.textSecondary}80`}
            style={[
              styles.formulaInput,
              {
                fontFamily: activeFont,
                color: colors.primary,
                textAlign: align,
              },
            ]}
            textAlignVertical="top"
          />
        </View>,
      );
    }

    case 'list':
      return wrapper(
        <View style={styles.listContainer}>
          {block.items.map((item, i) => (
            <View key={i} style={styles.listRow}>
              <Text
                style={[
                  styles.listMarker,
                  { fontFamily: activeFont, color: colors.primary },
                ]}
              >
                {block.ordered ? `${i + 1}.` : '•'}
              </Text>
              <SymTextInput
                blockId={block.id}
                fieldKey={fieldItem(i)}
                onFieldFocus={onFieldFocus}
                value={item}
                onChangeText={t => {
                  const items = [...block.items];
                  items[i] = t;
                  onChange({ ...block, items });
                }}
                style={[
                  styles.input,
                  { fontFamily: activeFont, color: colors.textPrimary, flex: 1 },
                ]}
              />
              <PressableScale
                animated={false}
                onPress={() => {
                  const items = block.items.filter((_, idx) => idx !== i);
                  onChange({ ...block, items });
                }}
                style={styles.removeBtn}
              >
                <Text style={{ color: colors.error, fontSize: 16 }}>×</Text>
              </PressableScale>
            </View>
          ))}
          <PressableScale
            animated={false}
            onPress={() => onChange({ ...block, items: [...block.items, ''] })}
          >
            <Text
              style={{
                color: colors.primary,
                fontFamily: activeFont,
                fontSize: 13,
              }}
            >
              + إضافة عنصر
            </Text>
          </PressableScale>
        </View>,
      );

    case 'question':
      return wrapper(
        <View>
          <QuestionEditor
            block={block}
            questionNumber={questionNumber ?? 1}
            activeFont={activeFont}
            onChange={onChange}
            onFieldFocus={onFieldFocus}
          />
          <View style={styles.questionBlockActions}>
            <PressableScale
              animated={false}
              onPress={onAddQuestionAfter}
              style={styles.addQuestionBtn}
            >
              <Text
                style={{
                  color: colors.primary,
                  fontFamily: activeFont,
                  fontSize: 13,
                  fontWeight: '700',
                }}
              >
                + إضافة سؤال
              </Text>
            </PressableScale>
            <PressableScale
              animated={false}
              onPress={onRequestDeleteQuestion}
              style={styles.deleteQuestionBtn}
            >
              <Text
                style={{
                  color: colors.error,
                  fontFamily: activeFont,
                  fontSize: 12,
                  fontWeight: '700',
                }}
              >
                حذف السؤال
              </Text>
            </PressableScale>
          </View>
        </View>,
      );

    case 'table':
      return wrapper(
        <TableEditor
          block={block}
          activeFont={activeFont}
          onChange={onChange}
          onFieldFocus={onFieldFocus}
        />,
      );

    case 'divider':
      return wrapper(
        <View
          style={[styles.dividerLine, { backgroundColor: colors.divider }]}
        />,
      );

    case 'image':
      return wrapper(
        <Text
          style={{
            color: colors.textSecondary,
            fontFamily: activeFont,
            textAlign: 'center',
          }}
        >
          [صورة]
        </Text>,
      );
  }
}

/* ------------------------------- محرر السؤال ------------------------------- */

function QuestionEditor({
  block,
  questionNumber,
  activeFont,
  onChange,
  onFieldFocus,
}: {
  block: QuestionBlock;
  questionNumber: number;
  activeFont: string;
  onChange: (b: EditorBlock) => void;
  onFieldFocus?: (i: FieldFocusInfo) => void;
}) {
  const { colors } = useTheme();

  const questionMode = getQuestionMode(block);
  const showStem = shouldShowQuestionStem(block);

  // استرجاع الفروع أو الخيارات المولدة سابقاً.
  const branches: QuestionBranch[] = React.useMemo(() => {
    if (block.branches && block.branches.length > 0) {
      return block.branches;
    }
    if (block.options && block.options.length > 0) {
      return block.options.map(o => ({ text: o, score: '', subItems: [] }));
    }
    return [];
  }, [block.branches, block.options]);

  const update = (patch: Partial<QuestionBlock>) =>
    onChange({ ...block, ...patch });

  const addBranch = () => {
    update({ branches: [...branches, { text: '', score: '', subItems: [] }] });
  };

  const removeBranch = (index: number) => {
    const updated = branches.filter((_, i) => i !== index);
    update({ branches: updated });
  };

  const setQuestionMode = (mode: 'direct' | 'branched') => {
    if (mode === questionMode) return;
    update({
      questionMode: mode,
      score: block.score,
      branches: mode === 'direct' ? [] : branches,
    });
  };

  return (
    <View style={styles.questionContainer}>
      <View style={styles.questionHeader}>
        <View style={styles.questionModeToggle}>
          <PressableScale
            animated={false}
            onPress={() => setQuestionMode('direct')}
            style={[
              styles.questionModeBtn,
              {
                backgroundColor:
                  questionMode === 'direct' ? `${colors.primary}18` : colors.surfaceElevated,
                borderColor: questionMode === 'direct' ? colors.primary : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.questionModeLabel,
                { color: questionMode === 'direct' ? colors.primary : colors.textSecondary },
              ]}
            >
              سؤال مباشر
            </Text>
          </PressableScale>
          <PressableScale
            animated={false}
            onPress={() => setQuestionMode('branched')}
            style={[
              styles.questionModeBtn,
              {
                backgroundColor:
                  questionMode === 'branched' ? `${colors.primary}18` : colors.surfaceElevated,
                borderColor: questionMode === 'branched' ? colors.primary : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.questionModeLabel,
                { color: questionMode === 'branched' ? colors.primary : colors.textSecondary },
              ]}
            >
              سؤال متفرع
            </Text>
          </PressableScale>
        </View>
        <SymTextInput
          blockId={block.id}
          fieldKey={FIELD_SCORE}
          onFieldFocus={onFieldFocus}
          value={block.score}
          onChangeText={t => update({ score: t })}
          placeholder="درجة السؤال"
          placeholderTextColor={`${colors.textSecondary}80`}
          style={[
            styles.scoreInput,
            {
              fontFamily: activeFont,
              borderColor: colors.border,
              color: colors.textPrimary,
            },
          ]}
        />
      </View>

      {showStem ? (
        <View style={styles.questionTextRow}>
          <Text
            style={[
              styles.questionInlineLabel,
              { fontFamily: activeFont, color: colors.primary },
            ]}
          >
            س{questionNumber}/
          </Text>
          <SymTextInput
            blockId={block.id}
            fieldKey={FIELD_TEXT}
            onFieldFocus={onFieldFocus}
            multiline
            value={block.text}
            onChangeText={t => update({ text: stripQuestionPrefix(t) })}
            placeholder={
              questionMode === 'direct'
                ? 'نص السؤال المباشر...'
                : 'نص السؤال الرئيسي المتفرع...'
            }
            placeholderTextColor={`${colors.textSecondary}80`}
            style={[
              styles.input,
              styles.questionTextInput,
              {
                fontFamily: activeFont,
                color: colors.textPrimary,
                fontWeight: '700',
                fontSize: 15,
              },
            ]}
          />
        </View>
      ) : null}

      {questionMode === 'branched' ? (
        <View style={styles.branchesList}>
          {branches.map((b, i) => {
            const subItems = getBranchSubItems(b);
            return (
              <View
                key={i}
                style={[
                  styles.branchCard,
                  { borderColor: colors.border, backgroundColor: colors.surfaceElevated },
                ]}
              >
                <View style={styles.branchTextRow}>
                  <Text
                    style={[
                      styles.branchLabel,
                      { fontFamily: activeFont, color: colors.primary },
                    ]}
                  >
                    {showStem
                      ? `${BRANCH_LABELS[i] ?? `${i + 1}`}/`
                      : `س${questionNumber}/${BRANCH_LABELS[i] ?? `${i + 1}`}/`}
                  </Text>
                  <SymTextInput
                    blockId={block.id}
                    fieldKey={fieldBranch(i)}
                    onFieldFocus={onFieldFocus}
                    multiline
                    value={stripBranchPrefix(b.text)}
                    onChangeText={t => {
                      const nextBranches = [...branches];
                      nextBranches[i] = { ...b, text: stripBranchPrefix(t) };
                      update({ branches: nextBranches });
                    }}
                    placeholder="نص الفرع..."
                    placeholderTextColor={`${colors.textSecondary}80`}
                    style={[
                      styles.input,
                      styles.branchTextInput,
                      { fontFamily: activeFont, color: colors.textPrimary },
                    ]}
                  />
                  <SymTextInput
                    blockId={block.id}
                    fieldKey={fieldBranchScore(i)}
                    onFieldFocus={onFieldFocus}
                    value={b.score}
                    onChangeText={t => {
                      const nextBranches = [...branches];
                      nextBranches[i] = { ...b, score: t };
                      update({ branches: nextBranches });
                    }}
                    placeholder="درجة الفرع"
                    placeholderTextColor={`${colors.textSecondary}80`}
                    style={[
                      styles.branchScore,
                      {
                        fontFamily: activeFont,
                        borderColor: colors.border,
                        color: colors.textPrimary,
                      },
                    ]}
                  />
                  <PressableScale
                    animated={false}
                    onPress={() => removeBranch(i)}
                    style={styles.removeBtn}
                  >
                    <Text style={{ color: colors.error, fontSize: 16 }}>×</Text>
                  </PressableScale>
                </View>
                {subItems.map((subItem, subItemIndex) => (
                  <View key={subItemIndex} style={styles.subItemRow}>
                    <Text
                      style={[
                        styles.subItemLabel,
                        { fontFamily: activeFont, color: colors.textSecondary },
                      ]}
                    >
                      {subItemIndex + 1}.
                    </Text>
                    <SymTextInput
                      blockId={block.id}
                      fieldKey={fieldSubItem(i, subItemIndex)}
                      onFieldFocus={onFieldFocus}
                      value={subItem.text}
                      onChangeText={t => {
                        const nextBranches = [...branches];
                        nextBranches[i] = {
                          ...b,
                          subItems: subItems.map((item, index) =>
                            index === subItemIndex ? { ...item, text: t } : item,
                          ),
                        };
                        update({ branches: nextBranches });
                      }}
                      placeholder="نقطة فرعية"
                      placeholderTextColor={`${colors.textSecondary}80`}
                      style={[
                        styles.input,
                        { fontFamily: activeFont, color: colors.textPrimary, flex: 1 },
                      ]}
                    />
                    <PressableScale
                      animated={false}
                      onPress={() => {
                        const nextBranches = [...branches];
                        nextBranches[i] = {
                          ...b,
                          subItems: subItems.filter((_, index) => index !== subItemIndex),
                        };
                        update({ branches: nextBranches });
                      }}
                      style={styles.removeBtn}
                    >
                      <Text style={{ color: colors.error, fontSize: 16 }}>×</Text>
                    </PressableScale>
                  </View>
                ))}
                <PressableScale
                  animated={false}
                  onPress={() => {
                    const nextBranches = [...branches];
                    nextBranches[i] = {
                      ...b,
                      subItems: [...subItems, { text: '' }],
                    };
                    update({ branches: nextBranches });
                  }}
                  style={styles.addSubItemBtn}
                >
                  <Text
                    style={{
                      color: colors.primary,
                      fontFamily: activeFont,
                      fontSize: 12,
                      fontWeight: '600',
                    }}
                  >
                    + إضافة نقطة فرعية
                  </Text>
                </PressableScale>
              </View>
            );
          })}
          <PressableScale
            animated={false}
            onPress={addBranch}
            style={styles.addBranchBtn}
          >
            <Text
              style={{
                color: colors.primary,
                fontFamily: activeFont,
                fontSize: 13,
                fontWeight: '600',
              }}
            >
              + إضافة فرع
            </Text>
          </PressableScale>
        </View>
      ) : null}
    </View>
  );
}

/* ------------------------------- محرر الجدول ------------------------------- */

function TableEditor({
  block,
  activeFont,
  onChange,
  onFieldFocus,
}: {
  block: TableBlock;
  activeFont: string;
  onChange: (b: EditorBlock) => void;
  onFieldFocus?: (i: FieldFocusInfo) => void;
}) {
  const { colors } = useTheme();

  const setCell = (
    row: number,
    col: number,
    value: string,
    isHeader: boolean,
  ) => {
    if (isHeader) {
      const headers = [...block.headers];
      headers[col] = value;
      onChange({ ...block, headers });
    } else {
      const rows = block.rows.map(r => [...r]);
      rows[row]![col] = value;
      onChange({ ...block, rows });
    }
  };

  return (
    <View>
      <View style={styles.tableRow}>
        {block.headers.map((h, i) => (
          <SymTextInput
            key={i}
            blockId={block.id}
            fieldKey={fieldCell(0, i)}
            onFieldFocus={onFieldFocus}
            value={h}
            onChangeText={t => setCell(0, i, t, true)}
            style={[
              styles.tableCell,
              styles.tableHeaderCell,
              {
                fontFamily: activeFont,
                borderColor: colors.border,
                color: colors.primary,
              },
            ]}
          />
        ))}
      </View>
      {block.rows.map((row, ri) => (
        <View key={ri} style={styles.tableRow}>
          {row.map((cell, ci) => (
            <SymTextInput
              key={ci}
              blockId={block.id}
              fieldKey={fieldCell(ri + 1, ci)}
              onFieldFocus={onFieldFocus}
              value={cell}
              onChangeText={t => setCell(ri, ci, t, false)}
              style={[
                styles.tableCell,
                {
                  fontFamily: activeFont,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                },
              ]}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

/* ------------------------------- المعاينة ------------------------------- */

function PreviewBlock({
  block,
  activeFont,
  questionNumber,
}: {
  block: EditorBlock;
  activeFont: string;
  questionNumber?: number;
}) {
  const { colors } = useTheme();

  switch (block.type) {
    case 'paragraph':
    case 'heading':
    case 'answer': {
      const size = block.type === 'heading' ? 20 - block.level * 2 : 15;
      const weight = block.type === 'heading' ? '700' : '400';
      const align =
        block.type === 'paragraph' || block.type === 'heading'
          ? block.align === 'center'
            ? 'center'
            : block.align === 'left'
            ? 'left'
            : 'right'
          : 'right';
      return (
        <Text
          style={{
            fontFamily: activeFont,
            fontSize: size,
            fontWeight: weight as '700' | '400',
            fontStyle:
              block.type === 'paragraph' && block.style?.italic
                ? 'italic'
                : 'normal',
            textDecorationLine:
              block.type === 'paragraph' && block.style?.underline
                ? 'underline'
                : 'none',
            color:
              block.type === 'answer'
                ? colors.textSecondary
                : colors.textPrimary,
            textAlign: align,
            lineHeight: 26,
          }}
        >
          {block.type === 'answer'
            ? `[الإجابة: ${block.text}]`
            : block.text || ' '}
        </Text>
      );
    }
    case 'formula':
      return (
        <Text
          style={{
            fontFamily: activeFont,
            fontSize: 17,
            fontWeight: '700',
            color: colors.primary,
            textAlign:
              block.align === 'left'
                ? 'left'
                : block.align === 'right'
                ? 'right'
                : 'center',
            lineHeight: 28,
            paddingVertical: 4,
          }}
        >
          {block.text || ' '}
        </Text>
      );
    case 'list':
      return (
        <View>
          {block.items.map((item, i) => (
            <Text
              key={i}
              style={{
                fontFamily: activeFont,
                fontSize: 15,
                color: colors.textPrimary,
                lineHeight: 26,
              }}
            >
              {block.ordered ? `${i + 1}. ` : '• '}
              {item}
            </Text>
          ))}
        </View>
      );
    case 'question':
      return (
        <PreviewQuestion
          block={block}
          activeFont={activeFont}
          questionNumber={questionNumber ?? 1}
        />
      );
    case 'table': {
      return (
        <View>
          <View style={styles.tableRow}>
            {block.headers.map((h, i) => (
              <Text
                key={i}
                style={[
                  styles.previewCell,
                  {
                    fontFamily: activeFont,
                    borderColor: colors.border,
                    color: colors.primary,
                    fontWeight: '700',
                  },
                ]}
              >
                {h}
              </Text>
            ))}
          </View>
          {block.rows.map((row, ri) => (
            <View key={ri} style={styles.tableRow}>
              {row.map((cell, ci) => (
                <Text
                  key={ci}
                  style={[
                    styles.previewCell,
                    {
                      fontFamily: activeFont,
                      borderColor: colors.border,
                      color: colors.textPrimary,
                    },
                  ]}
                >
                  {cell}
                </Text>
              ))}
            </View>
          ))}
        </View>
      );
    }
    case 'divider':
      return (
        <View
          style={[styles.dividerLine, { backgroundColor: colors.divider }]}
        />
      );
    case 'image':
      return (
        <Text
          style={{
            color: colors.textSecondary,
            fontFamily: activeFont,
            textAlign: 'center',
          }}
        >
          [صورة]
        </Text>
      );
  }
}

function PreviewQuestion({
  block,
  activeFont,
  questionNumber,
}: {
  block: QuestionBlock;
  activeFont: string;
  questionNumber: number;
}) {
  const { colors } = useTheme();
  const questionMode = getQuestionMode(block);
  const showStem = shouldShowQuestionStem(block);
  const branches: QuestionBranch[] =
    block.branches && block.branches.length > 0
      ? block.branches
      : (block.options ?? []).map(o => ({ text: o, score: '', subItems: [] }));
  const questionText = stripQuestionPrefix(block.text);

  return (
    <View style={styles.previewQuestion}>
      {showStem ? (
        <Text
          style={{
            fontFamily: activeFont,
            fontSize: 15,
            fontWeight: '700',
            color: colors.textPrimary,
            lineHeight: 26,
          }}
        >
          س{questionNumber}/ {questionText || 'سؤال'}
          {block.score ? ` (${block.score} درجة)` : ''}
        </Text>
      ) : null}

      {questionMode === 'branched' && branches.length > 0 ? (
        <View style={{ marginTop: 2 }}>
          {branches.map((b, i) => (
            <View key={i} style={styles.previewBranch}>
              <Text
                style={{
                  fontFamily: activeFont,
                  fontSize: 14,
                  color: colors.textPrimary,
                  lineHeight: 24,
                }}
              >
                {showStem
                  ? `${BRANCH_LABELS[i] ?? `${i + 1}`}/`
                  : `س${questionNumber}/${BRANCH_LABELS[i] ?? `${i + 1}`}/`}{' '}
                {stripBranchPrefix(b.text)}
                {!showStem && i === 0 && block.score
                  ? ` (${block.score} درجة)`
                  : ''}
                {b.score ? ` (${b.score} درجة)` : ''}
              </Text>
              {getBranchSubItems(b).map((subItem, subItemIndex) => (
                <Text
                  key={subItemIndex}
                  style={{
                    fontFamily: activeFont,
                    fontSize: 13,
                    color: colors.textPrimary,
                    marginRight: 22,
                    lineHeight: 22,
                  }}
                >
                  {subItemIndex + 1}. {subItem.text}
                </Text>
              ))}
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    borderRadius: radius.sm,
    padding: 8,
    marginVertical: 2,
    borderColor: 'transparent',
  },
  fullPageBlock: { minHeight: 640, marginVertical: 0, padding: 0 },
  input: {
    paddingVertical: 4,
    paddingHorizontal: 0,
  },
  fullPageInput: { minHeight: 640, paddingVertical: 0 },
  listContainer: { gap: 4 },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  listMarker: { fontSize: 15, fontWeight: '700' },
  dividerLine: { height: 1, marginVertical: 8 },
  questionContainer: { gap: 8 },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  questionModeToggle: { flexDirection: 'row', gap: 4 },
  questionModeBtn: {
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  questionModeLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '700',
  },
  scoreInput: {
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontSize: 12,
    minWidth: 80,
    textAlign: 'center',
  },
  questionTextRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 4 },
  questionInlineLabel: { fontSize: 15, fontWeight: '700', paddingVertical: 4 },
  questionTextInput: { flex: 1, minWidth: 0 },
  branchesList: { gap: 6, marginTop: 4 },
  branchCard: { borderWidth: 1, borderRadius: radius.sm, padding: 8, gap: 5 },
  branchTextRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 4 },
  branchLabel: { fontSize: 14, fontWeight: '700', paddingVertical: 4 },
  branchTextInput: { flex: 1, minWidth: 0 },
  branchScore: {
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontSize: 12,
    minWidth: 42,
    textAlign: 'center',
  },
  removeBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  addBranchBtn: {
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  subItemRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginRight: 10 },
  subItemLabel: { fontSize: 12, fontWeight: '700', minWidth: 16 },
  addSubItemBtn: { alignSelf: 'flex-start', marginRight: 10, marginTop: 2 },
  questionBlockActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#00000018',
  },
  addQuestionBtn: { paddingVertical: 4, paddingHorizontal: 2 },
  deleteQuestionBtn: { paddingVertical: 4, paddingHorizontal: 2 },
  formulaContainer: {
    borderWidth: 1,
    borderColor: '#24A1DE44',
    borderRadius: radius.md,
    padding: 10,
    backgroundColor: '#24A1DE0D',
  },
  formulaInput: {
    fontSize: 16,
    fontWeight: '700',
    padding: 0,
  },
  tableRow: { flexDirection: 'row' },
  tableCell: {
    flex: 1,
    borderWidth: 1,
    padding: 6,
    fontSize: 13,
    textAlign: 'center',
  },
  tableHeaderCell: { fontWeight: '700' },
  previewQuestion: { gap: 4 },
  previewBranch: { marginRight: 16 },
  previewCell: {
    flex: 1,
    borderWidth: 1,
    padding: 6,
    fontSize: 12,
    textAlign: 'center',
  },
});
