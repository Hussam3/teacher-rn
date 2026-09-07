const fs = require('fs');
const path = require('path');

const RAW_JSON = path.join(__dirname, '..', 'json_books', 'curriculum_pdf_links.json');
const OUTPUT_TS = path.join(__dirname, '..', 'src', 'services', 'pdfCurriculumLinks.ts');

const rawRows = JSON.parse(fs.readFileSync(RAW_JSON, 'utf8'));

// Row 0, 1 are titles. Row 2 is headers: A: المرحلة الرئيسية, B: الصف, C: المادة, D: نوع الكتاب / الجزء, E: اسم الملف, F: رابط العرض, G: رابط التنزيل المباشر
const dataRows = rawRows.slice(3);

function extractDriveId(url) {
  if (!url) return '';
  const match1 = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match1) return match1[1];
  const match2 = url.match(/id=([a-zA-Z0-9_-]+)/);
  if (match2) return match2[1];
  return '';
}

function normalizeGrade(grade) {
  if (!grade) return 'غير محدد';
  const g = grade.trim();
  if (g.includes('الرابع') && g.includes('الابتدائي')) return 'الرابع الابتدائي';
  if (g.includes('الخامس') && g.includes('الابتدائي')) return 'الخامس الابتدائي';
  if (g.includes('السادس') && g.includes('الابتدائي')) return 'السادس الابتدائي';
  if (g.includes('الرابع') && g.includes('العلمي')) return 'الرابع العلمي';
  if (g.includes('الرابع') && g.includes('الادبي')) return 'الرابع الأدبي';
  if (g.includes('الخامس') && g.includes('العلمي')) return 'الخامس العلمي';
  if (g.includes('الخامس') && g.includes('الادبي')) return 'الخامس الأدبي';
  if (g.includes('السادس') && g.includes('العلمي')) return 'السادس العلمي';
  if (g.includes('السادس') && g.includes('الادبي')) return 'السادس الأدبي';
  if (g.includes('الأول') || g.includes('الاول')) {
    if (g.includes('متوسط')) return 'الأول المتوسط';
    if (g.includes('ابتدائي')) return 'الأول الابتدائي';
  }
  if (g.includes('الثاني')) {
    if (g.includes('متوسط')) return 'الثاني المتوسط';
    if (g.includes('ابتدائي')) return 'الثاني الابتدائي';
  }
  if (g.includes('الثالث')) {
    if (g.includes('متوسط')) return 'الثالث المتوسط';
    if (g.includes('ابتدائي')) return 'الثالث الابتدائي';
  }
  return g;
}

const pdfCatalog = [];
const lookupMap = {};

for (const row of dataRows) {
  const stage = (row.A || '').trim();
  const grade = (row.B || '').trim();
  const subject = (row.C || '').trim();
  const bookTypeOrPart = (row.D || '').trim();
  const fileName = (row.E || '').trim();
  const viewUrl = (row.F || '').trim();
  const downloadUrl = (row.G || '').trim();
  const driveId = extractDriveId(downloadUrl || viewUrl);

  if (!fileName && !viewUrl && !downloadUrl) continue;

  const item = {
    fileName,
    stage,
    grade,
    subject,
    typeOrPart: bookTypeOrPart,
    driveId,
    viewUrl,
    downloadUrl: downloadUrl || (driveId ? `https://docs.google.com/uc?export=download&id=${driveId}` : ''),
  };

  pdfCatalog.push(item);

  // Key for exact lookup
  const key = `${stage}_${grade}_${subject}_${bookTypeOrPart}`.replace(/\s+/g, '_');
  lookupMap[key] = item;
}

console.log(`Processed ${pdfCatalog.length} PDF links.`);

// Build TypeScript catalog
const tsContent = `/**
 * دليل وروابط عرض وتنزيل ملفات PDF للمناهج العراقية (للقراءة والعرض المباشر).
 * مصدر البيانات: فهرس_المناهج_وروابط_التحميل.xlsx
 * عدد الكتب: ${pdfCatalog.length}
 */

export interface CurriculumPdfLink {
  fileName: string;
  stage: string;
  grade: string;
  subject: string;
  typeOrPart?: string;
  driveId: string;
  viewUrl: string;
  downloadUrl: string;
}

export const PDF_CURRICULUM_CATALOG: CurriculumPdfLink[] = ${JSON.stringify(pdfCatalog, null, 2)};

/**
 * البحث عن رابط عرض أو تنزيل PDF لمادة وصف معين
 */
export function findPdfLink(params: {
  subjectName: string;
  grade: string;
  stage?: string;
  typeOrPart?: string;
}): CurriculumPdfLink | undefined {
  const normSubj = params.subjectName.trim();
  const normGrade = params.grade.trim();

  // 1. مطابقة مباشرة
  for (const item of PDF_CURRICULUM_CATALOG) {
    const matchGrade = item.grade.includes(normGrade) || normGrade.includes(item.grade);
    const matchSubj = item.subject.includes(normSubj) || normSubj.includes(item.subject);
    if (matchGrade && matchSubj) {
      if (params.typeOrPart && item.typeOrPart) {
        if (item.typeOrPart.includes(params.typeOrPart) || params.typeOrPart.includes(item.typeOrPart)) {
          return item;
        }
      } else {
        return item;
      }
    }
  }

  // 2. مطابقة بالاسم
  return PDF_CURRICULUM_CATALOG.find(
    item => item.fileName.includes(normSubj) && (item.fileName.includes(normGrade) || item.grade.includes(normGrade)),
  );
}

/**
 * استخراج رابط العرض المباشر في المتصفح أو Webview
 */
export function getPdfViewUrl(subjectName: string, grade: string): string | null {
  const link = findPdfLink({ subjectName, grade });
  return link?.viewUrl ?? null;
}

/**
 * استخراج رابط التنزيل المباشر
 */
export function getPdfDownloadUrl(subjectName: string, grade: string): string | null {
  const link = findPdfLink({ subjectName, grade });
  return link?.downloadUrl ?? null;
}
`;

fs.writeFileSync(OUTPUT_TS, tsContent, 'utf8');
console.log(`✅ Saved TypeScript PDF links module to: ${OUTPUT_TS}`);

