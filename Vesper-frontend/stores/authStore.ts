import { create } from 'zustand';

import { getMe, login, register, type LoginPayload, type RegisterPayload, type UserVO } from '../lib/auth';
import { clearAuthToken, restoreAuthToken, setAuthToken, setUnauthorizedHandler } from '../lib/authSession';
import { useReviewStore } from './reviewStore';
import { useSavedStore } from './savedStore';
import { useVisitedStore } from './visitedStore';

type AuthState = {
  user: UserVO | null;
  isInitializing: boolean;
  isLoading: boolean;
  errorMessage: string | null;
  restoreSession: () => Promise<void>;
  login: (payload: LoginPayload) => Promise<boolean>;
  register: (payload: RegisterPayload) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
};

function getMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Authentication failed.';
}

export const useAuthStore = create<AuthState>()((set, get) => {
  setUnauthorizedHandler(() => {
    void get().logout();
  });

  return {
    user: null,
    isInitializing: true,
    isLoading: false,
    errorMessage: null,
    restoreSession: async () => {
      set({ isInitializing: true, errorMessage: null });

      try {
        const token = await restoreAuthToken();
        if (!token) {
          set({ user: null, isInitializing: false });
          return;
        }

        const user = await getMe();
        set({ user, isInitializing: false });
      } catch {
        await clearAuthToken();
        set({ user: null, isInitializing: false });
      }
    },
    login: async (payload) => {
      set({ isLoading: true, errorMessage: null });

      try {
        const auth = await login(payload);
        await setAuthToken(auth.token);
        set({ user: auth.user, isLoading: false });
        return true;
      } catch (error) {
        set({ errorMessage: getMessage(error), isLoading: false });
        return false;
      }
    },
    register: async (payload) => {
      set({ isLoading: true, errorMessage: null });

      try {
        const auth = await register(payload);
        await setAuthToken(auth.token);
        set({ user: auth.user, isLoading: false });
        return true;
      } catch (error) {
        set({ errorMessage: getMessage(error), isLoading: false });
        return false;
      }
    },
    logout: async () => {
      await clearAuthToken();
      useReviewStore.getState().clearMyReviews();
      useSavedStore.getState().clearSavedBars();
      useVisitedStore.getState().clearVisitedBars();
      set({ user: null, isLoading: false, errorMessage: null });
    },
    clearError: () => set({ errorMessage: null }),
  };
});
