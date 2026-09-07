/**
 * خدمة توليد PDF — قوالب HTML عربية (RTL) بخطوط مدمجة.
 *
 * تولّد مستندات A4 للخطة اليومية/السنوية وسجل الدرجات وتقرير الطالب
 * وورقة الامتحان، ثم تحوّلها إلى ملفات PDF.
 */
import { generatePDF } from 'react-native-html-to-pdf';
import type { AnnualPlan, DailyPlan, GradeBook, Student, Subject } from '../shared/types/domain';
import { getDailyPlanTopics } from '../shared/types/domain';
import type { EditorDocument } from '../shared/types/editor';
import { buildExamHtml } from '../features/editor/examHtml';
import { columnPassRate, columnValue, isPassing } from '../shared/utils/gradebook';
import { formatDate } from '../shared/utils/date';
import { teacherRoleLabel } from '../shared/utils/teacherRole';
import { NOTO_KUFI_BOLD_BASE64, NOTO_KUFI_REGULAR_BASE64 } from './pdfFonts';

const FONT_FACE = `
@font-face { font-family: 'NotoKufi'; src: url(data:font/ttf;base64,${NOTO_KUFI_REGULAR_BASE64}); font-weight: normal; }
@font-face { font-family: 'NotoKufi'; src: url(data:font/ttf;base64,${NOTO_KUFI_BOLD_BASE64}); font-weight: bold; }
`;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** نص متعدد الأسطر → فقرات HTML */
function multiline(text: string): string {
  return text
    .split('\n')
    .filter(Boolean)
    .map(line => `<p style="margin:2px 0;">${escapeHtml(line)}</p>`)
    .join('');
}

interface HtmlOptions {
  landscape?: boolean;
}

interface PdfPageOptions {
  landscape?: boolean;
}

const A4_WIDTH_POINTS = 595;
const A4_HEIGHT_POINTS = 842;

function wrapHtml(body: string, opts: HtmlOptions = {}): string {
  const size = opts.landscape ? 'A4 landscape' : 'A4';
  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="utf-8" />
<style>
${FONT_FACE}
@page { size: ${size}; margin: 0; }
* { box-sizing: border-box; }
body { font-family: 'NotoKufi', sans-serif; direction: rtl; color: #222; margin: 0; padding: 20pt; font-size: 12pt; line-height: 1.6; }
h1 { font-size: 20pt; text-align: center; margin: 0 0 12pt; }
table { width: 100%; border-collapse: collapse; }
th, td { border: 1px solid #bbb; padding: 6pt; text-align: right; font-size: 9pt; }
th { background: #f0f4f7; font-weight: bold; }
.section { margin-top: 12pt; }
.section h2 { font-size: 13pt; color: #1A81B0; border-right: 4px solid #24A1DE; padding-right: 8pt; margin: 0 0 6pt; }
.info-row { display: flex; gap: 10pt; margin-bottom: 6pt; }
.info-row .item { flex: 1; background: #f5f7f9; border-radius: 4pt; padding: 6pt 10pt; }
.item .label { font-size: 9pt; color: #777; }
.item .value { font-size: 12pt; font-weight: bold; }
</style>
</head>
<body>${body}</body>
</html>`;
}

async function convert(
  html: string,
  fileName: string,
  options: PdfPageOptions = {},
): Promise<string> {
  const res = await generatePDF({
    html,
    fileName,
    directory: 'Documents',
    width: options.landscape ? A4_HEIGHT_POINTS : A4_WIDTH_POINTS,
    height: options.landscape ? A4_WIDTH_POINTS : A4_HEIGHT_POINTS,
    // تترك هوامش ورقة الامتحان لـ CSS نفسه بدلاً من إضافة هامش أصلي ثانٍ.
    padding: 0,
    shouldPrintBackgrounds: true,
  });
  return res.filePath ?? '';
}

export function examPdfFileName(title?: string): string {
  const safeTitle = (title ?? '')
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/^[.\s-]+|[.\s-]+$/g, '')
    .slice(0, 80);
  return `Exam_${safeTitle || 'document'}`;
}

/** عرض اسم المادة للطباعة */
function subjectLabel(subject?: Subject): string {
  return subject ? `${subject.name} (${subject.grade})` : '';
}

/* ------------------------------- الخطة اليومية ------------------------------- */

export function buildDailyPlanHtml(plan: DailyPlan, subject?: Subject): string {
  const topics = getDailyPlanTopics(plan);
  const topicsHtml =
    topics.length > 1
      ? `<ul style="margin:0;padding-right:18pt;">${topics
          .map(topic => `<li>${escapeHtml(topic)}</li>`)
          .join('')}</ul>`
      : escapeHtml(topics[0] ?? '');
  const sections: Array<[string, string]> = [
    ['الأهداف السلوكية', plan.objectives],
    ['الوسائل التعليمية', plan.activities],
    ['التمهيد', plan.introduction],
    ['عرض الدرس', plan.presentation],
    ['التقويم', plan.evaluation],
    ['الواجب البيتي', plan.homework],
  ];

  const body = `
<div style="background:#eceff1;border-radius:8pt;padding:10pt;text-align:center;margin-bottom:12pt;">
  <h1 style="margin:0;">الخطة اليومية</h1>
</div>
<div class="info-row">
  <div class="item"><div class="label">المادة</div><div class="value">${escapeHtml(subject?.name ?? '')}</div></div>
  <div class="item"><div class="label">الصف</div><div class="value">${escapeHtml(plan.className)}</div></div>
  <div class="item"><div class="label">التاريخ</div><div class="value">${escapeHtml(formatDate(plan.date))}</div></div>
</div>
<div class="info-row">
  <div class="item"><div class="label">${topics.length > 1 ? 'الموضوعات' : 'الموضوع'}</div><div class="value">${topicsHtml}</div></div>
  <div class="item"><div class="label">مدة الدرس</div><div class="value">${plan.duration} دقيقة</div></div>
</div>
${sections
  .map(
    ([title, content]) =>
      `<div class="section"><h2>${title}</h2>${content ? multiline(content) : '<p>—</p>'}</div>`,
  )
  .join('')}`;

  return wrapHtml(body);
}

/* ------------------------------- الخطة السنوية ------------------------------- */

export function buildAnnualPlanHtml(plan: AnnualPlan, subject?: Subject): string {
  const academicYear = `${new Date(plan.startDate).getFullYear()}-${new Date(plan.endDate).getFullYear()}`;

  const rows = plan.distribution
    .map(
      d => `<tr>
<td>${escapeHtml(d.month)}</td>
<td>${d.topics.map(t => escapeHtml(t)).join('<br/>')}</td>
<td>${escapeHtml(d.vocabulary)}</td>
<td style="text-align:center;">${d.periodCount}</td>
<td>${escapeHtml(d.teachingMethods)}</td>
</tr>`,
    )
    .join('');

  const body = `
<div style="background:#eceff1;border-radius:8pt;padding:10pt;text-align:center;margin-bottom:12pt;">
  <h1 style="margin:0;">الخطة السنوية</h1>
</div>
<div class="info-row">
  <div class="item"><div class="label">المادة</div><div class="value">${escapeHtml(subject?.name ?? '')}</div></div>
  <div class="item"><div class="label">الصف</div><div class="value">${escapeHtml(plan.className)}</div></div>
  <div class="item"><div class="label">السنة الدراسية</div><div class="value">${academicYear}</div></div>
</div>
<div class="info-row"><div class="item"><div class="label">${teacherRoleLabel(subject?.stage)}</div><div class="value">${escapeHtml(plan.teacherName)}</div></div></div>
${plan.generalObjectives ? `<div class="section"><h2>الأهداف العامة</h2>${multiline(plan.generalObjectives)}</div>` : ''}
<div class="section">
  <h2>توزيع المنهج على الأشهر</h2>
  <table>
    <thead><tr>
      <th>الشهر (من - إلى)</th><th>عنوان الفصل</th><th>المفردات</th><th>الحصص</th><th>الأنشطة والوسائل</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>
</div>`;

  return wrapHtml(body);
}

/* ------------------------------- سجل الدرجات ------------------------------- */

export interface GradebookPdfOptions {
  /** طباعة الأسماء والأعمدة دون أي درجات لإدخالها يدوياً. */
  blank?: boolean;
}

export function buildGradebookHtml(
  gradebook: GradeBook,
  subject?: Subject,
  options: GradebookPdfOptions = {},
): string {
  const blank = options.blank === true;
  const columns = gradebook.columns;
  const headerCells = columns
    .map(
      c =>
        `<th>${escapeHtml(c.name)}<br/><small>(${c.maxScore})</small></th>`,
    )
    .join('');

  const rows = gradebook.students
    .map(
      (s, i) => `<tr>
<td style="text-align:center;">${i + 1}</td>
<td>${escapeHtml(s.name)}</td>
${columns
  .map(c => {
    const value = blank
      ? '&nbsp;'
      : c.isCalculated
      ? columnValue(s, c)
      : s.grades[c.id] ?? '';
    return `<td style="text-align:center;${blank ? 'height:28pt;' : ''}">${value}</td>`;
  })
  .join('')}
</tr>`,
    )
    .join('');

  const rateCells = columns
    .map(c => {
      const rate = columnPassRate(gradebook.students, c);
      const color = rate >= 0 && rate < 50 ? '#c0392b' : '#222';
      return `<td style="text-align:center;font-weight:bold;color:${color};">${
        rate < 0 ? '' : `${Math.round(rate)}%`
      }</td>`;
    })
    .join('');

  const label = [subjectLabel(subject), gradebook.title?.trim()]
    .filter(Boolean)
    .join(' - ');
  const body = `
<h1>${blank ? 'سجل الدرجات (فارغ)' : 'سجل الدرجات'}${label ? ` - ${escapeHtml(label)}` : ''}</h1>
<div class="info-row">
  <div class="item"><div class="label">الصف / الشعبة</div><div class="value">${escapeHtml(gradebook.className)}</div></div>
  <div class="item"><div class="label">السنة الدراسية</div><div class="value">${escapeHtml(gradebook.academicYear)}</div></div>
</div>
<table>
<thead><tr><th>ت</th><th>اسم الطالب</th>${headerCells}</tr></thead>
<tbody>${rows}${blank ? '' : `
<tr style="background:#f0f4f7;"><td></td><td style="font-weight:bold;">نسبة النجاح</td>${rateCells}</tr>`}
</tbody>
</table>`;

  return wrapHtml(body, { landscape: true });
}

/* ------------------------------- تقرير الطالب ------------------------------- */

export function buildStudentReportHtml(
  gradebook: GradeBook,
  student: Student,
  subject?: Subject,
): string {
  const rows = gradebook.columns
    .filter(c => !c.isCalculated)
    .map(c => {
      const grade = student.grades[c.id];
      const remark =
        grade == null
          ? 'غير مسجلة'
          : isPassing(grade, c.maxScore)
          ? 'ناجح'
          : 'راسب';
      return `<tr>
<td>${escapeHtml(c.name)}</td>
<td style="text-align:center;">${c.maxScore}</td>
<td style="text-align:center;">${grade ?? ''}</td>
<td>${remark}</td>
</tr>`;
    })
    .join('');

  const body = `
<h1>تقرير درجات الطالب</h1>
<div class="info-row">
  <div class="item"><div class="label">اسم الطالب</div><div class="value">${escapeHtml(student.name)}</div></div>
  <div class="item"><div class="label">الصف</div><div class="value">${escapeHtml(gradebook.className)}</div></div>
</div>
<div class="info-row">
  <div class="item"><div class="label">المادة</div><div class="value">${escapeHtml(subject?.name ?? '')}</div></div>
  <div class="item"><div class="label">السنة الدراسية</div><div class="value">${escapeHtml(gradebook.academicYear)}</div></div>
</div>
<table style="margin-top:12pt;">
<thead><tr><th>الامتحان/النشاط</th><th>الدرجة العظمى</th><th>الدرجة</th><th>الملاحظات</th></tr></thead>
<tbody>${rows}</tbody>
</table>
<div style="display:flex;justify-content:space-between;margin-top:30pt;">
   <div>توقيع ${teacherRoleLabel(subject?.stage)}: ....................</div>
  <div>توقيع ولي الأمر: ....................</div>
</div>`;

  return wrapHtml(body);
}

/* ------------------------------- ورقة الامتحان ------------------------------- */
/* ملاحظة: بناء ورقة الامتحان (HTML) يتم حصريًا في features/editor/examHtml.ts
   حتى تكون معاينة التطبيق مطابقة تمامًا للملف المطبوع (repeatPerPage، البسملة،
   autoFit، الهوامش المليمترية ... إلخ). */

/* ------------------------------- واجهة التوليد ------------------------------- */

export async function generateDailyPlanPdf(plan: DailyPlan, subject?: Subject): Promise<string> {
  return convert(buildDailyPlanHtml(plan, subject), `DailyPlan_${formatDate(plan.date)}`);
}

export async function generateAnnualPlanPdf(plan: AnnualPlan, subject?: Subject): Promise<string> {
  return convert(buildAnnualPlanHtml(plan, subject), `AnnualPlan_${subject?.name ?? 'plan'}`);
}

export async function generateGradebookPdf(
  gradebook: GradeBook,
  subject?: Subject,
  options: GradebookPdfOptions = {},
): Promise<string> {
  const suffix = options.blank ? 'Blank_' : '';
  return convert(
    buildGradebookHtml(gradebook, subject, options),
    `Gradebook_${suffix}${subject?.name ?? 'book'}`,
    { landscape: true },
  );
}

export async function generateStudentReportPdf(
  gradebook: GradeBook,
  student: Student,
  subject?: Subject,
): Promise<string> {
  return convert(buildStudentReportHtml(gradebook, student, subject), `Report_${student.name}`);
}

export async function generateExamPdf(doc: EditorDocument): Promise<string> {
  return convert(buildExamHtml(doc), examPdfFileName(doc.title));
}
