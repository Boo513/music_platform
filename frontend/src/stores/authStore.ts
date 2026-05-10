import { create } from 'zustand';
import type { User } from '@/types';
import { authApi } from '@/api/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, nickname?: string) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token'),
  isLoggedIn: !!localStorage.getItem('token'),

  login: async (username, password) => {
    const res = await authApi.login(username, password);
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    set({ token: res.data.token, user: res.data.user, isLoggedIn: true });
  },

  register: async (username, password, nickname) => {
    await authApi.register(username, password, nickname);
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null, isLoggedIn: false });
  },

  fetchMe: async () => {
    try {
      const res = await authApi.getMe();
      localStorage.setItem('user', JSON.stringify(res.data));
      set({ user: res.data });
    } catch {
      set({ user: null, isLoggedIn: false });
    }
  },
}));
