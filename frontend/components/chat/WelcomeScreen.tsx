'use client';

import React from 'react';
import { Sparkles, Languages, FileCheck, ArrowUpRight } from 'lucide-react';
import { SUGGESTED_QUESTIONS, SuggestedQuestion } from '@/lib/constants';

interface WelcomeScreenProps {
  onSelectQuestion: (question: string) => void;
}

export function WelcomeScreen({ onSelectQuestion }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 py-8 max-w-2xl mx-auto text-center animate-in fade-in duration-300">
      {/* Icon Badge */}
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-200 dark:shadow-none mb-5">
        <Sparkles className="h-7 w-7" />
      </div>

      {/* Main Title */}
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
        Multilingual Document Assistant
      </h1>

      {/* Subtitle */}
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400 max-w-lg leading-relaxed">
        Ask natural-language questions grounded strictly in your uploaded PDF documents. Every answer
        includes direct source citations with page numbers.
      </p>

      {/* Language Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-700 shadow-2xs dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
          <Languages className="h-3.5 w-3.5 text-indigo-500" />
          <span>Ask in English, हिन्दी, or Hinglish</span>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-700 shadow-2xs dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
          <FileCheck className="h-3.5 w-3.5 text-emerald-500" />
          <span>Grounded Source Citations</span>
        </div>
      </div>

      {/* Suggested Questions Grid */}
      <div className="w-full mt-8 text-left">
        <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3 px-1">
          Example queries you can try:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {SUGGESTED_QUESTIONS.map((item: SuggestedQuestion, idx) => (
            <button
              key={idx}
              onClick={() => onSelectQuestion(item.question)}
              className="flex flex-col justify-between rounded-xl border border-neutral-200 bg-white p-3.5 text-left transition-all hover:border-indigo-300 hover:shadow-xs active:scale-[0.99] dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-indigo-800 group"
            >
              <div className="flex items-start justify-between gap-2 w-full">
                <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                  {item.question}
                </span>
                <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-neutral-400 group-hover:text-indigo-600 transition-colors mt-0.5" />
              </div>
              <div className="flex items-center gap-1.5 mt-2.5">
                <span className="text-xs">{item.flag}</span>
                <span className="text-[10px] text-neutral-400 font-medium">{item.language}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
