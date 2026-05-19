import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type SavedState = {
  savedBarIds: string[];
  toggleSavedBar: (barId: string) => void;
  clearSavedBars: () => void;
  isBarSaved: (barId: string) => boolean;
};

export const useSavedStore = create<SavedState>()(
  persist(
    (set, get) => ({
      savedBarIds: [],
      toggleSavedBar: (barId) =>
        set((state) => {
          if (state.savedBarIds.includes(barId)) {
            return { savedBarIds: state.savedBarIds.filter((savedBarId) => savedBarId !== barId) };
          }

          return { savedBarIds: [...state.savedBarIds, barId] };
        }),
      clearSavedBars: () => set({ savedBarIds: [] }),
      isBarSaved: (barId) => get().savedBarIds.includes(barId),
    }),
    {
      name: 'vesper-saved-bars',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ savedBarIds: state.savedBarIds }),
    },
  ),
);
