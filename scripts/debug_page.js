const fs = require('fs');
const path = require('path');

const BOOKS_DIR = path.join(__dirname, '..', 'json_books');
const p = path.join(BOOKS_DIR, 'كتاب الاجتماعيات اول متوسط.json');
const data = JSON.parse(fs.readFileSync(p, 'utf8'));

console.log('--- Page 13 raw content ---');
console.log(JSON.stringify(data.pages['13'].content));

console.log('\n--- Page 13 split by newlines ---');
data.pages['13'].content.split('\n').forEach((l, i) => {
  console.log(`Line ${i}: ${JSON.stringify(l)}`);
});

