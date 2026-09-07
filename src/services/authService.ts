/**
 * خدمة المصادقة — Google/Facebook عبر Supabase Auth (OAuth + PKCE) + وضع الضيف.
 *
 * يستخدم الهاتف الرابط العميق teacherbag://auth-callback، بينما يستخدم الويب
 * مسار /auth/callback في عنوان الموقع الحالي (مثل localhost:5174).
 */
import { Platform, Linking } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import type { AppUser } from '../shared/types/domain';
import { subjectRepo } from '../data/repositories';
import { settingsRepo } from '../data/repositories/settingsRepo';
import { newId } from '../shared/utils/id';
import { todayISO } from '../shared/utils/date';
import { supabase } from './supabase';
import { AUTH_REDIRECT_URL } from './supabaseConfig';
import { initCloudSync, startCloudSync, stopCloudSync } from './cloudSyncService';

type OAuthProvider = 'google' | 'facebook';

interface BrowserLocation {
  href: string;
  origin: string;
}

interface BrowserHistory {
  replaceState: (data: unknown, title: string, url?: string | null) => void;
}

export const GUEST_UID = 'guest_user_id';
export const GUEST_USER: AppUser = {
  uid: GUEST_UID,
  displayName: 'مدرس ضيف',
  email: 'guest@bag.iq',
  photoUrl: null,
  isGuest: true,
};

// تهيئة جسر المزامنة (مرة واحدة عند تحميل الوحدة)
initCloudSync();

function mapSession(session: Session): AppUser {
  const meta = (session.user.user_metadata ?? {}) as Record<string, unknown>;
  return {
    uid: session.user.id,
    displayName:
      (meta.full_name as string | undefined) ??
      (meta.name as string | undefined) ??
      session.user.email ??
      null,
    email: session.user.email ?? null,
    photoUrl:
      (meta.avatar_url as string | undefined) ??
      (meta.picture as string | undefined) ??
      null,
    isGuest: false,
  };
}

function getBrowserLocation(): BrowserLocation | null {
  const location = (globalThis as { location?: Partial<BrowserLocation> }).location;
  if (!location || typeof location.href !== 'string' || typeof location.origin !== 'string') {
    return null;
  }
  return location as BrowserLocation;
}

/** رابط العودة المناسب للمنصة الحالية */
function getOAuthRedirectUrl(): string {
  if (Platform.OS !== 'web') return AUTH_REDIRECT_URL;
  const origin = getBrowserLocation()?.origin ?? 'http://localhost:5174';
  return `${origin}/auth/callback`;
}

function isAuthCallbackUrl(url: string): boolean {
  if (url.startsWith(AUTH_REDIRECT_URL)) return true;
  const origin = getBrowserLocation()?.origin;
  return Boolean(origin && url.startsWith(`${origin}/auth/callback`));
}

function clearWebAuthUrl(): void {
  if (Platform.OS !== 'web') return;
  const history = (globalThis as { history?: BrowserHistory }).history;
  history?.replaceState({}, '', '/');
}

/** استخراج المعاملات من الرابط العميق (fragment أو query) */
function extractUrlParams(url: string): Record<string, string> {
  const hashIndex = url.indexOf('#');
  const queryIndex = url.indexOf('?');
  const params: Record<string, string> = {};
  const rawParts: string[] = [];
  if (queryIndex >= 0) {
    rawParts.push(url.slice(queryIndex + 1, hashIndex >= 0 ? hashIndex : undefined));
  }
  if (hashIndex >= 0) rawParts.push(url.slice(hashIndex + 1));
  for (const raw of rawParts) {
    for (const pair of raw.split('&')) {
      const eq = pair.indexOf('=');
      if (eq <= 0) continue;
      const k = pair.slice(0, eq);
      const v = pair.slice(eq + 1);
      try {
        params[decodeURIComponent(k)] = decodeURIComponent(v.replace(/\+/g, ' '));
      } catch {}
    }
  }
  return params;
}

/** معالجة نتيجة تسجيل الدخول الواردة عبر الرابط العميق */
async function handleAuthUrl(url: string): Promise<boolean> {
  if (!isAuthCallbackUrl(url)) return false;
  const params = extractUrlParams(url);
  if (params.error) {
    throw new Error(params.error_description ?? params.error);
  }
  if (params.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (error) throw new Error(error.message);
  } else if (params.access_token && params.refresh_token) {
    const { error } = await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    });
    if (error) throw new Error(error.message);
  } else {
    return false;
  }
  clearWebAuthUrl();
  return true;
}

/**
 * تهيئة معالج الروابط العميقة عند تشغيل التطبيق.
 * تُستدعى قبل استعادة الجلسة في RootNavigator وتُعيد دالة إلغاء الاشتراك.
 */
export async function initSupabaseAuth(): Promise<() => void> {
  const sub = Linking.addEventListener('url', ({ url }) => {
    handleAuthUrl(url).catch(() => {});
  });
  try {
    const initialUrl =
      (await Linking.getInitialURL()) ??
      (Platform.OS === 'web' ? getBrowserLocation()?.href ?? null : null);
    if (initialUrl) await handleAuthUrl(initialUrl);
  } catch {
    // فشل رابط قديم أو غير مكتمل لا يمنع تشغيل التطبيق
  }
  return () => sub.remove();
}

/** زرع البيانات الأولية عند أول دخول كضيف */
function seedDefaultSubjects(): void {
  const existing = subjectRepo.list();
  if (existing.length > 0) return;

  const year = String(new Date().getFullYear());
  const now = todayISO();

  subjectRepo.saveAll([
    {
      id: newId(),
      name: 'الرياضيات',
      stage: 'الابتدائية',
      grade: 'الصف الخامس الابتدائي',
      year,
      pdfUri: null,
      pdfBase64: null,
      createdAt: now,
    },
    {
      id: newId(),
      name: 'العلوم',
      stage: 'الابتدائية',
      grade: 'الصف الخامس الابتدائي',
      year,
      pdfUri: null,
      pdfBase64: null,
      createdAt: now,
    },
    {
      id: newId(),
      name: 'الفيزياء',
      stage: 'المتوسطة',
      grade: 'الصف الثالث المتوسط',
      year,
      pdfUri: null,
      pdfBase64: null,
      createdAt: now,
    },
  ]);
}

/** الدخول كضيف (يعمل دائماً بدون إنترنت) */
export async function signInAsGuest(): Promise<AppUser> {
  stopCloudSync();
  settingsRepo.setIsGuest(true);
  seedDefaultSubjects();
  return GUEST_USER;
}

/** انتظار اكتمال جلسة OAuth على الهاتف بعد العودة من المتصفح */
function waitForOAuthSession(): Promise<AppUser> {
  return new Promise((resolve, reject) => {
    let settled = false;
    let subscription: { unsubscribe: () => void } | null = null;
    const cleanup = () => {
      subscription?.unsubscribe();
      subscription = null;
    };
    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error('انتهت مهلة تسجيل الدخول'));
    }, 180000);

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        clearTimeout(timeout);
        if (settled) return;
        settled = true;
        cleanup();
        resolve(mapSession(session));
      }
    });
    subscription = data.subscription;
  });
}

async function signInWithProvider(provider: OAuthProvider): Promise<AppUser | null> {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: getOAuthRedirectUrl(),
        // Supabase يعيد توجيه المتصفح بنفسه على الويب؛ الهاتف يفتح الرابط يدوياً.
        skipBrowserRedirect: Platform.OS !== 'web',
      },
    });
    if (error) throw new Error(error.message);
    if (!data.url) throw new Error('تعذر فتح صفحة تسجيل الدخول');
    if (Platform.OS === 'web') {
      // حصل Supabase على عنوان OAuth ونفّذ window.location.assign داخلياً.
      return null;
    }
    await Linking.openURL(data.url);
    const user = await waitForOAuthSession();
    settingsRepo.setIsGuest(false);
    await startCloudSync(user.uid);
    return user;
  } catch (e) {
    throw new Error(e instanceof Error && e.message ? e.message : 'فشل تسجيل الدخول');
  }
}

/** الدخول عبر جوجل (Supabase OAuth) */
export function signInWithGoogle(): Promise<AppUser | null> {
  return signInWithProvider('google');
}

/** الدخول عبر فيسبوك (Supabase OAuth) */
export function signInWithFacebook(): Promise<AppUser | null> {
  return signInWithProvider('facebook');
}

/** استعادة جلسة الدخول عند بدء التشغيل (ضيف أو حساب جوجل محفوظ) */
export async function restoreSession(): Promise<AppUser | null> {
  if (isGuestSession()) {
    return GUEST_USER;
  }
  try {
    const { data } = await supabase.auth.getSession();
    if (!data.session) return null;
    const user = mapSession(data.session);
    settingsRepo.setIsGuest(false);
    // لا ننتظر المزامنة حتى لا تتعطل شاشة التحميل
    startCloudSync(user.uid).catch(() => {});
    return user;
  } catch {
    return null;
  }
}

/** تسجيل الخروج */
export async function signOutUser(): Promise<void> {
  stopCloudSync();
  settingsRepo.setIsGuest(false);
  try {
    await supabase.auth.signOut();
  } catch {}
}

/** حذف حساب Supabase وبياناته السحابية المرتبطة من داخل التطبيق. */
export async function deleteCurrentAccount(): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    throw new Error('سجّل الدخول أولاً لحذف الحساب');
  }

  const { data, error } = await supabase.functions.invoke('delete-account', {
    body: {},
  });
  if (error) {
    const context = (error as unknown as {
      context?: { json?: () => Promise<unknown> };
    }).context;
    const body = await context?.json?.().catch(() => null);
    const message = (body as { error?: unknown } | null)?.error;
    throw new Error(
      typeof message === 'string' && message.trim() ? message : error.message,
    );
  }
  if ((data as { deleted?: unknown } | null)?.deleted !== true) {
    throw new Error('تعذر تأكيد حذف الحساب');
  }

  stopCloudSync();
  settingsRepo.setIsGuest(false);
  await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
}

/** هل المستخدم ضيف حالياً (من التخزين)؟ */
export function isGuestSession(): boolean {
  return settingsRepo.get().isGuest;
}

/**
 * مستمع لحدث SIGNED_IN على الويب.
 *
 * عندما يُفعَّل detectSessionInUrl، يعالج Supabase SDK الـ callback تلقائياً
 * ويُطلق حدث SIGNED_IN. هذه الدالة تستمع لهذا الحدث وتحدّث حالة المصادقة
 * في authStore لينتقل التطبيق من شاشة الدخول إلى الشاشة الرئيسية.
 */
export function onWebAuthSignedIn(): () => void {
  const { useAuthStore } = require('../features/auth/authStore') as {
    useAuthStore: {
      setState: (state: { user: AppUser | null; initializing: boolean }) => void;
    };
  };

  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) {
      const user = mapSession(session);
      settingsRepo.setIsGuest(false);
      useAuthStore.setState({ user, initializing: false });
      clearWebAuthUrl();
      // بدء المزامنة في الخلفية دون حجب الواجهة
      startCloudSync(user.uid).catch(() => {});
    } else if (event === 'SIGNED_OUT') {
      useAuthStore.setState({ user: null, initializing: false });
    }
  });

  return () => data.subscription.unsubscribe();
}
