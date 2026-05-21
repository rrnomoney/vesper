import { create } from 'zustand';

import type { Bar } from '../data/bars';
import { getAuthToken } from '../lib/authSession';
import { addVisited, getVisited, removeVisited } from '../lib/visited';

type VisitedState = {
  visitedBars: Bar[];
  visitedBarIds: string[];
  isLoading: boolean;
  errorMessage: string | null;
  syncingBarIds: string[];
  loadVisited: () => Promise<void>;
  addVisitedBar: (barId: string) => Promise<void>;
  removeVisitedBar: (barId: string) => Promise<void>;
  toggleVisitedBar: (barId: string) => Promise<void>;
  clearVisitedBars: () => void;
  isBarVisited: (barId: string) => boolean;
};

function getMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unable to update visited places.';
}

export const useVisitedStore = create<VisitedState>()((set, get) => ({
  visitedBars: [],
  visitedBarIds: [],
  isLoading: false,
  errorMessage: null,
  syncingBarIds: [],
  loadVisited: async () => {
    if (!getAuthToken()) {
      set({ visitedBars: [], visitedBarIds: [], errorMessage: null, isLoading: false });
      return;
    }

    set({ isLoading: true, errorMessage: null });

    try {
      const visitedBars = await getVisited();
      set({
        visitedBars,
        visitedBarIds: visitedBars.map((bar) => bar.id),
        isLoading: false,
      });
    } catch (error) {
      set({ errorMessage: getMessage(error), isLoading: false });
    }
  },
  addVisitedBar: async (barId) => {
    const state = get();
    if (!getAuthToken()) {
      set({ errorMessage: 'Please log in to light up places.' });
      return;
    }

    if (state.visitedBarIds.includes(barId) || state.syncingBarIds.includes(barId)) {
      return;
    }

    set({ syncingBarIds: [...state.syncingBarIds, barId], errorMessage: null });

    try {
      await addVisited(barId);
      await get().loadVisited();
    } catch (error) {
      set({ errorMessage: getMessage(error) });
    } finally {
      set((nextState) => ({
        syncingBarIds: nextState.syncingBarIds.filter((syncingBarId) => syncingBarId !== barId),
      }));
    }
  },
  removeVisitedBar: async (barId) => {
    const state = get();
    if (!getAuthToken()) {
      set({ errorMessage: 'Please log in to update visited places.' });
      return;
    }

    if (!state.visitedBarIds.includes(barId) || state.syncingBarIds.includes(barId)) {
      return;
    }

    set({ syncingBarIds: [...state.syncingBarIds, barId], errorMessage: null });

    try {
      await removeVisited(barId);
      set((nextState) => ({
        visitedBars: nextState.visitedBars.filter((bar) => bar.id !== barId),
        visitedBarIds: nextState.visitedBarIds.filter((visitedBarId) => visitedBarId !== barId),
      }));
    } catch (error) {
      set({ errorMessage: getMessage(error) });
    } finally {
      set((nextState) => ({
        syncingBarIds: nextState.syncingBarIds.filter((syncingBarId) => syncingBarId !== barId),
      }));
    }
  },
  toggleVisitedBar: async (barId) => {
    if (get().visitedBarIds.includes(barId)) {
      await get().removeVisitedBar(barId);
      return;
    }

    await get().addVisitedBar(barId);
  },
  clearVisitedBars: () => set({ visitedBars: [], visitedBarIds: [] }),
  isBarVisited: (barId) => get().visitedBarIds.includes(barId),
}));
