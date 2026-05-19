import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type CheckInState = {
  visitedBarIds: string[];
  checkInBar: (barId: string) => void;
  removeCheckIn: (barId: string) => void;
  clearCheckIns: () => void;
  isBarVisited: (barId: string) => boolean;
  visitedCount: () => number;
};

export const useCheckInStore = create<CheckInState>()(
  persist(
    (set, get) => ({
      visitedBarIds: [],
      checkInBar: (barId) =>
        set((state) => {
          if (state.visitedBarIds.includes(barId)) {
            return state;
          }

          return { visitedBarIds: [...state.visitedBarIds, barId] };
        }),
      removeCheckIn: (barId) =>
        set((state) => ({
          visitedBarIds: state.visitedBarIds.filter((visitedBarId) => visitedBarId !== barId),
        })),
      clearCheckIns: () => set({ visitedBarIds: [] }),
      isBarVisited: (barId) => get().visitedBarIds.includes(barId),
      visitedCount: () => get().visitedBarIds.length,
    }),
    {
      name: 'vesper-check-ins',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ visitedBarIds: state.visitedBarIds }),
    },
  ),
);
