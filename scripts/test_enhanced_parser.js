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

function isTOC(content) {
  return (content.match(/\.{4,}/g) || []).length > 3 || /فهرست|فهرس المحتويات/i.test(content);
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

function parseQuestionsFromPage(pageText, pageNum) {
  if (isTOC(pageText)) return [];

  const questions = [];
  const text = cleanArabic(pageText);

  // Split by Question markers
  const rawSplits = text.split(/(?=[::\.\s]*(?:س\s*[0-9]+|[0-9]+\s*س|السؤال\s+(?:الأول|الثاني|الثالث|الرابع|الخامس|السادس|السابع|الثامن|التاسع|العاشر|[0-9]+)|التمرين\s+(?:الأول|الثاني|الثالث|الرابع|الخامس|السادس|السابع|الثامن|التاسع|العاشر|[0-9]+)|تمرين\s*[0-9]+|مسألة\s*[0-9]+|[0-9]+\s*[\-\.]\s*(?:علل|عرف|قارن|ما|اختر|أجب|بين|وضح|عدد|اذكر|صحح|املا|اكمل)))/i);

  for (const block of rawSplits) {
    const trimmed = block.trim();
    if (trimmed.length < 12) continue;

    const hasQuestionIndicator = /(?:س\s*[0-9]+|[0-9]+\s*س|السؤال|التمرين|تمرين|علل|عرف|قارن|ما|ماذا|كيف|لماذا|متى|أين|اين|هل|وضح|اشرح|بين|عدد|اذكر|صحح|اختر|املا|اكمل|احسب|جد|أثبت|اثبت|مسألة)/i.test(trimmed);
    if (!hasQuestionIndicator) continue;

    const subBranches = [];
    const subMatches = trimmed.match(/(?:[\-\.\)]\s*[0-9]+|[0-9]+\s*[\-\.\)]|[أ-ي]\s*[\-\.\)])\s*[^0-9أ-ي\-\.\)][^\n\r\.\-]{5,}/g);
    if (subMatches && subMatches.length > 1) {
      subMatches.forEach(m => subBranches.push(cleanArabic(m)));
    }

    const qType = detectQuestionType(trimmed);

    questions.push({
      page: pageNum,
      type: qType,
      text: trimmed.slice(0, 300),
      subBranches: subBranches.slice(0, 8),
    });
  }

  return questions;
}

const testFiles = [
  'كتاب الاجتماعيات اول متوسط.json',
  'كتاب الكيمياء السادس العلمي.json',
  'كتاب التاريخ السادس الادبي.json',
  'كتاب الفيزياء الثالث المتوسط.json',
  'كتاب الاسلامية الخامس الاعدادي (2).json',
];

for (const file of testFiles) {
  const p = path.join(BOOKS_DIR, file);
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  let bookQuestions = [];

  for (const [pNum, page] of Object.entries(data.pages || {})) {
    const qList = parseQuestionsFromPage(page.content || '', parseInt(pNum));
    bookQuestions.push(...qList);
  }

  console.log(`\n📚 Book: "${file}" -> Extracted ${bookQuestions.length} questions:`);
  bookQuestions.slice(0, 5).forEach((q, idx) => {
    console.log(`  [${idx+1}] (ص ${q.page}) [نوع: ${q.type}] ${q.text.slice(0, 100)}...`);
    if (q.subBranches.length > 0) {
      console.log(`      فروع: ${q.subBranches.slice(0, 3).join(' | ')}`);
    }
  });
}

