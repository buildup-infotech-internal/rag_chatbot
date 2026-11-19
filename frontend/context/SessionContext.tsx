'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { STORAGE_KEYS } from '@/lib/constants';
import { getChatSessions } from '@/services/chat-service';
import { ChatSessionListItem } from '@/types/chat';

interface SessionContextType {
  sessionId: string | null;
  sessions: ChatSessionListItem[];
  isLoadingSessions: boolean;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  startNewSession: () => void;
  switchSession: (newId: string) => void;
  setConfirmedSessionId: (newId: string) => void;
  clearSession: () => void;
  refreshSessions: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSessionListItem[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // Initialize session from localStorage on client mount if it exists
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const stored = localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
    if (stored && stored.trim().length > 0) {
      setSessionId(stored.trim());
    } else {
      setSessionId(null);
    }
  }, []);

  const refreshSessions = useCallback(async () => {
    setIsLoadingSessions(true);
    try {
      const res = await getChatSessions(30, 0);
      setSessions(res.items || []);
    } catch {
      // Backend may be offline or unpopulated; fail gracefully
    } finally {
      setIsLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    refreshSessions();
  }, [refreshSessions]);

  const startNewSession = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
    }
    setSessionId(null);
  }, []);

  const clearSession = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
    }
    setSessionId(null);
  }, []);

  const switchSession = useCallback((newId: string) => {
    if (!newId || newId === sessionId) return;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, newId);
    }
    setSessionId(newId);
  }, [sessionId]);

  const setConfirmedSessionId = useCallback((newId: string) => {
    if (!newId) return;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, newId);
    }
    setSessionId(newId);
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed((prev) => !prev);
  }, []);

  return (
    <SessionContext.Provider
      value={{
        sessionId,
        sessions,
        isLoadingSessions,
        isSidebarCollapsed,
        toggleSidebar,
        setSidebarCollapsed: setIsSidebarCollapsed,
        startNewSession,
        switchSession,
        setConfirmedSessionId,
        clearSession,
        refreshSessions,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
