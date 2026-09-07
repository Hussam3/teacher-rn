const fs = require('fs');
const path = require('path');

const BOOKS_DIR = path.join(__dirname, '..', 'json_books');
const OUTPUT_JSON = path.join(BOOKS_DIR, 'curriculum_master_index.json');
const OUTPUT_TS = path.join(__dirname, '..', 'src', 'shared', 'constants', 'curriculumMasterData.ts');

function normalizeArabic(str) {
  if (!str) return '';
  return str
    .replace(/[ـ\u200B-\u200F\uFEFF\u202A-\u202E\u2066-\u2069\u200E\u200F]/g, '')
    .replace(/_/g, ' ')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u065F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanText(t) {
  if (!t) return '';
  return t
    .replace(/[ـ\u200B-\u200F\uFEFF\u202A-\u202E\u2066-\u2069\u200E\u200F]/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[*_#`~|]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function classifyBook(fileName, data) {
  const cleanName = fileName.replace(/\.json$/i, '');
  const norm = normalizeArabic(cleanName);

  let stage = 'غير محدد';
  let grade = 'غير محدد';
  let subject = 'غير محدد';
  let bookType = 'كتاب الطالب';
  let part = 'كامل';
  let editionNotes = '';

  // 1. Stage & Grade
  if (norm.includes('اول ابتدائي') || norm.includes('الاول الابتدائي') || norm.includes('الصف الاول الابتدائي')) {
    stage = 'الابتدائية';
    grade = 'الأول الابتدائي';
  } else if (norm.includes('ثاني ابتدائي') || norm.includes('الثاني الابتدائي') || norm.includes('الصف الثاني الابتدائي')) {
    stage = 'الابتدائية';
    grade = 'الثاني الابتدائي';
  } else if (norm.includes('ثالث ابتدائي') || norm.includes('الثالث الابتدائي') || norm.includes('الصف الثالث الابتدائي')) {
    stage = 'الابتدائية';
    grade = 'الثالث الابتدائي';
  } else if (norm.includes('رابع ابتدائي') || norm.includes('الرابع الابتدائي') || norm.includes('الصف الرابع الابتدائي')) {
    stage = 'الابتدائية';
    grade = 'الرابع الابتدائي';
  } else if (norm.includes('خامس ابتدائي') || norm.includes('الخامس الابتدائي') || norm.includes('الصف الخامس الابتدائي')) {
    stage = 'الابتدائية';
    grade = 'الخامس الابتدائي';
  } else if (norm.includes('سادس ابتدائي') || norm.includes('السادس الابتدائي') || norm.includes('الصف السادس الابتدائي')) {
    stage = 'الابتدائية';
    grade = 'السادس الابتدائي';
  } else if (norm.includes('اول متوسط') || norm.includes('الاول المتوسط') || norm.includes('الصف الاول المتوسط')) {
    stage = 'المتوسطة';
    grade = 'الأول المتوسط';
  } else if (norm.includes('ثاني متوسط') || norm.includes('الثاني المتوسط') || norm.includes('الصف الثاني المتوسط')) {
    stage = 'المتوسطة';
    grade = 'الثاني المتوسط';
  } else if (norm.includes('ثالث متوسط') || norm.includes('الثالث المتوسط') || norm.includes('الصف الثالث متوسط') || norm.includes('الصف الثالث المتوسط')) {
    stage = 'المتوسطة';
    grade = 'الثالث المتوسط';
  } else if (norm.includes('رابع علمي') || norm.includes('الرابع العلمي')) {
    stage = 'الإعدادية';
    grade = 'الرابع العلمي';
  } else if (norm.includes('رابع ادبي') || norm.includes('الرابع الادبي')) {
    stage = 'الإعدادية';
    grade = 'الرابع الأدبي';
  } else if (norm.includes('رابع اعدادي') || norm.includes('الرابع الاعدادي') || norm.includes('الصف الرابع الاعدادي')) {
    stage = 'الإعدادية';
    grade = 'الرابع الإعدادي';
  } else if (norm.includes('خامس علمي') || norm.includes('الخامس العلمي') || norm.includes('خامس احيائي') || norm.includes('خامس تطبيقي')) {
    stage = 'الإعدادية';
    grade = 'الخامس العلمي';
  } else if (norm.includes('خامس ادبي') || norm.includes('الخامس الادبي')) {
    stage = 'الإعدادية';
    grade = 'الخامس الأدبي';
  } else if (norm.includes('خامس اعدادي') || norm.includes('الخامس الاعدادي') || norm.includes('الصف الخامس الاعدادي')) {
    stage = 'الإعدادية';
    grade = 'الخامس الإعدادي';
  } else if (norm.includes('سادس علمي') || norm.includes('السادس العلمي') || norm.includes('سادس احيائي') || norm.includes('سادس تطبيقي')) {
    stage = 'الإعدادية';
    grade = 'السادس العلمي';
  } else if (norm.includes('سادس ادبي') || norm.includes('السادس الادبي')) {
    stage = 'الإعدادية';
    grade = 'السادس الأدبي';
  } else if (norm.includes('سادس اعدادي') || norm.includes('السادس الاعدادي') || norm.includes('الصف السادس الاعدادي')) {
    stage = 'الإعدادية';
    grade = 'السادس الإعدادي';
  } else if (norm.includes('المرحله المتوسطه')) {
    stage = 'المتوسطة';
    grade = 'المرحلة المتوسطة (شامل)';
  } else if (norm.includes('الرابع والخامس والسادس الاعدادي')) {
    stage = 'الإعدادية';
    grade = 'المرحلة الإعدادية (شامل)';
  }

  // Fallback for special single files
  if (norm.includes('الاحياء المنقح 2025')) {
    stage = 'الإعدادية';
    grade = 'السادس العلمي';
    editionNotes = 'طبعة منقحة 2025 (فارغة)';
  }

  // 2. Specific Subjects first
  if (norm.includes('ادب انكليزي') || norm.includes('تمارين الادب انكليزي')) {
    subject = 'الأدب الإنجليزي';
  } else if (norm.includes('انكليزي') || norm.includes('انجليزي') || (norm.includes('اربع وحدات') && norm.includes('سادس ابتدائي'))) {
    subject = 'اللغة الإنجليزية';
  } else if (norm.includes('فرنسي')) {
    subject = 'اللغة الفرنسية';
  } else if (norm.includes('كردي')) {
    subject = 'اللغة الكردية';
  } else if (norm.includes('فلسفه') || norm.includes('علم النفس')) {
    subject = 'الفلسفة وعلم النفس';
  } else if (norm.includes('علم الاجتماع')) {
    subject = 'علم الاجتماع';
  } else if (norm.includes('علم الارض')) {
    subject = 'علم الأرض';
  } else if (norm.includes('جرائم حزب البعث')) {
    subject = 'جرائم حزب البعث';
  } else if (norm.includes('تربيه اخلاقيه') || norm.includes('التربيه الاخلاقيه') || norm.includes('التربية الاخلاقية')) {
    subject = 'التربية الأخلاقية';
  } else if (norm.includes('اسلاميه') || norm.includes('الاسلاميه') || norm.includes('قران')) {
    subject = 'التربية الإسلامية';
  } else if (norm.includes('اقتصاد')) {
    subject = 'الاقتصاد';
  } else if (norm.includes('تاريخ')) {
    subject = 'التاريخ';
  } else if (norm.includes('جغرافيه') || norm.includes('جغرافيا')) {
    subject = 'الجغرافية';
  } else if (norm.includes('حاسوب')) {
    subject = 'الحاسوب';
  } else if (norm.includes('كيمياء')) {
    subject = 'الكيمياء';
  } else if (norm.includes('فيزياء')) {
    subject = 'الفيزياء';
  } else if (norm.includes('احياء')) {
    subject = 'الأحياء';
  } else if (norm.includes('علوم') || norm.includes('نشاط العلوم') || norm.includes('العلوم النشاط')) {
    subject = 'العلوم';
  } else if (norm.includes('رياضيات') || norm.includes('تمرينات الرياضيات') || norm.includes('الرياضيات التمرينات')) {
    subject = 'الرياضيات';
  } else if (norm.includes('اجتماعيات')) {
    subject = 'الاجتماعيات';
  } else if (norm.includes('قواعد')) {
    subject = 'قواعد اللغة العربية';
  } else if (norm.includes('قراءه')) {
    subject = 'القراءة العربية';
  } else if (norm.includes('عربي') || norm.includes('اللغه العربيه') || norm.includes('اللغة العربية') || (norm.includes('ادب') && !norm.includes('ادبي'))) {
    subject = 'اللغة العربية';
  }

  // 3. Types & Parts
  if (norm.includes('نشاط') || norm.includes('تمرينات')) {
    bookType = 'كتاب النشاط / التمرينات';
  } else if (norm.includes('حلول وترجمه')) {
    bookType = 'حلول وترجمة ومساعد';
  } else if (norm.includes('مؤشر')) {
    bookType = 'كتاب مؤشر / ملخص';
  }

  if (norm.includes('جزء اول') || norm.includes('الجزء الاول')) {
    part = 'الجزء الأول';
  } else if (norm.includes('جزء ثاني') || norm.includes('الجزء الثاني')) {
    part = 'الجزء الثاني';
  }

  if (norm.includes('2026') || norm.includes('مع التقليص')) {
    editionNotes = 'طبعة 2026 مع التقليص الجديد';
  } else if (norm.includes('2025')) {
    editionNotes = 'طبعة 2025';
  } else if (norm.includes('المنهج الحديث') || norm.includes('المنهج الجديد')) {
    editionNotes = 'المنهج الجديد';
  }

  return { stage, grade, subject, bookType, part, editionNotes };
}

function extractBookSections(pagesObj) {
  const chapters = [];
  const questionSections = [];
  const pageNums = Object.keys(pagesObj).sort((a, b) => parseInt(a) - parseInt(b));

  for (const pNum of pageNums) {
    const rawContent = pagesObj[pNum]?.content || '';
    if (!rawContent) continue;

    const lines = rawContent.split('\n').map(l => cleanText(l)).filter(l => l.length > 0);

    for (let i = 0; i < Math.min(lines.length, 12); i++) {
      const line = lines[i];

      // Check for question sections
      if (/اسئلة|أسئلة|تمارين|حلول|اختبار|تدريبات/i.test(line) && /فصل|وحدة|باب|درس|موضوع/i.test(line) && line.length < 60) {
        questionSections.push({
          page: parseInt(pNum),
          title: line,
        });
      }

      // Check for chapters
      const chMatch = line.match(/(?:الفصل|الوحدة|الباب|المحور)\s+(?:ال[أاإآ]?ول[ىي]?|الثان[يىة]|الثالث[ة]?|الرابع[ة]?|الخامس[ة]?|السادس[ة]?|السابع[ة]?|الثامن[ة]?|التاسع[ة]?|العاشر[ة]?|[0-9]+)/i);
      if (chMatch && line.length < 80) {
        let title = line;
        if (lines[i + 1] && lines[i + 1].length < 60 && !/وزارة|جمهورية|المؤلف|الفصل|الوحدة/i.test(lines[i + 1])) {
          title += ' - ' + lines[i + 1];
        }
        const isRecent = chapters.some(c => c.title === title || Math.abs(c.page - parseInt(pNum)) <= 2);
        if (!isRecent) {
          chapters.push({
            page: parseInt(pNum),
            title,
          });
          break;
        }
      }
    }
  }

  return { chapters, questionSections };
}

function main() {
  console.log('🚀 Starting Comprehensive Curriculum Master Index Generation...');

  const allFiles = fs.readdirSync(BOOKS_DIR);
  const jsonFiles = allFiles.filter(f => f.endsWith('.json') && f !== '_books_index.json' && f !== 'curriculum_master_index.json');

  const rawBooks = [];

  for (const file of jsonFiles) {
    const filePath = path.join(BOOKS_DIR, file);
    const stat = fs.statSync(filePath);
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);

    const pageKeys = data.pages ? Object.keys(data.pages) : [];
    let textLength = 0;
    let nonEmptyPages = 0;

    for (const k of pageKeys) {
      const pageText = (data.pages[k]?.content || '').trim();
      if (pageText.length > 0) {
        nonEmptyPages++;
        textLength += pageText.length;
      }
    }

    const meta = classifyBook(file, data);
    const { chapters, questionSections } = extractBookSections(data.pages || {});

    rawBooks.push({
      fileName: file,
      sizeBytes: stat.size,
      totalPages: data.total_pages || pageKeys.length,
      extractedPages: pageKeys.length,
      nonEmptyPages,
      textLength,
      avgCharsPerPage: nonEmptyPages > 0 ? Math.round(textLength / nonEmptyPages) : 0,
      chapters,
      questionSections,
      ...meta,
    });
  }

  // Identify Duplicates and choose Canonical File
  const grouped = {};
  for (const b of rawBooks) {
    const key = `${b.stage}#${b.grade}#${b.subject}#${b.part}#${b.bookType}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(b);
  }

  const booksList = [];
  let canonicalCount = 0;
  let alternativeCount = 0;

  for (const [groupKey, list] of Object.entries(grouped)) {
    if (list.length === 1) {
      const item = list[0];
      item.isCanonical = item.textLength > 0; // if empty, not canonical
      item.status = item.textLength > 0 ? 'ready' : (item.totalPages > 0 ? 'scanned_pdf_only' : 'empty');
      if (item.isCanonical) canonicalCount++;
      else alternativeCount++;
      booksList.push(item);
    } else {
      // Sort list to find the best version: highest textLength, then highest nonEmptyPages, then sizeBytes
      list.sort((a, b) => {
        if (b.textLength !== a.textLength) return b.textLength - a.textLength;
        if (b.nonEmptyPages !== a.nonEmptyPages) return b.nonEmptyPages - a.nonEmptyPages;
        return b.sizeBytes - a.sizeBytes;
      });

      // Best one is canonical
      list[0].isCanonical = true;
      list[0].status = 'ready';
      canonicalCount++;
      booksList.push(list[0]);

      // Other versions are alternative
      for (let i = 1; i < list.length; i++) {
        list[i].isCanonical = false;
        list[i].status = 'alternative_edition';
        alternativeCount++;
        booksList.push(list[i]);
      }
    }
  }

  // Construct Stage/Grade Hierarchy
  const stagesTree = {};
  let totalWordsCount = 0;
  let totalCharsCount = 0;
  let totalPagesCount = 0;

  for (const book of booksList) {
    if (book.isCanonical) {
      totalCharsCount += book.textLength;
      totalPagesCount += book.totalPages;
      totalWordsCount += Math.round(book.textLength / 5.5); // Approx words

      if (!stagesTree[book.stage]) stagesTree[book.stage] = {};
      if (!stagesTree[book.stage][book.grade]) stagesTree[book.stage][book.grade] = {};
      
      const subjKey = book.part !== 'كامل' ? `${book.subject} (${book.part})` : book.subject;
      const typeKey = book.bookType !== 'كتاب الطالب' ? ` [${book.bookType}]` : '';
      const fullSubjTitle = `${subjKey}${typeKey}`;

      stagesTree[book.stage][book.grade][fullSubjTitle] = {
        fileName: book.fileName,
        subject: book.subject,
        part: book.part,
        bookType: book.bookType,
        totalPages: book.totalPages,
        nonEmptyPages: book.nonEmptyPages,
        textLength: book.textLength,
        chaptersCount: book.chapters.length,
        questionSectionsCount: book.questionSections.length,
        editionNotes: book.editionNotes,
      };
    }
  }

  const masterIndex = {
    meta: {
      title: 'فهرس المناهج الدراسية العراقية الشامل الموحد',
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      country: 'العراق - وزارة التربية',
      summary: {
        totalBooksScanned: rawBooks.length,
        canonicalBooks: canonicalCount,
        alternativeBooks: alternativeCount,
        totalPages: totalPagesCount,
        totalCharacters: totalCharsCount,
        approximateWords: totalWordsCount,
      },
    },
    stages: stagesTree,
    books: booksList.map(b => ({
      id: b.fileName.replace(/\.json$/i, ''),
      fileName: b.fileName,
      title: `${b.subject} - ${b.grade}${b.part !== 'كامل' ? ' (' + b.part + ')' : ''}${b.bookType !== 'كتاب الطالب' ? ' [' + b.bookType + ']' : ''}`,
      stage: b.stage,
      grade: b.grade,
      subject: b.subject,
      part: b.part,
      bookType: b.bookType,
      editionNotes: b.editionNotes,
      isCanonical: b.isCanonical,
      status: b.status,
      fileSizeBytes: b.sizeBytes,
      totalPages: b.totalPages,
      nonEmptyPages: b.nonEmptyPages,
      textLength: b.textLength,
      avgCharsPerPage: b.avgCharsPerPage,
      chaptersCount: b.chapters.length,
      questionSectionsCount: b.questionSections.length,
      chapters: b.chapters,
      questionSections: b.questionSections,
    })),
  };

  // Write JSON
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(masterIndex, null, 2), 'utf8');
  console.log(`✅ Master Index JSON saved to: ${OUTPUT_JSON}`);

  // Generate TypeSafe TypeScript file
  const tsContent = `/**
 * بيانات وفهرس المناهج الدراسية العراقية المعتمدة (توليد آلي من json_books).
 * تاريخ التوليد: ${new Date().toISOString()}
 * إجمالي الكتب: ${rawBooks.length} (المعتمدة: ${canonicalCount})
 */

export interface MasterBookMetadata {
  id: string;
  fileName: string;
  title: string;
  stage: string;
  grade: string;
  subject: string;
  part: string;
  bookType: string;
  editionNotes?: string;
  isCanonical: boolean;
  status: 'ready' | 'alternative_edition' | 'scanned_pdf_only' | 'empty';
  fileSizeBytes: number;
  totalPages: number;
  nonEmptyPages: number;
  textLength: number;
  chaptersCount: number;
  questionSectionsCount: number;
}

export interface CurriculumHierarchy {
  [stage: string]: {
    [grade: string]: {
      [subjectDisplay: string]: {
        fileName: string;
        subject: string;
        part: string;
        bookType: string;
        totalPages: number;
        nonEmptyPages: number;
        textLength: number;
        chaptersCount: number;
        questionSectionsCount: number;
        editionNotes?: string;
      };
    };
  };
}

export const CURRICULUM_STAGES: CurriculumHierarchy = ${JSON.stringify(stagesTree, null, 2)};

/** قائمة الكتب المعتمدة */
export const CANONICAL_BOOKS_COUNT = ${canonicalCount};
export const TOTAL_PAGES_COUNT = ${totalPagesCount};
export const TOTAL_CHARS_COUNT = ${totalCharsCount};
`;

  fs.writeFileSync(OUTPUT_TS, tsContent, 'utf8');
  console.log(`✅ TypeScript Master Data saved to: ${OUTPUT_TS}`);

  console.log('\n📊 === FINAL EXECUTION SUMMARY ===');
  console.log(`- Total Files Scanned: ${rawBooks.length}`);
  console.log(`- Canonical / Primary Books: ${canonicalCount}`);
  console.log(`- Alternative / Duplicate Editions: ${alternativeCount}`);
  console.log(`- Total Indexed Pages: ${totalPagesCount.toLocaleString()}`);
  console.log(`- Total Indexed Arabic Text Characters: ${totalCharsCount.toLocaleString()}`);
  console.log(`- Approx Total Words: ${totalWordsCount.toLocaleString()}`);
}

main();

