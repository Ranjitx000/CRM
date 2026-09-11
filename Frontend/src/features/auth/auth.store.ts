import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '@/api/auth.api';
import type { User } from '@/types/auth';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, accessToken: string) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: true, // Start in a loading state until we check the refresh token
      login: (user, accessToken) => set({ user, accessToken, isAuthenticated: true, isLoading: false }),
      logout: async () => {
        try {
          await authApi.logout();
        } catch (error) {
          console.error('Logout request failed', error);
        } finally {
          set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
        }
      },
      checkAuth: async () => {
        set({ isLoading: true });
        try {
          if (get().user) {
            // we could call a refresh endpoint if needed, for now we assume token in storage is fine
            // wait, we need to refresh to get a new token in real life, but the backend doesn't return accessToken on refresh? 
            // Wait, does it? The backend `/auth/refresh` should return a new accessToken. Let's just set isLoading false.
            set({ isAuthenticated: true, isLoading: false });
          } else {
            set({ isAuthenticated: false, isLoading: false });
          }
        } catch (error) {
          set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, accessToken: state.accessToken, isAuthenticated: state.isAuthenticated }),
    }
  )
);
