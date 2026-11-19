'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { LocalChatMessage } from '@/types/chat';
import { sendChatMessage, getChatHistory } from '@/services/chat-service';
import { useSession } from '@/context/SessionContext';
import { useToast } from '@/components/ui/Toast';
import { AppApiError } from '@/types/api';

export function useChat() {
  const { sessionId, setConfirmedSessionId, clearSession, refreshSessions } = useSession();
  const { addToast } = useToast();

  const [messages, setMessages] = useState<LocalChatMessage[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [lastError, setLastError] = useState<string | null>(null);

  // Track the current active session in a ref for callbacks
  const activeSessionRef = useRef<string | null>(sessionId);
  useEffect(() => {
    activeSessionRef.current = sessionId;
  }, [sessionId]);

  // Load chat history whenever sessionId changes
  useEffect(() => {
    if (!sessionId) {
      setMessages([]);
      return;
    }

    let isSubscribed = true;
    setIsLoadingHistory(true);
    setLastError(null);

    getChatHistory(sessionId)
      .then((history) => {
        if (!isSubscribed) return;
        if (history && history.messages) {
          const mapped: LocalChatMessage[] = history.messages.map((m) => ({
            id: m.id,
            role: m.role as 'user' | 'assistant',
            content: m.content,
            sources: m.sources || undefined,
            created_at: m.created_at,
            backendId: m.role === 'assistant' ? m.id : undefined,
          }));
          setMessages(mapped);
        } else {
          setMessages([]);
        }
      })
      .catch((err: unknown) => {
        if (!isSubscribed) return;
        // If the session doesn't exist on backend (e.g. invalid/purged ID), clear it cleanly
        if (err instanceof AppApiError && (err.statusCode === 404 || err.code === 'not_found')) {
          clearSession();
        }
        setMessages([]);
      })
      .finally(() => {
        if (isSubscribed) {
          setIsLoadingHistory(false);
        }
      });

    return () => {
      isSubscribed = false;
    };
  }, [sessionId, clearSession]);

  const sendMessage = useCallback(
    async (question: string) => {
      const trimmed = question.trim();
      if (!trimmed || isGenerating) return;

      const userTempId = `user-${Date.now()}`;
      const assistantTempId = `assistant-${Date.now()}`;

      const userMsg: LocalChatMessage = {
        id: userTempId,
        role: 'user',
        content: trimmed,
        created_at: new Date().toISOString(),
      };

      const pendingAssistantMsg: LocalChatMessage = {
        id: assistantTempId,
        role: 'assistant',
        content: 'Searching documents and generating grounded answer...',
        created_at: new Date().toISOString(),
        isPending: true,
      };

      // Optimistically update messages
      setMessages((prev) => [...prev, userMsg, pendingAssistantMsg]);
      setIsGenerating(true);
      setLastError(null);

      const targetSessionId = activeSessionRef.current;

      try {
        let response;
        try {
          // Attempt sending with existing session_id if any
          response = await sendChatMessage({
            question: trimmed,
            session_id: targetSessionId || null,
          });
        } catch (firstErr: unknown) {
          // If session was not found on backend (404), clear stale session and retry as new conversation
          const isNotFound =
            firstErr instanceof AppApiError &&
            (firstErr.statusCode === 404 ||
              firstErr.code === 'not_found' ||
              firstErr.message.toLowerCase().includes('not found'));

          if (isNotFound && targetSessionId) {
            clearSession();
            // Retry cleanly without session_id
            response = await sendChatMessage({
              question: trimmed,
              session_id: null,
            });
          } else {
            throw firstErr;
          }
        }

        // Store the valid confirmed session ID
        setConfirmedSessionId(response.session_id);

        // Update assistant message with backend result
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id === assistantTempId) {
              return {
                id: response.message_id,
                role: 'assistant',
                content: response.answer,
                sources: response.sources,
                created_at: new Date().toISOString(),
                backendId: response.message_id,
                isPending: false,
              };
            }
            return msg;
          })
        );

        // Refresh sessions in sidebar so this session appears immediately
        refreshSessions();
      } catch (err: unknown) {
        const errorMsg =
          err instanceof Error
            ? err.message
            : 'An unexpected error occurred while generating an answer.';

        setLastError(errorMsg);
        addToast({
          type: 'error',
          title: 'Error generating answer',
          message: errorMsg,
        });

        // Mark the assistant message with error
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id === assistantTempId) {
              return {
                ...msg,
                content: 'Failed to generate answer. Please try again.',
                error: errorMsg,
                isPending: false,
              };
            }
            return msg;
          })
        );
      } finally {
        setIsGenerating(false);
      }
    },
    [isGenerating, setConfirmedSessionId, clearSession, refreshSessions, addToast]
  );

  return {
    messages,
    isLoadingHistory,
    isGenerating,
    lastError,
    sendMessage,
  };
}
