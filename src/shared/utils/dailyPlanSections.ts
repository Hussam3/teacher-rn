/**
 * أدوات معالجة وتوزيع أقسام الخطة اليومية.
 * دالة نقية ومستقلة بدون أي تبعيات خارجية لضمان سلامة استخراج النصوص وتوزيعها.
 */

/** تنسيق السطر وإزالة الصياغة (أرقام، رصاصات، ترقيم عربي لفظي، ترويسة Markdown) للمطابقة على العناوين */
export function normalizeMarkerLine(line: string): string {
  return line
    .trim()
    .replace(/^=+\s*/, '')
    .replace(/^#+\s*/, '')
    .replace(/^[*\-•+–—]+\s*/, '')
    .replace(/^\s*\*{1,3}\s*/, '')
    .replace(/\*{1,3}$/, '')
    .replace(/^\(?\d+\)?[.)\-:]\s*/, '')
    .replace(/^[أ-ي][.)\-:]\s*/, '')
    .replace(
      /^(?:أولاً|ثانياً|ثالثاً|رابعاً|خامساً|سادساً|سابعاً|ثامناً|تاسعاً|عاشراً)\s*[:\-–—.]?\s*/,
      '',
    )
    .replace(/^\s*\*{1,3}\s*/, '')
    .replace(/\*{1,3}$/, '')
    .replace(/\s+\*{1,3}$/, '')
    .trim();
}

/** هل يبدأ السطر بأحد العناوين المطلوبة (يتحمل صياغة Markdown والأرقام والرصاصات)؟ */
export function startsWithMarker(line: string, markers: string[]): boolean {
  const cleaned = normalizeMarkerLine(line);
  return markers.some(m => {
    const norm = normalizeMarkerLine(m);
    return (
      cleaned === norm ||
      cleaned.startsWith(`${norm} `) ||
      cleaned.startsWith(`${norm}:`) ||
      cleaned.startsWith(`${norm}-`) ||
      cleaned.startsWith(`${norm}–`) ||
      cleaned.startsWith(`${norm}(`)
    );
  });
}

/** استخراج محتوى قسم بين علامات بداية وعلامات نهاية */
export function extractSectionSmart(
  text: string,
  startMarkers: string[],
  endMarkers?: string[],
): string {
  const lines = text.split('\n');
  let capturing = false;
  let result: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!capturing) {
      const matchStart = startMarkers.find(m => startsWithMarker(trimmed, [m]));
      if (matchStart) {
        capturing = true;
        const normStart = normalizeMarkerLine(matchStart);
        const clean = normalizeMarkerLine(trimmed)
          .replace(normStart, '')
          .replace(/^\s*\([^)]*\)\s*[:\-–—.]?\s*/, '')
          .replace(/^[:\-–—.]\s*/, '')
          .trim();
        if (clean) result.push(clean);
      }
      continue;
    }
    if (
      endMarkers &&
      endMarkers.some(em => startsWithMarker(trimmed, [em]))
    ) {
      break;
    }
    result.push(line);
  }

  return result.join('\n').trim();
}

/** الكلمات والعناوين التي تمثل خطوات وسير الدرس والتمهيد والعرض والتقويم */
export const PROCEDURE_START_MARKERS = [
  'التمهيد',
  'المقدمة',
  'التهيئة',
  'مرحلة التمهيد',
  'سؤال الاستكشاف',
  'خطوات الدرس',
  'خطوات التدريس',
  'خطوات سير الدرس',
  'خطوات تنفيذ الدرس',
  'سير الدرس',
  'سير الحصة',
  'سير وخطوات الدرس',
  'إجراءات التدريس',
  'إجراءات الدرس',
  'الأنشطة التدريسية',
  'الأنشطة التعليمية',
  'الأنشطة الصفية',
  'أنشطة وسير الدرس',
  'خطة الدرس',
  'مراحل الدرس',
  'عرض الدرس',
  'العرض',
  'شرح الدرس',
  'خطوات العرض',
  'شرح المفاهيم',
  'التقويم',
  'التقييم',
  'أسئلة التقويم',
  'الواجب البيتي',
  'الواجب',
];

const PROCEDURE_REGEX =
  /(?:^|\n|\.\s+|\s{2,})(?:[*\-•#=]|\d+[.)\-:]|أولاً|ثانياً|ثالثاً|رابعاً|خامساً)?\s*(?:التمهيد|المقدمة|التهيئة|عرض الدرس|العرض|سير الدرس|شرح الدرس|خطوات الدرس|خطوات التدريس|إجراءات التدريس|إجراءات الدرس|الأنشطة التدريسية|الأنشطة الصفية|التقويم|التقييم|أسئلة التقويم|الواجب البيتي)/i;

/** فحص ما إذا كان النص يحتوي على خطوات الدرس أو التمهيد أو العرض أو التقويم */
export function hasProcedureContent(text: string): boolean {
  if (!text || !text.trim()) return false;
  const lines = text.split('\n');
  if (lines.some(l => startsWithMarker(l, PROCEDURE_START_MARKERS))) {
    return true;
  }
  return PROCEDURE_REGEX.test(text);
}

/**
 * التحقق من سلامة مفردات الخطة اليومية وتوزيعها بدقة.
 * إذا كانت الخطة تحتوي على تمهيد أو عرض أو تقويم مدموج داخل الوسائل (activities)،
 * تقوم الدالة تلقائياً بفصلها ونقل كل قسم إلى موضعه المخصص، وتصفية الوسائل للوسائل التعليمية فقط.
 */
export function sanitizeAndDistributeDailyPlanSections(raw: {
  objectives?: string;
  activities?: string;
  teachingAids?: string;
  introduction?: string;
  presentation?: string;
  evaluation?: string;
  homework?: string;
}): {
  objectives: string;
  activities: string;
  introduction: string;
  presentation: string;
  evaluation: string;
  homework: string;
} {
  let objectives = (raw.objectives || '').trim();
  let activities = (raw.activities || raw.teachingAids || '').trim();
  let introduction = (raw.introduction || '').trim();
  let presentation = (raw.presentation || '').trim();
  let evaluation = (raw.evaluation || '').trim();
  let homework = (raw.homework || '').trim();

  // فحص ما إذا كانت الوسائل تحتوي على التمهيد أو خطوات الدرس أو التقويم بشكل مدمج
  if (hasProcedureContent(activities)) {
    const extractedIntro = extractSectionSmart(
      activities,
      ['التمهيد', 'المقدمة', 'التهيئة', 'مرحلة التمهيد', 'سؤال الاستكشاف'],
      [
        'عرض الدرس',
        'العرض',
        'سير الدرس',
        'شرح الدرس',
        'خطوات العرض',
        'خطوات الدرس',
        'إجراءات التدريس',
        'التقويم',
        'التقييم',
        'الواجب',
      ],
    );
    const extractedPres = extractSectionSmart(
      activities,
      [
        'عرض الدرس',
        'العرض',
        'سير الدرس',
        'شرح الدرس',
        'خطوات العرض',
        'خطوات الدرس',
        'إجراءات التدريس',
        'شرح المفاهيم',
      ],
      ['التقويم', 'التقييم', 'أسئلة التقويم', 'الواجب البيتي', 'الواجب'],
    );
    const extractedEval = extractSectionSmart(
      activities,
      ['التقويم', 'التقييم', 'أسئلة التقويم'],
      ['الواجب البيتي', 'الواجب', 'المهمة'],
    );
    const extractedHw = extractSectionSmart(
      activities,
      ['الواجب البيتي', 'الواجب', 'المهمة'],
    );

    // توزيع المحتوى المستخرج إذا كان الحقل فارغاً أو المحتوى المستخرج أكثر تفصيلاً
    if (
      extractedIntro &&
      (!introduction || introduction.length < 20 || extractedIntro.length > introduction.length)
    ) {
      introduction = extractedIntro;
    }
    if (
      extractedPres &&
      (!presentation || presentation.length < 30 || extractedPres.length > presentation.length)
    ) {
      presentation = extractedPres;
    }
    if (
      extractedEval &&
      (!evaluation || evaluation.length < 20 || extractedEval.length > evaluation.length)
    ) {
      evaluation = extractedEval;
    }
    if (
      extractedHw &&
      (!homework || homework.length < 10 || extractedHw.length > homework.length)
    ) {
      homework = extractedHw;
    }

    // استخلاص الوسائل الصافية فقط: ما قبل أول عنوان لخطوات التدريس
    const lines = activities.split('\n');
    const aidLines: string[] = [];
    for (const line of lines) {
      if (startsWithMarker(line, PROCEDURE_START_MARKERS)) {
        break;
      }
      aidLines.push(line);
    }

    let cleanedAids = aidLines.join('\n').trim();

    // فحص إذا كان الانتقال للتمهيد أو العرض قد بدأ ضمن نفس السطر
    const inlineMatch = cleanedAids.search(PROCEDURE_REGEX);
    if (inlineMatch !== -1) {
      cleanedAids = cleanedAids.slice(0, inlineMatch).trim();
    }

    cleanedAids = cleanedAids
      .replace(/^(=|#|\*|-)+\s*/, '')
      .replace(
        /^(?:الوسائل التعليمية|الوسائل والأدوات|الوسائل|الأدوات التعليمية|الادوات التعليمية|الأدوات)\s*[:\-–—.]?\s*/,
        '',
      )
      .trim();

    // إذا أصبحت الوسائل فارغة لأن الحقل كان يحتوي حصراً على خطوات الدرس
    if (!cleanedAids) {
      cleanedAids = 'الكتاب المنهجي المقرر، السبورة والأقلام الملونة، وسائل وأمثلة توضيحية.';
    }
    activities = cleanedAids;
  }

  const cleanField = (text: string) =>
    text
      .replace(/^[:\-–—.]\s*/, '')
      .replace(/^\*{1,3}\s*/, '')
      .trim();

  return {
    objectives: cleanField(objectives),
    activities: cleanField(activities),
    introduction: cleanField(introduction),
    presentation: cleanField(presentation),
    evaluation: cleanField(evaluation),
    homework: cleanField(homework),
  };
}

