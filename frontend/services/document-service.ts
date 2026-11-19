import { apiClient } from './api';
import {
  DocumentDeleteResponse,
  DocumentListResponse,
  DocumentStatusResponse,
  DocumentUploadResponse,
} from '@/types/document';

export async function uploadDocuments(files: File[]): Promise<DocumentUploadResponse> {
  const formData = new FormData();
  for (const file of files) {
    formData.append('files', file);
  }

  return apiClient<DocumentUploadResponse>('/api/documents/upload', {
    method: 'POST',
    body: formData,
  });
}

export async function getDocuments(
  limit: number = 20,
  offset: number = 0,
  isActive?: boolean
): Promise<DocumentListResponse> {
  const params: Record<string, string | number | boolean | undefined> = {
    limit,
    offset,
  };

  if (isActive !== undefined) {
    params.is_active = isActive;
  }

  return apiClient<DocumentListResponse>('/api/documents', {
    method: 'GET',
    params,
  });
}

export async function updateDocumentStatus(
  documentId: string,
  isActive: boolean
): Promise<DocumentStatusResponse> {
  return apiClient<DocumentStatusResponse>(`/api/documents/${documentId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ is_active: isActive }),
  });
}

export async function deleteDocument(documentId: string): Promise<DocumentDeleteResponse> {
  return apiClient<DocumentDeleteResponse>(`/api/documents/${documentId}`, {
    method: 'DELETE',
  });
}
