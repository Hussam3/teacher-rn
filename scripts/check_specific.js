const fs = require('fs');
const path = require('path');

const BOOKS_DIR = path.join(__dirname, '..', 'json_books');

const specific = [
  '_⁨كتاب_الرياضيات_الثالث_المتوسط_2026_مع_التقليص_الجديد⁩.json',
  'كتاب الرياضيات الثاني المتوسط.json',
  'كتاب الاحياء السادس العلمي.json',
  'كتاب الاحياء المنقح 2025.json',
  'كتاب_الاحياء_المؤشر_سالم_ال_منصور_السادس_العلمي_2025_الفصل_الاول.json',
  'كتاب الفرنسي المرحلة المتوسطة المنهج الجديد.json',
  'كتاب_الطالب_الفرنسي_اول_متوسط_المنهج_الجديد.json',
  'كتاب_الطالب_الفرنسي_الثاني_متوسط_المنهج_الجديد.json',
];

for (const file of fs.readdirSync(BOOKS_DIR)) {
  if (file.includes('رياضيات') || file.includes('الرياضيات') || file.includes('فرنسي') || file.includes('احياء') || file.includes('الاحياء')) {
    const p = path.join(BOOKS_DIR, file);
    try {
      const d = JSON.parse(fs.readFileSync(p, 'utf8'));
      const len = Object.values(d.pages || {}).reduce((acc, page) => acc + (page.content || '').length, 0);
      console.log(`"${file}" -> Size: ${(fs.statSync(p).size/1024).toFixed(1)} KB, Pages: ${d.total_pages}, Chars: ${len}`);
    } catch (e) {}
  }
}

