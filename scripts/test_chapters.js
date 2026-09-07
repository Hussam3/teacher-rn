const fs = require('fs');
const path = require('path');

const BOOKS_DIR = path.join(__dirname, '..', 'json_books');

function extractChapters(pagesObj) {
  const chapters = [];
  const pageNums = Object.keys(pagesObj).sort((a, b) => parseInt(a) - parseInt(b));

  const chapterPatterns = [
    /^(?:#+\s*)?(الفصل\s+[^\n\r]+)/m,
    /^(?:#+\s*)?(الوحدة\s+[^\n\r]+)/m,
    /^(?:#+\s*)?(الباب\s+[^\n\r]+)/m,
    /^(?:#+\s*)?(المحور\s+[^\n\r]+)/m,
    /<mark>(الفصل\s+[^<]+)<\/mark>/i,
    /<mark>(الوحدة\s+[^<]+)<\/mark>/i,
    /<mark>(الباب\s+[^<]+)<\/mark>/i,
  ];

  for (const pNum of pageNums) {
    const content = pagesObj[pNum]?.content || '';
    if (!content) continue;

    for (const pat of chapterPatterns) {
      const match = content.match(pat);
      if (match && match[1]) {
        const title = match[1]
          .replace(/[*_#<>\/]/g, '')
          .replace(/mark/g, '')
          .replace(/\s+/g, ' ')
          .trim();
        
        // Only keep if meaningful title length
        if (title.length >= 6 && title.length <= 80) {
          // Avoid duplicate nearby titles
          const isRecentDup = chapters.some(c => c.title === title || Math.abs(c.page - parseInt(pNum)) <= 1);
          if (!isRecentDup) {
            chapters.push({
              page: parseInt(pNum),
              title,
            });
          }
        }
      }
    }
  }

  return chapters;
}

// Test on some books
const testFiles = [
  'كتاب الاجتماعيات اول متوسط.json',
  'كتاب الكيمياء السادس العلمي.json',
  'كتاب التاريخ السادس الادبي.json',
  'كتاب الاسلامية السادس الاعدادي (2).json',
];

for (const file of testFiles) {
  const p = path.join(BOOKS_DIR, file);
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  const chapters = extractChapters(data.pages || {});
  console.log(`\nBook: ${file} (Found ${chapters.length} chapters):`);
  chapters.slice(0, 8).forEach(c => console.log(`  - [ص ${c.page}] ${c.title}`));
}

