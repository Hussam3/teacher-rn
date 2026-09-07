/**
 * خدمة الملفات — اختيار ملفات PDF من الجهاز وتصدير/استيراد النسخ.
 */
import { pick, types } from '@react-native-documents/picker';
import ReactNativeBlobUtil from 'react-native-blob-util';
import Share from 'react-native-share';

export interface PickedFile {
  uri: string;
  name: string;
}

/** اختيار ملف PDF من الجهاز، أو null عند الإلغاء */
export async function pickPdf(): Promise<PickedFile | null> {
  try {
    const [result] = await pick({ type: [types.pdf] });
    if (!result) return null;
    return { uri: result.uri, name: result.name ?? 'document.pdf' };
  } catch {
    return null;
  }
}

/** تصدير محتوى نصي كملف عبر مشاركة النظام */
export async function exportTextFile(content: string, filename: string): Promise<void> {
  const path = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/${filename}`;
  await ReactNativeBlobUtil.fs.writeFile(path, content, 'utf8');
  await Share.open({ url: `file://${path}`, type: 'application/json', failOnCancel: false });
}

/** اختيار ملف نسخة احتياطية JSON وقراءة محتواه */
export async function pickJson(): Promise<string | null> {
  try {
    const [result] = await pick({ type: [types.allFiles] });
    if (!result) return null;
    const content = await ReactNativeBlobUtil.fs.readFile(result.uri, 'utf8');
    return content;
  } catch {
    return null;
  }
}
