import { create } from 'zustand';
import { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const getStoredUser = (): User | null => {
  try {
    const raw = localStorage.getItem('saral_qa_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  user: getStoredUser(),
  token: localStorage.getItem('saral_qa_token'),
  isAuthenticated: !!localStorage.getItem('saral_qa_token'),

  login: (token: string, user: User) => {
    localStorage.setItem('saral_qa_token', token);
    localStorage.setItem('saral_qa_user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('saral_qa_token');
    localStorage.removeItem('saral_qa_user');
    set({ token: null, user: null, isAuthenticated: false });
  },
}));
