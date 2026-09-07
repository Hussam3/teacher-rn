/**
 * محاكي توليد PDF على الويب — ينتج عنوان blob: صفحة HTML جاهزة للطباعة.
 */
export async function generatePDF(options: {
  html: string;
  fileName?: string;
  directory?: string;
  base64?: boolean;
}): Promise<{ filePath: string | null }> {
  const blob = new Blob([options.html], { type: 'text/html;charset=utf-8' });
  return { filePath: URL.createObjectURL(blob) };
}