'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, X, CheckCircle2, AlertCircle, Copy, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { uploadDocuments } from '@/services/document-service';
import { UploadedDocumentResult } from '@/types/document';
import { UPLOAD_LIMITS } from '@/lib/constants';
import { formatFileSize, cn } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

interface DocumentUploadZoneProps {
  onUploadComplete: () => void;
}

export function DocumentUploadZone({ onUploadComplete }: DocumentUploadZoneProps) {
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [batchResults, setBatchResults] = useState<UploadedDocumentResult[] | null>(null);

  const handleFilesChosen = (incoming: FileList | null) => {
    if (!incoming) return;

    const validated: File[] = [];
    const errors: string[] = [];

    Array.from(incoming).forEach((file) => {
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        errors.push(`${file.name}: Only PDF documents are allowed.`);
        return;
      }
      if (file.size > UPLOAD_LIMITS.MAX_FILE_SIZE_BYTES) {
        errors.push(`${file.name}: Exceeds maximum 10MB size limit.`);
        return;
      }
      validated.push(file);
    });

    if (errors.length > 0) {
      addToast({
        type: 'error',
        title: 'Some files were rejected',
        message: errors.join(' | '),
      });
    }

    if (validated.length + selectedFiles.length > UPLOAD_LIMITS.MAX_FILES_COUNT) {
      addToast({
        type: 'error',
        title: 'Too many files',
        message: `You can upload at most ${UPLOAD_LIMITS.MAX_FILES_COUNT} files per batch.`,
      });
      return;
    }

    setSelectedFiles((prev) => [...prev, ...validated]);
    setBatchResults(null);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFilesChosen(e.dataTransfer.files);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0 || isUploading) return;

    setIsUploading(true);
    setBatchResults(null);

    try {
      const response = await uploadDocuments(selectedFiles);
      setBatchResults(response.results);

      const successCount = response.results.filter(
        (r) => r.status === 'ingested' || r.status === 'duplicate'
      ).length;
      const failCount = response.results.filter((r) => r.status === 'failed').length;

      if (failCount === 0) {
        addToast({
          type: 'success',
          title: 'Batch upload complete',
          message: `Successfully processed ${successCount} document(s).`,
        });
        setSelectedFiles([]);
      } else {
        addToast({
          type: 'error',
          title: 'Partial batch upload',
          message: `${successCount} processed, ${failCount} failed. Check details below.`,
        });
      }

      onUploadComplete();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed.';
      addToast({
        type: 'error',
        title: 'Upload failed',
        message: msg,
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Drag & Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all',
          isDragging
            ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20'
            : 'border-neutral-300 bg-neutral-50/50 hover:bg-neutral-100/50 dark:border-neutral-800 dark:bg-neutral-900/40 dark:hover:bg-neutral-800/50'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={(e) => {
            handleFilesChosen(e.target.files);
            e.target.value = '';
          }}
        />

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 mb-3 shadow-xs">
          <UploadCloud className="h-6 w-6" />
        </div>

        <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
          Drop PDF documents here, or <span className="text-indigo-600 underline">browse</span>
        </p>
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          Supports up to 5 PDF files per batch • Max 10MB per file
        </p>
      </div>

      {/* Selected Files Staging List */}
      {selectedFiles.length > 0 && (
        <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 shadow-xs animate-in fade-in-50">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
            <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Selected Files ({selectedFiles.length})
            </span>
            <Button
              size="sm"
              variant="primary"
              onClick={handleUpload}
              isLoading={isUploading}
            >
              Upload {selectedFiles.length} Document{selectedFiles.length > 1 ? 's' : ''}
            </Button>
          </div>

          <div className="divide-y divide-neutral-100 dark:divide-neutral-800 mt-2">
            {selectedFiles.map((file, idx) => (
              <div key={idx} className="flex items-center justify-between py-2.5 text-xs">
                <div className="flex items-center gap-2.5 min-w-0 pr-4">
                  <FileText className="h-4 w-4 shrink-0 text-indigo-500" />
                  <span className="truncate font-medium text-neutral-800 dark:text-neutral-200">
                    {file.name}
                  </span>
                  <span className="text-neutral-400 shrink-0 font-mono text-[11px]">
                    ({formatFileSize(file.size)})
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(idx);
                  }}
                  disabled={isUploading}
                  className="rounded-md p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Results Summary Card */}
      {batchResults && (
        <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 shadow-xs animate-in fade-in-50">
          <h4 className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-3">
            Batch Upload Processing Results
          </h4>
          <div className="space-y-2">
            {batchResults.map((result, idx) => (
              <div
                key={idx}
                className={cn(
                  'flex items-start justify-between rounded-lg p-3 text-xs border',
                  result.status === 'ingested' &&
                    'bg-emerald-50/70 border-emerald-200 text-emerald-900 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-200',
                  result.status === 'duplicate' &&
                    'bg-amber-50/70 border-amber-200 text-amber-900 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-200',
                  result.status === 'failed' &&
                    'bg-rose-50/70 border-rose-200 text-rose-900 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-200'
                )}
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  {result.status === 'ingested' && (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                  )}
                  {result.status === 'duplicate' && (
                    <Copy className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                  )}
                  {result.status === 'failed' && (
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{result.filename}</p>
                    <p className="mt-0.5 opacity-90 text-[11px]">
                      {result.status === 'ingested' &&
                        `Successfully indexed • ${result.chunk_count} chunk(s) generated`}
                      {result.status === 'duplicate' &&
                        `Already indexed • ${result.chunk_count} chunk(s) active`}
                      {result.status === 'failed' &&
                        (result.error || 'Processing failed')}
                    </p>
                  </div>
                </div>

                <span className="shrink-0 font-medium uppercase text-[10px] px-2 py-0.5 rounded-full bg-white/80 dark:bg-neutral-800 border">
                  {result.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
