import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import type { Profile } from '../types';
import * as authService from '../services/auth';

function friendlyError(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes('rate limit') || lower.includes('too many'))
    return 'Too many attempts. Please wait a minute and try again.';
  if (lower.includes('invalid login'))
    return 'Invalid email or password. Please try again.';
  if (lower.includes('already registered') || lower.includes('already been registered'))
    return 'This email is already registered. Try signing in instead.';
  if (lower.includes('not configured'))
    return 'Backend not connected. Please check Supabase configuration.';
  if (lower.includes('network') || lower.includes('fetch'))
    return 'Network error. Please check your internet connection.';
  return msg;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;

  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  loading: false,
  error: null,
  initialized: false,

  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
  clearError: () => set({ error: null }),

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const data = await authService.loginUser(email, password);
      set({
        user: data.user,
        session: data.session,
        loading: false,
      });
      // Fetch profile
      if (data.user) {
        const profile = await authService.getProfile(data.user.id);
        set({ profile });
      }
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : 'Login failed';
      const message = friendlyError(raw);
      set({ loading: false, error: message });
      throw err;
    }
  },

  register: async (email, password, fullName) => {
    set({ loading: true, error: null });
    try {
      const data = await authService.registerUser(email, password, fullName);
      set({
        user: data.user,
        session: data.session,
        loading: false,
      });
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : 'Registration failed';
      const message = friendlyError(raw);
      set({ loading: false, error: message });
      throw err;
    }
  },

  logout: async () => {
    set({ loading: true });
    try {
      await authService.logoutUser();
      set({
        user: null,
        session: null,
        profile: null,
        loading: false,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Logout failed';
      set({ loading: false, error: message });
    }
  },

  initialize: async () => {
    if (get().initialized) return;
    try {
      const session = await authService.getCurrentSession();
      if (session?.user) {
        const profile = await authService.getProfile(session.user.id);
        set({
          user: session.user,
          session,
          profile,
          initialized: true,
        });
      } else {
        set({ initialized: true });
      }
    } catch {
      set({ initialized: true });
    }
  },
}));
