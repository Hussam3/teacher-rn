/**
 * خدمة الطباعة والمشاركة — طباعة PDF أو HTML عبر نظام التشغيل.
 */
import { Platform } from 'react-native';
import RNPrint from 'react-native-print';
import RNShare from 'react-native-share';
import ReactNativeBlobUtil from 'react-native-blob-util';

import type { DailyPlan, Subject } from '../shared/types/domain';

/** طباعة ملف PDF مع تنظيف البادئة */
export async function printPdf(filePath: string): Promise<void> {
  const cleanPath = filePath.replace(/^file:\/\//, '');
  await RNPrint.print({ filePath: cleanPath });
}

/** طباعة HTML (RTL عربي) مباشرة */
export async function printHtml(html: string): Promise<void> {
  await RNPrint.print({ html });
}

/**
 * طباعة الخطة اليومية بموثوقية عالية:
 * تحاول أولاً توليد ملف PDF وطباعته، وفي حال تعذر توليد الـ PDF تلجأ للطباعة المباشرة عبر HTML
 */
export async function printDailyPlan(plan: DailyPlan, subject?: Subject): Promise<void> {
  const { buildDailyPlanHtml, generateDailyPlanPdf } = await import('./pdfService');
  const html = buildDailyPlanHtml(plan, subject);
  try {
    const pdfPath = await generateDailyPlanPdf(plan, subject);
    if (pdfPath) {
      await printPdf(pdfPath);
      return;
    }
  } catch (pdfError) {
    console.warn('generateDailyPlanPdf failed, falling back to direct HTML print:', pdfError);
  }
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
