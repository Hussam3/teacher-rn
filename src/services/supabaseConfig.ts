/**
 * إعدادات Supabase المركزية — Google/Facebook وقاعدة البيانات السحابية.
 *
 * من إعدادات المشروع في Supabase Dashboard:
 *   - Project Settings → API → Project URL / Publishable key
 *   - Authentication → Providers → فعّل Google أو Facebook
 *   - Authentication → URL Configuration → Redirect URLs:
 *     أضف teacherbag://auth-callback و http://localhost:5174/auth/callback
 */
export const SUPABASE_URL = 'https://yqqedfjadgyktiohkuwg.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY =
  'sb_publishable_3Hw8ucxqC03yi7dC4zkDog_fFZvcyzk';

/** مخطط الروابط العميقة (Deep Link) لاستقبال نتيجة تسجيل الدخول */
export const APP_SCHEME = 'teacherbag';
export const AUTH_REDIRECT_PATH = 'auth-callback';
export const AUTH_REDIRECT_URL = `${APP_SCHEME}://${AUTH_REDIRECT_PATH}`;
