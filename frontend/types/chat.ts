export interface SourceReference {
  source_filename: string;
  page_number: number;
}

export interface ChatRequest {
  question: string;
  session_id?: string | null;
}

export interface ChatResponse {
  session_id: string;
  answer: string;
  sources: SourceReference[];
  message_id: number;
}

export interface ChatMessageResponse {
  id: number;
  role: 'user' | 'assistant' | string;
  content: string;
  sources: SourceReference[] | null;
  created_at: string;
}

export interface ChatHistoryResponse {
  session_id: string;
  messages: ChatMessageResponse[];
}

export interface ChatSessionListItem {
  session_id: string;
  created_at: string;
  last_activity_at: string | null;
}

export interface ChatSessionListResponse {
  items: ChatSessionListItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface LocalChatMessage {
  id: number | string; // Can be string for optimistic temporary message, but backend message_id is number
  role: 'user' | 'assistant';
  content: string;
  sources?: SourceReference[];
  created_at: string;
  backendId?: number; // Real backend message_id required for feedback
  isPending?: boolean;
  error?: string;
}
