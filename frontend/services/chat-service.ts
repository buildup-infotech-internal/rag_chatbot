import { apiClient } from './api';
import {
  ChatHistoryResponse,
  ChatRequest,
  ChatResponse,
  ChatSessionListResponse,
} from '@/types/chat';

export async function sendChatMessage(data: ChatRequest): Promise<ChatResponse> {
  // Ensure no extra fields are passed because backend uses extra="forbid"
  const payload: { question: string; session_id?: string | null } = {
    question: data.question.trim(),
  };

  if (data.session_id) {
    payload.session_id = data.session_id;
  }

  return apiClient<ChatResponse>('/api/chat', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getChatHistory(sessionId: string): Promise<ChatHistoryResponse> {
  return apiClient<ChatHistoryResponse>(`/api/chat/${sessionId}`, {
    method: 'GET',
  });
}

export async function getChatSessions(
  limit: number = 20,
  offset: number = 0
): Promise<ChatSessionListResponse> {
  return apiClient<ChatSessionListResponse>('/api/chat/sessions', {
    method: 'GET',
    params: { limit, offset },
  });
}
