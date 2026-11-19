'use client';

import React, { useState } from 'react';
import { SourceReference } from '@/types/chat';
import { FileText, ChevronDown, ChevronUp, Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SourceCitationProps {
  sources?: SourceReference[] | null;
}

export function SourceCitation({ sources }: SourceCitationProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!sources || sources.length === 0) {
    return null;
  }

  // Deduplicate sources by filename and page
  const uniqueSources = sources.filter(
    (src, index, self) =>
      index ===
      self.findIndex(
        (s) => s.source_filename === src.source_filename && s.page_number === src.page_number
      )
  );

  return (
    <div className="mt-3.5 pt-3 border-t border-neutral-200/70 dark:border-neutral-800">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1.5 text-xs font-semibold text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors focus-visible:outline-none"
        aria-expanded={isExpanded}
      >
        <Bookmark className="h-3.5 w-3.5 text-indigo-500" />
        <span>Sources ({uniqueSources.length} citation{uniqueSources.length > 1 ? 's' : ''})</span>
        {isExpanded ? (
          <ChevronUp className="h-3.5 w-3.5 ml-0.5 opacity-70" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 ml-0.5 opacity-70" />
        )}
      </button>

      {/* Pill summary when collapsed */}
      {!isExpanded && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {uniqueSources.slice(0, 3).map((source, idx) => (
            <span
              key={`${source.source_filename}-${source.page_number}-${idx}`}
              className="inline-flex items-center gap-1.5 rounded-md bg-neutral-100 px-2 py-1 text-[11px] font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
            >
              <FileText className="h-3 w-3 text-neutral-500" />
              <span className="truncate max-w-[150px]">{source.source_filename}</span>
              <span className="rounded bg-neutral-200/80 px-1 text-[10px] font-mono text-neutral-800 dark:bg-neutral-700 dark:text-neutral-200">
                p. {source.page_number}
              </span>
            </span>
          ))}
          {uniqueSources.length > 3 && (
            <span className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-1 text-[11px] text-neutral-500 dark:bg-neutral-800">
              +{uniqueSources.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Expanded detailed cards */}
      {isExpanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2.5 animate-in fade-in-50 duration-150">
          {uniqueSources.map((source, idx) => (
            <div
              key={`${source.source_filename}-${source.page_number}-${idx}`}
              className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50/70 p-2.5 text-xs dark:border-neutral-800 dark:bg-neutral-900/50"
            >
              <div className="flex items-center gap-2 min-w-0 pr-2">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  <FileText className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium text-neutral-900 dark:text-neutral-100 text-[11px]">
                    {source.source_filename}
                  </p>
                  <p className="text-[10px] text-neutral-500 dark:text-neutral-400">PDF Document</p>
                </div>
              </div>

              <span className="shrink-0 rounded-md bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:border-indigo-800 dark:text-indigo-300 font-mono">
                Page {source.page_number}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
