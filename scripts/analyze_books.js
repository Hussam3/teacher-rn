const fs = require('fs');
const path = require('path');

const BOOKS_DIR = path.join(__dirname, '..', 'json_books');

function normalizeArabic(str) {
  if (!str) return '';
  return str
    .replace(/[ـ\u200B-\u200F\uFEFF\u202A-\u202E\u2066-\u2069\u200E\u200F]/g, '') // remove invisible & tatweel & bidi marks
    .replace(/_/g, ' ') // replace underscores with spaces
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u065F]/g, '') // remove tashkeel
    .replace(/\s+/g, ' ')
    .trim();
}

function analyzeBookFileName(fileName) {
  const cleanName = fileName.replace(/\.json$/i, '');
  const norm = normalizeArabic(cleanName);

  let stage = 'غير محدد';
  let grade = 'غير محدد';
  let subject = 'غير محدد';
  let bookType = 'كتاب الطالب'; // default
  let part = 'كامل';
  let notes = [];

  // Determine Stage & Grade
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

  // Determine Subject
  if (norm.includes('ادب انكليزي') || norm.includes('تمارين الادب انكليزي')) {
    subject = 'الأدب الإنجليزي';
  } else if (norm.includes('انكليزي') || norm.includes('انجليزي') || (norm.includes('اربع وحدات') && norm.includes('سادس ابتدائي'))) {
    subject = 'اللغة الإنجليزية';
  } else if (norm.includes('فرنسي')) {
    subject = 'اللغة الفرنسية';
  } else if (norm.includes('كردي')) {
    subject = 'اللغة الكردية';
  } else if (norm.includes('اسلاميه') || norm.includes('الاسلاميه') || norm.includes('قران')) {
    subject = 'التربية الإسلامية';
  } else if (norm.includes('قواعد')) {
    subject = 'قواعد اللغة العربية';
  } else if (norm.includes('قراءه')) {
    subject = 'القراءة العربية';
  } else if (norm.includes('فلسفه') || norm.includes('علم النفس')) {
    subject = 'الفلسفة وعلم النفس';
  } else if (norm.includes('علم الاجتماع')) {
    subject = 'علم الاجتماع';
  } else if (norm.includes('علم الارض')) {
    subject = 'علم الأرض';
  } else if (norm.includes('تربيه اخلاقيه') || norm.includes('التربيه الاخلاقيه') || norm.includes('التربية الاخلاقية')) {
    subject = 'التربية الأخلاقية';
  } else if (norm.includes('جرائم حزب البعث')) {
    subject = 'جرائم حزب البعث';
  } else if (norm.includes('عربي') || norm.includes('اللغه العربيه') || norm.includes('اللغة العربية') || norm.includes('ادب')) {
    subject = 'اللغة العربية';
  } else if (norm.includes('رياضيات') || norm.includes('تمرينات الرياضيات') || norm.includes('الرياضيات التمرينات')) {
    subject = 'الرياضيات';
  } else if (norm.includes('احياء')) {
    subject = 'الأحياء';
  } else if (norm.includes('كيمياء')) {
    subject = 'الكيمياء';
  } else if (norm.includes('فيزياء')) {
    subject = 'الفيزياء';
  } else if (norm.includes('علوم') || norm.includes('نشاط العلوم') || norm.includes('العلوم النشاط')) {
    subject = 'العلوم';
  } else if (norm.includes('اجتماعيات')) {
    subject = 'الاجتماعيات';
  } else if (norm.includes('تاريخ')) {
    subject = 'التاريخ';
  } else if (norm.includes('جغرافيه') || norm.includes('جغرافيا')) {
    subject = 'الجغرافية';
  } else if (norm.includes('اقتصاد')) {
    subject = 'الاقتصاد';
  } else if (norm.includes('حاسوب')) {
    subject = 'الحاسوب';
  }

  // Fallback for special single files
  if (norm.includes('حلول وترجمه الوحده الاولي')) {
    subject = 'اللغة الإنجليزية';
    stage = 'المتوسطة';
    grade = 'الأول المتوسط';
    bookType = 'حلول وترجمة الوحدة الأولى';
  }

  // Determine Type & Part
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

  const isDuplicateVariant = /[\s_]\([0-9]+\)|_1$/.test(cleanName);

  if (norm.includes('2026') || norm.includes('مع التقليص')) {
    notes.push('طبعة 2026 مع التقليص الجديد');
  }
  if (norm.includes('المنقح 2025') || norm.includes('2025')) {
    notes.push('طبعة منقحة 2025');
  }
  if (norm.includes('المنهج الحديث') || norm.includes('المنهج الجديد')) {
    notes.push('المنهج الجديد');
  }

  return {
    rawFileName: fileName,
    cleanName,
    stage,
    grade,
    subject,
    bookType,
    part,
    notes: notes.join(' - '),
    isDuplicateVariant,
  };
}

async function main() {
  const files = fs.readdirSync(BOOKS_DIR);
  const jsonFiles = files.filter(f => f.endsWith('.json') && f !== '_books_index.json' && f !== 'curriculum_master_index.json');

  console.log(`Found ${jsonFiles.length} JSON book files.`);

  const results = [];
  const errors = [];
  const duplicateGroups = {};

  for (const file of jsonFiles) {
    const fullPath = path.join(BOOKS_DIR, file);
    const stats = fs.statSync(fullPath);
    const meta = analyzeBookFileName(file);

    try {
      const rawContent = fs.readFileSync(fullPath, 'utf8');
      const data = JSON.parse(rawContent);

      const pageKeys = data.pages ? Object.keys(data.pages) : [];
      const declaredPages = data.total_pages || pageKeys.length;
      const actualPagesCount = pageKeys.length;

      let textLength = 0;
      let hasMarkdown = false;
      for (const pk of pageKeys) {
        const pContent = data.pages[pk]?.content || '';
        textLength += pContent.length;
        if (pContent.includes('#') || pContent.includes('**')) hasMarkdown = true;
      }

      const info = {
        ...meta,
        fileSizeBytes: stats.size,
        declaredPages,
        actualPagesCount,
        totalChars: textLength,
        avgCharsPerPage: actualPagesCount > 0 ? Math.round(textLength / actualPagesCount) : 0,
        hasMarkdown,
        isValid: true,
      };

      results.push(info);

      const groupKey = `${info.stage}|${info.grade}|${info.subject}|${info.part}|${info.bookType}`;
      if (!duplicateGroups[groupKey]) {
        duplicateGroups[groupKey] = [];
      }
      duplicateGroups[groupKey].push(info);

    } catch (err) {
      errors.push({
        file,
        error: err.message,
      });
    }
  }

  console.log('\n--- SCAN SUMMARY ---');
  console.log(`Total valid files parsed: ${results.length}`);
  console.log(`Total errors: ${errors.length}`);

  // Stage Distribution
  const stageDist = {};
  for (const item of results) {
    stageDist[item.stage] = (stageDist[item.stage] || 0) + 1;
  }
  console.log('\n--- STAGE DISTRIBUTION ---');
  console.log(stageDist);

  // Grade Distribution
  const gradeDist = {};
  for (const item of results) {
    gradeDist[item.grade] = (gradeDist[item.grade] || 0) + 1;
  }
  console.log('\n--- GRADE DISTRIBUTION ---');
  console.log(gradeDist);

  // Unclassified
  const unclassified = results.filter(r => r.stage === 'غير محدد' || r.grade === 'غير محدد' || r.subject === 'غير محدد');
  if (unclassified.length > 0) {
    console.log('\n--- UNCLASSIFIED FILES (' + unclassified.length + ') ---');
    for (const u of unclassified) {
      console.log(`  - "${u.rawFileName}" -> Stage: ${u.stage}, Grade: ${u.grade}, Subject: ${u.subject}`);
    }
  } else {
    console.log('\nSUCCESS: All 124 files successfully classified!');
  }

  // Multi-file groups (potential duplicates / versions)
  console.log('\n--- MULTI-FILE GROUPS (VERSIONS / DUPLICATES) ---');
  for (const [key, group] of Object.entries(duplicateGroups)) {
    if (group.length > 1) {
      console.log(`\nGroup [${key}] (${group.length} files):`);
      for (const item of group) {
        console.log(`  * "${item.rawFileName}" | Size: ${(item.fileSizeBytes / 1024).toFixed(1)} KB | Pages: ${item.actualPagesCount} | Chars: ${item.totalChars} | Notes: ${item.notes || 'None'}`);
      }
    }
  }
}

main();

