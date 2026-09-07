/**
 * دالة تجزئة حتمية (FNV-1a 32-bit).
 * تُستخدم لتوليد ألوان ثابتة للمواد عبر الجلسات (بديل String.hashCode في Dart
 * غير المستقر بين التشغيلات).
 */
export function fnv1aHash(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** فهرس لوني ثابت في مدى معيّن */
export function stableIndex(input: string, size: number): number {
  return fnv1aHash(input) % size;
}
