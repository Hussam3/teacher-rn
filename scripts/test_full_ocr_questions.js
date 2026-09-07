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

function extractQuestionsFromRawPage(content, pageNum, bookMeta) {
  if (!content) return [];
  const cleaned = cleanArabic(content);
  if (cleaned.length < 15) return [];

  // Check if page is an exam/question page
  const hasQuestionKeywords = /أسئلة|اسئلة|المناقشة|المناقشه|التمرينات|تمرينات|تأكد من فهمك|تدرب وحل|مسائل|س\s*[0-9]|[0-9]+\s*س|اختر|علل|عرف|قارن|صحح/i.test(cleaned);
  if (!hasQuestionKeywords) return [];

  const questions = [];

  // Pattern A: Standard line-by-line questions (س1: أو 1- أو السؤال الأول:)
  const lines = cleaned.split(/(?:\r\n|\r|\n|\.\s+(?=[0-9]+\s*[\-\.]|[0-9]+\s*س|س\s*[0-9]+))/).map(l => l.trim()).filter(l => l.length > 0);

  // Pattern B: Arabic OCR reverse pattern (e.g. "صحح ما يأتي 1س ... علل 2س ...")
  // We can search for all matches of `(\d+)\s*س` or `س\s*(\d+)`
  const anchorRegex = /(?:([0-9]+)\s*س|س\s*([0-9]+)|(?:السؤال|التمرين|تمرين)\s+([^\:\.\-]+)|([0-9]+)\s*[\-\.]\s*(?:علل|عرف|قارن|ما|اختر|أجب|بين|وضح|عدد|اذكر|صحح|املا|اكمل|احسب|جد))/g;
  
  let match;
  const matchIndices = [];
  while ((match = anchorRegex.exec(cleaned)) !== null) {
    matchIndices.push({
      index: match.index,
      length: match[0].length,
      num: match[1] || match[2] || match[3] || match[4] || 'س',
      rawAnchor: match[0],
    });
  }

  if (matchIndices.length >= 1) {
    for (let i = 0; i < matchIndices.length; i++) {
      const current = matchIndices[i];
      const prevIndex = i === 0 ? 0 : matchIndices[i - 1].index + matchIndices[i - 1].length;
      const nextIndex = i + 1 < matchIndices.length ? matchIndices[i + 1].index : cleaned.length;

      // In Arabic OCR, the question title might be just BEFORE the anchor (e.g. "علل ما يأتي 1س")
      // or just AFTER the anchor (e.g. "1س: علل ما يأتي")
      const beforeText = cleaned.slice(prevIndex, current.index).trim();
      const afterText = cleaned.slice(current.index + current.length, nextIndex).trim();

      // Determine prompt & sub-items
      let prompt = '';
      let subItemsText = '';

      // If beforeText contains a question phrase like "علل ما يأتي" or "ما الفائدة"
      if (beforeText.length > 5 && /(?:علل|عرف|قارن|ما|ماذا|كيف|لماذا|متى|أين|اين|هل|وضح|اشرح|بين|عدد|اذكر|صحح|اختر|املا|اكمل|احسب|جد|أثبت|اثبت)/i.test(beforeText)) {
        // Take the last sentence of beforeText as the prompt
        const beforeSentences = beforeText.split(/[:\.]/);
        prompt = beforeSentences[beforeSentences.length - 1].trim();
        subItemsText = afterText;
      } else {
        // Standard: prompt is in afterText
        const afterSentences = afterText.split(/[:\.\-]/);
        prompt = afterSentences[0].trim();
        subItemsText = afterSentences.slice(1).join(' ').trim();
      }

      if (!prompt || prompt.length < 4) {
        prompt = (current.rawAnchor + ' ' + afterText).slice(0, 80);
      }

      // Clean prompt of leading colons / numbers
      prompt = prompt.replace(/^[:\.\s\-0-9]+/, '').trim();

      if (prompt.length >= 5) {
        // Extract sub branches
        const branches = [];
        const branchMatches = afterText.match(/(?:[\-\.\)]\s*[0-9]+|[0-9]+\s*[\-\.\)]|[أ-ي]\s*[\-\.\)]|\([0-9أ-ي]\))\s*[^0-9أ-ي\-\.\)][^\.\-]{4,}/g);
        if (branchMatches) {
          branchMatches.forEach(b => branches.push(cleanArabic(b)));
        }

        const fullQText = `${prompt}${branches.length > 0 ? '\n' + branches.join('\n') : (afterText.length > 10 ? '\n' + afterText : '')}`.trim();
        const qType = detectQuestionType(fullQText);

        questions.push({
          num: current.num,
          page: pageNum,
          type: qType,
          prompt,
          branches: branches.slice(0, 8),
          text: fullQText.slice(0, 350),
        });
      }
    }
  }

  return questions;
}

// Test across 5 canonical books
const testList = [
  'كتاب الاجتماعيات اول متوسط.json',
  'كتاب الكيمياء الثالث المتوسط.json',
  'كتاب الفيزياء السادس العلمي.json',
  'كتاب التاريخ الخامس الادبي.json',
  'كتاب الاسلامية السادس الابتدائي.json',
];

for (const file of testList) {
  const p = path.join(BOOKS_DIR, file);
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  let total = 0;
  console.log(`\n======================================================`);
  console.log(`📘 BOOK: ${file}`);
  console.log(`======================================================`);

  for (const [pNum, page] of Object.entries(data.pages || {})) {
    const qs = extractQuestionsFromRawPage(page.content || '', parseInt(pNum), {});
    if (qs.length > 0) {
      total += qs.length;
      console.log(`\n  📍 [صفحة ${pNum}] (${qs.length} أسئلة):`);
      qs.forEach(q => {
        console.log(`     • (${q.num}) [نوع: ${q.type}] ${q.prompt}`);
        if (q.branches.length > 0) {
          console.log(`       فروع: ${q.branches.slice(0, 3).join(' | ')}`);
        }
      });
    }
  }
  console.log(`--> Total Questions in "${file}": ${total}`);
}

