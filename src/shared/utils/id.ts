/**
 * مولّد المعرّفات الفريدة.
 */
import uuid from 'react-native-uuid';

/** توليد معرّف UUID v4 */
export function newId(): string {
  return uuid.v4() as string;
}
