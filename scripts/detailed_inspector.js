const fs = require('fs');
const path = require('path');

const BOOKS_DIR = path.join(__dirname, '..', 'json_books');

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

function classifyBook(fileName, data) {
  const cleanName = fileName.replace(/\.json$/i, '');
  const norm = normalizeArabic(cleanName);

  let stage = 'غير محدد';
  let grade = 'غير محدد';
  let subject = 'غير محدد';
  let bookType = 'كتاب الطالب';
  let part = 'كامل';

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

  // 2. Specific Subjects first (Avoid greedy matches)
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

  return { stage, grade, subject, bookType, part };
}

function run() {
  const files = fs.readdirSync(BOOKS_DIR);
  const jsonFiles = files.filter(f => f.endsWith('.json') && f !== '_books_index.json' && f !== 'curriculum_master_index.json');

  const books = [];
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

    books.push({
      fileName: file,
      sizeBytes: stat.size,
      totalPages: data.total_pages || pageKeys.length,
      extractedPages: pageKeys.length,
      nonEmptyPages,
      textLength,
      ...meta,
    });
  }

  console.log(`Total Books Processed: ${books.length}`);

  // Empty / Low Text Books
  const emptyBooks = books.filter(b => b.textLength === 0);
  console.log(`\n=== EMPTY TEXT BOOKS (${emptyBooks.length}) ===`);
  emptyBooks.forEach(b => console.log(` - ${b.fileName} (${b.totalPages} pages, size: ${(b.sizeBytes/1024).toFixed(1)} KB)`));

  const lowTextBooks = books.filter(b => b.textLength > 0 && b.textLength < 5000);
  console.log(`\n=== LOW TEXT BOOKS (< 5,000 chars) (${lowTextBooks.length}) ===`);
  lowTextBooks.forEach(b => console.log(` - ${b.fileName} (${b.nonEmptyPages}/${b.totalPages} pages, chars: ${b.textLength})`));

  // Duplicates analysis
  const groups = {};
  for (const b of books) {
    const key = `${b.stage} > ${b.grade} > ${b.subject} > ${b.part} > ${b.bookType}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(b);
  }

  console.log(`\n=== DUPLICATE / ALTERNATIVE EDITIONS ===`);
  for (const [key, list] of Object.entries(groups)) {
    if (list.length > 1) {
      console.log(`\n[${key}] (${list.length} files):`);
      list.forEach(b => {
        console.log(`  * "${b.fileName}" -> Size: ${(b.sizeBytes/1024).toFixed(1)} KB | Total Pages: ${b.totalPages} | Non-empty: ${b.nonEmptyPages} | Chars: ${b.textLength}`);
      });
    }
  }

  // Summary by stage & grade
  console.log(`\n=== COMPLETE CURRICULUM COVERAGE TREE ===`);
  const stages = {};
  for (const b of books) {
    if (!stages[b.stage]) stages[b.stage] = {};
    if (!stages[b.stage][b.grade]) stages[b.stage][b.grade] = [];
    stages[b.stage][b.grade].push(b);
  }

  for (const [sName, sGrades] of Object.entries(stages)) {
    console.log(`\n📍 ${sName}`);
    for (const [gName, gBooks] of Object.entries(sGrades)) {
      console.log(`   📂 ${gName} (${gBooks.length} كتب):`);
      gBooks.forEach(b => {
        console.log(`      • ${b.subject} [${b.part}] (${b.bookType}) - ${b.nonEmptyPages} ص - ${(b.sizeBytes/1024).toFixed(1)} KB - "${b.fileName}"`);
      });
    }
  }
}

run();

