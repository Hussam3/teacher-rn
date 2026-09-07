const fs = require('fs');
const path = require('path');

const BOOKS_DIR = path.join(__dirname, '..', 'json_books');
const MASTER_INDEX_PATH = path.join(BOOKS_DIR, 'curriculum_master_index.json');
const OUTPUT_QUESTIONS_JSON = path.join(BOOKS_DIR, 'questions_bank.json');
const OUTPUT_SUMMARY_JSON = path.join(BOOKS_DIR, 'questions_bank_summary.json');
const OUTPUT_TS_SERVICE = path.join(__dirname, '..', 'src', 'services', 'questionBankService.ts');

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

function extractQuestionsFromBook(fileName, bookData, meta) {
  const extracted = [];
  const pages = bookData.pages || {};
  const pageNums = Object.keys(pages).sort((a, b) => parseInt(a) - parseInt(b));
  // The same grade and subject can have a student book and an exercise book.
  // Include the book filename so their page-based question IDs never collide.
  const bookKey = fileName.replace(/\.json$/i, '').replace(/\s+/g, '_');

  let currentChapter = 'عام';

  for (const pNum of pageNums) {
    const rawContent = pages[pNum]?.content || '';
    if (!rawContent) continue;

    // Detect Chapter
    const chMatch = rawContent.match(/(?:الفصل|الوحدة|الباب)\s+(?:ال[أاإآ]?ول[ىي]?|الثان[يىة]|الثالث[ة]?|الرابع[ة]?|الخامس[ة]?|السادس[ة]?|السابع[ة]?|الثامن[ة]?|التاسع[ة]?|العاشر[ة]?|[0-9]+)[^\n\r]{0,40}/i);
    if (chMatch) {
      currentChapter = cleanArabic(chMatch[0]);
    }

    const cleaned = cleanArabic(rawContent);
    if (cleaned.length < 20) continue;

    // Check if this page contains questions or exercises
    const isQuestionPage = /أسئلة|اسئلة|المناقشة|المناقشه|التمرينات|تمرينات|تأكد من فهمك|تدرب وحل|مسائل|س\s*[0-9]|[0-9]+\s*س|اختر|علل|عرف|قارن|صحح/i.test(cleaned);
    if (!isQuestionPage) continue;

    // Search for question anchors in this page
    const anchorRegex = /(?:([0-9]+)\s*س|س\s*([0-9]+)|(?:السؤال|التمرين|تمرين)\s+([^\:\.\-]+)|([0-9]+)\s*[\-\.]\s*(?:علل|عرف|قارن|ما|اختر|أجب|بين|وضح|عدد|اذكر|صحح|املا|اكمل|احسب|جد))/g;
    
    let match;
    const matchIndices = [];
    while ((match = anchorRegex.exec(cleaned)) !== null) {
      matchIndices.push({
        index: match.index,
        length: match[0].length,
        num: match[1] || match[2] || match[3] || match[4] || `س${matchIndices.length + 1}`,
        rawAnchor: match[0],
      });
    }

    if (matchIndices.length >= 1) {
      for (let i = 0; i < matchIndices.length; i++) {
        const current = matchIndices[i];
        const prevIndex = i === 0 ? 0 : matchIndices[i - 1].index + matchIndices[i - 1].length;
        const nextIndex = i + 1 < matchIndices.length ? matchIndices[i + 1].index : cleaned.length;

        const beforeText = cleaned.slice(prevIndex, current.index).trim();
        const afterText = cleaned.slice(current.index + current.length, nextIndex).trim();

        let prompt = '';
        if (beforeText.length > 5 && /(?:علل|عرف|قارن|ما|ماذا|كيف|لماذا|متى|أين|اين|هل|وضح|اشرح|بين|عدد|اذكر|صحح|اختر|املا|اكمل|احسب|جد|أثبت|اثبت)/i.test(beforeText)) {
          const beforeSentences = beforeText.split(/[:\.]/);
          prompt = beforeSentences[beforeSentences.length - 1].trim();
        } else {
          const afterSentences = afterText.split(/[:\.\-]/);
          prompt = afterSentences[0].trim();
        }

        if (!prompt || prompt.length < 4) {
          prompt = (current.rawAnchor + ' ' + afterText).slice(0, 80);
        }

        prompt = prompt.replace(/^[:\.\s\-0-9]+/, '').trim();

        // Avoid pure metadata or short non-questions
        if (prompt.length >= 6 && !/^(صدق اهلل|وزارة|جمهورية|المؤلفون|الفصل|الوحدة|الطبعة)/i.test(prompt)) {
          const branches = [];
          const branchMatches = afterText.match(/(?:[\-\.\)]\s*[0-9]+|[0-9]+\s*[\-\.\)]|[أ-ي]\s*[\-\.\)]|\([0-9أ-ي]\))\s*[^0-9أ-ي\-\.\)][^\.\-]{4,}/g);
          if (branchMatches) {
            branchMatches.forEach(b => branches.push(cleanArabic(b)));
          }

          const fullQText = `${prompt}${branches.length > 0 ? '\n' + branches.join('\n') : (afterText.length > 10 ? '\n' + afterText : '')}`.trim();
          const qType = detectQuestionType(fullQText);

          extracted.push({
            id: `iq_q_${bookKey}_p${pNum}_${extracted.length + 1}`,
            bookFileName: fileName,
            bookTitle: meta.title,
            stage: meta.stage,
            grade: meta.grade,
            subject: meta.subject,
            part: meta.part,
            chapter: currentChapter,
            page: parseInt(pNum),
            questionNumber: String(current.num).trim(),
            type: qType,
            prompt,
            branches: branches.slice(0, 10),
            fullText: fullQText.slice(0, 500),
          });
        }
      }
    }
  }

  return extracted;
}

function main() {
  console.log('🚀 Extracting Question Bank from Canonical Books...');

  if (!fs.existsSync(MASTER_INDEX_PATH)) {
    console.error('Error: curriculum_master_index.json not found!');
    return;
  }

  const masterIndex = JSON.parse(fs.readFileSync(MASTER_INDEX_PATH, 'utf8'));
  const canonicalBooks = masterIndex.books.filter(b => b.isCanonical && b.textLength > 0);

  console.log(`Processing ${canonicalBooks.length} canonical books...`);

  const allQuestions = [];
  const summaryBySubject = {};
  const summaryByType = {};
  const summaryByGrade = {};

  for (const bookMeta of canonicalBooks) {
    const filePath = path.join(BOOKS_DIR, bookMeta.fileName);
    if (!fs.existsSync(filePath)) continue;

    const bookData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const questions = extractQuestionsFromBook(bookMeta.fileName, bookData, bookMeta);

    allQuestions.push(...questions);

    // Stats
    summaryBySubject[bookMeta.subject] = (summaryBySubject[bookMeta.subject] || 0) + questions.length;
    summaryByGrade[bookMeta.grade] = (summaryByGrade[bookMeta.grade] || 0) + questions.length;

    for (const q of questions) {
      summaryByType[q.type] = (summaryByType[q.type] || 0) + 1;
    }
  }

  console.log(`\n✅ Extracted a total of ${allQuestions.length} questions.`);

  const summaryPayload = {
    totalQuestions: allQuestions.length,
    totalBooksCovered: canonicalBooks.length,
    byType: summaryByType,
    byGrade: summaryByGrade,
    bySubject: summaryBySubject,
  };

  const outputPayload = {
    meta: {
      title: 'بنك الأسئلة والتمارين الوزارية المعتمدة - حقيبة المدرس',
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      country: 'العراق',
      totalQuestions: allQuestions.length,
      totalBooksCovered: canonicalBooks.length,
    },
    summary: summaryPayload,
    questions: allQuestions,
  };

  // Write questions_bank.json
  fs.writeFileSync(OUTPUT_QUESTIONS_JSON, JSON.stringify(outputPayload, null, 2), 'utf8');
  console.log(`💾 Saved Questions Bank to: ${OUTPUT_QUESTIONS_JSON}`);

  // Write questions_bank_summary.json
  fs.writeFileSync(OUTPUT_SUMMARY_JSON, JSON.stringify({ meta: outputPayload.meta, summary: summaryPayload }, null, 2), 'utf8');
  console.log(`💾 Saved Summary to: ${OUTPUT_SUMMARY_JSON}`);

  // Generate TypeScript service in src/services/questionBankService.ts
  const tsServiceContent = `/**
 * خدمة بنك الأسئلة والتمارين الوزارية للمناهج العراقية.
 * تم توليدها وتحديثها آلياً من نصوص المناهج المعتمدة.
 */

export interface BankQuestion {
  id: string;
  bookFileName: string;
  bookTitle: string;
  stage: string;
  grade: string;
  subject: string;
  part: string;
  chapter: string;
  page: number;
  questionNumber: string;
  type:
    | 'mcq'
    | 'reasoning'
    | 'definition'
    | 'compare'
    | 'fill_blanks'
    | 'true_false'
    | 'enumerate'
    | 'calculation'
    | 'general';
  prompt: string;
  branches: string[];
  fullText: string;
}

export interface QuestionBankFilter {
  stage?: string;
  grade?: string;
  subject?: string;
  type?: BankQuestion['type'];
  chapter?: string;
  searchTerm?: string;
  limit?: number;
}

export interface QuestionBankSummary {
  totalQuestions: number;
  totalBooksCovered: number;
  byType: Record<string, number>;
  byGrade: Record<string, number>;
  bySubject: Record<string, number>;
}

export const QUESTION_BANK_SUMMARY: QuestionBankSummary = ${JSON.stringify(summaryPayload, null, 2)};
export const TOTAL_QUESTIONS_COUNT = ${allQuestions.length};
`;

  fs.writeFileSync(OUTPUT_TS_SERVICE, tsServiceContent, 'utf8');
  console.log(`✅ TypeScript Question Bank Service saved to: ${OUTPUT_TS_SERVICE}`);

  console.log('\n📊 === SUMMARY BREAKDOWN BY TYPE ===');
  console.log(summaryByType);
}

main();
