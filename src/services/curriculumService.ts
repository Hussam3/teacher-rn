/**
 * خدمة المناهج — تنزيل وعرض كتب المنهج العراقي من Google Drive.
 */
import { Linking, Platform } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { findBook, toGoogleDrivePreviewUrl, toGoogleDriveDownloadUrl } from './curriculumCatalog';
import { findPdfLink } from './pdfCurriculumLinks';

export interface DownloadResult {
  /** رابط ملف PDF محفوظ داخل مساحة التطبيق */
  path: string;
}

const CURRICULUM_DIRECTORY = 'teacher_curriculum';

/** يميّز رابط العرض السحابي عن ملف يمكن قراءته من الجهاز. */
export function isRemotePdfUri(uri: string | null | undefined): boolean {
  return /^https?:\/\//i.test(uri ?? '');
}

function fileNameForBook(grade: string, subject: string): string {
  const safeSubject = subject.replace(/[/\\?%*:|"<>]/g, '_').trim();
  const safeGrade = grade.replace(/[/\\?%*:|"<>]/g, '_').trim();
  return `${safeSubject}_${safeGrade}.pdf`.replace(/\s+/g, '_');
}

function localBookPath(grade: string, subject: string): string {
  const { DocumentDir } = ReactNativeBlobUtil.fs.dirs;
  return `${DocumentDir}/${CURRICULUM_DIRECTORY}/${fileNameForBook(grade, subject)}`;
}

function asFileUri(path: string): string {
  return path.startsWith('file://') ? path : `file://${path}`;
}

/** يعيد النسخة المحفوظة إن كانت كاملة، دون أي طلب إلى الإنترنت. */
export async function findDownloadedBookPath(
  grade: string,
  subject: string,
): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  const path = localBookPath(grade, subject);
  if (!(await ReactNativeBlobUtil.fs.exists(path))) return null;

  try {
    const { size } = await ReactNativeBlobUtil.fs.stat(path);
    if (Number(size) > 0) return asFileUri(path);
  } catch {
    // يعاد تنزيل الملف الناقص أو غير القابل للقراءة عند توفر اتصال لاحقاً.
  }

  await ReactNativeBlobUtil.fs.unlink(path).catch(() => {});
  return null;
}

function responseContentType(headers: unknown): string {
  if (!headers || typeof headers !== 'object') return '';
  const header = Object.entries(headers as Record<string, unknown>).find(
    ([name]) => name.toLowerCase() === 'content-type',
  );
  return String(header?.[1] ?? '').toLowerCase();
}

/** إيجاد معرّف ملف Google Drive حسب المرحلة والصف والمادة */
export function findFileId(stage: string, grade: string, subject: string): string {
  const book = findBook({ subjectName: subject, grade, stage });
  if (book?.driveId) return book.driveId;

  const pdfLink = findPdfLink({ subjectName: subject, grade, stage });
  return pdfLink?.driveId ?? '';
}

/** إيجاد رابط العرض المباشر للكتاب بصيغة Preview للـ WebView و Iframe */
export function findViewUrl(stage: string, grade: string, subject: string): string | null {
  const book = findBook({ subjectName: subject, grade, stage });
  if (book?.viewUrl || book?.driveId) {
    return toGoogleDrivePreviewUrl(book.viewUrl, book.driveId);
  }

  const pdfLink = findPdfLink({ subjectName: subject, grade, stage });
  if (pdfLink?.viewUrl || pdfLink?.driveId) {
    return toGoogleDrivePreviewUrl(pdfLink.viewUrl, pdfLink.driveId);
  }

  return null;
}

/** إيجاد رابط التنزيل المباشر */
export function findDownloadUrl(stage: string, grade: string, subject: string): string | null {
  const fileId = findFileId(stage, grade, subject);
  if (fileId) {
    return toGoogleDriveDownloadUrl('', fileId);
  }

  const book = findBook({ subjectName: subject, grade, stage });
  if (book?.downloadUrl) return toGoogleDriveDownloadUrl(book.downloadUrl, book.driveId);

  const pdfLink = findPdfLink({ subjectName: subject, grade, stage });
  if (pdfLink?.downloadUrl) return toGoogleDriveDownloadUrl(pdfLink.downloadUrl, pdfLink.driveId);

  return null;
}

/**
 * تنزيل كتاب المنهج من Google Drive وحفظه محلياً مع تقرير التقدم.
 */
export async function downloadBook(
  stage: string,
  grade: string,
  subject: string,
  onProgress?: (progress: number) => void,
): Promise<DownloadResult> {
  // لا نطلب الشبكة مرة أخرى عندما يكون الكتاب محفوظاً بالفعل على الجهاز.
  const savedPath = await findDownloadedBookPath(grade, subject);
  if (savedPath) return { path: savedPath };

  const fileId = findFileId(stage, grade, subject);
  const downloadUrl = findDownloadUrl(stage, grade, subject);
  const previewUrl = findViewUrl(stage, grade, subject) || (fileId ? toGoogleDrivePreviewUrl('', fileId) : '');

  if (!downloadUrl) {
    throw new Error('رابط تحميل الكتاب غير متوفر حالياً لهذا الصف');
  }

  // على بيئة الويب: المتصفح يمنع fetch المباشر لـ Google Drive بسبب CORS
  if (Platform.OS === 'web') {
    try {
      await Linking.openURL(downloadUrl);
    } catch {
      // تجاهل
    }
    // إرجاع رابط العرض لكي يظل متاحاً للقراءة المباشرة داخل التطبيق
    return { path: previewUrl || downloadUrl };
  }

  // على بيئة التطبيق الأصلي (Android / iOS)
  const dirs = ReactNativeBlobUtil.fs.dirs;
  const dir = `${dirs.DocumentDir}/${CURRICULUM_DIRECTORY}`;
  const isDir = await ReactNativeBlobUtil.fs.exists(dir);
  if (!isDir) {
    await ReactNativeBlobUtil.fs.mkdir(dir);
  }
  const path = localBookPath(grade, subject);
  const tempPath = `${path}.tmp`;

  try {
    await ReactNativeBlobUtil.fs.unlink(tempPath).catch(() => {});
    const response = await ReactNativeBlobUtil.config({
      path: tempPath,
      fileCache: true,
      followRedirect: true,
      timeout: 120000,
    })
      .fetch('GET', downloadUrl, { Accept: 'application/pdf,*/*;q=0.8' })
      .progress({ interval: 200 }, (received, total) => {
        if (total > 0 && onProgress) {
          onProgress(received / total);
        }
      });

    const responseInfo = response.info();
    if (responseInfo.status < 200 || responseInfo.status >= 300) {
      throw new Error(`استجاب الخادم برمز ${responseInfo.status}`);
    }
    if (responseContentType(responseInfo.headers).includes('text/html')) {
      throw new Error('الخادم أعاد صفحة ويب بدلاً من ملف PDF');
    }

    const { size } = await ReactNativeBlobUtil.fs.stat(tempPath);
    if (Number(size) <= 0) {
      throw new Error('ملف PDF الذي تم تنزيله فارغ');
    }

    // لا نستبدل النسخة المكتملة إلا بعد تحقق التنزيل؛ لذلك تبقى صالحة دون إنترنت.
    await ReactNativeBlobUtil.fs.unlink(path).catch(() => {});
    await ReactNativeBlobUtil.fs.mv(tempPath, path);
    return { path: asFileUri(path) };
  } catch (err) {
    await ReactNativeBlobUtil.fs.unlink(tempPath).catch(() => {});
    throw new Error(
      `فشل في تنزيل الكتاب: ${err instanceof Error ? err.message : 'تأكد من الاتصال بالإنترنت'}`,
    );
  }
}
