import React from 'react';
import { FlaskConical, CheckCircle2, AlertTriangle, XCircle, ShieldCheck, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export default function EvaluationsPage() {
  const categories = [
    {
      title: 'Correct Answers',
      icon: CheckCircle2,
      badge: 'Category A',
      badgeVariant: 'success' as const,
      description:
        'Answers where all facts match the ground-truth document context with 100% precision and accurate source citations.',
    },
    {
      title: 'Partially Correct Answers',
      icon: AlertTriangle,
      badge: 'Category B',
      badgeVariant: 'warning' as const,
      description:
        'Answers that capture the primary concept but miss secondary constraints, conditions, or nuanced context.',
    },
    {
      title: 'Incorrect Answers',
      icon: XCircle,
      badge: 'Category C',
      badgeVariant: 'danger' as const,
      description:
        'Answers containing hallucinated details or misattributions conflicting with the ground-truth document.',
    },
    {
      title: 'Correctly Refused Answers',
      icon: ShieldCheck,
      badge: 'Category D',
      badgeVariant: 'info' as const,
      description:
        'Questions testing out-of-domain knowledge where the assistant accurately declares that information is unavailable in the document.',
    },
  ];

  return (
    <div className="flex flex-col min-h-full p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <FlaskConical className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Evaluation & Quality Framework
            </h1>
          </div>
          <Badge variant="outline" className="font-mono text-xs">
            Architecture Ready
          </Badge>
        </div>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
          Structured benchmark architecture for scoring RAG pipeline fidelity against 40+ multilingual
          ground-truth question-and-answer pairs.
        </p>
      </div>

      {/* Real Framework Status Banner */}
      <div className="rounded-xl border border-indigo-200/80 bg-indigo-50/50 p-4 dark:border-indigo-900/40 dark:bg-indigo-950/20 text-xs text-indigo-950 dark:text-indigo-200 leading-relaxed">
        <span className="font-semibold">Framework Readiness Notice:</span> This frontend architecture is
        pre-configured to accept live benchmark runs from the backend evaluation harness. In accordance with
        system integrity principles, evaluation metrics are rendered only when executed through actual
        test runs, without fabricated statistics.
      </div>

      {/* Target Evaluation Categories */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
          Standard Evaluation Criteria (4 Categories)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {categories.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <Card key={idx} className="border border-neutral-200/90 dark:border-neutral-800 shadow-2xs">
                <CardHeader className="p-4 pb-2 flex-row items-center justify-between space-y-0">
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    <CardTitle className="text-sm font-semibold">{cat.title}</CardTitle>
                  </div>
                  <Badge variant={cat.badgeVariant}>{cat.badge}</Badge>
                </CardHeader>
                <CardContent className="p-4 pt-1 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {cat.description}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Test Benchmark Breakdown */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900 shadow-2xs space-y-3">
        <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
          Planned 40-Question Multilingual Test Suite
        </h3>
        <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
          The evaluation suite spans three linguistic modalities with independent verification:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="rounded-lg bg-neutral-50 p-3 border border-neutral-200/70 dark:bg-neutral-800/50 dark:border-neutral-800">
            <span className="font-semibold text-neutral-800 dark:text-neutral-200 block mb-1">
              English Benchmarks
            </span>
            <p className="text-neutral-500 dark:text-neutral-400 text-[11px]">
              Direct factual lookups, cross-page synthesis, and out-of-scope refusal questions.
            </p>
          </div>

          <div className="rounded-lg bg-neutral-50 p-3 border border-neutral-200/70 dark:bg-neutral-800/50 dark:border-neutral-800">
            <span className="font-semibold text-neutral-800 dark:text-neutral-200 block mb-1">
              Hindi Benchmarks
            </span>
            <p className="text-neutral-500 dark:text-neutral-400 text-[11px]">
              Pure Devanagari questions verifying cross-lingual semantic matching against English documents.
            </p>
          </div>

          <div className="rounded-lg bg-neutral-50 p-3 border border-neutral-200/70 dark:bg-neutral-800/50 dark:border-neutral-800">
            <span className="font-semibold text-neutral-800 dark:text-neutral-200 block mb-1">
              Hinglish Benchmarks
            </span>
            <p className="text-neutral-500 dark:text-neutral-400 text-[11px]">
              Colloquial conversational Romanized Hindi questions reflecting real-world workplace queries.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
