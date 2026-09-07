const fs = require('fs');
const path = require('path');

const BOOKS_DIR = path.join(__dirname, '..', 'json_books');

const sampleBooks = [
  'كتاب الكيمياء الثالث المتوسط.json',
  'كتاب الفيزياء السادس العلمي.json',
  'كتاب التاريخ السادس الادبي.json',
  'كتاب الاسلامية الخامس الاعدادي (2).json',
  'كتاب الرياضيات الثاني المتوسط.json',
  'كتاب الاجتماعيات اول متوسط.json',
  'كتاب الاحياء الخامس الاعدادي.json',
  'كتاب_العربي_السادس_الاعدادي_الجزء_الاول (2).json'
];

for (const file of sampleBooks) {
  const p = path.join(BOOKS_DIR, file);
  if (!fs.existsSync(p)) continue;
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));

  console.log(`\n======================================================`);
  console.log(`BOOK: ${file}`);
  console.log(`======================================================`);

  for (const [pNum, page] of Object.entries(data.pages || {})) {
    const content = page.content || '';
    if (/أسئلة|اسئلة|المناقشة|المناقشه|التمرينات|تأكد من فهمك|تدرب وحل/i.test(content)) {
      const lines = content.split('\n').filter(l => l.trim().length > 0);
      const matchHeader = lines.find(l => /أسئلة|اسئلة|المناقشة|المناقشه|التمرينات|تأكد من فهمك/i.test(l));
      console.log(`\n--- [ص ${pNum}] Header: ${matchHeader?.slice(0, 80)} ---`);
      console.log(lines.slice(0, 6).join('\n'));
    }
  }
}

