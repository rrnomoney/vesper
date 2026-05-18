import { create } from 'zustand';

type SavedState = {
  savedBarIds: string[];
  toggleSavedBar: (barId: string) => void;
  isBarSaved: (barId: string) => boolean;
};

export const useSavedStore = create<SavedState>()((set, get) => ({
  savedBarIds: [],
  toggleSavedBar: (barId) =>
    set((state) => {
      if (state.savedBarIds.includes(barId)) {
        return { savedBarIds: state.savedBarIds.filter((savedBarId) => savedBarId !== barId) };
      }

      return { savedBarIds: [...state.savedBarIds, barId] };
    }),
  isBarSaved: (barId) => get().savedBarIds.includes(barId),
}));
