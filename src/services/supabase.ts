/**
 * عميل Supabase الموحّد — مصادقة جوجل + قاعدة البيانات السحابية.
 *
 * جلسة المستخدم تُحفظ في AsyncStorage (تُستعاد عند فتح التطبيق من جديد)،
 * و PKCE مُفعّل افتراضياً لحماية تدفق تسجيل الدخول عبر الرابط العميق.
 */
import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import { storage } from '../shared/lib/storage';
import {
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
} from './supabaseConfig';

/**
 * محوّل تخزين الجلسة المتوافق مع Supabase عبر MMKV السريع
 */
const mmkvAuthStorage = {
  getItem: (key: string): Promise<string | null> => {
    const val = storage.getString(key);
    return Promise.resolve(val ?? null);
  },
  setItem: (key: string, value: string): Promise<void> => {
    storage.set(key, value);
    return Promise.resolve();
  },
  removeItem: (key: string): Promise<void> => {
    storage.remove(key);
    return Promise.resolve();
  },
};

/**
 * على الويب: تفعيل detectSessionInUrl ليعالج Supabase SDK
 * رابط الـ callback (يستخرج code ويُبادله بالجلسة تلقائياً).
 * على الهاتف: إبقاؤه false لأن الروابط العميقة تُعالج يدوياً.
 */
const isWeb = Platform.OS === 'web';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: mmkvAuthStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: isWeb,
    flowType: 'pkce',
  },
});

