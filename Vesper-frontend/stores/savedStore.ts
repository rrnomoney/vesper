import { create } from 'zustand';

import type { Bar } from '../data/bars';
import { getAuthToken } from '../lib/authSession';
import { addFavorite, getFavorites, removeFavorite } from '../lib/favorites';

type SavedState = {
  savedBars: Bar[];
  savedBarIds: string[];
  isLoading: boolean;
  errorMessage: string | null;
  syncingBarIds: string[];
  loadFavorites: () => Promise<void>;
  addSavedBar: (barId: string) => Promise<void>;
  removeSavedBar: (barId: string) => Promise<void>;
  toggleSavedBar: (barId: string) => Promise<void>;
  clearSavedBars: () => void;
  isBarSaved: (barId: string) => boolean;
};

function getMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unable to update favorites.';
}

export const useSavedStore = create<SavedState>()((set, get) => ({
  savedBars: [],
  savedBarIds: [],
  isLoading: false,
  errorMessage: null,
  syncingBarIds: [],
  loadFavorites: async () => {
    if (!getAuthToken()) {
      set({ savedBars: [], savedBarIds: [], errorMessage: null, isLoading: false });
      return;
    }

    set({ isLoading: true, errorMessage: null });

    try {
      const savedBars = await getFavorites();
      set({
        savedBars,
        savedBarIds: savedBars.map((bar) => bar.id),
        isLoading: false,
      });
    } catch (error) {
      set({ errorMessage: getMessage(error), isLoading: false });
    }
  },
  addSavedBar: async (barId) => {
    const state = get();
    if (!getAuthToken()) {
      set({ errorMessage: 'Please log in to save places.' });
      return;
    }

    if (state.savedBarIds.includes(barId) || state.syncingBarIds.includes(barId)) {
      return;
    }

    set({ syncingBarIds: [...state.syncingBarIds, barId], errorMessage: null });

    try {
      await addFavorite(barId);
      await get().loadFavorites();
    } catch (error) {
      set({ errorMessage: getMessage(error) });
    } finally {
      set((nextState) => ({
        syncingBarIds: nextState.syncingBarIds.filter((syncingBarId) => syncingBarId !== barId),
      }));
    }
  },
  removeSavedBar: async (barId) => {
    const state = get();
    if (!getAuthToken()) {
      set({ errorMessage: 'Please log in to update saved places.' });
      return;
    }

    if (!state.savedBarIds.includes(barId) || state.syncingBarIds.includes(barId)) {
      return;
    }

    set({ syncingBarIds: [...state.syncingBarIds, barId], errorMessage: null });

    try {
      await removeFavorite(barId);
      set((nextState) => ({
        savedBars: nextState.savedBars.filter((bar) => bar.id !== barId),
        savedBarIds: nextState.savedBarIds.filter((savedBarId) => savedBarId !== barId),
      }));
    } catch (error) {
      set({ errorMessage: getMessage(error) });
    } finally {
      set((nextState) => ({
        syncingBarIds: nextState.syncingBarIds.filter((syncingBarId) => syncingBarId !== barId),
      }));
    }
  },
  toggleSavedBar: async (barId) => {
    if (get().savedBarIds.includes(barId)) {
      await get().removeSavedBar(barId);
      return;
    }

    await get().addSavedBar(barId);
  },
  clearSavedBars: () => set({ savedBars: [], savedBarIds: [] }),
  isBarSaved: (barId) => get().savedBarIds.includes(barId),
}));
