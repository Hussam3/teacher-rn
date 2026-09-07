/**
 * مصنع مستودعات المجموعات — يوفر CRUD عام لكل كيان له معرّف.
 * كل تغيير محلي يُبلغ جسر المزامنة ليُدفع إلى السحابة تلقائياً.
 */
import { readJSON, writeJSON } from '../../shared/lib/storage';
import { notifyLocalChange } from '../syncBridge';

export interface CollectionRepo<T extends { id: string }> {
  list(): T[];
  get(id: string): T | undefined;
  save(entity: T): void;
  saveAll(entities: T[]): void;
  remove(id: string): void;
  clear(): void;
}

export function createCollectionRepo<T extends { id: string }>(
  key: string,
): CollectionRepo<T> {
  return {
    list(): T[] {
      const map = readJSON<Record<string, T>>(key, {});
      return Object.values(map);
    },
    get(id: string): T | undefined {
      const map = readJSON<Record<string, T>>(key, {});
      return map[id];
    },
    save(entity: T): void {
      const map = readJSON<Record<string, T>>(key, {});
      map[entity.id] = entity;
      writeJSON(key, map);
      notifyLocalChange(key, map);
    },
    saveAll(entities: T[]): void {
      const map: Record<string, T> = {};
      for (const e of entities) {
        map[e.id] = e;
      }
      writeJSON(key, map);
      notifyLocalChange(key, map);
    },
    remove(id: string): void {
      const map = readJSON<Record<string, T>>(key, {});
      delete map[id];
      writeJSON(key, map);
      notifyLocalChange(key, map);
    },
    clear(): void {
      writeJSON(key, {});
      notifyLocalChange(key, {});
    },
  };
}
