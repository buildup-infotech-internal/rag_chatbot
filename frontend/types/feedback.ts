export type FeedbackRating = 1 | -1;

export interface FeedbackRequest {
  message_id: number;
  rating: FeedbackRating;
  comment?: string | null;
}

export interface FeedbackSubmissionResponse {
  feedback_id: number;
  message_id: number;
  rating: number;
  updated_existing: boolean;
}

export interface FeedbackMessageInfo {
  session_id: string;
  role: string;
  content: string;
}

export interface FeedbackListItem {
  id: number;
  message_id: number;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
  message: FeedbackMessageInfo;
}

export interface FeedbackListResponse {
  items: FeedbackListItem[];
  total: number;
  limit: number;
  offset: number;
}
