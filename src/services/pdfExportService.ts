/**
 * تصدير ورقة الامتحان إلى موقع عام من ملفات الجهاز.
 *
 * ملفات PDF المولّدة عبر react-native-html-to-pdf تُحفظ داخل مخزن خاص
 * بالتطبيق (getExternalFilesDir) لا يظهر في مدير الملفات/المعرض، لذلك
 * تُنسخ هنا إلى MediaStore (مجلد التنزيلات العام) على أندرويد.
 */
import { Platform } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import type { EditorDocument } from '../shared/types/editor';
import { examPdfFileName, generateExamPdf } from './pdfService';

export interface ExamPdfExportResult {
  /** العنوان القابل للاستخدام (path على أندرويد/أخرى، أو content:// بعد النسخ). */
  uri: string;
  /** هل حُفظ الملف في مخزن عام ظاهر للمستخدم في تطبيق الملفات. */
  savedToDownloads: boolean;
}

/**
 * توليد ورقة الامتحان وحفظ نسخة منها في مجلد التنزيلات العام
 * (MediaStore) حتى تظهر للمستخدم في تطبيق الملفات/المعرض.
 */
export async function generateExamPdfToDownloads(
  doc: EditorDocument,
): Promise<ExamPdfExportResult> {
  const path = await generateExamPdf(doc);
  if (Platform.OS !== 'android' || !ReactNativeBlobUtil.MediaCollection) {
    return { uri: path, savedToDownloads: false };
  }
  try {
    const uri = await ReactNativeBlobUtil.MediaCollection.copyToMediaStore(
      {
        name: `${examPdfFileName(doc.title)}.pdf`,
        parentFolder: '',
        mimeType: 'application/pdf',
      },
      'Download',
      path,
    );
    return { uri, savedToDownloads: true };
  } catch {
    // النسخ فشل (منصات دون MediaStore أو حظر) — نعيد المسار الأصلي للأدوات الأخرى.
    return { uri: path, savedToDownloads: false };
  }
}