/**
 * محاكي المشاركة على الويب — Web Share API مع بدائل (حفظ ملف / نسخ نص).
 */

const FS_PREFIX = 'web-fs:';

function blobForPath(path: string, mime: string): Blob | null {
  const content = localStorage.getItem(FS_PREFIX + path);
  if (content === null) return null;
  return new Blob([content], { type: mime });
}

function triggerDownload(blobUrl: string, filename: string): void {
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

interface ShareOptions {
  url?: string;
  message?: string;
  title?: string;
  type?: string;
  failOnCancel?: boolean;
}

async function open(options: ShareOptions): Promise<void> {
  const nav = navigator as any;

  // ملف محلي من نظام الملفات الافتراضي (web-fs)
  if (options.url?.startsWith('file://')) {
    const path = options.url.replace('file://', '');
    const mime = options.type ?? 'application/octet-stream';
    const blob = blobForPath(path, mime);
    if (!blob) throw new Error('الملف غير موجود');
    const url = URL.createObjectURL(blob);
    const filename = path.split('/').pop() ?? 'file';
    if (nav.canShare?.({ files: [new File([blob], filename, { type: mime })] })) {
      try {
        await nav.share({ files: [new File([blob], filename, { type: mime })], title: options.title });
        return;
      } catch {
        /* انتقل للبديل */
      }
    }
    triggerDownload(url, filename);
    return;
  }

  const data: any = {};
  if (options.url) data.url = options.url;
  if (options.message) data.text = options.message;
  if (options.title) data.title = options.title;

  if (nav.share) {
    try {
      await nav.share(data);
      return;
    } catch (e: any) {
      if (options.failOnCancel === false) return;
      if (e?.name === 'AbortError') return;
      // خلاف ذلك انتقل للبديل
    }
  }

  // البديل: نسخ النص إلى الحافظة أو فتح الرابط
  if (options.message && !options.url) {
    try {
      await navigator.clipboard.writeText(options.message);
    } catch {
      /* تجاهل */
    }
    return;
  }
  if (options.url) {
    window.open(options.url, '_blank', 'noopener');
  }
}

export default { open };