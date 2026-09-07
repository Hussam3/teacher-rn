const fs = require('fs');
const path = require('path');

const BOOKS_DIR = path.join(__dirname, '..', 'json_books');

const pairs = [
  ['كتاب الاسلامية الخامس الاعدادي.json', 'كتاب الاسلامية الخامس الاعدادي (2).json'],
  ['كتاب الاسلامية السادس الاعدادي.json', 'كتاب الاسلامية السادس الاعدادي (2).json'],
  ['كتاب الحاسوب الخامس الاعدادي.json', 'كتاب الحاسوب الخامس الاعدادي (2).json'],
  ['كتاب_العربي_الخامس_الاعدادي_الجزء_الاول.json', 'كتاب_العربي_الخامس_الاعدادي_الجزء_الاول (2).json'],
  ['كتاب_العربي_الخامس_الاعدادي_الجزء_الثاني.json', 'كتاب_العربي_الخامس_الاعدادي_الجزء_الثاني (2).json'],
  ['كتاب_العربي_السادس_الاعدادي_الجزء_الاول.json', 'كتاب_العربي_السادس_الاعدادي_الجزء_الاول (2).json'],
  ['كتاب_العربي_السادس_الاعدادي_الجزء_الثاني.json', 'كتاب_العربي_السادس_الاعدادي_الجزء_الثاني (2).json'],
  ['كتاب_اللغة_العربية_الصف_الثالث_متوسط2026.json', 'كتاب_اللغة_العربية_الصف_الثالث_متوسط2026_1.json'],
];

for (const [f1, f2] of pairs) {
  const p1 = path.join(BOOKS_DIR, f1);
  const p2 = path.join(BOOKS_DIR, f2);
  const c1 = fs.readFileSync(p1, 'utf8');
  const c2 = fs.readFileSync(p2, 'utf8');
  const d1 = JSON.parse(c1);
  const d2 = JSON.parse(c2);

  const len1 = Object.values(d1.pages || {}).reduce((acc, p) => acc + (p.content || '').length, 0);
  const len2 = Object.values(d2.pages || {}).reduce((acc, p) => acc + (p.content || '').length, 0);

  console.log(`\nCompare:`);
  console.log(`  File 1: "${f1}" -> Size: ${(fs.statSync(p1).size/1024).toFixed(1)} KB, Chars: ${len1}, Pages: ${d1.total_pages}`);
  console.log(`  File 2: "${f2}" -> Size: ${(fs.statSync(p2).size/1024).toFixed(1)} KB, Chars: ${len2}, Pages: ${d2.total_pages}`);
}

