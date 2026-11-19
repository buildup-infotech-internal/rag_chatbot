'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSendMessage: (question: string) => void;
  isLoading: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSendMessage,
  isLoading,
  placeholder = 'Ask a question in English, हिन्दी, or Hinglish...',
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea height up to 160px
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 160)}px`;
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    onSendMessage(trimmed);
    setInput('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isEmpty = input.trim().length === 0;

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-4 sm:pb-6">
      <form
        onSubmit={handleSubmit}
        className={cn(
          'relative flex flex-col rounded-2xl border bg-white shadow-sm transition-all dark:bg-neutral-900',
          isEmpty
            ? 'border-neutral-200 dark:border-neutral-800'
            : 'border-indigo-300 dark:border-indigo-800 ring-2 ring-indigo-50 dark:ring-indigo-950/30'
        )}
      >
        {/* Multiline textarea */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          disabled={isLoading}
          aria-label="User question"
          className="w-full resize-none bg-transparent px-4 pt-3.5 pb-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none dark:text-neutral-100 disabled:opacity-60 max-h-40"
        />

        {/* Input Bar Footer */}
        <div className="flex items-center justify-between px-3 pb-2.5 pt-1 text-[11px] text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline">Press</span>
            <kbd className="hidden sm:inline-block rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-mono text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
              Enter ↵
            </kbd>
            <span className="hidden sm:inline">to send,</span>
            <kbd className="hidden sm:inline-block rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-mono text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
              Shift + Enter
            </kbd>
            <span className="hidden sm:inline">for newline</span>
          </div>

          <div className="flex items-center gap-2">
            {input.length > 0 && (
              <span className="text-[10px] font-mono opacity-70">
                {input.length} char{input.length > 1 ? 's' : ''}
              </span>
            )}

            <button
              type="submit"
              disabled={isEmpty || isLoading}
              aria-label="Send message"
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-xl transition-all',
                isEmpty || isLoading
                  ? 'bg-neutral-100 text-neutral-300 dark:bg-neutral-800 dark:text-neutral-600 cursor-not-allowed'
                  : 'bg-indigo-600 text-white shadow-xs hover:bg-indigo-700 active:scale-95'
              )}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowUp className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </form>
      <p className="mt-2 text-center text-[11px] text-neutral-400 dark:text-neutral-500">
        AI responses are grounded in uploaded documents. Always verify critical policy or legal information.
      </p>
    </div>
  );
}
