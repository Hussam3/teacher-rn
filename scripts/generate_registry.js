const fs = require('fs');
const path = require('path');

const MASTER_INDEX_PATH = path.join(__dirname, '..', 'json_books', 'curriculum_master_index.json');
const OUTPUT_TS = path.join(__dirname, '..', 'src', 'services', 'curriculumRegistry.ts');

const masterIndex = JSON.parse(fs.readFileSync(MASTER_INDEX_PATH, 'utf8'));

// Build lookup maps
const bookMap = {};
for (const book of masterIndex.books) {
  if (book.isCanonical) {
    const key = `${book.grade}_${book.subject}_${book.part}`.replace(/\s+/g, '_');
    bookMap[key] = {
      id: book.id,
      fileName: book.fileName,
      title: book.title,
      stage: book.stage,
      grade: book.grade,
      subject: book.subject,
      part: book.part,
      totalPages: book.totalPages,
      chapters: book.chapters || [],
      questionSections: book.questionSections || [],
    };
  }
}

const tsContent = `/**
 * سجل المناهج والفصول المعتمدة في العراق.
 * تم توليده آلياً لضمان سرعة الوصول الفورية للفصول والأبواب بدون استهلاك شبكة.
 */

export interface RegistryBook {
  id: string;
  fileName: string;
  title: string;
  stage: string;
  grade: string;
  subject: string;
  part: string;
  totalPages: number;
  chapters: Array<{ title: string; page: number }>;
  questionSections: Array<{ title: string; page: number }>;
}

export const CANONICAL_REGISTRY: Record<string, RegistryBook> = ${JSON.stringify(bookMap, null, 2)};

/**
 * إيجاد بيانات الكتاب للمادة والصف
 */
export function findBookMeta(subjectName: string, grade: string, part = 'كامل'): RegistryBook | undefined {
  const normSubj = subjectName.trim();
  const normGrade = grade.trim();

  // Try exact key
  const exactKey = \`\${normGrade}_\${normSubj}_\${part}\`.replace(/\\s+/g, '_');
  if (CANONICAL_REGISTRY[exactKey]) return CANONICAL_REGISTRY[exactKey];

  // Try fuzzy match
  for (const book of Object.values(CANONICAL_REGISTRY)) {
    if (
      (book.grade.includes(normGrade) || normGrade.includes(book.grade)) &&
      (book.subject.includes(normSubj) || normSubj.includes(book.subject))
    ) {
      return book;
    }
  }

  return undefined;
}

/**
 * الحصول على قائمة فصول المادة والصف
 */
export function getChaptersList(subjectName: string, grade: string): Array<{ title: string; page: number }> {
  const meta = findBookMeta(subjectName, grade);
  return meta?.chapters ?? [];
}
`;

fs.writeFileSync(OUTPUT_TS, tsContent, 'utf8');
console.log(`✅ curriculumRegistry.ts generated successfully with ${Object.keys(bookMap).length} canonical books.`);

