/**
 * شاشة المحرر — ورقة كتابة متصلة مع كتل متخصصة للامتحانات.
 *
 * أعيد ترتيب وتصميم شريط الأدوات بالكامل على نمط Microsoft Word (Ribbon):
 * [ ملف ] [ الرئيسية ] [ إدراج ] [ تخطيط ] [ إعدادات الطباعة ] [ ذكاء اصطناعي ] [ عرض ]
 *
 * مع إدراج مباشر لكافة أنواع الأسئلة (اختيارات، صح/خطأ، فراغات، مطابقة، مقالي)،
 * وتكامل محكم مع محرك الطباعة ومعاينة A4 الحقيقية.
 */
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { EditorStackParamList } from '../../app/navigation/types';
import {
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTheme } from '../../shared/theme/ThemeProvider';
import { FONT_FAMILY, radius } from '../../shared/theme/tokens';
import { strings } from '../../shared/i18n/ar';
import { AppScreen } from '../../shared/ui/AppScreen';
import { Icon } from '../../shared/ui/Icon';
import { PressableScale } from '../../shared/ui/PressableScale';
import { showError, showInfo, showSuccess } from '../../shared/ui/toast';
import type {
  EditorBlock,
  EditorDocument,
  PrintSettings,
  ProofreadIssue,
  QuestionFormat,
} from '../../shared/types/editor';
import {
  BRANCH_LABELS,
  DEFAULT_PRINT_SETTINGS,
  getBranchSubItems,
  getQuestionMode,
  normalizeEditorDocument,
  shouldShowQuestionStem,
} from '../../shared/types/editor';
import type { Question } from '../../shared/types/domain';
import { documentRepo } from '../../data/repositories';
import { generateExamPdf } from '../../services/pdfService';
import { generateExamPdfToDownloads } from '../../services/pdfExportService';
import { printPdf, sharePdf, shareText } from '../../services/printService';
import { startDictation, stopDictation } from '../../services/speechService';
import { processVoiceInput } from '../../services/voiceCommandProcessor';
import { getAIService } from '../../services/aiService';
import {
  BlockView,
  FIELD_SCORE,
  FIELD_TEXT,
  type FieldFocusInfo,
} from './BlockView';
import { ExamHeaderDialog } from './ExamHeaderDialog';
import { PrintPreviewDialog } from './PrintPreviewDialog';
import { DraftsDialog } from './DraftsDialog';
import { QuestionGenerationDialog } from './QuestionGenerationDialog';
import { SymbolPalette } from './SymbolPalette';
import { ProofreadDialog } from './ProofreadDialog';
import { VoiceHelpDialog } from './VoiceHelpDialog';
import {
  isCompleteHeaderDate,
  shouldShowHeaderTrack,
  shouldShowRoundInSubtitle,
  suggestAutoFit,
} from './examHtml';
import {
  parseExamText,
  stripBranchPrefix,
  stripQuestionPrefix,
} from './examTextParser';
import { compactSmartFormatBlocks } from './smartFormat';
import {
  createBlock,
  createEmptyDocument,
  createParagraph,
  createQuestion,
  createAnswer,
} from './blocks';
import { newId } from '../../shared/utils/id';
import { todayISO } from '../../shared/utils/date';
import { Button } from '../../shared/ui/Button';
import { Dialog } from '../../shared/ui/Dialog';
import {
  createNamedDraft,
  listNamedDrafts,
  restoreNamedDraft,
} from './drafts';

/** تحويل نوع سؤال مولّد إلى صيغة كتلة السؤال */
function formatFromQuestion(
  q: Question,
): QuestionFormat {
  if (q.type === 'mcq') return 'mcq';
  if (q.type === 'true_false') return 'trueFalse';
  if (q.type === 'fill_blanks') return 'fillBlank';
  return 'generic';
}

/** درجة مقترحة حسب نوع السؤال */
function suggestedScore(q: Question): string {
  switch (q.type) {
    case 'mcq':
      return '4';
    case 'true_false':
      return '2';
    case 'fill_blanks':
      return '3';
    case 'calculation':
      return '10';
    default:
      return '8';
  }
}

/** تحويل سؤال مولّد إلى كتل محرر حقيقية */
function questionToBlocks(q: Question): EditorBlock[] {
  const blocks: EditorBlock[] = [];
  const qb = createQuestion();
  qb.text = q.text;
  qb.score = suggestedScore(q);
  qb.format = formatFromQuestion(q);
  if (q.type === 'mcq' && q.options) {
    qb.questionMode = 'branched';
    qb.branches = q.options.map(o => ({ text: o, score: '', subItems: [] }));
    qb.options = q.options;
  } else if (q.type === 'true_false') {
    qb.questionMode = 'branched';
    qb.branches = [
      { text: 'صح', score: '', subItems: [] },
      { text: 'خطأ', score: '', subItems: [] },
    ];
  } else if (q.options && q.options.length > 0) {
    qb.questionMode = 'branched';
    qb.branches = q.options.map(o => ({ text: o, score: '', subItems: [] }));
  } else {
    qb.branches = [];
  }
  blocks.push(qb);
  if (q.modelAnswer || q.correctAnswer) {
    blocks.push(createAnswer(q.correctAnswer ?? q.modelAnswer ?? ''));
  }
  return blocks;
}

/** تطبيق تعديلات التدقيق اللغوي والعلمي على كتل المستند */
function applyIssuesToDocument(
  doc: EditorDocument,
  issues: ProofreadIssue[],
): EditorDocument {
  if (!issues.length) return doc;

  const replaceText = (text: string): string => {
    let result = text;
    for (const iss of issues) {
      if (iss.originalText && iss.suggestedText) {
        result = result.split(iss.originalText).join(iss.suggestedText);
      }
    }
    return result;
  };

  const updatedBlocks = doc.blocks.map(b => {
    switch (b.type) {
      case 'paragraph':
      case 'heading':
      case 'formula':
      case 'answer':
        return { ...b, text: replaceText(b.text) };
      case 'question': {
        return {
          ...b,
          text: replaceText(b.text),
          branches: b.branches.map(br => ({
            ...br,
            text: replaceText(br.text),
            subItems: getBranchSubItems(br).map(item => ({
              ...item,
              text: replaceText(item.text),
            })),
          })),
          options: b.options?.map(replaceText),
          pairs: b.pairs?.map(
            ([l, r]) => [replaceText(l), replaceText(r)] as [string, string],
          ),
        };
      }
      case 'list':
        return { ...b, items: b.items.map(replaceText) };
      case 'table':
        return {
          ...b,
          headers: b.headers.map(replaceText),
          rows: b.rows.map(row => row.map(replaceText)),
        };
      default:
        return b;
    }
  });

  return { ...doc, blocks: updatedBlocks };
}

/** نص المستند كسلسلة واحدة */
function documentToText(doc: EditorDocument): string {
  const parts: string[] = [];
  let questionNumber = 0;
  for (const b of doc.blocks) {
    if (b.type === 'paragraph' || b.type === 'heading' || b.type === 'answer') {
      parts.push(b.text);
    } else if (b.type === 'formula') {
      parts.push(b.text);
    } else if (b.type === 'question') {
      questionNumber += 1;
      const questionMode = getQuestionMode(b);
      const scoreStr = b.score ? ` (${b.score} درجة)` : '';
      const branches = b.branches && b.branches.length > 0
        ? b.branches
        : (b.options ?? []).map(o => ({ text: o, score: '', subItems: [] }));
      const showStem = shouldShowQuestionStem(b) || !branches.length;
      if (showStem) {
        parts.push(`س${questionNumber}/ ${stripQuestionPrefix(b.text)}${scoreStr}`);
      }
      if (questionMode === 'branched') {
        branches.forEach((br, i) => {
          const brScoreStr = br.score ? ` (${br.score} درجة)` : '';
          const label = BRANCH_LABELS[i] ?? `${i + 1}`;
          const questionPrefix = showStem ? `${label}/ ` : `س${questionNumber}/${label}/ `;
          parts.push(
            `${questionPrefix}${stripBranchPrefix(br.text)}${brScoreStr}`,
          );
          getBranchSubItems(br).forEach((item, itemIndex) => {
            parts.push(`${itemIndex + 1}. ${item.text}`);
          });
        });
      }
      for (const p of b.pairs ?? []) {
        if (p[0] || p[1]) {
          parts.push(`${p[0]} — ${p[1]}`);
        }
      }
    } else if (b.type === 'list') {
      b.items.forEach((item, i) => {
        parts.push(`${b.ordered ? `${i + 1}.` : '•'} ${item}`);
      });
    }
  }
  return parts.filter(Boolean).join('\n');
}

/** مجموع درجات الأسئلة والفروع */
function computeTotalScore(doc: EditorDocument): number {
  let total = 0;
  for (const b of doc.blocks) {
    if (b.type !== 'question') continue;
    if (getQuestionMode(b) === 'direct') {
      total += parseFloat(b.score) || 0;
    } else {
      const branchTotal = b.branches.reduce(
        (sum, branch) => sum + (parseFloat(branch.score) || 0),
        0,
      );
      total += branchTotal || parseFloat(b.score) || 0;
    }
  }
  return total;
}

/** تعديل نص حقل داخل كتلة (لوحة الرموز) */
function applyField(
  block: EditorBlock,
  key: string,
  fn: (t: string) => string,
): EditorBlock | null {
  switch (block.type) {
    case 'paragraph':
    case 'heading':
    case 'answer':
    case 'formula':
      return key === FIELD_TEXT ? { ...block, text: fn(block.text) } : null;
    case 'question': {
      if (key === FIELD_TEXT) return { ...block, text: fn(block.text) };
      if (key === FIELD_SCORE) return { ...block, score: fn(block.score) };
      const idx = parseInt(key.split(':')[1] ?? '', 10);
      if (Number.isNaN(idx)) return null;
      if (key.startsWith('branch:')) {
        return {
          ...block,
          branches: block.branches.map((br, i) =>
            i === idx ? { ...br, text: fn(br.text) } : br,
          ),
        };
      }
      if (key.startsWith('branchScore:')) {
        return {
          ...block,
          branches: block.branches.map((br, i) =>
            i === idx ? { ...br, score: fn(br.score) } : br,
          ),
        };
      }
      if (key.startsWith('subItem:')) {
        const [, branchIndexValue, subItemIndexValue] = key.split(':');
        const branchIndex = parseInt(branchIndexValue ?? '', 10);
        const subItemIndex = parseInt(subItemIndexValue ?? '', 10);
        if (Number.isNaN(branchIndex) || Number.isNaN(subItemIndex)) return null;
        return {
          ...block,
          branches: block.branches.map((br, i) =>
            i === branchIndex
              ? {
                  ...br,
                  subItems: getBranchSubItems(br).map((item, j) =>
                    j === subItemIndex ? { ...item, text: fn(item.text) } : item,
                  ),
                }
              : br,
          ),
        };
      }
      if (key.startsWith('pairL:')) {
        const pairs = (block.pairs ?? []).map((p, i) =>
          i === idx ? ([fn(p[0]), p[1]] as [string, string]) : p,
        );
        return { ...block, pairs };
      }
      if (key.startsWith('pairR:')) {
        const pairs = (block.pairs ?? []).map((p, i) =>
          i === idx ? ([p[0], fn(p[1])] as [string, string]) : p,
        );
        return { ...block, pairs };
      }
      return null;
    }
    case 'list': {
      const idx = parseInt(key.split(':')[1] ?? '', 10);
      if (Number.isNaN(idx)) return null;
      return {
        ...block,
        items: block.items.map((it, i) => (i === idx ? fn(it) : it)),
      };
    }
    case 'table': {
      const parts = key.split(':').map(Number);
      const r = parts[1];
      const c = parts[2];
      if (
        r === undefined ||
        c === undefined ||
        Number.isNaN(r) ||
        Number.isNaN(c)
      )
        return null;
      if (r === 0) {
        const headers = block.headers.map((h, i) => (i === c ? fn(h) : h));
        return { ...block, headers };
      }
      const rows = block.rows.map((row, ri) =>
        ri === r - 1
          ? row.map((cell, ci) => (ci === c ? fn(cell) : cell))
          : row,
      );
      return { ...block, rows };
    }
    default:
      return null;
  }
}

export const RIBBON_TABS = [
  { key: 'file', label: 'ملف', icon: 'folder' },
  { key: 'home', label: 'الرئيسية', icon: 'edit' },
  { key: 'insert', label: 'إدراج', icon: 'add-circle-outline' },
  { key: 'layout', label: 'تخطيط', icon: 'aspect-ratio' },
  { key: 'print', label: 'إعدادات الطباعة', icon: 'tune' },
  { key: 'ai', label: 'ذكاء اصطناعي', icon: 'auto-awesome' },
  { key: 'view', label: 'عرض', icon: 'visibility' },
] as const;

export type RibbonTabKey = (typeof RIBBON_TABS)[number]['key'];

export function EditorScreen() {
  const { colors } = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<EditorStackParamList>>();
  const route = useRoute<RouteProp<EditorStackParamList, 'Editor'>>();
  const canGoBack = navigation.canGoBack();

  const [doc, setDoc] = useState<EditorDocument>(createEmptyDocument);
  const [preview, setPreview] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [headerOpen, setHeaderOpen] = useState(false);
  const [printPreviewOpen, setPrintPreviewOpen] = useState(false);
  const [printSettingsPanelOpen, setPrintSettingsPanelOpen] = useState(false);
  const [draftsOpen, setDraftsOpen] = useState(false);
  const [savedDrafts, setSavedDrafts] = useState<EditorDocument[]>([]);
  const [questionGenOpen, setQuestionGenOpen] = useState(false);
  const [symbolsOpen, setSymbolsOpen] = useState(false);
  const [proofreadOpen, setProofreadOpen] = useState(false);
  const [proofreadLoading, setProofreadLoading] = useState(false);
  const [proofreadIssues, setProofreadIssues] = useState<ProofreadIssue[]>([]);
  const [voiceHelpOpen, setVoiceHelpOpen] = useState(false);
  const [ribbonTab, setRibbonTab] = useState<RibbonTabKey>('home');
  const [listening, setListening] = useState(false);
  const [partialVoiceText, setPartialVoiceText] = useState('');
  const [voiceSessionCount, setVoiceSessionCount] = useState(0);
  const [voiceFeedback, setVoiceFeedback] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [questionPendingDeletion, setQuestionPendingDeletion] = useState<
    string | null
  >(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [busy, setBusy] = useState<'save' | 'print' | 'share' | 'ai' | null>(
    null,
  );

  // نبض الميكروفون التفاعلي أثناء الاستماع
  useEffect(() => {
    if (listening) {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 650,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.9,
            duration: 650,
            useNativeDriver: true,
          }),
        ]),
      );
      anim.start();
      return () => anim.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [listening, pulseAnim]);

  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const loadedRef = useRef(false);
  const docRef = useRef(doc);
  const pastRef = useRef<EditorDocument[]>([]);
  const futureRef = useRef<EditorDocument[]>([]);
  const applyingRef = useRef(false);
  const lastPushRef = useRef<{ at: number; doc: EditorDocument } | null>(null);
  const fieldFocusRef = useRef<FieldFocusInfo | null>(null);
  const editorScrollRef = useRef<React.ElementRef<typeof ScrollView>>(null);
  const blockOffsetsRef = useRef(new Map<string, number>());

  const scrollFocusedBlockIntoView = useCallback((blockId: string) => {
    const offset = blockOffsetsRef.current.get(blockId);
    if (offset === undefined) return;
    setTimeout(() => {
      editorScrollRef.current?.scrollTo({
        y: Math.max(0, offset - 16),
        animated: true,
      });
    }, 180);
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSubscription = Keyboard.addListener(showEvent, event => {
      setKeyboardHeight(event.endCoordinates.height);
      const focused = fieldFocusRef.current;
      if (focused) scrollFocusedBlockIntoView(focused.blockId);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [scrollFocusedBlockIntoView]);

  // تحميل المسودة المحفوظة عند الفتح
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    if (route.params?.fresh) {
      const fresh = createEmptyDocument();
      setDoc(fresh);
      docRef.current = fresh;
      return;
    }
    const saved = documentRepo.get('current');
    if (saved) {
      const normalized = normalizeEditorDocument(saved);
      setDoc(normalized);
      docRef.current = normalized;
    }
  }, [route.params?.fresh]);

  // حفظ تلقائي
  useEffect(() => {
    const t = setTimeout(() => {
      documentRepo.save({ ...doc, updatedAt: todayISO() });
    }, 800);
    return () => clearTimeout(t);
  }, [doc]);

  // تتبع أحدث مستند
  useEffect(() => {
    docRef.current = doc;
  }, [doc]);

  // سجل التراجع/الإعادة
  useEffect(() => {
    if (applyingRef.current) {
      applyingRef.current = false;
      return;
    }
    const now = Date.now();
    const last = lastPushRef.current;
    if (!last) {
      lastPushRef.current = { at: now, doc };
      return;
    }
    const structural =
      last.doc.blocks.length !== doc.blocks.length ||
      last.doc.blocks.some((b, i) => b.id !== doc.blocks[i]?.id);
    if (structural || now - last.at > 800) {
      pastRef.current = [...pastRef.current.slice(-49), last.doc];
      lastPushRef.current = { at: now, doc };
      setCanUndo(true);
      futureRef.current = [];
      setCanRedo(false);
    } else {
      lastPushRef.current = { at: now, doc };
    }
  }, [doc]);

  const undo = useCallback(() => {
    const prev = pastRef.current.pop();
    if (!prev) return;
    futureRef.current = [...futureRef.current.slice(-49), docRef.current];
    applyingRef.current = true;
    lastPushRef.current = null;
    setCanRedo(true);
    setCanUndo(pastRef.current.length > 0);
    setSelectedId(null);
    setDoc(prev);
  }, []);

  const redo = useCallback(() => {
    const next = futureRef.current.pop();
    if (!next) return;
    pastRef.current = [...pastRef.current.slice(-49), docRef.current];
    applyingRef.current = true;
    lastPushRef.current = null;
    setCanUndo(true);
    setCanRedo(futureRef.current.length > 0);
    setSelectedId(null);
    setDoc(next);
  }, []);

  const updateBlock = useCallback((updated: EditorBlock) => {
    setDoc(d => ({
      ...d,
      blocks: d.blocks.map(b => (b.id === updated.id ? updated : b)),
    }));
  }, []);

  const addBlock = useCallback(
    (type: EditorBlock['type']) => {
      const block = createBlock(type);
      setDoc(d => {
        const idx = d.blocks.findIndex(b => b.id === selectedId);
        const blocks = [...d.blocks];
        blocks.splice(idx >= 0 ? idx + 1 : blocks.length, 0, block);
        return { ...d, blocks };
      });
      setSelectedId(block.id);
    },
    [selectedId],
  );

  const addQuestionAfter = useCallback(
    (afterId: string | null, text = '') => {
      const block = createQuestion(text);
      setDoc(d => {
        const idx = d.blocks.findIndex(b => b.id === afterId);
        const blocks = [...d.blocks];
        blocks.splice(idx >= 0 ? idx + 1 : blocks.length, 0, block);
        return { ...d, blocks };
      });
      setSelectedId(block.id);
    },
    [],
  );

  const addQuestion = useCallback(
    (text = '') => addQuestionAfter(selectedId, text),
    [addQuestionAfter, selectedId],
  );

  const removeBlockById = useCallback((id: string) => {
    const idx = docRef.current.blocks.findIndex(b => b.id === id);
    if (idx < 0) return;
    setDoc(d => {
      const blocks = d.blocks.filter(b => b.id !== id);
      return { ...d, blocks: blocks.length ? blocks : [createParagraph('')] };
    });
    const remaining = docRef.current.blocks.filter(b => b.id !== id);
    const next = remaining[idx] ?? remaining[idx - 1] ?? null;
    setSelectedId(current => (current === id ? next?.id ?? null : current));
  }, []);

  const requestRemoveBlock = useCallback((id: string) => {
    const block = docRef.current.blocks.find(b => b.id === id);
    if (block?.type === 'question') {
      setQuestionPendingDeletion(id);
      return;
    }
    removeBlockById(id);
  }, [removeBlockById]);

  const removeBlock = useCallback(() => {
    if (selectedId) requestRemoveBlock(selectedId);
  }, [requestRemoveBlock, selectedId]);

  const confirmQuestionDeletion = useCallback(() => {
    if (questionPendingDeletion) removeBlockById(questionPendingDeletion);
    setQuestionPendingDeletion(null);
  }, [questionPendingDeletion, removeBlockById]);

  const questionNumbers = useMemo(() => {
    let count = 0;
    return new Map(
      doc.blocks
        .filter(block => block.type === 'question')
        .map(block => [block.id, ++count]),
    );
  }, [doc.blocks]);

  const duplicateBlock = useCallback(() => {
    if (!selectedId) return;
    setDoc(d => {
      const idx = d.blocks.findIndex(b => b.id === selectedId);
      if (idx < 0) return d;
      const copy = { ...d.blocks[idx]!, id: newId() } as EditorBlock;
      const blocks = [...d.blocks];
      blocks.splice(idx + 1, 0, copy);
      return { ...d, blocks };
    });
  }, [selectedId]);

  const moveBlock = useCallback(
    (dir: -1 | 1) => {
      setDoc(d => {
        const idx = d.blocks.findIndex(b => b.id === selectedId);
        if (idx < 0) return d;
        const target = idx + dir;
        if (target < 0 || target >= d.blocks.length) return d;
        const blocks = [...d.blocks];
        [blocks[idx], blocks[target]] = [blocks[target]!, blocks[idx]!];
        return { ...d, blocks };
      });
    },
    [selectedId],
  );

  const toggleStyle = (style: 'bold' | 'italic' | 'underline') => {
    if (!selectedId) return;
    setDoc(d => ({
      ...d,
      blocks: d.blocks.map(b => {
        if (b.id !== selectedId || b.type !== 'paragraph') return b;
        return { ...b, style: { ...b.style, [style]: !b.style?.[style] } };
      }),
    }));
  };

  const setAlign = (align: 'right' | 'center' | 'left') => {
    if (!selectedId) return;
    setDoc(d => ({
      ...d,
      blocks: d.blocks.map(b => {
        if (b.id !== selectedId) return b;
        if (b.type === 'paragraph' || b.type === 'heading')
          return { ...b, align };
        return b;
      }),
    }));
  };

  const setHeading = (level: 1 | 2 | 3) => {
    if (!selectedId) return;
    setDoc(d => ({
      ...d,
      blocks: d.blocks.map(b => {
        if (b.id !== selectedId) return b;
        if (b.type === 'heading') return { ...b, level };
        if (b.type === 'paragraph')
          return { id: b.id, type: 'heading', level, text: b.text };
        return b;
      }),
    }));
  };

  const handleFormatAI = async () => {
    const raw = documentToText(doc).trim();
    if (!raw) {
      showError(strings.editor.emptyContent);
      return;
    }
    setBusy('ai');
    try {
      const ai = getAIService();
      const blocks = compactSmartFormatBlocks(
        await ai.formatExamToBlocks(raw),
      );
      if (!blocks.length) throw new Error('empty');
      setDoc(d => ({ ...d, blocks }));
      showSuccess(strings.editor.formatAISuccess);
    } catch (aiError) {
      const locallyParsed = parseExamText(raw);
      if (locallyParsed) {
        setDoc(current => ({
          ...current,
          title: locallyParsed.title || current.title,
          header: locallyParsed.replaceHeader
            ? {
                ...current.header,
                schoolName: '',
                grade: '',
                examTitle: '',
                academicYear: '',
                duration: '',
                date: '',
                teacherName: '',
                round: '',
                track: '',
                showBismillah: false,
                closingNote: '',
                ...locallyParsed.header,
              }
            : current.header,
          blocks: compactSmartFormatBlocks(locallyParsed.blocks),
        }));
        showInfo(strings.editor.formatLocalFallback);
      } else {
        showError(strings.editor.formatError.replace('{error}', String(aiError)));
      }
    } finally {
      setBusy(null);
    }
  };

  const handleProofreadAI = async () => {
    const raw = documentToText(doc).trim();
    if (!raw) {
      showError(strings.editor.emptyContent);
      return;
    }
    setProofreadOpen(true);
    setProofreadLoading(true);
    try {
      const ai = getAIService();
      const issues = await ai.proofreadExam(raw, doc.blocks);
      setProofreadIssues(issues);
    } catch (e) {
      showError(`تعذر التدقيق: ${String(e)}`);
    } finally {
      setProofreadLoading(false);
    }
  };

  const handleBlankDoc = () => {
    setDoc(createEmptyDocument());
    showSuccess('تم فتح ورقة فارغة جديدة');
  };

  const handleApplyProofread = (selectedIssues: ProofreadIssue[]) => {
    if (!selectedIssues.length) return;
    setDoc(currentDoc => applyIssuesToDocument(currentDoc, selectedIssues));
    showSuccess(`تم تطبيق ${selectedIssues.length} تعديل بنجاح`);
  };

  const openDrafts = () => {
    setSavedDrafts(listNamedDrafts(documentRepo.list()));
    setDraftsOpen(true);
  };

  const handleSaveDraft = (title: string) => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      showError(strings.editor.draftNameRequired);
      return;
    }
    const updatedAt = todayISO();
    const current = {
      ...docRef.current,
      title: trimmedTitle,
      updatedAt,
    };
    const draft = createNamedDraft(current, trimmedTitle, newId(), updatedAt);
    documentRepo.save(current);
    documentRepo.save(draft);
    docRef.current = current;
    setDoc(current);
    setSavedDrafts(listNamedDrafts(documentRepo.list()));
    showSuccess(strings.editor.savedDraft);
  };

  const handleRestoreDraft = (draft: EditorDocument) => {
    const restored = normalizeEditorDocument(
      restoreNamedDraft(draft, todayISO()),
    );
    documentRepo.save(restored);
    docRef.current = restored;
    pastRef.current = [];
    futureRef.current = [];
    lastPushRef.current = null;
    applyingRef.current = true;
    fieldFocusRef.current = null;
    setCanUndo(false);
    setCanRedo(false);
    setSelectedId(null);
    setSymbolsOpen(false);
    setDoc(restored);
    setDraftsOpen(false);
    showSuccess(strings.editor.draftLoaded);
  };

  const openPrintPreview = () => {
    setPrintSettingsPanelOpen(false);
    setPrintPreviewOpen(true);
  };

  const openPrintSettings = () => {
    setPrintSettingsPanelOpen(true);
    setPrintPreviewOpen(true);
  };

  const handleChangePrintSettings = useCallback(
    (patch: Partial<PrintSettings>) => {
      setDoc(current => {
        const changedKeys = Object.keys(patch);
        const isOnlyAutoFit =
          changedKeys.length === 1 && changedKeys[0] === 'autoFit';

        if (isOnlyAutoFit && patch.autoFit) {
          const next = {
            ...current,
            printSettings: { ...current.printSettings, autoFit: true },
          };
          const fit = suggestAutoFit(next);
          return {
            ...next,
            printSettings: { ...fit.settings, autoFit: true },
          };
        }

        const isManualChange = changedKeys.some(key => key !== 'autoFit');
        return {
          ...current,
          printSettings: {
            ...current.printSettings,
            ...patch,
            autoFit: isManualChange
              ? false
              : (patch.autoFit ?? current.printSettings.autoFit),
          },
        };
      });
    },
    [],
  );

  const handleResetPrintSettings = useCallback(() => {
    setDoc(current => ({
      ...current,
      printSettings: { ...DEFAULT_PRINT_SETTINGS },
    }));
  }, []);

  const handleSavePdf = async () => {
    setBusy('save');
    try {
      const result = await generateExamPdfToDownloads(doc);
      showSuccess(
        result.savedToDownloads
          ? strings.editor.savedPdfDownloads
          : strings.editor.savedPdf,
      );
    } catch {
      showError(strings.editor.saveError);
    } finally {
      setBusy(null);
    }
  };

  const handlePrint = async () => {
    setBusy('print');
    try {
      const path = await generateExamPdf(doc);
      await printPdf(path);
    } catch {
      showError(strings.editor.printError);
    } finally {
      setBusy(null);
    }
  };

  const handleSharePdf = async () => {
    setBusy('share');
    try {
      const path = await generateExamPdf(doc);
      await sharePdf(path, strings.editor.shareSubject);
    } catch {
      showError(strings.editor.sharePdfError);
    } finally {
      setBusy(null);
    }
  };

  const handleShare = async () => {
    const text = documentToText(doc).trim();
    if (!text) {
      showError(strings.editor.noContent);
      return;
    }
    setBusy('share');
    try {
      await shareText(text);
    } finally {
      setBusy(null);
    }
  };

  /* ------------------- لوحة الرموز والكتابة ------------------- */

  const handleFieldFocus = useCallback((info: FieldFocusInfo) => {
    fieldFocusRef.current = info;
    setSelectedId(info.blockId);
    scrollFocusedBlockIntoView(info.blockId);
  }, [scrollFocusedBlockIntoView]);

  const insertTextAtCursor = useCallback(
    (text: string, separateWord = false) => {
      const f = fieldFocusRef.current;
      if (!f) return;
      setDoc(d => {
        const block = d.blocks.find(b => b.id === f.blockId);
        if (!block) return d;
        let nextPos = f.start;
        const fn = (current: string): string => {
          const hasSelection = f.start >= 0 && f.start <= current.length;
          const start = hasSelection ? f.start : current.length;
          const end = hasSelection
            ? Math.max(start, Math.min(f.end, current.length))
            : current.length;
          const prefix =
            separateWord &&
            start === end &&
            start > 0 &&
            !/\s$/.test(current.slice(0, start))
              ? ' '
              : '';
          const insertion = prefix + text;
          nextPos = start + insertion.length;
          return current.slice(0, start) + insertion + current.slice(end);
        };
        const updated = applyField(block, f.key, fn);
        if (!updated) return d;
        fieldFocusRef.current = {
          ...f,
          start: nextPos,
          end: nextPos,
        };
        return {
          ...d,
          blocks: d.blocks.map(b => (b.id === updated.id ? updated : b)),
        };
      });
    },
    [],
  );

  const insertSymbol = useCallback(
    (sym: string) => insertTextAtCursor(sym),
    [insertTextAtCursor],
  );

  /* ------------------- الكتابة بالصوت والإملاء المستمر ------------------- */

  const insertVoiceText = useCallback(
    (text: string) => {
      const spoken = text.trim();
      if (!spoken) return;

      const focused = fieldFocusRef.current;
      if (
        focused &&
        docRef.current.blocks.some(b => b.id === focused.blockId)
      ) {
        insertTextAtCursor(spoken, true);
        return;
      }

      setDoc(d => {
        const selected = d.blocks.find(b => b.id === selectedId);
        const target =
          selected &&
          (selected.type === 'paragraph' ||
            selected.type === 'heading' ||
            selected.type === 'answer' ||
            selected.type === 'formula' ||
            selected.type === 'question')
            ? selected
            : d.blocks.find(b => b.type === 'paragraph');
        if (target) {
          const updated = applyField(target, FIELD_TEXT, current =>
            current && !/\s$/.test(current)
              ? `${current} ${spoken}`
              : `${current}${spoken}`,
          );
          if (updated) {
            fieldFocusRef.current = {
              blockId: target.id,
              key: FIELD_TEXT,
              start: -1,
              end: -1,
            };
            return {
              ...d,
              blocks: d.blocks.map(b => (b.id === updated.id ? updated : b)),
            };
          }
        }
        const newParagraph = createParagraph(spoken);
        fieldFocusRef.current = {
          blockId: newParagraph.id,
          key: FIELD_TEXT,
          start: -1,
          end: -1,
        };
        return { ...d, blocks: [...d.blocks, newParagraph] };
      });
    },
    [insertTextAtCursor, selectedId],
  );

  /** تنفيذ الأوامر الصوتية الذكية لمحرر الامتحانات */
  const executeVoiceCommand = useCallback(
    (rawSpokenText: string) => {
      const parsed = processVoiceInput(rawSpokenText);

      if (parsed.feedbackLabel) {
        setVoiceFeedback(parsed.feedbackLabel);
        setTimeout(() => setVoiceFeedback(''), 2500);
      }

      switch (parsed.type) {
        case 'undo':
          undo();
          break;

        case 'delete_current':
          removeBlock();
          break;

        case 'new_divider':
          addBlock('divider');
          break;

        case 'new_line':
          insertTextAtCursor('\n');
          break;

        case 'new_paragraph': {
          const p = createParagraph(parsed.payloadText || '');
          setDoc(d => {
            const idx = d.blocks.findIndex(b => b.id === selectedId);
            const blocks = [...d.blocks];
            blocks.splice(idx >= 0 ? idx + 1 : blocks.length, 0, p);
            return { ...d, blocks };
          });
          setSelectedId(p.id);
          fieldFocusRef.current = {
            blockId: p.id,
            key: FIELD_TEXT,
            start: -1,
            end: -1,
          };
          break;
        }

        case 'new_question': {
          const qBlock = createQuestion(parsed.payloadText || '');
          setDoc(d => {
            const idx = d.blocks.findIndex(b => b.id === selectedId);
            const blocks = [...d.blocks];
            blocks.splice(idx >= 0 ? idx + 1 : blocks.length, 0, qBlock);
            return { ...d, blocks };
          });
          setSelectedId(qBlock.id);
          fieldFocusRef.current = {
            blockId: qBlock.id,
            key: FIELD_TEXT,
            start: -1,
            end: -1,
          };
          break;
        }

        case 'select_branch': {
          const bIdx = parsed.branchIndex ?? 0;
          setDoc(d => {
            const target =
              d.blocks.find(b => b.id === selectedId && b.type === 'question') ??
              [...d.blocks].reverse().find(b => b.type === 'question');

            if (!target || target.type !== 'question') {
              const newQ = createQuestion('generic');
              newQ.questionMode = 'branched';
              while (newQ.branches.length <= bIdx) {
                newQ.branches.push({ text: '', score: '', subItems: [] });
              }
              if (parsed.payloadText) {
                newQ.branches[bIdx] = {
                  text: parsed.payloadText,
                  score: '',
                  subItems: [],
                };
              }
              fieldFocusRef.current = {
                blockId: newQ.id,
                key: `branch:${bIdx}`,
                start: -1,
                end: -1,
              };
              setSelectedId(newQ.id);
              return { ...d, blocks: [...d.blocks, newQ] };
            }

            const branches = [...target.branches];
            while (branches.length <= bIdx) {
              branches.push({ text: '', score: '', subItems: [] });
            }
            if (parsed.payloadText) {
              const existing = branches[bIdx]?.text ?? '';
              branches[bIdx] = {
                  text: existing ? `${existing} ${parsed.payloadText}` : parsed.payloadText,
                  score: branches[bIdx]?.score ?? '',
                  subItems: getBranchSubItems(branches[bIdx]!),
                };
            }
            const updated: EditorBlock = {
              ...target,
              questionMode: 'branched',
              score: '',
              branches,
            };
            fieldFocusRef.current = {
              blockId: target.id,
              key: `branch:${bIdx}`,
              start: -1,
              end: -1,
            };
            setSelectedId(target.id);
            return {
              ...d,
              blocks: d.blocks.map(b => (b.id === target.id ? updated : b)),
            };
          });
          break;
        }

        case 'text_only':
        default:
          insertVoiceText(parsed.payloadText);
          break;
      }

      setVoiceSessionCount(prev => prev + 1);
    },
    [selectedId, undo, removeBlock, addBlock, insertTextAtCursor, insertVoiceText],
  );

  const handleVoiceToggle = useCallback(async () => {
    if (listening) {
      await stopDictation();
      setListening(false);
      setPartialVoiceText('');
      return;
    }
    setPartialVoiceText('');
    setVoiceSessionCount(0);
    setVoiceFeedback('');

    await startDictation({
      onResult: text => {
        setPartialVoiceText('');
        executeVoiceCommand(text);
      },
      onPartialResult: interim => {
        setPartialVoiceText(interim);
      },
      onStart: () => setListening(true),
      onEnd: () => {
        setListening(false);
        setPartialVoiceText('');
      },
      onError: msg => {
        setListening(false);
        setPartialVoiceText('');
        showError(msg);
        if (
          msg.includes('Google') ||
          msg.includes('تفعيل') ||
          msg.includes('خدمة') ||
          msg.includes('ميكروفون') ||
          msg.includes('إذن') ||
          msg.includes('غير مفعّلة') ||
          msg.includes('غير متاح')
        ) {
          setVoiceHelpOpen(true);
        }
      },
    });
  }, [listening, executeVoiceCommand]);

  useEffect(() => {
    return () => {
      stopDictation().catch(() => {});
    };
  }, []);

  const totalScore = useMemo(() => computeTotalScore(doc), [doc]);

  return (
    <AppScreen edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'android' ? 'height' : undefined}
        style={styles.keyboardAvoider}
      >
      <View
        style={[
          styles.ribbon,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
      >
        {canGoBack ? (
          <View style={styles.editorTopBar}>
            <PressableScale
              onPress={() => navigation.goBack()}
              animated={false}
              style={styles.backBtn}
            >
              <Icon name="chevron-right" size={22} color={colors.primary} />
              <Text style={[styles.backLabel, { color: colors.primary }]}>
                {strings.editor.examHomeTitle}
              </Text>
            </PressableScale>
          </View>
        ) : null}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.ribbonTabs}
        >
          {RIBBON_TABS.map(t => (
            <PressableScale
              key={t.key}
              onPress={() => {
                setRibbonTab(t.key);
                if (preview && t.key !== 'view') setPreview(false);
              }}
              animated={false}
              style={[
                styles.ribbonTab,
                {
                  borderBottomColor:
                    ribbonTab === t.key ? colors.primary : 'transparent',
                },
              ]}
            >
              <Icon
                name={t.icon}
                size={14}
                color={
                  ribbonTab === t.key ? colors.primary : colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.ribbonTabLabel,
                  {
                    color:
                      ribbonTab === t.key
                        ? colors.primary
                        : colors.textSecondary,
                  },
                ]}
              >
                {t.label}
              </Text>
            </PressableScale>
          ))}
        </ScrollView>

        {/* محتويات التبويب النشط */}
        {ribbonTab === 'file' ? (
          <FileTools
            busy={busy}
            onBlankDoc={handleBlankDoc}
            onSavePdf={handleSavePdf}
            onPrint={handlePrint}
            onPreview={openPrintPreview}
            onShare={handleShare}
            onSharePdf={handleSharePdf}
            onOpenDrafts={openDrafts}
          />
        ) : ribbonTab === 'home' ? (
          <HomeTools
            selectedId={selectedId}
            doc={doc}
            listening={listening}
            onToggleVoice={handleVoiceToggle}
            onStyle={toggleStyle}
            onAlign={setAlign}
            onHeading={setHeading}
            onDelete={removeBlock}
            onMove={moveBlock}
            onDuplicate={duplicateBlock}
            onUndo={undo}
            onRedo={redo}
            canUndo={canUndo}
            canRedo={canRedo}
          />
        ) : ribbonTab === 'insert' ? (
          <InsertTools
            symbolsActive={symbolsOpen}
            listening={listening}
            onToggleVoice={handleVoiceToggle}
            onOpenVoiceHelp={() => setVoiceHelpOpen(true)}
            onSymbols={() => setSymbolsOpen(o => !o)}
            onAddQuestion={addQuestion}
            onAddBlock={addBlock}
          />
        ) : ribbonTab === 'layout' ? (
          <LayoutTools
            totalScore={totalScore}
            onHeader={() => setHeaderOpen(true)}
          />
        ) : ribbonTab === 'print' ? (
          <PrintTools
            onOpenSettings={openPrintSettings}
            onOpenPreview={openPrintPreview}
          />
        ) : ribbonTab === 'ai' ? (
          <AITools
            aiBusy={busy === 'ai'}
            listening={listening}
            onSmartQuestions={() => setQuestionGenOpen(true)}
            onFormatAI={handleFormatAI}
            onProofreadAI={handleProofreadAI}
            onToggleVoice={handleVoiceToggle}
            onOpenVoiceHelp={() => setVoiceHelpOpen(true)}
          />
        ) : (
          <ViewTools
            preview={preview}
            onTogglePreview={() => setPreview(p => !p)}
            onPrintPreview={openPrintPreview}
          />
        )}
      </View>

      {/* الورقة المتصلة */}
      <ScrollView
        ref={editorScrollRef}
        style={styles.editorScroll}
        contentContainerStyle={[
          styles.editorScrollContent,
          { paddingBottom: Math.max(64, keyboardHeight + 24) },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        onTouchStart={() => setSymbolsOpen(false)}
      >
        <View
          style={[
            styles.paper,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {/* ترويسة الامتحان التفاعلية في أعلى الورقة */}
          <PressableScale
            onPress={() => setHeaderOpen(true)}
            animated={false}
            style={[
              styles.headerBanner,
              {
                borderColor: colors.border,
                backgroundColor: colors.surfaceElevated,
              },
            ]}
          >
            {doc.header.showBismillah ? (
              <Text
                style={[
                  styles.headerBannerBismillah,
                  { color: colors.textPrimary },
                ]}
              >
                بسم الله الرحمن الرحيم
              </Text>
            ) : null}
            <View style={styles.headerBannerCols}>
              <View style={styles.headerBannerColRight}>
                <Text
                  style={[
                    styles.headerBannerMinistry,
                    { color: colors.textSecondary },
                  ]}
                >
                  جمهورية العراق — وزارة التربية
                </Text>
                <Text
                  style={[
                    styles.headerBannerSchool,
                    {
                      color: doc.header.schoolName
                        ? colors.textPrimary
                        : colors.textSecondary,
                    },
                  ]}
                >
                  {doc.header.schoolName || 'اسم المدرسة (انقر للتحديد)'}
                </Text>
                {doc.header.grade ? (
                  <Text
                    style={[
                      styles.headerBannerInfo,
                      { color: colors.textSecondary },
                    ]}
                  >
                    الصف: {doc.header.grade}{' '}
                    {shouldShowHeaderTrack(doc.header.grade, doc.header.track)
                      ? `(${doc.header.track})`
                      : ''}
                  </Text>
                ) : null}
              </View>

              <View style={styles.headerBannerColCenter}>
                <Text
                  style={[
                    styles.headerBannerTitle,
                    { color: colors.primary },
                  ]}
                >
                  {doc.header.examTitle || 'عنوان الامتحان'}
                </Text>
                {doc.header.academicYear ? (
                  <Text
                    style={[
                      styles.headerBannerYear,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {doc.header.academicYear}{' '}
                    {shouldShowRoundInSubtitle(
                      doc.header.examTitle,
                      doc.header.round,
                    )
                      ? `(الدور ${doc.header.round})`
                      : ''}
                  </Text>
                ) : null}
              </View>

              <View style={styles.headerBannerColLeft}>
                {doc.header.subject ? (
                  <Text
                    style={[
                      styles.headerBannerInfo,
                      { color: colors.textPrimary },
                    ]}
                  >
                    المادة: {doc.header.subject}
                  </Text>
                ) : null}
                {doc.header.duration ? (
                  <Text
                    style={[
                      styles.headerBannerInfo,
                      { color: colors.textSecondary },
                    ]}
                  >
                    الزمن: {doc.header.duration}
                  </Text>
                ) : null}
                {isCompleteHeaderDate(doc.header.date) ? (
                  <Text
                    style={[
                      styles.headerBannerInfo,
                      { color: colors.textSecondary },
                    ]}
                  >
                    التاريخ: {doc.header.date}
                  </Text>
                ) : null}
              </View>
            </View>
            <View style={styles.headerBannerFooter}>
              <Icon name="edit" size={12} color={colors.primary} />
              <Text
                style={[styles.headerBannerHint, { color: colors.primary }]}
              >
                انقر هنا لتعديل بيانات الترويسة والمدرسة
              </Text>
            </View>
          </PressableScale>

          {doc.blocks.map(item => (
            <BlockView
              key={item.id}
              block={item}
              preview={preview}
              fontFamily={doc.printSettings.fontFamily}
              selected={item.id === selectedId}
              fullPage={doc.blocks.length === 1 && item.type === 'paragraph'}
              questionNumber={questionNumbers.get(item.id)}
              onSelect={() => setSelectedId(item.id)}
              onChange={updateBlock}
              onAddQuestionAfter={() => addQuestionAfter(item.id)}
              onRequestDeleteQuestion={() => requestRemoveBlock(item.id)}
              onFieldFocus={handleFieldFocus}
              onLayout={event =>
                blockOffsetsRef.current.set(item.id, event.nativeEvent.layout.y)
              }
            />
          ))}
        </View>
      </ScrollView>

      {/* لوحة الرموز العلمية */}
      {!preview ? (
        <SymbolPalette visible={symbolsOpen} onInsert={insertSymbol} />
      ) : null}

      {!preview && !listening ? (
        <PressableScale
          animated={false}
          onPress={() => {
            setSymbolsOpen(false);
            addQuestion();
          }}
          style={[
            styles.quickAddQuestion,
            {
              backgroundColor: colors.primary,
              bottom: symbolsOpen ? 60 : 18,
              shadowColor: '#000',
            },
          ]}
        >
          <Icon name="add-circle" size={17} color="#FFF" />
          <Text style={styles.quickAddQuestionText}>سؤال</Text>
        </PressableScale>
      ) : null}

      {/* حوارات المحرر */}
      <ExamHeaderDialog
        visible={headerOpen}
        current={doc.header}
        onClose={() => setHeaderOpen(false)}
        onSave={header => setDoc(d => ({ ...d, header }))}
      />
      <DraftsDialog
        visible={draftsOpen}
        document={doc}
        drafts={savedDrafts}
        onClose={() => setDraftsOpen(false)}
        onSave={handleSaveDraft}
        onRestore={handleRestoreDraft}
      />
      <PrintPreviewDialog
        visible={printPreviewOpen}
        doc={doc}
        onClose={() => {
          setPrintPreviewOpen(false);
          setPrintSettingsPanelOpen(false);
        }}
        onConfirmPrint={() => {
          setPrintPreviewOpen(false);
          setPrintSettingsPanelOpen(false);
          handlePrint();
        }}
        settingsOpen={printSettingsPanelOpen}
        onSettingsOpenChange={setPrintSettingsPanelOpen}
        onChangeSettings={handleChangePrintSettings}
        onResetSettings={handleResetPrintSettings}
      />
      <QuestionGenerationDialog
        visible={questionGenOpen}
        initialSubjectId={doc.header.subjectId}
        onClose={() => setQuestionGenOpen(false)}
        onQuestionsGenerated={questions => {
          const blocks = questions.flatMap(questionToBlocks);
          setDoc(d => ({ ...d, blocks: [...d.blocks, ...blocks] }));
        }}
      />
      <ProofreadDialog
        visible={proofreadOpen}
        loading={proofreadLoading}
        issues={proofreadIssues}
        onClose={() => setProofreadOpen(false)}
        onApply={handleApplyProofread}
        onRecheck={handleProofreadAI}
      />
      <VoiceHelpDialog
        visible={voiceHelpOpen}
        onClose={() => setVoiceHelpOpen(false)}
        onRetry={handleVoiceToggle}
      />
      <Dialog
        visible={questionPendingDeletion !== null}
        title="حذف السؤال"
        onClose={() => setQuestionPendingDeletion(null)}
        scrollable={false}
        actions={
          <>
            <Button
              label="إلغاء"
              variant="outline"
              onPress={() => setQuestionPendingDeletion(null)}
            />
            <Button
              label="حذف السؤال"
              variant="danger"
              onPress={confirmQuestionDeletion}
            />
          </>
        }
      >
        <Text style={[styles.deleteQuestionDialogText, { color: colors.textSecondary }]}>
          سيُحذف السؤال بكل فروعه ونقاطه الفرعية نهائياً. هل تريد المتابعة؟
        </Text>
      </Dialog>

      {/* شريط الإملاء الصوتي الحي والمستمر */}
      {listening ? (
        <View
          style={[
            styles.voiceFloatingBar,
            {
              backgroundColor: colors.surfaceElevated,
              borderColor: colors.primary,
              shadowColor: '#000',
            },
          ]}
        >
          {/* الصف العلوي: الحالة، النبض، عدد الجمل، وزر الإيقاف */}
          <View style={styles.voiceTopRow}>
            <View style={styles.voiceStatusContainer}>
              <Animated.View
                style={[
                  styles.voicePulseDot,
                  {
                    backgroundColor: colors.primary,
                    transform: [{ scale: pulseAnim }],
                    opacity: pulseAnim,
                  },
                ]}
              />
              <Icon name="mic" size={22} color={colors.primary} />
              <View style={styles.voiceTextContainer}>
                <View style={styles.voiceTitleRow}>
                  <Text style={[styles.voiceStatusTitle, { color: colors.textPrimary }]}>
                    إملاء مستمر نشط
                  </Text>
                  {voiceSessionCount > 0 ? (
                    <View style={[styles.voiceCountBadge, { backgroundColor: `${colors.primary}20` }]}>
                      <Text style={[styles.voiceCountBadgeText, { color: colors.primary }]}>
                        {voiceSessionCount} {voiceSessionCount === 1 ? 'إدخال' : 'إدخالات'}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text
                  style={[
                    styles.voiceStatusSub,
                    {
                      color: partialVoiceText
                        ? colors.primary
                        : voiceFeedback
                        ? colors.success
                        : colors.textSecondary,
                      fontWeight: partialVoiceText || voiceFeedback ? '700' : '400',
                    },
                  ]}
                  numberOfLines={1}
                >
                  {partialVoiceText
                    ? `«${partialVoiceText}...»`
                    : voiceFeedback || 'تحدث بحرية.. قل "سؤال جديد" أو "فرع ب" أو أملِ الأسئلة'}
                </Text>
              </View>
            </View>

            <PressableScale
              onPress={handleVoiceToggle}
              style={[styles.voiceStopBtn, { backgroundColor: '#EF4444' }]}
            >
              <Icon name="stop" size={16} color="#FFF" />
              <Text style={styles.voiceStopBtnText}>إيقاف</Text>
            </PressableScale>
          </View>

          {/* شريط الأوامر السريعة باللمس أثناء الإملاء */}
          <View style={[styles.voiceQuickRow, { borderTopColor: `${colors.border}80` }]}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.voiceQuickChips}
            >
              <PressableScale
                style={[
                  styles.voiceQuickChip,
                  { backgroundColor: `${colors.primary}15`, borderColor: `${colors.primary}40` },
                ]}
                onPress={() => executeVoiceCommand('سؤال جديد')}
              >
                <Icon name="add-circle" size={13} color={colors.primary} />
                <Text style={[styles.voiceQuickChipText, { color: colors.primary }]}>+ سؤال</Text>
              </PressableScale>

              <PressableScale
                style={[styles.voiceQuickChip, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => executeVoiceCommand('فرع ب')}
              >
                <Icon name="subdirectory-arrow-right" size={13} color={colors.textPrimary} />
                <Text style={[styles.voiceQuickChipText, { color: colors.textPrimary }]}>+ فرع</Text>
              </PressableScale>

              <PressableScale
                style={[styles.voiceQuickChip, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => insertTextAtCursor('؟ ')}
              >
                <Text style={[styles.voiceQuickChipText, { color: colors.textPrimary, fontWeight: '700' }]}>؟</Text>
              </PressableScale>

              <PressableScale
                style={[styles.voiceQuickChip, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => insertTextAtCursor('، ')}
              >
                <Text style={[styles.voiceQuickChipText, { color: colors.textPrimary, fontWeight: '700' }]}>،</Text>
              </PressableScale>

              <PressableScale
                style={[styles.voiceQuickChip, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => insertTextAtCursor('. ')}
              >
                <Text style={[styles.voiceQuickChipText, { color: colors.textPrimary, fontWeight: '700' }]}>.</Text>
              </PressableScale>

              <PressableScale
                style={[styles.voiceQuickChip, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => insertTextAtCursor('\n')}
              >
                <Icon name="keyboard-return" size={13} color={colors.textPrimary} />
                <Text style={[styles.voiceQuickChipText, { color: colors.textPrimary }]}>سطر ↵</Text>
              </PressableScale>
            </ScrollView>
          </View>
        </View>
      ) : null}
      </KeyboardAvoidingView>
    </AppScreen>
  );
}

/* ------------------------------------------------------------------ */
/* أشرطة الأدوات لكل تبويب                                             */
/* ------------------------------------------------------------------ */

/** 1. أدوات ملف */
function FileTools({
  busy,
  onBlankDoc,
  onSavePdf,
  onPrint,
  onPreview,
  onShare,
  onSharePdf,
  onOpenDrafts,
}: {
  busy: 'save' | 'print' | 'share' | 'ai' | null;
  onBlankDoc: () => void;
  onSavePdf: () => void;
  onPrint: () => void;
  onPreview: () => void;
  onShare: () => void;
  onSharePdf: () => void;
  onOpenDrafts: () => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.toolsRow}
    >
      <RibbonChip icon="note-add" label="ورقة فارغة" onPress={onBlankDoc} />
      <RibbonChip
        icon="save"
        label={strings.editor.saveDraft}
        onPress={onOpenDrafts}
      />
      <ToolDivider />
      <RibbonChip
        icon="picture-as-pdf"
        label="حفظ كـ PDF"
        onPress={onSavePdf}
        loading={busy === 'save'}
      />
      <RibbonChip
        icon="share"
        label={strings.editor.sharePdf}
        onPress={onSharePdf}
        loading={busy === 'share'}
      />
      <RibbonChip
        icon="print"
        label="طباعة"
        onPress={onPrint}
        loading={busy === 'print'}
      />
      <RibbonChip icon="preview" label="معاينة الطباعة" onPress={onPreview} />
      <RibbonChip
        icon="short-text"
        label="مشاركة"
        onPress={onShare}
      />
    </ScrollView>
  );
}

/** 2. أدوات الرئيسية */
function HomeTools({
  selectedId,
  doc,
  listening,
  onToggleVoice,
  onStyle,
  onAlign,
  onHeading,
  onDelete,
  onMove,
  onDuplicate,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: {
  selectedId: string | null;
  doc: EditorDocument;
  listening?: boolean;
  onToggleVoice?: () => void;
  onStyle: (s: 'bold' | 'italic' | 'underline') => void;
  onAlign: (a: 'right' | 'center' | 'left') => void;
  onHeading: (l: 1 | 2 | 3) => void;
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
  onDuplicate: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}) {
  const selected = doc.blocks.find(b => b.id === selectedId);
  const isParagraph = selected?.type === 'paragraph';
  const hasSel = !!selectedId;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.toolsRow}
    >
      <ToolBtn icon="undo" onPress={onUndo} disabled={!canUndo} />
      <ToolBtn icon="redo" onPress={onRedo} disabled={!canRedo} />
      <ToolDivider />
      {onToggleVoice ? (
        <>
          <ToolBtn
            icon="mic"
            onPress={onToggleVoice}
            active={!!listening}
          />
          <ToolDivider />
        </>
      ) : null}
      <ToolBtn
        icon="format-bold"
        onPress={() => onStyle('bold')}
        active={isParagraph && selected?.style?.bold}
        disabled={!isParagraph}
      />
      <ToolBtn
        icon="format-italic"
        onPress={() => onStyle('italic')}
        active={isParagraph && selected?.style?.italic}
        disabled={!isParagraph}
      />
      <ToolBtn
        icon="format-underlined"
        onPress={() => onStyle('underline')}
        active={isParagraph && selected?.style?.underline}
        disabled={!isParagraph}
      />
      <ToolDivider />
      <ToolBtn
        icon="looks-one"
        onPress={() => onHeading(1)}
        disabled={!hasSel}
      />
      <ToolBtn
        icon="looks-two"
        onPress={() => onHeading(2)}
        disabled={!hasSel}
      />
      <ToolBtn icon="looks-3" onPress={() => onHeading(3)} disabled={!hasSel} />
      <ToolDivider />
      <ToolBtn
        icon="format-align-right"
        onPress={() => onAlign('right')}
        disabled={!hasSel}
      />
      <ToolBtn
        icon="format-align-center"
        onPress={() => onAlign('center')}
        disabled={!hasSel}
      />
      <ToolBtn
        icon="format-align-left"
        onPress={() => onAlign('left')}
        disabled={!hasSel}
      />
      <ToolDivider />
      <ToolBtn
        icon="arrow-upward"
        onPress={() => onMove(-1)}
        disabled={!hasSel}
      />
      <ToolBtn
        icon="arrow-downward"
        onPress={() => onMove(1)}
        disabled={!hasSel}
      />
      <ToolBtn icon="content-copy" onPress={onDuplicate} disabled={!hasSel} />
      <ToolBtn icon="delete-outline" onPress={onDelete} disabled={!hasSel} />
    </ScrollView>
  );
}

function InsertTools({
  symbolsActive,
  listening,
  onToggleVoice,
  onOpenVoiceHelp,
  onSymbols,
  onAddQuestion,
  onAddBlock,
}: {
  symbolsActive: boolean;
  listening?: boolean;
  onToggleVoice?: () => void;
  onOpenVoiceHelp?: () => void;
  onSymbols: () => void;
  onAddQuestion: () => void;
  onAddBlock: (
    type:
      | 'paragraph'
      | 'heading'
      | 'formula'
      | 'answer'
      | 'list'
      | 'table'
      | 'divider',
  ) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.toolsRow}
    >
      {onToggleVoice ? (
        <RibbonChip
          icon="mic"
          label={listening ? 'إيقاف الصوت' : 'كتابة بالصوت'}
          active={!!listening}
          onPress={onToggleVoice}
        />
      ) : null}
      {onOpenVoiceHelp ? (
        <RibbonChip
          icon="help-outline"
          label="دليل الصوت"
          onPress={onOpenVoiceHelp}
        />
      ) : null}
      <RibbonChip
        icon="help-outline"
        label="سؤال"
        primary
        onPress={onAddQuestion}
      />
      <ToolDivider />
      <RibbonChip
        icon="notes"
        label="فقرة"
        onPress={() => onAddBlock('paragraph')}
      />
      <RibbonChip
        icon="title"
        label="عنوان"
        onPress={() => onAddBlock('heading')}
      />
      <RibbonChip
        icon="table-chart"
        label="جدول"
        onPress={() => onAddBlock('table')}
      />
      <RibbonChip
        icon="list"
        label="قائمة"
        onPress={() => onAddBlock('list')}
      />
      <RibbonChip
        icon="functions"
        label="معادلة"
        onPress={() => onAddBlock('formula')}
      />
      <RibbonChip
        icon="lightbulb"
        label="إجابة"
        onPress={() => onAddBlock('answer')}
      />
      <RibbonChip
        icon="horizontal-rule"
        label="فاصل"
        onPress={() => onAddBlock('divider')}
      />
      <ToolDivider />
      <RibbonChip
        icon="spellcheck"
        label="لوحة الرموز"
        active={symbolsActive}
        onPress={onSymbols}
      />
    </ScrollView>
  );
}

/** 4. أدوات تخطيط الصفحة */
function LayoutTools({
  totalScore,
  onHeader,
}: {
  totalScore: number;
  onHeader: () => void;
}) {
  const { colors } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.toolsRow}
    >
      <RibbonChip
        icon="view-headline"
        label="ترويسة الامتحان"
        primary
        onPress={onHeader}
      />

      <View style={[styles.ribbonChip, { backgroundColor: `${colors.textSecondary}18` }]}>
        <Icon
          name="star"
          size={14}
          color={totalScore > 0 ? colors.primary : colors.textSecondary}
        />
        <Text
          style={[
            styles.ribbonChipLabel,
            { color: totalScore > 0 ? colors.primary : colors.textSecondary },
          ]}
        >
          المجموع: {totalScore} درجة
        </Text>
      </View>
    </ScrollView>
  );
}

/** 5. إعدادات الطباعة الرئيسية */
function PrintTools({
  onOpenSettings,
  onOpenPreview,
}: {
  onOpenSettings: () => void;
  onOpenPreview: () => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.toolsRow}
    >
      <RibbonChip
        icon="tune"
        label="إعدادات الطباعة"
        primary
        onPress={onOpenSettings}
      />
      <RibbonChip icon="preview" label="معاينة الطباعة" onPress={onOpenPreview} />
    </ScrollView>
  );
}

/** 6. أدوات الذكاء الاصطناعي */
function AITools({
  aiBusy,
  listening,
  onSmartQuestions,
  onFormatAI,
  onProofreadAI,
  onToggleVoice,
  onOpenVoiceHelp,
}: {
  aiBusy: boolean;
  listening: boolean;
  onSmartQuestions: () => void;
  onFormatAI: () => void;
  onProofreadAI: () => void;
  onToggleVoice: () => void;
  onOpenVoiceHelp?: () => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.toolsRow}
    >
      <RibbonChip
        icon="auto-awesome"
        label="توليد أسئلة ذكي"
        primary
        onPress={onSmartQuestions}
      />
      <RibbonChip
        icon="auto-fix-high"
        label="تنسيق ذكي للورقة"
        loading={aiBusy}
        onPress={onFormatAI}
      />
      <RibbonChip
        icon="spellcheck"
        label="تدقيق لغوي وعلمي"
        loading={aiBusy}
        onPress={onProofreadAI}
      />
      <ToolDivider />
      <RibbonChip
        icon="mic"
        label={listening ? 'إيقاف الإملاء الصوتي' : 'كتابة بالصوت'}
        active={listening}
        onPress={onToggleVoice}
      />
      {onOpenVoiceHelp ? (
        <RibbonChip
          icon="help-outline"
          label="دليل الصوت"
          onPress={onOpenVoiceHelp}
        />
      ) : null}
    </ScrollView>
  );
}

/** 7. أدوات العرض */
function ViewTools({
  preview,
  onTogglePreview,
  onPrintPreview,
}: {
  preview: boolean;
  onTogglePreview: () => void;
  onPrintPreview: () => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.toolsRow}
    >
      <RibbonChip
        icon={preview ? 'edit' : 'visibility'}
        label={preview ? 'العودة للتحرير' : 'معاينة الورقة (قراءة)'}
        active={preview}
        onPress={onTogglePreview}
      />
      <RibbonChip
        icon="print"
        label="معاينة الطباعة A4"
        onPress={onPrintPreview}
      />
    </ScrollView>
  );
}

/* ------------------------------------------------------------------ */
/* مكونات واجهة شريط الأدوات                                          */
/* ------------------------------------------------------------------ */

function RibbonChip({
  label,
  icon,
  onPress,
  active,
  primary,
  loading,
}: {
  label: string;
  icon?: string;
  onPress: () => void;
  active?: boolean;
  primary?: boolean;
  loading?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      disabled={loading}
      animated={false}
      style={[
        styles.ribbonChip,
        {
          backgroundColor: primary
            ? colors.primary
            : active
            ? `${colors.primary}22`
            : colors.surfaceElevated,
          borderColor: active ? colors.primary : 'transparent',
          borderWidth: active ? 1 : 0,
        },
      ]}
    >
      {loading ? (
        <Text style={{ color: colors.primary, fontSize: 12 }}>⏳</Text>
      ) : icon ? (
        <Icon
          name={icon}
          size={15}
          color={primary ? '#fff' : active ? colors.primary : colors.textPrimary}
        />
      ) : null}
      <Text
        style={[
          styles.ribbonChipLabel,
          {
            color: primary
              ? '#fff'
              : active
              ? colors.primary
              : colors.textPrimary,
          },
        ]}
      >
        {label}
      </Text>
    </PressableScale>
  );
}

function ToolBtn({
  icon,
  onPress,
  active,
  disabled,
  primary,
  loading,
}: {
  icon: string;
  onPress: () => void;
  active?: boolean;
  disabled?: boolean;
  primary?: boolean;
  loading?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled || loading}
      animated={false}
      style={[
        styles.toolBtn,
        active && { backgroundColor: `${colors.primary}22` },
        primary && { backgroundColor: colors.primary },
        disabled && { opacity: 0.3 },
      ]}
    >
      {loading ? (
        <Text style={{ color: colors.primary, fontSize: 14 }}>⏳</Text>
      ) : (
        <Icon
          name={icon}
          size={18}
          color={
            primary ? '#fff' : active ? colors.primary : colors.textPrimary
          }
        />
      )}
    </PressableScale>
  );
}

function ToolDivider() {
  const { colors } = useTheme();
  return (
    <View style={[styles.toolDivider, { backgroundColor: colors.border }]} />
  );
}

const styles = StyleSheet.create({
  ribbon: {
    borderBottomWidth: 1,
  },
  editorTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: 4,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  backLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
  },
  keyboardAvoider: { flex: 1 },
  ribbonTabs: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingTop: 4,
    gap: 4,
  },
  ribbonTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderBottomWidth: 2.5,
  },
  ribbonTabLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '700',
  },
  toolsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 4,
  },
  toolBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolDivider: {
    width: 1,
    height: 22,
    marginHorizontal: 3,
  },
  ribbonChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: radius.sm,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  ribbonChipLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '700',
  },
  editorScroll: { flex: 1 },
  editorScrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    padding: 12,
    paddingBottom: 64,
  },
  paper: {
    width: '100%',
    maxWidth: 820,
    minHeight: 720,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  headerBanner: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 16,
  },
  headerBannerBismillah: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  headerBannerCols: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  headerBannerColRight: {
    flex: 1.1,
  },
  headerBannerMinistry: {
    fontFamily: FONT_FAMILY,
    fontSize: 10,
  },
  headerBannerSchool: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  headerBannerColCenter: {
    flex: 1.2,
    alignItems: 'center',
  },
  headerBannerTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  headerBannerYear: {
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    marginTop: 2,
  },
  headerBannerColLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  headerBannerInfo: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    lineHeight: 18,
  },
  headerBannerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  headerBannerHint: {
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    fontWeight: '600',
  },
  voiceFloatingBar: {
    position: 'absolute',
    bottom: 20,
    left: 14,
    right: 14,
    maxWidth: 600,
    alignSelf: 'center',
    borderRadius: radius.lg,
    borderWidth: 1.5,
    elevation: 10,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    zIndex: 999,
    overflow: 'hidden',
  },
  voiceTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  voiceStatusContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  voicePulseDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  voiceTextContainer: {
    flex: 1,
  },
  voiceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  voiceStatusTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
  },
  voiceCountBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 12,
  },
  voiceCountBadgeText: {
    fontFamily: FONT_FAMILY,
    fontSize: 10.5,
    fontWeight: '700',
  },
  voiceStatusSub: {
    fontFamily: FONT_FAMILY,
    fontSize: 11.5,
    textAlign: 'right',
    marginTop: 2,
  },
  voiceStopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: radius.sm,
  },
  voiceStopBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  voiceQuickRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  voiceQuickChips: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  voiceQuickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
  },
  voiceQuickChipText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11.5,
    fontWeight: '600',
  },
  quickAddQuestion: {
    position: 'absolute',
    right: 18,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 18,
    elevation: 6,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.24,
    shadowRadius: 6,
  },
  quickAddQuestionText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '800',
    color: '#FFF',
  },
  deleteQuestionDialogText: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    lineHeight: 23,
    textAlign: 'right',
  },
});
