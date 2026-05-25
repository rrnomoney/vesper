import { create } from 'zustand';

import { getAuthToken } from '../lib/authSession';
import { getMyReviews, type ReviewVO } from '../lib/reviews';

type ReviewState = {
  myReviews: ReviewVO[];
  isLoading: boolean;
  errorMessage: string | null;
  setMyReviews: (reviews: ReviewVO[]) => void;
  addMyReview: (review: ReviewVO) => void;
  refreshMyReviews: (options?: { showLoading?: boolean }) => Promise<void>;
  clearMyReviews: () => void;
};

function getMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unable to load reviews.';
}

export const useReviewStore = create<ReviewState>()((set, get) => ({
  myReviews: [],
  isLoading: false,
  errorMessage: null,
  setMyReviews: (reviews) => set({ myReviews: Array.isArray(reviews) ? reviews : [], errorMessage: null }),
  addMyReview: (review) =>
    set((state) => ({
      myReviews: [review, ...state.myReviews.filter((item) => item.id !== review.id)],
      errorMessage: null,
    })),
  refreshMyReviews: async (options) => {
    if (!getAuthToken()) {
      set({ myReviews: [], errorMessage: null, isLoading: false });
      return;
    }

    const shouldShowLoading = options?.showLoading ?? get().myReviews.length === 0;
    if (shouldShowLoading) {
      set({ isLoading: true });
    }
    set({ errorMessage: null });

    try {
      const reviews = await getMyReviews();
      set({ myReviews: Array.isArray(reviews) ? reviews : [], isLoading: false });
    } catch (error) {
      set({ errorMessage: getMessage(error), isLoading: false });
    }
  },
  clearMyReviews: () => set({ myReviews: [], errorMessage: null, isLoading: false }),
}));
