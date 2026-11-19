'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { AlertTriangle } from 'lucide-react';
import { DocumentListItem } from '@/types/document';

interface DeleteConfirmModalProps {
  document: DocumentListItem | null;
  isOpen: boolean;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmModal({
  document,
  isOpen,
  isDeleting,
  onClose,
  onConfirm,
}: DeleteConfirmModalProps) {
  if (!document) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Document"
      description="This will permanently delete the document metadata and all chunk embeddings."
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3 rounded-xl bg-rose-50 p-3.5 border border-rose-200 dark:bg-rose-950/30 dark:border-rose-900 text-rose-900 dark:text-rose-200 text-xs">
          <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
          <div>
            <p className="font-semibold">Irreversible Administrative Action</p>
            <p className="mt-1 opacity-90 leading-relaxed">
              Are you sure you want to delete <span className="font-mono font-bold">{document.filename}</span>?
              All associated <span className="font-semibold">{document.chunk_count} text chunks</span> and embeddings
              will be permanently removed from future retrieval queries.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={onConfirm} isLoading={isDeleting}>
            Delete Permanently
          </Button>
        </div>
      </div>
    </Modal>
  );
}
