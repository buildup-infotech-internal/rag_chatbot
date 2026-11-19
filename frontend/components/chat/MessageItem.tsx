'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { LocalChatMessage } from '@/types/chat';
import { SourceCitation } from './SourceCitation';
import { FeedbackDialog } from './FeedbackDialog';
import { Copy, Check, Sparkles, User, AlertCircle, RefreshCw } from 'lucide-react';
import { cn, formatRelativeTime } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

interface MessageItemProps {
  message: LocalChatMessage;
  onRetry?: (text: string) => void;
}

export function MessageItem({ message, onRetry }: MessageItemProps) {
  const { addToast } = useToast();
  const [isCopied, setIsCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      addToast({
        type: 'info',
        title: 'Copied to clipboard',
      });
    } catch {
      // Fallback
    }
  };

  return (
    <div
      className={cn(
        'group flex w-full gap-3 px-4 py-3 sm:px-6 transition-colors bg-transparent',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'flex gap-3 max-w-3xl w-full',
          isUser ? 'justify-end max-w-xl' : 'justify-start'
        )}
      >
        {/* Assistant Avatar */}
        {!isUser && (
          <div className="flex h-7 w-7 shrink-0 select-none items-center justify-center rounded-lg bg-indigo-600 text-white mt-0.5 shadow-2xs">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
        )}

        {/* Message Bubble & Content */}
        <div
          className={cn(
            'flex flex-col min-w-0',
            isUser ? 'items-end max-w-full' : 'flex-1'
          )}
        >
          {/* Header (Role & Time) */}
          <div className="flex items-center gap-2 mb-1 text-[11px] text-neutral-400">
            <span className="font-semibold text-neutral-700 dark:text-neutral-300">
              {isUser ? 'You' : 'DocuRAG Assistant'}
            </span>
            <span>•</span>
            <span>{formatRelativeTime(message.created_at)}</span>
          </div>

          {/* User Bubble */}
          {isUser ? (
            <div className="rounded-2xl rounded-tr-xs bg-indigo-600 px-3.5 py-2 text-sm text-white shadow-2xs leading-relaxed whitespace-pre-wrap break-words">
              {message.content}
            </div>
          ) : (
            /* Assistant Content - No contrasting background card, constant text-sm like the input */
            <div className="w-full text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed bg-transparent">
              {message.error ? (
                <div className="flex items-start gap-2.5 rounded-lg bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-200">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold">Answer generation failed</p>
                    <p className="mt-0.5 opacity-90">{message.error}</p>
                    {onRetry && (
                      <button
                        onClick={() => onRetry(message.content)}
                        className="mt-2 inline-flex items-center gap-1 font-medium text-rose-700 hover:text-rose-900 underline"
                      >
                        <RefreshCw className="h-3 w-3" /> Retry question
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ children }) => (
                        <p className="text-sm leading-relaxed mb-2 last:mb-0">{children}</p>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc pl-5 my-2 space-y-1 text-sm leading-relaxed">{children}</ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal pl-5 my-2 space-y-1 text-sm leading-relaxed">{children}</ol>
                      ),
                      li: ({ children }) => <li className="text-sm leading-relaxed">{children}</li>,
                      h1: ({ children }) => (
                        <h1 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mt-3 mb-1.5">{children}</h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mt-2.5 mb-1">{children}</h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mt-2 mb-1">{children}</h3>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-semibold text-neutral-900 dark:text-neutral-100">{children}</strong>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-2 border-indigo-400 pl-3 italic text-neutral-600 dark:text-neutral-400 my-2 text-sm">
                          {children}
                        </blockquote>
                      ),
                      table: ({ children }) => (
                        <div className="overflow-x-auto my-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800">
                          <table className="min-w-full divide-y divide-neutral-200 text-xs dark:divide-neutral-800">
                            {children}
                          </table>
                        </div>
                      ),
                      th: ({ children }) => (
                        <th className="bg-neutral-100 px-3 py-1.5 text-left font-semibold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 text-xs">
                          {children}
                        </th>
                      ),
                      td: ({ children }) => (
                        <td className="px-3 py-1.5 border-t border-neutral-100 dark:border-neutral-800 text-xs">
                          {children}
                        </td>
                      ),
                      code: ({ className, children, ...props }) => {
                        const isInline = !className && typeof children === 'string';
                        return isInline ? (
                          <code
                            className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-xs text-indigo-700 dark:bg-neutral-800 dark:text-indigo-300"
                            {...props}
                          >
                            {children}
                          </code>
                        ) : (
                          <code className="block rounded-lg bg-neutral-900 p-3 font-mono text-xs text-neutral-100 overflow-x-auto my-2">
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              )}

              {/* Source citations section */}
              {message.sources && message.sources.length > 0 && (
                <SourceCitation sources={message.sources} />
              )}

              {/* Action bar (Copy & Feedback) */}
              <div className="flex flex-wrap items-center justify-between gap-2 mt-2 pt-1.5">
                <FeedbackDialog messageId={message.backendId} />

                <button
                  onClick={handleCopy}
                  aria-label="Copy response"
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200 transition-colors"
                  title="Copy to clipboard"
                >
                  {isCopied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-emerald-600 font-medium text-[11px]">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span className="text-[11px]">Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Avatar */}
        {isUser && (
          <div className="flex h-7 w-7 shrink-0 select-none items-center justify-center rounded-lg bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 mt-0.5">
            <User className="h-3.5 w-3.5" />
          </div>
        )}
      </div>
    </div>
  );
}
