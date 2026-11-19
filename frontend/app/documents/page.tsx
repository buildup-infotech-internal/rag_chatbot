'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DocumentUploadZone } from '@/components/documents/DocumentUploadZone';
import { DocumentListTable } from '@/components/documents/DocumentListTable';
import { getDocuments } from '@/services/document-service';
import { DocumentListItem } from '@/types/document';
import { Files, ShieldAlert, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getDocuments(100, 0);
      setDocuments(res.items || []);
    } catch {
      // Graceful error state
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return (
    <div className="flex flex-col min-h-full p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <Files className="h-4 w-4" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Document Management
            </h1>
          </div>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            Upload, index, activate, or remove PDF documents used for multilingual retrieval.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchDocuments}
          disabled={isLoading}
          className="self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh List
        </Button>
      </div>

      {/* Administrative Notice Alert */}
      <div className="flex items-start gap-3 rounded-xl bg-amber-50/80 p-3.5 border border-amber-200/80 text-amber-900 dark:bg-amber-950/20 dark:border-amber-900/60 dark:text-amber-200 text-xs">
        <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-semibold">Administrative Access Note:</span> Document upload, status toggle,
          and chunk deletion are administrative capabilities. In the current version, these backend endpoints
          are unauthenticated and should be placed behind authentication/VPN before public deployment.
        </div>
      </div>

      {/* Upload Section */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
          Upload New Documents
        </h2>
        <DocumentUploadZone onUploadComplete={fetchDocuments} />
      </section>

      {/* Document Library Section */}
      <section className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
            Indexed Knowledge Base ({documents.length})
          </h2>
        </div>

        <DocumentListTable
          documents={documents}
          isLoading={isLoading}
          onRefresh={fetchDocuments}
        />
      </section>
    </div>
  );
}
