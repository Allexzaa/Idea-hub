import { create } from 'zustand';
import { User } from '../types/auth.types';
import * as authService from '../services/auth.service';

interface AuthStore {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  loadFromStorage: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,

  /**
   * Set authentication state
   */
  setAuth: (user, accessToken, refreshToken) => {
    // Save to localStorage
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);

    // Update state
    set({
      user,
      accessToken,
      refreshToken,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  /**
   * Logout and clear state
   */
  logout: () => {
    // Clear localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    // Clear state
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });

    // Call logout API
    authService.logout().catch(() => {
      // Silent fail
    });
  },

  /**
   * Load auth state from localStorage on app start
   */
  loadFromStorage: () => {
    try {
      const userStr = localStorage.getItem('user');
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');

      if (userStr && accessToken && refreshToken) {
        const user = JSON.parse(userStr);
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Failed to load auth from storage:', error);
      set({ isLoading: false });
    }
  },

  /**
   * Check if user is still authenticated by calling API
   */
  checkAuth: async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        set({ isLoading: false });
        return;
      }

      const user = await authService.getCurrentUser();
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      // Token is invalid, logout
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
      localStorage.clear();
    }
  },
}));
