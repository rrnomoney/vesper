import { apiDelete, apiGet, apiPost } from './api';

export type ReviewVO = {
  id: number;
  barId: number;
  barName: string | null;
  userId: number;
  username: string | null;
  rating: number;
  content: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type CreateReviewPayload = {
  barId: number;
  rating: number;
  content: string;
};

export async function createReview(payload: CreateReviewPayload) {
  return apiPost<ReviewVO>('/reviews', payload, { auth: true });
}

export async function getBarReviews(barId: string | number) {
  const reviews = await apiGet<ReviewVO[] | null>(`/bars/${barId}/reviews`);
  return Array.isArray(reviews) ? reviews : [];
}

export async function getMyReviews() {
  const reviews = await apiGet<ReviewVO[] | null>('/users/me/reviews', undefined, { auth: true });
  return Array.isArray(reviews) ? reviews : [];
}

export async function deleteReview(reviewId: string | number) {
  await apiDelete<void>(`/reviews/${reviewId}`, { auth: true });
}
