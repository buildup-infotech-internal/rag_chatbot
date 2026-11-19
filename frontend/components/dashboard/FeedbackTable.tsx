'use client';

import React, { useState } from 'react';
import { FeedbackListItem, FeedbackRating } from '@/types/feedback';
import { ThumbsUp, ThumbsDown, MessageSquare, Clock, Filter, Eye, X } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { formatDate, truncateText } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';

interface FeedbackTableProps {
  items: FeedbackListItem[];
  isLoading: boolean;
  activeFilter: FeedbackRating | 'all';
  onFilterChange: (filter: FeedbackRating | 'all') => void;
}

export function FeedbackTable({
  items,
  isLoading,
  activeFilter,
  onFilterChange,
}: FeedbackTableProps) {
  const [inspectItem, setInspectItem] = useState<FeedbackListItem | null>(null);

  return (
    <div className="flex flex-col gap-3">
      {/* Table Header Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
            User Feedback & Audit Log
          </span>
          <span className="text-xs text-neutral-400">({items.length} records)</span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 rounded-lg bg-neutral-100 p-1 dark:bg-neutral-800">
          <button
            onClick={() => onFilterChange('all')}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              activeFilter === 'all'
                ? 'bg-white shadow-2xs text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100'
                : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400'
            }`}
          >
            All Ratings
          </button>
          <button
            onClick={() => onFilterChange(1)}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              activeFilter === 1
                ? 'bg-white shadow-2xs text-emerald-700 dark:bg-neutral-900 dark:text-emerald-400'
                : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400'
            }`}
          >
            <ThumbsUp className="h-3 w-3 text-emerald-600" />
            Positive
          </button>
          <button
            onClick={() => onFilterChange(-1)}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              activeFilter === -1
                ? 'bg-white shadow-2xs text-rose-700 dark:bg-neutral-900 dark:text-rose-400'
                : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400'
            }`}
          >
            <ThumbsDown className="h-3 w-3 text-rose-600" />
            Negative
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-semibold dark:bg-neutral-800/60 dark:border-neutral-800 dark:text-neutral-400">
              <tr>
                <th className="py-3 px-4">Rating</th>
                <th className="py-3 px-4">AI Answer Preview</th>
                <th className="py-3 px-4">User Comment</th>
                <th className="py-3 px-4">Session UUID</th>
                <th className="py-3 px-4">Logged At</th>
                <th className="py-3 px-4 text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-neutral-400">
                    Loading feedback entries...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-neutral-400">
                    No feedback entries recorded matching this filter.
                  </td>
                </tr>
              ) : (
                items.map((fb) => (
                  <tr
                    key={fb.id}
                    className="hover:bg-neutral-50/70 transition-colors dark:hover:bg-neutral-800/50"
                  >
                    <td className="py-3 px-4">
                      {fb.rating === 1 ? (
                        <Badge variant="success" className="gap-1">
                          <ThumbsUp className="h-3 w-3" /> Positive
                        </Badge>
                      ) : (
                        <Badge variant="danger" className="gap-1">
                          <ThumbsDown className="h-3 w-3" /> Negative
                        </Badge>
                      )}
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      <p className="truncate text-neutral-800 dark:text-neutral-200 font-medium">
                        {truncateText(fb.message?.content || 'No content', 75)}
                      </p>
                    </td>

                    <td className="py-3 px-4 max-w-xs text-neutral-600 dark:text-neutral-400">
                      {fb.comment ? (
                        <span className="italic text-neutral-800 dark:text-neutral-200">
                          &ldquo;{truncateText(fb.comment, 60)}&rdquo;
                        </span>
                      ) : (
                        <span className="text-neutral-400 text-[11px]">—</span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-neutral-500">
                      {fb.message?.session_id
                        ? `${fb.message.session_id.slice(0, 8)}...`
                        : '—'}
                    </td>

                    <td className="py-3 px-4 text-neutral-500 text-[11px]">
                      {formatDate(fb.created_at)}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setInspectItem(fb)}
                        className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                        title="View full answer & feedback"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Detail Modal */}
      {inspectItem && (
        <Modal
          isOpen={true}
          onClose={() => setInspectItem(null)}
          title="Feedback Details & Answer Audit"
          description={`Message ID: ${inspectItem.message_id} • Session: ${inspectItem.message?.session_id}`}
        >
          <div className="flex flex-col gap-4 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700">
              <span className="font-semibold text-neutral-700 dark:text-neutral-300">Rating</span>
              {inspectItem.rating === 1 ? (
                <Badge variant="success" className="gap-1">
                  <ThumbsUp className="h-3 w-3" /> Positive Rating
                </Badge>
              ) : (
                <Badge variant="danger" className="gap-1">
                  <ThumbsDown className="h-3 w-3" /> Negative Rating
                </Badge>
              )}
            </div>

            {inspectItem.comment && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800">
                <span className="font-semibold text-amber-900 dark:text-amber-200 block mb-1">
                  User Comment:
                </span>
                <p className="text-amber-950 dark:text-amber-100 leading-relaxed whitespace-pre-wrap">
                  {inspectItem.comment}
                </p>
              </div>
            )}

            <div>
              <span className="font-semibold text-neutral-700 dark:text-neutral-300 block mb-1.5">
                Full Assistant Response:
              </span>
              <div className="max-h-60 overflow-y-auto rounded-xl border border-neutral-200 bg-neutral-50 p-3.5 text-neutral-800 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 whitespace-pre-wrap leading-relaxed">
                {inspectItem.message?.content}
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <span>Feedback ID: {inspectItem.id}</span>
              <span>Logged: {formatDate(inspectItem.created_at)}</span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
