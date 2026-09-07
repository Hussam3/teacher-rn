/** عمليات المسودات المسماة، منفصلة لتبقى سهلة الاختبار وإعادة الاستخدام. */
import type { EditorDocument } from '../../shared/types/editor';

const WORKING_DOCUMENT_ID = 'current';

export function createNamedDraft(
  document: EditorDocument,
  title: string,
  id: string,
  updatedAt: string,
): EditorDocument {
  return {
    ...document,
    id,
    title: title.trim(),
    updatedAt,
  };
}

export function listNamedDrafts(documents: EditorDocument[]): EditorDocument[] {
  return documents
    .filter(document => document.id !== WORKING_DOCUMENT_ID)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function restoreNamedDraft(
  draft: EditorDocument,
  updatedAt: string,
): EditorDocument {
  return {
    ...draft,
    id: WORKING_DOCUMENT_ID,
    updatedAt,
  };
}
