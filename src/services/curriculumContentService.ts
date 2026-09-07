/**
 * خدمة محتوى المناهج العراقية — ربط وتزويد الذكاء الاصطناعي بنصوص المنهج الفعلي.
 */
import { getChaptersList } from './curriculumRegistry';

export interface CurriculumExcerptParams {
  subjectName: string;
  grade: string;
  stage?: string;
  chapterTitle?: string;
  startPage?: number;
  endPage?: number;
  topic?: string;
  maxChars?: number;
}

export interface ChapterInfo {
  title: string;
  page: number;
}

/**
 * البحث عن قائمة الفصول المتوفرة للمادة والصف المحدد
 */
export function getSubjectChapters(subjectName: string, grade: string): ChapterInfo[] {
  return getChaptersList(subjectName, grade);
}

/**
 * تنظيف نصوص المنهج وتنسيقها لتناسب سياق الذكاء الاصطناعي (Prompt Grounding)
 */
export function formatCurriculumContextForAI(params: {
  subjectName: string;
  grade: string;
  chapterTitle?: string;
  topic?: string;
  contentSnippet?: string;
  pageRange?: string;
}): string {
  const parts: string[] = [];

  parts.push(`=== المنهج العراقي الرسمي المعتمد ===`);
  parts.push(`المادة: ${params.subjectName}`);
  parts.push(`الصف / المرحلة: ${params.grade}`);

  if (params.chapterTitle) {
    parts.push(`الفصل / الوحدة: ${params.chapterTitle}`);
  }
  if (params.topic) {
    parts.push(`موضوع الدرس: ${params.topic}`);
  }
  if (params.pageRange) {
    parts.push(`نطاق الصفحات: ${params.pageRange}`);
  }

  if (params.contentSnippet && params.contentSnippet.trim().length > 0) {
    parts.push(`\nنصوص ومحتوى الدرس من الكتاب المدرسي:`);
    parts.push(params.contentSnippet.trim());
  }

  return parts.join('\n');
}

/**
 * محرك استخراج سياق المنهج الذكي
 */
export const curriculumContentService = {
  getChapters: getSubjectChapters,
  formatContext: formatCurriculumContextForAI,
};
