const fs = require('fs');
const path = require('path');

const BOOKS_DIR = path.join(__dirname, '..', 'json_books');

function cleanArabic(text) {
  if (!text) return '';
  return text
    .replace(/[ـ\u200B-\u200F\uFEFF\u202A-\u202E\u2066-\u2069\u200E\u200F]/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[*_#`~|]/g, '')
    .replace(/\uFFFD/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function detectQuestionType(text) {
  const norm = text.replace(/[\u064B-\u065F]/g, '');
  if (/اختر|اختر العبارة|اختر الاجابة|اختر الصحيحة/i.test(norm)) return 'mcq';
  if (/علل|ما سبب|بين سبب|فسر|لماذا/i.test(norm)) return 'reasoning';
  if (/عرف|ما المقصود|ما هو تعريف|ما مفهوم/i.test(norm)) return 'definition';
  if (/قارن|ما الفرق|مقارنة|موازنة|وازن بين/i.test(norm)) return 'compare';
  if (/املا|املا الفراغات|اكمل العبارات|اكمل الفراغات/i.test(norm)) return 'fill_blanks';
  if (/صح او خطا|صح ام خطا|ضع علامة|صحح العبارات|صحح الخطا/i.test(norm)) return 'true_false';
  if (/عدد|اذكر|ما هي مميزات|ما اهم|ما خصائص/i.test(norm)) return 'enumerate';
  if (/احسب|جد قيمة|ما مقدار|حل المعادلة|اثبت ان|برهن|مسائل/i.test(norm)) return 'calculation';
  return 'general';
}

function extractHighPrecisionQuestions(bookFileName, bookData, stage, grade, subject) {
  const questions = [];
  const pages = bookData.pages || {};
  const pageNums = Object.keys(pages).sort((a, b) => parseInt(a) - parseInt(b));

  let currentChapter = '';

  for (const pNum of pageNums) {
    const rawContent = pages[pNum]?.content || '';
    if (!rawContent) continue;

    // Detect chapter
    const chMatch = rawContent.match(/(?:الفصل|الوحدة|الباب)\s+(?:ال[أاإآ]?ول[ىي]?|الثان[يىة]|الثالث[ة]?|الرابع[ة]?|الخامس[ة]?|السادس[ة]?|السابع[ة]?|الثامن[ة]?|التاسع[ة]?|العاشر[ة]?|[0-9]+)[^\n\r]{0,40}/i);
    if (chMatch) {
      currentChapter = cleanArabic(chMatch[0]);
    }

    // Check if this page is a Question/Exercise page or contains explicit questions
    const isQuestionPage = /أسئلة|اسئلة|المناقشة|المناقشه|التمرينات|تمرينات|تأكد من فهمك|تدرب وحل|مسائل الفصل|اختبار الفصل|س[0-9]|1س|2س|3س|4س|5س|6س|7س|8س|9س|10س/i.test(rawContent);
    if (!isQuestionPage) continue;

    // Split page lines
    const lines = rawContent.split('\n').map(l => cleanArabic(l)).filter(l => l.length > 0);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Match Question Header: e.g. "س1:", "1س:", "س/1:", "السؤال الأول:", "علل ما يأتي:", "عرف ما يأتي:", "قارن بين:"
      const qHeaderMatch = line.match(/^(?:س\s*([0-9]+|[\u0621-\u064A])\s*[:\.\-]|([0-9]+)\s*س\s*[:\.\-]?|السؤال\s+([^\:\-]+)[:\-]|التمرين\s+([^\:\-]+)[:\-]|تمرين\s*([0-9]+)[:\.\-]|(?:علل|عرف|قارن|ما المقصود|املا الفراغات|اختر الاجابة الصحيحة|صحح العبارات|عدد|اذكر)\s*(?:ما يأتي|مما يأتي|بين|الآتي)?\s*[:\.\-])\s*(.*)/i);

      if (qHeaderMatch) {
        let qNum = qHeaderMatch[1] || qHeaderMatch[2] || qHeaderMatch[3] || qHeaderMatch[4] || qHeaderMatch[5] || `س${questions.length + 1}`;
        let mainPrompt = (qHeaderMatch[6] || line).trim();
        
        // Collect following sub-items or branches (e.g. 1- ... 2- ... or أ- ... ب- ...)
        const branches = [];
        let j = i + 1;
        while (j < lines.length && j <= i + 12) {
          const nextLine = lines[j];
          // If nextLine starts a new main question or chapter, stop
          if (nextLine.match(/^(?:س\s*[0-9]+|[0-9]+\s*س|السؤال|التمرين|تمرين\s*[0-9]+|الفصل|الوحدة|أسئلة الفصل)/i)) {
            break;
          }
          // Sub-item match
          const subMatch = nextLine.match(/^(?:[\-\*]\s*([0-9]+|[أ-ي])|([0-9]+|[أ-ي])\s*[\-\.\)]|\(([0-9]+|[أ-ي])\))\s*(.+)/i);
          if (subMatch) {
            branches.push(nextLine);
          } else if (branches.length === 0 && nextLine.length < 120 && !nextLine.match(/^[0-9]+$/)) {
            mainPrompt += ' ' + nextLine;
          }
          j++;
        }

        if (mainPrompt.length >= 6) {
          const fullText = mainPrompt + (branches.length > 0 ? '\n' + branches.join('\n') : '');
          const type = detectQuestionType(fullText);

          questions.push({
            id: `q_${bookFileName.replace(/\.json$/i, '')}_p${pNum}_${questions.length + 1}`,
            bookTitle: bookData.book_title || bookFileName.replace(/\.json$/i, ''),
            stage,
            grade,
            subject,
            chapter: currentChapter || 'عام',
            page: parseInt(pNum),
            num: String(qNum).trim(),
            type,
            prompt: mainPrompt,
            branches: branches.slice(0, 10),
            fullText,
          });
        }
      }
    }
  }

  return questions;
}

const sampleBooks = [
  { file: 'كتاب الاجتماعيات اول متوسط.json', stage: 'المتوسطة', grade: 'الأول المتوسط', subject: 'الاجتماعيات' },
  { file: 'كتاب الكيمياء السادس العلمي.json', stage: 'الإعدادية', grade: 'السادس العلمي', subject: 'الكيمياء' },
  { file: 'كتاب التاريخ السادس الادبي.json', stage: 'الإعدادية', grade: 'السادس الأدبي', subject: 'التاريخ' },
  { file: 'كتاب الفيزياء الثالث المتوسط.json', stage: 'المتوسطة', grade: 'الثالث المتوسط', subject: 'الفيزياء' },
  { file: 'كتاب الاسلامية الخامس الابتدائي.json', stage: 'الابتدائية', grade: 'الخامس الابتدائي', subject: 'التربية الإسلامية' },
];

for (const b of sampleBooks) {
  const p = path.join(BOOKS_DIR, b.file);
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  const qs = extractHighPrecisionQuestions(b.file, data, b.stage, b.grade, b.subject);

  console.log(`\n======================================================`);
  console.log(`📘 ${b.subject} - ${b.grade} (${qs.length} أسئلة مستخرجة):`);
  console.log(`======================================================`);

  qs.slice(0, 4).forEach((q, idx) => {
    console.log(`\n[${idx + 1}] رقم: ${q.num} | نوع: ${q.type} | ص ${q.page} | فصل: ${q.chapter}`);
    console.log(`    النص: ${q.prompt}`);
    if (q.branches.length > 0) {
      console.log(`    الفروع:`);
      q.branches.slice(0, 4).forEach(br => console.log(`      • ${br}`));
    }
  });
}

