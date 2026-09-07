const fs = require('fs');
const path = require('path');

const BOOKS_DIR = path.join(__dirname, '..', 'json_books');

function cleanText(t) {
  if (!t) return '';
  return t
    .replace(/[ـ\u200B-\u200F\uFEFF\u202A-\u202E\u2066-\u2069\u200E\u200F]/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[*_#`~|]/g, '')
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
  if (/احسب|جد قيمة|ما مقدار|حل المعادلة|اثبت ان|برهن/i.test(norm)) return 'calculation';
  return 'general';
}

function extractQuestionsFromBook(bookData) {
  const extracted = [];
  const pages = bookData.pages || {};
  const pageNums = Object.keys(pages).sort((a, b) => parseInt(a) - parseInt(b));

  let currentSection = '';
  let currentChapter = '';

  for (const pNum of pageNums) {
    const rawContent = pages[pNum]?.content || '';
    if (!rawContent) continue;

    const lines = rawContent.split('\n').map(l => cleanText(l)).filter(l => l.length > 0);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Track chapter
      const chMatch = line.match(/(?:الفصل|الوحدة|الباب)\s+(?:ال[أاإآ]?ول[ىي]?|الثان[يىة]|الثالث[ة]?|الرابع[ة]?|الخامس[ة]?|السادس[ة]?|السابع[ة]?|الثامن[ة]?|التاسع[ة]?|العاشر[ة]?|[0-9]+)/i);
      if (chMatch && line.length < 60) {
        currentChapter = line;
      }

      // Track Question Section Header
      const isSecHeader = /^(?:أسئلة|اسئلة|المناقشة|المناقشه|التمرينات|تمرينات|تأكد من فهمك|تدرب وحل|اختبار الفصل|مسائل الفصل)/i.test(line);
      if (isSecHeader && line.length < 60) {
        currentSection = line;
      }

      // Question start patterns: "س1:", "1س", "1-", "-1", "س/1", "س 1", "أولاً:", "ثانياً:"
      const qMatch = line.match(/^(?:س\s*([0-9]+|[\u0621-\u064A])\s*[:\.\-]|([0-9]+)\s*س\s*[:\.\-]?|([0-9]+)\s*[\-\.]\s*|[\-\*]\s*([0-9]+)\s*[:\.\-]|(أول[ااً]|ثاني[ااً]|ثالث[ااً]|رابع[ااً]|خامس[ااً]|سادس[ااً]|سابع[ااً]|ثامن[ااً])\s*[:\.\-])\s*(.*)/i);

      if (qMatch) {
        const qNum = qMatch[1] || qMatch[2] || qMatch[3] || qMatch[4] || qMatch[5];
        let qBody = (qMatch[6] || '').trim();

        // If line is short and next lines are question body
        let subItems = [];
        let j = i + 1;
        while (j < lines.length && j <= i + 8) {
          const nextLine = lines[j];
          // Stop if next line is a new question or section
          if (nextLine.match(/^(?:س\s*[0-9]+|[0-9]+\s*س|[0-9]+\s*[\-\.]|[\-\*]\s*[0-9]+|الفصل|الوحدة|أسئلة)/i)) {
            break;
          }
          // Check for sub-item: أ- ب- ج- د- or 1- 2-
          if (nextLine.match(/^(?:[\u0623\u0628\u062C\u062F\u0647\u0648]\s*[\-\.\)]|[0-9]+\s*[\-\.\)])/i)) {
            subItems.push(nextLine);
          } else if (!qBody) {
            qBody = nextLine;
          } else if (subItems.length === 0 && nextLine.length < 150) {
            qBody += ' ' + nextLine;
          }
          j++;
        }

        if (qBody.length >= 8) {
          const qType = detectQuestionType(qBody + ' ' + subItems.join(' '));
          extracted.push({
            page: parseInt(pNum),
            chapter: currentChapter || 'عام',
            section: currentSection || 'أسئلة',
            num: qNum,
            text: qBody,
            subItems,
            type: qType,
          });
        }
      }
    }
  }

  return extracted;
}

const testFiles = [
  'كتاب الاجتماعيات اول متوسط.json',
  'كتاب الكيمياء السادس العلمي.json',
  'كتاب التاريخ السادس الادبي.json',
  'كتاب الفيزياء الثالث المتوسط.json',
  'كتاب الاحياء الخامس الاعدادي.json',
];

for (const file of testFiles) {
  const p = path.join(BOOKS_DIR, file);
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  const questions = extractQuestionsFromBook(data);
  console.log(`\n📚 Book: "${file}" -> Extracted ${questions.length} questions:`);
  questions.slice(0, 5).forEach((q, idx) => {
    console.log(`  [${idx+1}] (ص ${q.page}) [نوع: ${q.type}] ${q.text.slice(0, 90)}...`);
    if (q.subItems.length > 0) {
      console.log(`      فروع: ${q.subItems.slice(0, 3).join(' | ')}`);
    }
  });
}

