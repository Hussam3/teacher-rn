/**
 * بيانات المناهج — خريطة (مرحلة ← صف ← مادة ← معرّف ملف Google Drive).
 * تم تحديثها من الفهرس الشامل لملفات PDF وروابط المناهج العراقية (124 كتاب).
 */
import { ALL_CURRICULUM_BOOKS } from '../../services/curriculumCatalog';

export type CurriculumMap = Record<string, Record<string, Record<string, string>>>;

export const curriculumData: CurriculumMap = {
  الابتدائية: {
    'الأول الابتدائي': {},
    'الثاني الابتدائي': {},
    'الثالث الابتدائي': {},
    'الرابع الابتدائي': {},
    'الخامس الابتدائي': {},
    'السادس الابتدائي': {},
  },
  المتوسطة: {
    'الأول المتوسط': {},
    'الثاني المتوسط': {},
    'الثالث المتوسط': {},
  },
  الإعدادية: {
    'الرابع الإعدادي': {},
    'الخامس الإعدادي': {},
    'السادس الإعدادي': {},
  },
};

// ملء البيانات آلياً من الكتالوج الشامل
for (const book of ALL_CURRICULUM_BOOKS) {
  const stageKey = book.stage.includes('ابتدائي')
    ? 'الابتدائية'
    : book.stage.includes('متوسط')
    ? 'المتوسطة'
    : 'الإعدادية';

  if (!curriculumData[stageKey]) {
    curriculumData[stageKey] = {};
  }
  const currentStage = curriculumData[stageKey];
  if (currentStage) {
    if (!currentStage[book.grade]) {
      currentStage[book.grade] = {};
    }
    const currentGrade = currentStage[book.grade];
    if (currentGrade) {
      currentGrade[book.title] = book.driveId;
      currentGrade[book.subjectName] = book.driveId;
    }
  }
}
