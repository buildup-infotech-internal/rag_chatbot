'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DashboardMetrics } from '@/components/dashboard/DashboardMetrics';
import { FeedbackTable } from '@/components/dashboard/FeedbackTable';
import { getFeedbackList } from '@/services/feedback-service';
import { getChatSessions } from '@/services/chat-service';
import { getDocuments } from '@/services/document-service';
import { FeedbackListItem, FeedbackRating } from '@/types/feedback';
import { ChatSessionListItem } from '@/types/chat';
import { DocumentListItem } from '@/types/document';
import { BarChart3, ShieldAlert, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function DashboardPage() {
  const [sessions, setSessions] = useState<ChatSessionListItem[]>([]);
  const [totalSessions, setTotalSessions] = useState<number>(0);

  const [feedbackItems, setFeedbackItems] = useState<FeedbackListItem[]>([]);
  const [totalFeedback, setTotalFeedback] = useState<number>(0);
  const [activeRatingFilter, setActiveRatingFilter] = useState<FeedbackRating | 'all'>('all');

  const [documents, setDocuments] = useState<DocumentListItem[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [sessionsRes, feedbackRes, docsRes] = await Promise.all([
        getChatSessions(100, 0),
        getFeedbackList(100, 0, activeRatingFilter === 'all' ? undefined : activeRatingFilter),
        getDocuments(100, 0),
      ]);

      setSessions(sessionsRes.items || []);
      setTotalSessions(sessionsRes.total || 0);

      setFeedbackItems(feedbackRes.items || []);
      setTotalFeedback(feedbackRes.total || 0);

      setDocuments(docsRes.items || []);
    } catch {
      // Graceful fallback
    } finally {
      setIsLoading(false);
    }
  }, [activeRatingFilter]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  return (
    <div className="flex flex-col min-h-full p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <BarChart3 className="h-4 w-4" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Staff Performance Dashboard
            </h1>
          </div>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            Real-time audit metrics for conversations, user feedback ratings, and retrieval health.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadDashboardData}
          disabled={isLoading}
          className="self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Metrics
        </Button>
      </div>

      {/* Security notice */}
      <div className="flex items-start gap-3 rounded-xl bg-amber-50/80 p-3.5 border border-amber-200/80 text-amber-900 dark:bg-amber-950/20 dark:border-amber-900/60 dark:text-amber-200 text-xs">
        <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-semibold">Staff Dashboard Route:</span> This page visualizes real database
          feedback submissions and conversation history. In the current version, the underlying API endpoints
          are unauthenticated and should be protected by staff authentication prior to production release.
        </div>
      </div>

      {/* Actual Data Metrics Cards */}
      <DashboardMetrics
        sessions={sessions}
        totalSessions={totalSessions}
        feedbackItems={feedbackItems}
        totalFeedback={totalFeedback}
        documents={documents}
        isLoading={isLoading}
      />

      {/* Feedback Audit Table */}
      <section className="space-y-3 pt-2">
        <FeedbackTable
          items={feedbackItems}
          isLoading={isLoading}
          activeFilter={activeRatingFilter}
          onFilterChange={(f) => setActiveRatingFilter(f)}
        />
      </section>
    </div>
  );
}
