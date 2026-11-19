import { apiClient } from './api';
import {
  FeedbackListResponse,
  FeedbackRating,
  FeedbackRequest,
  FeedbackSubmissionResponse,
} from '@/types/feedback';

export async function submitFeedback(data: FeedbackRequest): Promise<FeedbackSubmissionResponse> {
  // Ensure no extra fields are passed because backend uses extra="forbid"
  const payload: { message_id: number; rating: FeedbackRating; comment?: string | null } = {
    message_id: data.message_id,
    rating: data.rating,
  };

  if (data.comment !== undefined && data.comment !== null && data.comment.trim() !== '') {
    payload.comment = data.comment.trim();
  }

  return apiClient<FeedbackSubmissionResponse>('/api/feedback', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getFeedbackList(
  limit: number = 20,
  offset: number = 0,
  rating?: FeedbackRating
): Promise<FeedbackListResponse> {
  const params: Record<string, string | number | undefined> = {
    limit,
    offset,
  };

  if (rating !== undefined) {
    params.rating = rating;
  }

  return apiClient<FeedbackListResponse>('/api/feedback', {
    method: 'GET',
    params,
  });
}
