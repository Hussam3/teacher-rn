/**
 * خدمة الطباعة والمشاركة — طباعة PDF أو HTML عبر نظام التشغيل.
 */
import { Platform } from 'react-native';
import RNPrint from 'react-native-print';
import RNShare from 'react-native-share';
import ReactNativeBlobUtil from 'react-native-blob-util';

/** طباعة ملف PDF */
export async function printPdf(filePath: string): Promise<void> {
  await RNPrint.print({ filePath });
}

/** طباعة HTML (RTL عربي) مباشرة */
export async function printHtml(html: string): Promise<void> {
  await RNPrint.print({ html });
}

/** مشاركة ملف PDF */
export async function sharePdf(filePath: string, message?: string): Promise<void> {
  let url = `file://${filePath}`;
  // على أندرويد، ملفات html-to-pdf تكون في مجلد خاص بالتطبيق
  // (getExternalFilesDir) خارج مسارات FileProvider الخاصة بـ react-native-share،
  // لذا ننسخ الملف إلى ذاكرة التخزين المؤقت (المغطاة في share_download_paths).
  if (Platform.OS === 'android' && ReactNativeBlobUtil.fs?.dirs?.CacheDir) {
    const cachePath = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/share_${Date.now()}.pdf`;
    const content = await ReactNativeBlobUtil.fs.readFile(filePath, 'base64');
    await ReactNativeBlobUtil.fs.writeFile(cachePath, content, 'base64');
    url = `file://${cachePath}`;
  }
  await RNShare.open({
    url,
    type: 'application/pdf',
    message,
    failOnCancel: false,
  });
}

/** مشاركة نص */
export async function shareText(text: string): Promise<void> {
  await RNShare.open({
    message: text,
    title: 'مشاركة مستند من حقيبة المدرس',
  });
}
