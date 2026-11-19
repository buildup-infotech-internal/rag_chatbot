'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useChat } from '@/hooks/useChat';
import { useSession } from '@/context/SessionContext';
import { WelcomeScreen } from './WelcomeScreen';
import { MessageItem } from './MessageItem';
import { ChatInput } from './ChatInput';
import { ArrowDown, Loader2, Sparkles, Languages } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ChatInterface() {
  const { sessionId } = useSession();
  const { messages, isLoadingHistory, isGenerating, sendMessage } = useChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // Auto scroll to latest message when new message appears
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
    });
  };

  useEffect(() => {
    scrollToBottom(true);
  }, [messages.length, isGenerating]);

  // Handle scroll detection for "jump to bottom" button
  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
    setShowScrollBottom(!isNearBottom);
  };

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-neutral-50/50 dark:bg-neutral-950">
      {/* Top Session Bar */}
      <div className="flex h-12 items-center justify-between border-b border-neutral-200/80 bg-white/70 px-4 sm:px-6 backdrop-blur-xs dark:border-neutral-800 dark:bg-neutral-900/70 z-10">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate">
            Session: <span className="font-mono text-neutral-500 font-normal">{sessionId ? `${sessionId.slice(0, 8)}...` : 'New Conversation'}</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 px-2.5 py-0.5 text-[11px] font-medium text-neutral-600 dark:text-neutral-300">
            <Languages className="h-3 w-3 text-indigo-500" />
            <span className="hidden sm:inline">Multilingual:</span>
            <span>EN / हिं / Hinglish</span>
          </div>
        </div>
      </div>

      {/* Main Messages Scroll Container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto"
      >
        {isLoadingHistory ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-neutral-400 py-20">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            <span className="text-xs">Loading conversation history...</span>
          </div>
        ) : messages.length === 0 ? (
          <WelcomeScreen onSelectQuestion={(q) => sendMessage(q)} />
        ) : (
          <div className="flex flex-col py-4">
            {messages.map((message) => (
              <MessageItem
                key={message.id}
                message={message}
                onRetry={(text) => sendMessage(text)}
              />
            ))}

            {/* Thinking / Generating Pulse indicator */}
            {isGenerating && (
              <div className="flex items-center gap-3 px-4 py-3 sm:px-6 animate-pulse">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600/80 text-white">
                  <Sparkles className="h-4 w-4 animate-spin" />
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                  <span className="h-2 w-2 rounded-full bg-indigo-600 animate-ping" />
                  Generating answer from retrieved documents...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} className="h-2" />
          </div>
        )}
      </div>

      {/* Floating Jump to Bottom Button */}
      {showScrollBottom && (
        <button
          onClick={() => scrollToBottom(true)}
          className="absolute bottom-24 right-6 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-md text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 active:scale-95 transition-all"
          aria-label="Scroll to bottom"
        >
          <ArrowDown className="h-4 w-4" />
        </button>
      )}

      {/* Input Form at Bottom */}
      <ChatInput
        onSendMessage={(q) => sendMessage(q)}
        isLoading={isGenerating}
      />
    </div>
  );
}
