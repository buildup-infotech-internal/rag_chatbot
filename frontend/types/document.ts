export interface DocumentListItem {
  document_id: string;
  filename: string;
  file_size: number | null;
  status: string;
  is_active: boolean;
  chunk_count: number;
  created_at: string;
}

export interface DocumentListResponse {
  items: DocumentListItem[];
  total: number;
  limit: number;
  offset: number;
}

export type UploadOutcomeStatus = 'ingested' | 'duplicate' | 'failed';

export interface UploadedDocumentResult {
  filename: string;
  status: UploadOutcomeStatus;
  document_id?: string | null;
  chunk_count?: number | null;
  error?: string | null;
}

export interface DocumentUploadResponse {
  results: UploadedDocumentResult[];
}

export interface DocumentStatusRequest {
  is_active: boolean;
}

export interface DocumentStatusResponse {
  document_id: string;
  status: string;
  is_active: boolean;
}

export interface DocumentDeleteResponse {
  document_id: string;
  deleted: boolean;
  storage_object_deleted: boolean;
  message: string;
}
