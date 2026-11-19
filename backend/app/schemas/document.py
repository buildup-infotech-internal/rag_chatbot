"""Request and response models for document management endpoints."""

import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict


class DocumentStatusRequest(BaseModel):
    """Requested active state for a document."""

    model_config = ConfigDict(extra="forbid")

    is_active: bool


class DocumentStatusResponse(BaseModel):
    """Current status of a document."""

    document_id: uuid.UUID
    status: str
    is_active: bool


class DocumentListItem(BaseModel):
    """Document metadata and actual associated chunk count."""

    document_id: uuid.UUID
    filename: str
    file_size: int | None
    status: str
    is_active: bool
    chunk_count: int
    created_at: datetime


class DocumentListResponse(BaseModel):
    """Paginated document metadata."""

    items: list[DocumentListItem]
    total: int
    limit: int
    offset: int


class UploadedDocumentResult(BaseModel):
    """Outcome for one PDF in a potentially partial batch upload."""

    filename: str
    status: Literal["ingested", "duplicate", "failed"]
    document_id: uuid.UUID | None = None
    chunk_count: int | None = None
    error: str | None = None


class DocumentUploadResponse(BaseModel):
    """Per-file outcomes for a PDF upload batch."""

    results: list[UploadedDocumentResult]


class DocumentDeleteResponse(BaseModel):
    """Result of permanently deleting a document and its chunks."""

    document_id: uuid.UUID
    deleted: bool
    storage_object_deleted: bool = False
    message: str