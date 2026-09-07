/**
 * محرك الطباعة — يحوّل مستند المحرر (EditorDocument) إلى HTML/CSS جاهز
 * لمقاس A4، ليُستخدم مباشرة من services/pdfService.ts (عبر react-native-html-to-pdf)
 * ومن editor/PrintPreviewDialog.tsx (عبر WebView) بنفس الوقت — حتى تكون
 * المعاينة داخل التطبيق مطابقة تمامًا لما سيخرج من الطابعة.
 */
import type {
  EditorBlock,
  EditorDocument,
  ExamFontFamily,
  ExamHeader,
  PrintSettings,
  QuestionBlock,
  QuestionBranch,
  TableBlock,
} from '../../shared/types/editor';
import {
  BRANCH_LABELS,
  getBranchSubItems,
  getQuestionMode,
  normalizeEditorDocument,
  shouldShowQuestionStem,
} from '../../shared/types/editor';
import { NOTO_KUFI_BOLD_BASE64, NOTO_KUFI_REGULAR_BASE64 } from '../../services/pdfFonts';
import { subjectRepo } from '../../data/repositories';
import { teacherRoleLabel } from '../../shared/utils/teacherRole';
import { stripBranchPrefix, stripQuestionPrefix } from './examTextParser';

/* ------------------------------------------------------------------ */
/* أدوات مساعدة                                                        */
/* ------------------------------------------------------------------ */

export function getFontFamilyCss(family?: ExamFontFamily): string {
  switch (family) {
    case 'Cairo':
      return "'Cairo', 'Noto Kufi Arabic', 'NotoKufi', 'Segoe UI', Tahoma, sans-serif";
    case 'Amiri':
      return "'Amiri', 'Traditional Arabic', serif";
    case 'Tajawal':
      return "'Tajawal', 'Noto Kufi Arabic', 'NotoKufi', 'Segoe UI', Tahoma, sans-serif";
    case 'NotoNaskh':
      return "'Noto Naskh Arabic', 'Traditional Arabic', serif";
    case 'Almarai':
      return "'Almarai', 'Noto Kufi Arabic', 'NotoKufi', 'Segoe UI', Tahoma, sans-serif";
    case 'NotoKufi':
      return "'Noto Kufi Arabic', 'NotoKufi', 'NotoKufiArabic', 'Segoe UI', Tahoma, sans-serif";
    case 'Tahoma':
    default:
      return "'Tahoma', 'Arial', sans-serif";
  }
}

function esc(text: string | undefined | null): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br/>');
}

/** يعزل الصيغ والوحدات اللاتينية حتى لا تنقلب داخل سطر عربي RTL. */
function escWithBidi(text: string | undefined | null): string {
  if (!text) return '';
  const scientificToken = /(?:[A-Za-z][A-Za-z0-9₀-₉⁰-⁹¹²³⁺⁻₊₋().=+/*→⇌-]*|\d+(?:[.,]\d+)?(?:\s*(?:g|kg|mL|L|mol))?|λ\s*=\s*[A-Za-z]\s*\/\s*[A-Za-z])/g;
  return text
    .split('\n')
    .map(line =>
      esc(line).replace(
        scientificToken,
        token => `<bdi class="ltr-token" dir="ltr">${token}</bdi>`,
      ),
    )
    .join('<br/>');
}

export function shouldShowHeaderTrack(grade = '', track = ''): boolean {
  const normalizedGrade = grade.replace(/\s+/g, ' ').trim();
  const normalizedTrack = track.replace(/\s+/g, ' ').trim();
  return Boolean(normalizedTrack && !normalizedGrade.includes(normalizedTrack));
}

export function shouldShowRoundInSubtitle(title = '', round = ''): boolean {
  const normalizedTitle = title.replace(/\s+/g, ' ').trim();
  return Boolean(round.trim() && !normalizedTitle.includes(`الدور ${round.trim()}`));
}

export function isCompleteHeaderDate(value = ''): boolean {
  const date = value.trim();
  return Boolean(date && !/[/-]\s*$/.test(date));
}

/* ------------------------------------------------------------------ */
/* تقدير الارتفاع والاحتواء التلقائي (Auto-fit)                        */
/* ------------------------------------------------------------------ */

export const A4_HEIGHT_MM = 297;
export const A4_WIDTH_MM = 210;
const MM_PER_PT = 0.3528;

/** حساب الارتفاع التقديري بالميليمتر لكامل محتوى الامتحان */
export function estimateExamHeightMm(doc: EditorDocument, settings: PrintSettings): number {
  const normalizedDoc = normalizeEditorDocument(doc);
  const usableWidthMm = (A4_WIDTH_MM - settings.marginMm * 2) / settings.columns;
  const charsPerLine = Math.max(25, Math.floor(usableWidthMm / (settings.fontSize * 0.22)));
  const lineHeightMm = settings.fontSize * MM_PER_PT * 1.45;
  const questionSpacingMm = settings.questionSpacing * MM_PER_PT;

  let heightMm = 0;

  // 1. ترويسة الامتحان
  const h = normalizedDoc.header;
  if (h.showBismillah) heightMm += 6;
  if (h.schoolName || h.subject || h.grade || h.duration || h.date) heightMm += 24;
  if (h.examTitle || h.academicYear) heightMm += 14;

  // 2. الكتل والمحتوى
  let contentHeightMm = 0;
  for (const b of normalizedDoc.blocks) {
    switch (b.type) {
      case 'paragraph': {
        const lines = Math.max(1, Math.ceil((b.text?.length ?? 0) / charsPerLine));
        contentHeightMm += lines * lineHeightMm + 3;
        break;
      }
      case 'heading':
        contentHeightMm += 10;
        break;
      case 'formula':
        contentHeightMm += 12;
        break;
      case 'answer':
        contentHeightMm += 8;
        break;
      case 'divider':
        contentHeightMm += 4;
        break;
      case 'image':
        contentHeightMm += 40;
        break;
      case 'list':
        contentHeightMm += b.items.length * (lineHeightMm + 2) + 2;
        break;
      case 'table':
        contentHeightMm += (b.rows.length + 1) * 7 + questionSpacingMm;
        break;
      case 'question': {
        const questionMode = getQuestionMode(b);
        const branches =
          b.branches && b.branches.length > 0
            ? b.branches
            : (b.options ?? []).map(o => ({ text: o, score: '', subItems: [] }));
        const titleLines =
          shouldShowQuestionStem(b) || !branches.length
            ? Math.max(1, Math.ceil((b.text?.length ?? 0) / charsPerLine))
            : 0;
        let qH = titleLines * lineHeightMm;
        const format = b.format ?? 'generic';
        if (questionMode === 'direct') {
          contentHeightMm += qH + questionSpacingMm + 2;
          break;
        }
        if (format === 'matching') {
          const pairsCount = b.pairs?.length ? b.pairs.length : branches.length || 3;
          qH += pairsCount * 6.5 + 6;
        } else if (format === 'mcq' || format === 'trueFalse') {
          qH += branches.length * (lineHeightMm + 2.5);
        } else if (format === 'fillBlank' && branches.length === 0) {
          qH += 10;
        } else {
          qH += branches.reduce(
            (total, branch) =>
              total + lineHeightMm + 2 + getBranchSubItems(branch).length * (lineHeightMm + 1),
            0,
          );
        }
        contentHeightMm += qH + questionSpacingMm + 2;
        break;
      }
    }
  }

  // في حال وجود عمودين يتوزع محتوى الكتل على العمودين
  if (settings.columns === 2) {
    contentHeightMm = contentHeightMm * 0.55;
  }
  heightMm += contentHeightMm;

  // 3. التذييل
  if (h.teacherName || h.closingNote) {
    heightMm += 10;
  }

  return heightMm;
}

export function capacityHeightMm(settings: PrintSettings): number {
  const usablePageHeightMm = A4_HEIGHT_MM - settings.marginMm * 2;
  const cutLineSpace = settings.repeatPerPage > 1 ? (settings.repeatPerPage - 1) * 6 : 0;
  return (usablePageHeightMm - cutLineSpace) / settings.repeatPerPage;
}

export interface AutoFitResult {
  settings: PrintSettings;
  applied: boolean;
  isUnderCapacity?: boolean;
}

/**
 * ضبط ذكي متدرج لتباعد الأسئلة والخط والهوامش:
 * - إن كان المحتوى زائداً عن صفحة واحدة: يتم تقليص الخط والتباعد ليتسع داخل صفحة A4 واحدة.
 * - إن كان المحتوى صغيراً (نصف صفحة أو أقل): يتم تكبير الخط وزيادة التباعد وتوزيع الأسئلة لتشغل كامل ورقة A4.
 */
export function suggestAutoFit(doc: EditorDocument): AutoFitResult {
  const normalizedDoc = normalizeEditorDocument(doc);
  let settings = { ...normalizedDoc.printSettings };
  const targetCapacity = capacityHeightMm(settings);
  let currentEstimated = estimateExamHeightMm(normalizedDoc, settings);

  // الحالة الأولى: المحتوى أكبر من الصفحة الواحدة (فائض) -> تقليص ذكي
  if (currentEstimated > targetCapacity) {
    let applied = false;

    // 1. تقليص تباعد الأسئلة
    if (settings.questionSpacing > 2) {
      settings.questionSpacing = Math.max(2, settings.questionSpacing - 4);
      applied = true;
      currentEstimated = estimateExamHeightMm(normalizedDoc, settings);
    }

    // 2. تقليص حجم الخط تدريجياً
    while (currentEstimated > targetCapacity && settings.fontSize > 9.5) {
      settings.fontSize = Math.max(9.5, settings.fontSize - 0.5);
      applied = true;
      currentEstimated = estimateExamHeightMm(normalizedDoc, settings);
    }

    // 3. تقليص الهوامش إذا لزم الأمر
    while (currentEstimated > targetCapacity && settings.marginMm > 8) {
      settings.marginMm = Math.max(8, settings.marginMm - 1);
      applied = true;
      currentEstimated = estimateExamHeightMm(normalizedDoc, settings);
    }

    // 4. إنقاص تباعد الأسئلة للصفر كحل أخير
    if (currentEstimated > targetCapacity && settings.questionSpacing > 0) {
      settings.questionSpacing = 0;
      applied = true;
    }

    return { settings, applied, isUnderCapacity: false };
  }

  // الحالة الثانية: المحتوى صغير ويشغل نصف الصفحة أو أقل -> تكبير وتوسيع ذكي لملء كامل ورقة A4
  if (currentEstimated < targetCapacity * 0.88) {
    const questionsCount =
      normalizedDoc.blocks.filter(b => b.type === 'question' || b.type === 'table').length ||
      1;

    // 1. زيادة حجم الخط تدريجياً حتى 15.5pt إذا كانت الصفحة فارغة
    while (currentEstimated < targetCapacity * 0.72 && settings.fontSize < 15.5) {
      settings.fontSize = Math.min(15.5, settings.fontSize + 0.5);
      currentEstimated = estimateExamHeightMm(normalizedDoc, settings);
    }

    // 2. زيادة تباعد الأسئلة لملء الفراغ العمودي
    const remainingMm = Math.max(0, targetCapacity - currentEstimated);
    const extraSpacingPerQuestionPt = (remainingMm / (questionsCount + 1)) / MM_PER_PT;
    settings.questionSpacing = Math.min(
      36,
      Math.max(
        settings.questionSpacing,
        Math.round(settings.questionSpacing + extraSpacingPerQuestionPt * 0.65),
      ),
    );

    // 3. تحسين الهامش إذا كان ضيقاً جداً ليعطي مظهراً متناسقاً
    if (settings.marginMm < 15 && currentEstimated < targetCapacity * 0.7) {
      settings.marginMm = 15;
    }

    return { settings, applied: true, isUnderCapacity: true };
  }

  return { settings, applied: false, isUnderCapacity: false };
}

/* ------------------------------------------------------------------ */
/* CSS                                                                 */
/* ------------------------------------------------------------------ */

function buildCss(
  settings: PrintSettings,
  isCompact = false,
  isUnderCapacity = false,
): string {
  const frameCss =
    settings.frameOption === 1
      ? '.page-frame { border: 1.5pt solid #222; padding: 4mm 5mm; min-height: calc(100% - 2mm); }'
      : settings.frameOption === 2
        ? '.q { border: 1pt solid #444; border-radius: 2mm; padding: 2.5mm 3.5mm; background: #fafafa; }'
        : '';

  const lineHeight = isCompact ? '1.32' : isUnderCapacity ? '1.55' : '1.45';
  const tablePadding = isCompact ? '1mm 2mm' : isUnderCapacity ? '2mm 3mm' : '1.5mm 2.5mm';
  const fontFam = getFontFamilyCss(settings.fontFamily);

  return `
    @import url('https://fonts.googleapis.com/css2?family=Almarai:wght@400;700;800&family=Amiri:ital,wght@0,400;0,700;1,400&family=Cairo:wght@400;600;700;800;900&family=Noto+Kufi+Arabic:wght@400;600;700;800&family=Noto+Naskh+Arabic:wght@400;600;700&family=Tajawal:wght@400;500;700;800&display=swap');

    @font-face {
      font-family: 'NotoKufi';
      src: url('data:font/ttf;base64,${NOTO_KUFI_REGULAR_BASE64}') format('truetype');
      font-weight: normal;
      font-style: normal;
    }
    @font-face {
      font-family: 'NotoKufi';
      src: url('data:font/ttf;base64,${NOTO_KUFI_BOLD_BASE64}') format('truetype');
      font-weight: bold;
      font-style: normal;
    }

    @page {
      size: A4 portrait;
      margin: ${settings.marginMm}mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
    }
    body {
      direction: rtl;
      unicode-bidi: plaintext;
      font-family: ${fontFam};
      font-size: ${settings.fontSize}pt;
      color: #111111;
      line-height: ${lineHeight};
      background-color: #cbd5e1;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 16px 8px;
    }
    .a4-sheet {
      width: 210mm;
      min-height: 297mm;
      background: #ffffff;
      margin: 0 auto 20px auto;
      padding: ${settings.marginMm}mm;
      box-shadow: 0 4px 25px rgba(0, 0, 0, 0.18), 0 1px 3px rgba(0, 0, 0, 0.1);
      border-radius: 2px;
      box-sizing: border-box;
      position: relative;
      display: flex;
      flex-direction: column;
    }
    @media print {
      body {
        background-color: #ffffff !important;
        padding: 0 !important;
        margin: 0 !important;
        display: block !important;
      }
      .a4-sheet {
        width: 100% !important;
        min-height: auto !important;
        margin: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
        border-radius: 0 !important;
      }
    }
    .page-frame {
      width: 100%;
      min-height: 100%;
      display: flex;
      flex-direction: column;
      flex: 1;
    }
    .copy {
      column-count: ${settings.columns};
      column-gap: 8mm;
      break-inside: avoid;
      ${settings.columns === 1 ? 'display: flex; flex-direction: column; flex: 1; min-height: 100%; justify-content: space-between;' : ''}
    }
    .content {
      ${settings.columns === 1 ? `flex: 1; display: flex; flex-direction: column; justify-content: ${isUnderCapacity ? 'space-around' : 'flex-start'};` : ''}
    }
    .copy + .cut-line + .copy,
    .cut-line {
      break-inside: avoid;
    }
    .cut-line {
      border-top: 1px dashed #777;
      margin: 3mm 0;
      text-align: center;
      color: #777;
      font-size: 8pt;
      position: relative;
    }
    .exam-header-official {
      width: 100%;
      margin-bottom: 3.5mm;
    }
    .bismillah {
      text-align: center;
      font-weight: bold;
      font-size: ${settings.fontSize + 0.5}pt;
      margin-bottom: 2mm;
    }
    .header-columns {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 4mm;
      font-size: ${settings.fontSize - 1}pt;
      line-height: 1.45;
    }
    .header-col-right {
      flex: 1.1;
      text-align: right;
    }
    .ministry-title {
      font-size: ${settings.fontSize - 2}pt;
      color: #444;
    }
    .school-title {
      font-weight: bold;
      font-size: ${settings.fontSize + 0.5}pt;
      color: #111;
      margin: 0.5mm 0;
    }
    .header-col-center {
      flex: 1.2;
      text-align: center;
    }
    .exam-title-main {
      font-weight: bold;
      font-size: ${settings.fontSize + 1.5}pt;
      color: #111;
    }
    .exam-sub {
      font-size: ${settings.fontSize - 1.5}pt;
      color: #555;
      margin-top: 0.5mm;
    }
    .header-col-left {
      flex: 1;
      text-align: left;
      direction: rtl;
    }
    .header-divider-line {
      border-bottom: 1.5pt solid #222;
      margin-top: 2.5mm;
      margin-bottom: 2mm;
    }
    .content h1, .content h2, .content h3 {
      margin: 2.5mm 0 1.5mm;
      font-weight: bold;
    }
    .content p {
      margin: 0 0 1.5mm;
    }
    .q {
      margin-bottom: ${settings.questionSpacing}pt;
      break-inside: avoid;
    }
    .q-head {
      text-align: justify;
      font-weight: bold;
    }
    .question-label, .branch-label {
      white-space: nowrap;
    }
    .question-text, .branch-text, .sub-item {
      unicode-bidi: plaintext;
    }
    .score {
      color: #b71c1c;
      font-weight: bold;
      white-space: nowrap;
      margin-inline-start: 2mm;
    }
    .branch {
      text-align: justify;
      margin: 1mm 0 1mm 4mm;
    }
    .branch-label {
      font-weight: bold;
    }
    .sub-items {
      margin: 0.5mm 7mm 0 0;
      width: 100%;
    }
    .sub-item {
      margin: 0.5mm 0;
      text-align: justify;
    }
    .ltr-token {
      direction: ltr;
      unicode-bidi: isolate;
      white-space: nowrap;
    }
    .mcq-option {
      display: flex;
      gap: 2mm;
      align-items: baseline;
      margin: 0.8mm 0 0.8mm 4mm;
    }
    .mcq-circle {
      font-size: 11pt;
      color: #555;
    }
    .match-table {
      border-collapse: collapse;
      width: 100%;
      margin: 1.5mm 0;
    }
    .match-table td {
      border: 0;
      padding: 1mm 2mm;
      width: 50%;
    }
    .match-right {
      border-left: 1pt solid #999 !important;
      text-align: right;
    }
    .match-left {
      text-align: right;
    }
    .fill-line {
      border-bottom: 1pt dotted #555;
      height: 7mm;
      margin: 1.5mm 4mm 3mm;
    }
    .answer {
      color: #444;
      font-size: ${settings.fontSize - 0.5}pt;
      background: #f5f5f5;
      padding: 1mm 2mm;
      border-radius: 1mm;
      margin: 1mm 0;
    }
    table.data-table {
      border-collapse: collapse;
      width: 100%;
      margin-bottom: ${settings.questionSpacing}pt;
    }
    table.data-table th, table.data-table td {
      border: 1pt solid #333;
      padding: ${tablePadding};
      text-align: center;
      font-size: ${settings.fontSize - 1}pt;
    }
    table.data-table th {
      background: #f0f0f0;
      font-weight: bold;
    }
    .divider {
      border-top: 1pt solid #888;
      margin: 2.5mm 0;
    }
    ul, ol {
      margin: 0 0 1.5mm 0;
      padding-inline-start: 5mm;
    }
    .footer {
      display: flex;
      justify-content: space-between;
      margin-top: 4mm;
      font-size: ${settings.fontSize - 1}pt;
      border-top: 0.5pt solid #ccc;
      padding-top: 2mm;
    }
    ${frameCss}
  `;
}

/* ------------------------------------------------------------------ */
/* الترويسة                                                            */
/* ------------------------------------------------------------------ */

function renderHeader(header: ExamHeader): string {
  const roundText = shouldShowRoundInSubtitle(header.examTitle, header.round)
    ? ` (الدور ${esc(header.round)})`
    : '';
  const hasSchool = Boolean(header.schoolName?.trim());
  const hasSubject = Boolean(header.subject?.trim());
  const hasGrade = Boolean(header.grade?.trim());
  const hasDuration = Boolean(header.duration?.trim());
  const hasDate = isCompleteHeaderDate(header.date);
  const hasExamTitle = Boolean(header.examTitle?.trim());

  if (!header.showBismillah && !hasSchool && !hasSubject && !hasGrade && !hasExamTitle) {
    return '';
  }

  return `
    <header class="exam-header-official">
      ${header.showBismillah ? '<div class="bismillah">بسم الله الرحمن الرحيم</div>' : ''}
      <div class="header-columns">
        <div class="header-col-right">
          <div class="ministry-title">جمهورية العراق — وزارة التربية</div>
          ${hasSchool ? `<div class="school-title">${esc(header.schoolName)}</div>` : ''}
          ${hasGrade ? `<div>الصف: <b>${esc(header.grade)}</b> ${shouldShowHeaderTrack(header.grade, header.track) ? `(${esc(header.track)})` : ''}</div>` : ''}
        </div>
        <div class="header-col-center">
          ${hasExamTitle ? `<div class="exam-title-main">${esc(header.examTitle)}</div>` : ''}
          ${header.academicYear ? `<div class="exam-sub">العام الدراسي: ${esc(header.academicYear)}${roundText}</div>` : ''}
        </div>
        <div class="header-col-left">
          ${hasSubject ? `<div>المادة: <b>${escWithBidi(header.subject)}</b></div>` : ''}
          ${hasDuration ? `<div>الزمن: <b>${esc(header.duration)}</b></div>` : ''}
          ${hasDate ? `<div>التاريخ: ${escWithBidi(header.date)}</div>` : ''}
        </div>
      </div>
      <div class="header-divider-line"></div>
    </header>
  `;
}

function renderFooter(header: ExamHeader): string {
  if (!header.teacherName && !header.closingNote) return '';
  const role = teacherRoleLabel(
    header.subjectId ? subjectRepo.get(header.subjectId)?.stage : undefined,
  );
  const roleLabel = role === 'المعلم' ? 'معلم المادة' : 'مدرس المادة';
  return `
    <div class="footer">
      <span>${header.closingNote ? esc(header.closingNote) : ''}</span>
      <span>${header.teacherName ? `${roleLabel}: ${esc(header.teacherName)}` : ''}</span>
    </div>
  `;
}

/* ------------------------------------------------------------------ */
/* الكتل                                                                */
/* ------------------------------------------------------------------ */

function renderQuestion(b: QuestionBlock, questionNumber: number): string {
  const questionMode = getQuestionMode(b);
  const branches: QuestionBranch[] =
    b.branches && b.branches.length > 0
      ? b.branches
      : (b.options ?? []).map(o => ({ text: o, score: '', subItems: [] }));

  const showStem = shouldShowQuestionStem(b) || !branches.length;
  const questionText = stripQuestionPrefix(b.text);
  const hasBranchScores = branches.some(br => ((br.score ?? '').trim() !== ''));
  const head = showStem
    ? `
    <div class="q">
      <div class="q-head">
        <span class="question-label">س${questionNumber}/</span>${questionText ? `<span class="question-text">${escWithBidi(questionText)}</span>` : ''}${b.score && !hasBranchScores ? `<span class="score">(${esc(b.score)} درجة)</span>` : ''}
      </div>`
    : '<div class="q">';

  if (questionMode === 'direct') return `${head}</div>`;

  const renderedBranches = branches
    .map(
      (br, i) => `
      <div class="branch">
        <span class="branch-label">${showStem ? `${BRANCH_LABELS[i] ?? i + 1}/` : `س${questionNumber}/${BRANCH_LABELS[i] ?? i + 1}/`}</span>
        <span class="branch-text">${escWithBidi(stripBranchPrefix(br.text))}</span>
        ${i === 0 && !showStem && b.score && !hasBranchScores ? `<span class="score">(${esc(b.score)} درجة)</span>` : ''}
        ${br.score ? `<span class="score">(${esc(br.score)} د)</span>` : ''}
        ${getBranchSubItems(br).length ? `<div class="sub-items">${getBranchSubItems(br)
          .map(
            (item, itemIndex) =>
              `<div class="sub-item">${itemIndex + 1}. ${escWithBidi(item.text)}</div>`,
          )
          .join('')}</div>` : ''}
      </div>
    `,
    )
    .join('');
  return `${head}${renderedBranches}</div>`;
}

function renderTable(b: TableBlock): string {
  const head = `<tr>${b.headers.map(h => `<th>${esc(h)}</th>`).join('')}</tr>`;
  const rows = b.rows.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('');
  return `<table class="data-table">${head}${rows}</table>`;
}

function renderBlock(b: EditorBlock, questionNumber?: number): string {
  switch (b.type) {
    case 'paragraph': {
      const style = [
        b.style?.bold ? 'font-weight:bold;' : '',
        b.style?.italic ? 'font-style:italic;' : '',
        b.style?.underline ? 'text-decoration:underline;' : '',
        `text-align:${b.align ?? 'right'};`,
      ].join('');
      return `<p style="${style}">${escWithBidi(b.text) || '&nbsp;'}</p>`;
    }
    case 'heading':
      return `<h${b.level} style="text-align:${b.align ?? 'right'};">${escWithBidi(b.text)}</h${b.level}>`;
    case 'formula':
      return `<p style="font-weight:bold;text-align:${b.align ?? 'center'};margin:1.5mm 0;direction:ltr;">${esc(b.text)}</p>`;
    case 'answer':
      return `<p class="answer">الإجابة: ${esc(b.text)}</p>`;
    case 'list':
      return `<${b.ordered ? 'ol' : 'ul'}>${b.items.map(i => `<li>${escWithBidi(i)}</li>`).join('')}</${b.ordered ? 'ol' : 'ul'}>`;
    case 'question':
      return renderQuestion(b, questionNumber ?? 1);
    case 'table':
      return renderTable(b);
    case 'divider':
      return '<div class="divider"></div>';
    case 'image':
      return b.uri ? `<div style="text-align:center;"><img src="${esc(b.uri)}" style="max-width:100%;max-height:60mm;" /></div>` : '';
    default:
      return '';
  }
}

/* ------------------------------------------------------------------ */
/* التجميع النهائي                                                     */
/* ------------------------------------------------------------------ */

function renderCopy(doc: EditorDocument): string {
  let questionNumber = 0;
  return `
    <section class="copy">
      ${renderHeader(doc.header)}
      <div class="content">${doc.blocks
        .map(block =>
          renderBlock(
            block,
            block.type === 'question' ? ++questionNumber : undefined,
          ),
        )
        .join('')}</div>
      ${renderFooter(doc.header)}
    </section>
  `;
}

export interface BuildHtmlResult {
  html: string;
  autoFitApplied: boolean;
  effectiveSettings: PrintSettings;
}

/**
 * يبني مستند HTML كامل جاهز لمقاس A4. تُطبّق قيمة الاحتواء قبل الحفظ في
 * المحرر، لذلك تظل أي هوامش أو خطوط يغيّرها المعلم ظاهرة كما اختارها.
 */
export function buildExamHtmlWithMeta(doc: EditorDocument): BuildHtmlResult {
  const normalizedDoc = normalizeEditorDocument(doc);
  const effectiveSettings = { ...normalizedDoc.printSettings };
  const autoFitApplied = normalizedDoc.printSettings.autoFit;
  const isUnderCapacity = false;

  const effectiveDoc: EditorDocument = {
    ...normalizedDoc,
    printSettings: effectiveSettings,
  };
  const copies = Array.from({ length: effectiveSettings.repeatPerPage }).map((_, i) => {
    const cut = i > 0 && effectiveSettings.cutLines ? '<div class="cut-line">✂ ------------------------------------</div>' : '';
    return `${cut}${renderCopy(effectiveDoc)}`;
  }).join('');

  const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Almarai:wght@400;700;800&family=Amiri:ital,wght@0,400;0,700;1,400&family=Cairo:wght@400;600;700;800;900&family=Noto+Kufi+Arabic:wght@400;600;700;800&family=Noto+Naskh+Arabic:wght@400;600;700&family=Tajawal:wght@400;500;700;800&display=swap" rel="stylesheet" />
<style>${buildCss(effectiveSettings, autoFitApplied, isUnderCapacity)}</style>
</head>
<body>
<div class="a4-sheet">
  <div class="page-frame">${copies}</div>
</div>
</body>
</html>`;

  return { html, autoFitApplied, effectiveSettings };
}

/** واجهة مبسّطة تُرجع HTML فقط — تكفي لأي مكان يحتاج السلسلة النصية فقط (مثل pdfService). */
export function buildExamHtml(doc: EditorDocument): string {
  return buildExamHtmlWithMeta(doc).html;
}
