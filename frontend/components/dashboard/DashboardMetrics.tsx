'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { MessageSquare, ThumbsUp, ThumbsDown, FileText, CheckCircle2 } from 'lucide-react';
import { FeedbackListItem } from '@/types/feedback';
import { ChatSessionListItem } from '@/types/chat';
import { DocumentListItem } from '@/types/document';

interface DashboardMetricsProps {
  sessions: ChatSessionListItem[];
  totalSessions: number;
  feedbackItems: FeedbackListItem[];
  totalFeedback: number;
  documents: DocumentListItem[];
  isLoading: boolean;
}

export function DashboardMetrics({
  totalSessions,
  feedbackItems,
  totalFeedback,
  documents,
  isLoading,
}: DashboardMetricsProps) {
  const positiveCount = feedbackItems.filter((f) => f.rating === 1).length;
  const negativeCount = feedbackItems.filter((f) => f.rating === -1).length;

  const totalRated = positiveCount + negativeCount;
  const satisfactionRate = totalRated > 0 ? Math.round((positiveCount / totalRated) * 100) : null;

  const activeDocs = documents.filter((d) => d.is_active).length;
  const totalChunks = documents.reduce((sum, d) => sum + (d.chunk_count || 0), 0);

  const stats = [
    {
      title: 'Total Conversations',
      value: totalSessions,
      subtext: 'Anonymous sessions recorded',
      icon: MessageSquare,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950/50',
    },
    {
      title: 'User Satisfaction',
      value: satisfactionRate !== null ? `${satisfactionRate}%` : 'N/A',
      subtext: `${positiveCount} positive • ${negativeCount} negative`,
      icon: ThumbsUp,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/50',
    },
    {
      title: 'Negative / Poor Ratings',
      value: negativeCount,
      subtext: 'Requires review or document updates',
      icon: ThumbsDown,
      color: 'text-rose-600 dark:text-rose-400',
      bgColor: 'bg-rose-50 dark:bg-rose-950/50',
    },
    {
      title: 'Active Knowledge Base',
      value: `${activeDocs} Docs`,
      subtext: `${totalChunks} indexed text chunks`,
      icon: FileText,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950/50',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <Card key={idx} className="border border-neutral-200/90 dark:border-neutral-800 shadow-2xs">
            <CardContent className="p-4 flex items-center gap-3.5">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${stat.bgColor} ${stat.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium truncate">
                  {stat.title}
                </p>
                <h3 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 mt-0.5">
                  {isLoading ? '...' : stat.value}
                </h3>
                <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5 truncate">
                  {stat.subtext}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
