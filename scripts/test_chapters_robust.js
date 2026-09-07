const fs = require('fs');
const path = require('path');

const BOOKS_DIR = path.join(__dirname, '..', 'json_books');

function cleanText(t) {
  if (!t) return '';
  return t
    .replace(/[ـ\u200B-\u200F\uFEFF\u202A-\u202E\u2066-\u2069\u200E\u200F]/g, '')
    .replace(/<[^>]+>/g, ' ') // remove html tags
    .replace(/[*_#`~]/g, '') // remove markdown symbols
    .replace(/\s+/g, ' ')
    .trim();
}

function extractChaptersRobust(pagesObj) {
  const chapters = [];
  const pageNums = Object.keys(pagesObj).sort((a, b) => parseInt(a) - parseInt(b));

  const ordinalMap = {
    'الاول': 'الأول', 'الاولى': 'الأولى', 'الول': 'الأول', 'الولى': 'الأولى', 'لاول': 'الأول', 'لاولى': 'الأولى',
    'الثاني': 'الثاني', 'الثانية': 'الثانية', 'الثانى': 'الثاني',
    'الثالث': 'الثالث', 'الثالثة': 'الثالثة',
    'الرابع': 'الرابع', 'الرابعة': 'الرابعة',
    'الخامس': 'الخامس', 'الخامسة': 'الخامسة',
    'السادس': 'السادس', 'السادسة': 'السادسة',
    'السابع': 'السابع', 'السابعة': 'السابعة',
    'الثامن': 'الثامن', 'الثامنة': 'الثامنة',
    'التاسع': 'التاسع', 'التاسعة': 'التاسعة',
    'العاشر': 'العاشر', 'العاشرة': 'العاشرة',
  };

  for (const pNum of pageNums) {
    const rawContent = pagesObj[pNum]?.content || '';
    if (!rawContent) continue;

    const lines = rawContent.split('\n').map(l => cleanText(l)).filter(l => l.length > 0);

    for (let i = 0; i < Math.min(lines.length, 10); i++) {
      const line = lines[i];

      // Check for Chapter / Unit / Part keywords
      const match = line.match(/(?:الفصل|الوحدة|الباب|المحور)\s+(?:ال[أاإآ]?ول[ىي]?|الثان[يىة]|الثالث[ة]?|الرابع[ة]?|الخامس[ة]?|السادس[ة]?|السابع[ة]?|الثامن[ة]?|التاسع[ة]?|العاشر[ة]?|[0-9]+)/i);
      
      // Also check if line has "الفصل" or "الوحدة" separated
      const hasChapterWord = /الف[ص]+ل|الوحد[ةه]|الباب/i.test(line);

      if (match || (hasChapterWord && line.length < 50)) {
        let title = line;
        // If next line is a subtitle, combine
        if (lines[i + 1] && lines[i + 1].length < 60 && !/الفصل|الوحدة|وزارة|جمهورية|المؤلف/i.test(lines[i + 1])) {
          title += ' : ' + lines[i + 1];
        }

        if (title.length >= 4 && title.length <= 90) {
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
  }

  return chapters;
}

const testFiles = [
  'كتاب الاجتماعيات اول متوسط.json',
  'كتاب الكيمياء السادس العلمي.json',
  'كتاب التاريخ السادس الادبي.json',
  'كتاب الاسلامية السادس الاعدادي (2).json',
  'كتاب الاحياء الثاني المتوسط.json',
  'كتاب الفيزياء الثالث المتوسط.json',
];

for (const file of testFiles) {
  const p = path.join(BOOKS_DIR, file);
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  const chapters = extractChaptersRobust(data.pages || {});
  console.log(`\nBook: ${file} (Found ${chapters.length} chapters):`);
  chapters.forEach(c => console.log(`  - [ص ${c.page}] ${c.title}`));
}

