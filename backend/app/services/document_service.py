"""Business logic for document ingestion and lifecycle management."""

import logging
from pathlib import Path, PurePosixPath
import uuid

import pymupdf
from sqlalchemy import func
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.exceptions import (
    DatabaseOperationError,
    InvalidUploadError,
    NotFoundError,
    ServiceUnavailableError,
)
from app.core.logging_config import log_exception_safely
from app.models.document import DocumentChunk
from app.models.document_metadata import Document
from app.schemas.document import (
    DocumentDeleteResponse,
    DocumentListItem,
    DocumentListResponse,
    DocumentStatusResponse,
)
from app.services.ingestion_service import UnreadablePDFError, ingest_pdf

logger = logging.getLogger(__name__)


def sanitize_filename(filename: str | None) -> str:
    """Reduce a client filename to safe display metadata, never a filesystem path."""
    normalized = (filename or "upload.pdf").replace("\\", "/")
    name = PurePosixPath(normalized).name
    name = "".join(character for character in name if character.isprintable())
    name = name.strip().rstrip(".") or "upload.pdf"
    if len(name) > 255:
        suffix = Path(name).suffix[:10]
        name = f"{name[: 255 - len(suffix)]}{suffix}"
    return name


def ingest_uploaded_pdf(path: str, filename: str, file_size: int) -> dict:
    """Validate and pass a staged PDF to the existing ingestion pipeline."""
    try:
        with pymupdf.open(stream=Path(path).read_bytes(), filetype="pdf") as pdf:
            if pdf.is_encrypted or len(pdf) == 0:
                raise InvalidUploadError("The PDF is empty, encrypted, or unsupported.")
    except InvalidUploadError:
        raise
    except Exception:
        logger.warning("Uploaded PDF failed parser validation filename=%s", filename)
        raise InvalidUploadError("The uploaded file is corrupt or is not a supported PDF.") from None

    try:
        return ingest_pdf(path, filename=filename, file_size=file_size)
    except UnreadablePDFError:
        logger.warning("PDF ingestion found no usable text document_filename=%s", filename)
        raise InvalidUploadError("The PDF contains no readable text or could not be processed.") from None
    except SQLAlchemyError as error:
        log_exception_safely(logger, "Document ingestion database operation failed", error)
        raise DatabaseOperationError() from None
    except Exception as error:
        log_exception_safely(logger, "Document ingestion failed", error)
        raise ServiceUnavailableError("Document ingestion is temporarily unavailable.") from None


def list_documents(
    limit: int,
    offset: int,
    is_active: bool | None,
    db: Session,
) -> DocumentListResponse:
    """Return paginated document metadata with actual chunk counts."""
    try:
        query = db.query(Document, func.count(DocumentChunk.id)).outerjoin(
            DocumentChunk, DocumentChunk.document_id == Document.id
        )
        if is_active is not None:
            query = query.filter(Document.is_active.is_(is_active))
        total = query.with_entities(func.count(func.distinct(Document.id))).scalar() or 0
        rows = (
            query.group_by(Document.id)
            .order_by(Document.created_at.desc(), Document.id.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )
        logger.info(
            "Documents listed result_count=%d total=%d active_filter=%s offset=%d",
            len(rows),
            total,
            is_active,
            offset,
        )
        return DocumentListResponse(
            items=[
                DocumentListItem(
                    document_id=document.id,
                    filename=document.filename,
                    file_size=document.file_size,
                    status=document.status,
                    is_active=document.is_active,
                    chunk_count=chunk_count,
                    created_at=document.created_at,
                )
                for document, chunk_count in rows
            ],
            total=total,
            limit=limit,
            offset=offset,
        )
    except SQLAlchemyError as error:
        _rollback(db)
        log_exception_safely(logger, "Document listing failed", error)
        raise DatabaseOperationError() from None


def set_document_active(
    document_id: uuid.UUID,
    is_active: bool,
    db: Session,
) -> DocumentStatusResponse:
    """Toggle retrieval availability while preserving the document's chunks."""
    try:
        document = db.get(Document, document_id)
        if document is None:
            raise NotFoundError("Document")
        document.is_active = is_active
        document.status = "active" if is_active else "inactive"
        db.commit()
    except NotFoundError:
        raise
    except SQLAlchemyError as error:
        _rollback(db)
        log_exception_safely(logger, "Document status update failed", error)
        raise DatabaseOperationError() from None

    logger.info("Document status updated document_id=%s is_active=%s", document_id, is_active)
    return DocumentStatusResponse(
        document_id=document.id,
        status=document.status,
        is_active=document.is_active,
    )


def delete_document(document_id: uuid.UUID, db: Session) -> DocumentDeleteResponse:
    """Delete document metadata; PostgreSQL cascades the associated chunks."""
    try:
        document = db.get(Document, document_id)
        if document is None:
            raise NotFoundError("Document")
        db.delete(document)
        db.commit()
    except NotFoundError:
        raise
    except SQLAlchemyError as error:
        _rollback(db)
        log_exception_safely(logger, "Document deletion failed", error)
        raise DatabaseOperationError() from None

    logger.info("Document and linked chunks deleted document_id=%s", document_id)
    return DocumentDeleteResponse(
        document_id=document_id,
        deleted=True,
        storage_object_deleted=False,
        message="Document metadata and chunks were deleted. No Supabase Storage integration is configured.",
    )


def _rollback(db: Session) -> None:
    """Roll back a failed document database operation."""
    try:
        db.rollback()
    except SQLAlchemyError as error:
        log_exception_safely(logger, "Document transaction rollback failed", error)