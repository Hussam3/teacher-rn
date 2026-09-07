/**
 * مخزن المصادقة (Zustand) — حالة المستخدم الحالي.
 */
import { create } from 'zustand';
import type { AppUser } from '../../shared/types/domain';
import {
  restoreSession,
  signInAsGuest,
  signInWithFacebook,
  signInWithGoogle,
  deleteCurrentAccount,
  signOutUser,
} from '../../services/authService';

interface AuthState {
  user: AppUser | null;
  initializing: boolean;
  setInitializing: (v: boolean) => void;
  loginAsGuest: () => Promise<AppUser>;
  loginWithGoogle: () => Promise<AppUser | null>;
  loginWithFacebook: () => Promise<AppUser | null>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

export const useAuthStore = create<AuthState>(set => ({
  user: null,
  initializing: true,

  setInitializing: v => set({ initializing: v }),

  loginAsGuest: async () => {
    const user = await signInAsGuest();
    set({ user });
    return user;
  },

  loginWithGoogle: async () => {
    const user = await signInWithGoogle();
    if (user) set({ user });
    return user;
  },

  loginWithFacebook: async () => {
    const user = await signInWithFacebook();
    if (user) set({ user });
    return user;
  },

  logout: async () => {
    await signOutUser();
    set({ user: null });
  },

  deleteAccount: async () => {
    await deleteCurrentAccount();
    set({ user: null });
  },
}));

/** تهيئة حالة المصادقة عند بدء التشغيل — تعيد الجلسة المحفوظة (ضيف أو جوجل) */
export async function initAuth(): Promise<void> {
  useAuthStore.setState({ initializing: true });
  const user = await restoreSession();
  useAuthStore.setState({ user, initializing: false });
}
