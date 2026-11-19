import React from 'react';
import {
  ShieldCheck,
  FileCheck2,
  AlertTriangle,
  Languages,
  Layers,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export default function AboutPage() {
  const principles = [
    {
      icon: FileCheck2,
      title: 'Grounded Retrieval (RAG)',
      description:
        'All answers are strictly synthesized from relevant text chunks extracted from uploaded PDF documents. The model is constrained from relying on generic hallucinations.',
    },
    {
      icon: Layers,
      title: 'Verifiable Source Citations',
      description:
        'Every factual answer includes explicit citations containing the source document filename and exact page number, enabling instant verification.',
    },
    {
      icon: Languages,
      title: 'Multilingual Processing',
      description:
        'Native comprehension and generation in English, Hindi, and Hinglish without requiring manual language switching or translation degradation.',
    },
    {
      icon: HelpCircle,
      title: 'Safe Refusal Behavior',
      description:
        'When the active document library does not contain sufficient factual evidence to answer a query, the assistant politely declines rather than guessing.',
    },
  ];

  return (
    <div className="flex flex-col min-h-full p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            About & Responsible Usage
          </h1>
        </div>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
          DocuRAG is an enterprise-grade document question-answering assistant designed for accuracy,
          transparency, and source verifiability.
        </p>
      </div>

      {/* How it works grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {principles.map((p, idx) => {
          const Icon = p.icon;
          return (
            <Card key={idx} className="border border-neutral-200/90 dark:border-neutral-800 shadow-2xs">
              <CardHeader className="p-4 pb-2 flex-row items-center gap-3 space-y-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 shrink-0">
                  <Icon className="h-4 w-4" />
                </div>
                <CardTitle className="text-sm font-semibold">{p.title}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {p.description}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Limitations & Legal Disclaimer */}
      <Card className="border-amber-200/80 bg-amber-50/40 dark:border-amber-900/40 dark:bg-amber-950/20 shadow-2xs">
        <CardHeader className="p-5 pb-3 flex-row items-start gap-3 space-y-0">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <CardTitle className="text-sm font-bold text-amber-950 dark:text-amber-200">
              System Limitations & Professional Advice Disclaimer
            </CardTitle>
            <p className="text-xs text-amber-900/80 dark:text-amber-300/80 mt-1">
              Please review the following boundaries before relying on generated answers.
            </p>
          </div>
        </CardHeader>
        <CardContent className="p-5 pt-1 text-xs text-amber-950/90 dark:text-amber-200/90 space-y-2 leading-relaxed">
          <ul className="list-disc pl-4 space-y-1.5">
            <li>
              <strong>No Professional Advice:</strong> This application is a retrieval assistant and
              does not provide certified legal, financial, medical, or regulatory advice.
            </li>
            <li>
              <strong>Document Dependency:</strong> Answer fidelity is entirely bounded by the clarity,
              completeness, and currency of the uploaded documents. If documents contain contradictory or
              outdated clauses, the assistant may reflect those discrepancies.
            </li>
            <li>
              <strong>Mandatory Source Verification:</strong> Users should always cross-reference
              high-impact decisions with the original source document citations provided under each answer.
            </li>
            <li>
              <strong>Refusal Protocols:</strong> If an answer cannot be grounded with high confidence from
              the retrieved chunks, the chatbot will declare that the information is unavailable in the
              supplied documents.
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Multilingual Guidance */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900 shadow-2xs">
        <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
          <Languages className="h-4 w-4 text-indigo-600" />
          Multilingual Guidelines (English, Hindi & Hinglish)
        </h3>
        <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
          You do not need to configure language toggles. You can type in Devanagari Hindi
          (&quot;छुट्टियों की सूची क्या है?&quot;), Hinglish (&quot;Office timings aur leave policy bataiye&quot;),
          or standard English. The RAG pipeline matches query semantics across languages and generates
          grounded answers in the user&apos;s chosen query language.
        </p>
      </div>
    </div>
  );
}
