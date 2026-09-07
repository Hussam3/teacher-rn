/**
 * محاكي MMKV على الويب — تخزين محلي عبر localStorage بنفس الواجهة.
 */
export interface MMKVInterface {
  getString(key: string): string | undefined;
  getNumber(key: string): number | undefined;
  getBoolean(key: string): boolean | undefined;
  set(key: string, value: string | number | boolean): void;
  remove(key: string): void;
  contains(key: string): boolean;
  clearAll(): void;
}

class WebMMKV implements MMKVInterface {
  private readonly prefix: string;

  constructor(id: string) {
    this.prefix = `mmkv:${id}:`;
  }

  private fullKey(key: string): string {
    return this.prefix + key;
  }

  getString(key: string): string | undefined {
    const raw = localStorage.getItem(this.fullKey(key));
    return raw === null ? undefined : raw;
  }

  getNumber(key: string): number | undefined {
    const raw = localStorage.getItem(this.fullKey(key));
    if (raw === null) return undefined;
    const n = Number(raw);
    return Number.isFinite(n) ? n : undefined;
  }

  getBoolean(key: string): boolean | undefined {
    const raw = localStorage.getItem(this.fullKey(key));
    if (raw === null) return undefined;
    return raw === 'true';
  }

  set(key: string, value: string | number | boolean): void {
    localStorage.setItem(this.fullKey(key), String(value));
  }

  remove(key: string): void {
    localStorage.removeItem(this.fullKey(key));
  }

  contains(key: string): boolean {
    return localStorage.getItem(this.fullKey(key)) !== null;
  }

  clearAll(): void {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i);
      if (k && k.startsWith(this.prefix)) keys.push(k);
    }
    keys.forEach(k => localStorage.removeItem(k));
  }
}

export function createMMKV(options: { id: string }): MMKVInterface {
  return new WebMMKV(options.id);
}