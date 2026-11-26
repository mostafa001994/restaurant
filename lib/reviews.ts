// lib/reviews.ts
import { api } from '@/lib/api';

export interface Review {
  id: number;
  rating: number;
  comment: string | null;
  created_at: string;
  user?: { id: number; name: string };
}

export interface ReviewsResponse {
  reviews: Review[];
  average_rating: number;
  count: number;
}

export async function fetchProductReviews(productId: number): Promise<ReviewsResponse> {
  const res = await api.get(`/products/${productId}/reviews`);
  return res.data;
}

export async function fetchReviewEligibility(productId: number): Promise<{ can_review: boolean; already_reviewed: boolean }> {
  const res = await api.get(`/products/${productId}/reviews/eligibility`);
  return res.data;
}

export async function submitReview(productId: number, rating: number, comment: string) {
  const res = await api.post(`/products/${productId}/reviews`, { rating, comment });
  return res.data;
}
