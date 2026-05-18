import { create } from 'zustand';

type CheckInState = {
  visitedBarIds: string[];
  checkInBar: (barId: string) => void;
  removeCheckIn: (barId: string) => void;
  isBarVisited: (barId: string) => boolean;
  visitedCount: () => number;
};

export const useCheckInStore = create<CheckInState>()((set, get) => ({
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
  isBarVisited: (barId) => get().visitedBarIds.includes(barId),
  visitedCount: () => get().visitedBarIds.length,
}));
