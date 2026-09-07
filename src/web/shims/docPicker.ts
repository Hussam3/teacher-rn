/**
 * محاكي اختيار الملفات على الويب — عبر عنصر input من المتصفح.
 */
export const types = {
  allFiles: '*/*',
  images: 'image/*',
  pdf: 'application/pdf',
  audio: 'audio/*',
  video: 'video/*',
  plainText: 'text/plain',
  json: 'application/json',
} as const;

export interface PickedDocument {
  uri: string;
  name?: string;
  type?: string;
  size?: number;
  fileCopyUri?: string;
}

export async function pick(options?: { type?: string[]; multiple?: boolean; copyTo?: string }): Promise<PickedDocument[]> {
  return new Promise(resolve => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = (options?.type ?? []).join(',') || '*/*';
    input.multiple = options?.multiple === true;
    input.style.display = 'none';

    const cleanup = () => {
      window.removeEventListener('focus', onFocus);
      document.body.removeChild(input);
    };
    const onFocus = () => {
      setTimeout(() => {
        if (!input.files?.length) {
          cleanup();
          resolve([]);
        }
      }, 400);
    };

    input.onchange = () => {
      const files = Array.from(input.files ?? []);
      cleanup();
      const results = files.map(file => ({
        uri: URL.createObjectURL(file),
        name: file.name,
        type: file.type,
        size: file.size,
      }));
      resolve(results);
    };

    document.body.appendChild(input);
    window.addEventListener('focus', onFocus);
    input.click();
  });
}