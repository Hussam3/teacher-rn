import { Linking } from 'react-native';
import { supabase } from '../services/supabase';

export const ADMIN_AUTH_REDIRECT_URL = 'teacherbagadmin://auth-callback';

function extractUrlParams(url: string): Record<string, string> {
  const hashIndex = url.indexOf('#');
  const queryIndex = url.indexOf('?');
  const parts: string[] = [];
  const params: Record<string, string> = {};

  if (queryIndex >= 0) {
    parts.push(
      url.slice(queryIndex + 1, hashIndex >= 0 ? hashIndex : undefined),
    );
  }
  if (hashIndex >= 0) parts.push(url.slice(hashIndex + 1));

  for (const part of parts) {
    for (const pair of part.split('&')) {
      const separator = pair.indexOf('=');
      if (separator <= 0) continue;
      try {
        params[decodeURIComponent(pair.slice(0, separator))] =
          decodeURIComponent(pair.slice(separator + 1).replace(/\+/g, ' '));
      } catch {}
    }
  }
  return params;
}

async function handleAuthUrl(url: string): Promise<void> {
  if (!url.startsWith(ADMIN_AUTH_REDIRECT_URL)) return;
  const params = extractUrlParams(url);
  if (params.error) {
    throw new Error(params.error_description ?? params.error);
  }
  if (params.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (error) throw error;
    return;
  }
  if (params.access_token && params.refresh_token) {
    const { error } = await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    });
    if (error) throw error;
    return;
  }
  throw new Error('تعذر إكمال تسجيل الدخول.');
}

/** يستقبل رابط Google العائد للتطبيق المستقل فقط. */
export async function initAdminAuth(
  onError: (message: string) => void,
): Promise<() => void> {
  const processUrl = (url: string) => {
    handleAuthUrl(url).catch(error => {
      onError(error instanceof Error ? error.message : 'فشل تسجيل الدخول.');
    });
  };
  const subscription = Linking.addEventListener('url', ({ url }) =>
    processUrl(url),
  );
  try {
    const initialUrl = await Linking.getInitialURL();
    if (initialUrl) processUrl(initialUrl);
  } catch {
    // رابط قديم أو غير مكتمل لا يمنع فتح التطبيق.
  }
  return () => subscription.remove();
}

export async function signInAdminWithGoogle(): Promise<void> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: ADMIN_AUTH_REDIRECT_URL,
      skipBrowserRedirect: true,
    },
  });
  if (error) throw error;
  if (!data.url) throw new Error('تعذر فتح صفحة تسجيل الدخول بجوجل.');
  await Linking.openURL(data.url);
}
