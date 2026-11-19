'use client';

import React, { useState } from 'react';
import { DocumentListItem } from '@/types/document';
import {
  FileText,
  Search,
  CheckCircle2,
  XCircle,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Layers,
  Calendar,
  HardDrive,
  Loader2,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { formatFileSize, formatDate } from '@/lib/utils';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { updateDocumentStatus, deleteDocument } from '@/services/document-service';
import { useToast } from '@/components/ui/Toast';

interface DocumentListTableProps {
  documents: DocumentListItem[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function DocumentListTable({ documents, isLoading, onRefresh }: DocumentListTableProps) {
  const { addToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedDocToDelete, setSelectedDocToDelete] = useState<DocumentListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = doc.filename.toLowerCase().includes(searchQuery.toLowerCase());
    if (statusFilter === 'active') return matchesSearch && doc.is_active;
    if (statusFilter === 'inactive') return matchesSearch && !doc.is_active;
    return matchesSearch;
  });

  const handleToggleStatus = async (doc: DocumentListItem) => {
    setUpdatingId(doc.document_id);
    const nextStatus = !doc.is_active;

    try {
      await updateDocumentStatus(doc.document_id, nextStatus);
      addToast({
        type: 'success',
        title: nextStatus ? 'Document activated' : 'Document deactivated',
        message: nextStatus
          ? `${doc.filename} is now active for retrieval.`
          : `${doc.filename} has been excluded from retrieval.`,
      });
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update document status.';
      addToast({
        type: 'error',
        title: 'Status update failed',
        message: msg,
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedDocToDelete) return;

    setIsDeleting(true);
    try {
      await deleteDocument(selectedDocToDelete.document_id);
      addToast({
        type: 'success',
        title: 'Document deleted',
        message: `${selectedDocToDelete.filename} has been deleted.`,
      });
      setSelectedDocToDelete(null);
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete document.';
      addToast({
        type: 'error',
        title: 'Deletion failed',
        message: msg,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents by name..."
            className="w-full rounded-lg border border-neutral-300 bg-white pl-9 pr-3 py-1.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto rounded-lg bg-neutral-100 p-1 dark:bg-neutral-800">
          <button
            onClick={() => setStatusFilter('all')}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              statusFilter === 'all'
                ? 'bg-white shadow-2xs text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100'
                : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400'
            }`}
          >
            All ({documents.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              statusFilter === 'active'
                ? 'bg-white shadow-2xs text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100'
                : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400'
            }`}
          >
            Active ({documents.filter((d) => d.is_active).length})
          </button>
          <button
            onClick={() => setStatusFilter('inactive')}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              statusFilter === 'inactive'
                ? 'bg-white shadow-2xs text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100'
                : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400'
            }`}
          >
            Inactive ({documents.filter((d) => !d.is_active).length})
          </button>
        </div>
      </div>

      {/* Documents Table */}
      <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-semibold dark:bg-neutral-800/60 dark:border-neutral-800 dark:text-neutral-400">
              <tr>
                <th className="py-3 px-4">Document</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Chunks</th>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4">Indexed On</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-neutral-400">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-indigo-600" />
                    Loading indexed documents...
                  </td>
                </tr>
              ) : filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-neutral-400">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    No documents match your criteria.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => (
                  <tr
                    key={doc.document_id}
                    className="hover:bg-neutral-50/70 transition-colors dark:hover:bg-neutral-800/50"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 shrink-0">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-neutral-900 dark:text-neutral-100 truncate max-w-xs">
                            {doc.filename}
                          </p>
                          <p className="font-mono text-[10px] text-neutral-400">
                            {doc.document_id.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {doc.is_active ? (
                        <Badge variant="success" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 text-neutral-400">
                          <XCircle className="h-3 w-3" /> Inactive
                        </Badge>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono text-neutral-700 dark:text-neutral-300">
                      <div className="flex items-center gap-1">
                        <Layers className="h-3.5 w-3.5 text-neutral-400" />
                        <span>{doc.chunk_count} chunks</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-neutral-600 dark:text-neutral-400">
                      {formatFileSize(doc.file_size)}
                    </td>

                    <td className="py-3 px-4 text-neutral-500 dark:text-neutral-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                        <span>{formatDate(doc.created_at)}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Status Toggle Button */}
                        <button
                          onClick={() => handleToggleStatus(doc)}
                          disabled={updatingId === doc.document_id}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800 disabled:opacity-50"
                          title={doc.is_active ? 'Deactivate document' : 'Activate document'}
                        >
                          {updatingId === doc.document_id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
                          ) : doc.is_active ? (
                            <ToggleRight className="h-5 w-5 text-indigo-600" />
                          ) : (
                            <ToggleLeft className="h-5 w-5 text-neutral-400" />
                          )}
                          <span className="hidden sm:inline">
                            {doc.is_active ? 'Deactivate' : 'Activate'}
                          </span>
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => setSelectedDocToDelete(doc)}
                          className="rounded-md p-1.5 text-neutral-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50 dark:hover:text-rose-400 transition-colors"
                          title="Delete document"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        document={selectedDocToDelete}
        isOpen={selectedDocToDelete !== null}
        isDeleting={isDeleting}
        onClose={() => setSelectedDocToDelete(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
