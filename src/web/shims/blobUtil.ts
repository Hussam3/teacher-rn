/**
 * محاكي نظام الملفات على الويب — تخزين في الذاكرة/localStorage مع دعم عناوين blob.
 *
 * الواجهة تتوافق مع react-native-blob-util التي تستخدمها خدمات التطبيق
 * (تنزيل الكتب، تصدير/استيراد النسخ الاحتياطية).
 */

const FS_PREFIX = 'web-fs:';
const memory = new Map<string, string>();

function fullPath(path: string): string {
  return FS_PREFIX + path;
}

export const fs = {
  dirs: {
    DocumentDir: '/web-fs/documents',
    CacheDir: '/web-fs/cache',
    DownloadDir: '/web-fs/downloads',
    SDCardDir: '/web-fs/sdcard',
    MainBundleDir: '/web-fs/bundle',
    DCIMDir: '/web-fs/dcim',
    PictureDir: '/web-fs/pictures',
    MusicDir: '/web-fs/music',
    MovieDir: '/web-fs/movies',
    ringToneDir: '/web-fs/ringtones',
  },

  async exists(path: string): Promise<boolean> {
    if (path === this.dirs.DocumentDir || path === this.dirs.CacheDir || path === this.dirs.DownloadDir) {
      return true;
    }
    return localStorage.getItem(fullPath(path)) !== null || memory.has(path);
  },

  async mkdir(): Promise<void> {
    // لا مجلدات حقيقية على الويب
  },

  async writeFile(path: string, content: string, _encoding?: string): Promise<void> {
    if (path.startsWith('blob:') || path.startsWith('data:')) {
      memory.set(path, content);
      return;
    }
    localStorage.setItem(fullPath(path), content);
  },

  async readFile(path: string, _encoding?: string): Promise<string> {
    const local = localStorage.getItem(fullPath(path));
    if (local !== null) return local;
    const mem = memory.get(path);
    if (mem !== undefined) return mem;
    const res = await fetch(path);
    if (!res.ok) throw new Error(`readFile failed: HTTP ${res.status}`);
    return res.text();
  },

  async unlink(path: string): Promise<void> {
    localStorage.removeItem(fullPath(path));
    memory.delete(path);
  },

  async isDir(path: string): Promise<boolean> {
    return path === this.dirs.DocumentDir || path === this.dirs.CacheDir || path === this.dirs.DownloadDir;
  },
};

/**
 * تحويل مسار الـ FS الافتراضي على الويب إلى Blob URL أو Data URL حقيقي للعرض في Iframe
 */
export function resolveFileUri(path: string): string {
  if (!path) return '';
  if (
    path.startsWith('blob:') ||
    path.startsWith('data:') ||
    path.startsWith('http://') ||
    path.startsWith('https://')
  ) {
    return path;
  }
  const mem = memory.get(path);
  if (mem) return mem;
  const local = localStorage.getItem(fullPath(path));
  if (local) {
    if (local.startsWith('blob:') || local.startsWith('data:') || local.startsWith('http')) return local;
  }
  return path;
}

/** تنزيل مباشر عبر fetch مع تقرير التقدم */
async function download(
  url: string,
  targetPath: string,
  onProgress?: (received: number, total: number) => void,
): Promise<{ path: string }> {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const total = Number(res.headers.get('content-length')) || 0;
    const blob = await res.blob();
    onProgress?.(blob.size, total);
    const objectUrl = URL.createObjectURL(blob);
    memory.set(targetPath, objectUrl);
    return { path: targetPath };
  } catch {
    // في حال حجب المتصفح للـ fetch المباشر (CORS) مع Google Drive
    downloadToSystem(url, targetPath.split('/').pop());
    memory.set(targetPath, url);
    return { path: url };
  }
}

/** تنزيل ملف PDF أو مرفق إلى نظام المتصفح */
export async function downloadToSystem(uri: string, filename?: string): Promise<void> {
  try {
    const a = document.createElement('a');
    a.href = uri;
    a.target = '_blank';
    a.download = filename ?? 'download.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch {
    if (typeof window !== 'undefined') {
      window.open(uri, '_blank');
    }
  }
}

function config(options: { path?: string }) {
  const targetPath = options.path ?? `/web-fs/downloads/${Date.now()}`;
  return {
    fetch(method: string, url: string) {
      return {
        progress(
          _opts: { interval?: number; count?: number },
          onProgress: (received: number, total: number) => void,
        ) {
          return download(url, targetPath, onProgress);
        },
      };
    },
  };
}

export default {
  fs,
  config,
  downloadToSystem,
  resolveFileUri,
};