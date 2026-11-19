"""HTTP routes for PDF upload and document lifecycle management."""

import logging
import os
import tempfile
import uuid
from pathlib import PurePosixPath
from typing import Annotated

from fastapi import APIRouter, Depends, File, Query, Response, UploadFile, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.core.config import settings
from app.core.exceptions import APIError, InvalidUploadError
from app.core.logging_config import log_exception_safely
from app.schemas.document import (
    DocumentDeleteResponse,
    DocumentListResponse,
    DocumentStatusRequest,
    DocumentStatusResponse,
    DocumentUploadResponse,
    UploadedDocumentResult,
)
from app.services.document_service import (
    delete_document,
    ingest_uploaded_pdf,
    list_documents,
    sanitize_filename,
    set_document_active,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/documents", tags=["Documents"])

_ALLOWED_PDF_MIME_TYPES = {
    "application/pdf",
    "application/x-pdf",
    "application/octet-stream",  # Swagger UI / generic clients
}

_UPLOAD_CHUNK_BYTES = 64 * 1024


def _stage_pdf(upload: UploadFile) -> tuple[str, int]:
    """Copy one bounded PDF to a server-generated temporary path."""
    temporary_path: str | None = None
    size = 0
    prefix = bytearray()
    try:
        with tempfile.NamedTemporaryFile(mode="wb", suffix=".pdf", delete=False) as staged:
            temporary_path = staged.name
            while True:
                chunk = upload.file.read(_UPLOAD_CHUNK_BYTES)
                if not chunk:
                    break
                size += len(chunk)
                if size > settings.MAX_UPLOAD_FILE_SIZE_BYTES:
                    raise InvalidUploadError(
                        "The PDF exceeds the configured per-file size limit.",
                        status_code=413,
                    )
                if len(prefix) < 1024:
                    prefix.extend(chunk[: 1024 - len(prefix)])
                staged.write(chunk)

        if size == 0:
            raise InvalidUploadError("The uploaded PDF is empty.")
        if b"%PDF-" not in prefix:
            raise InvalidUploadError("The uploaded file does not have a valid PDF signature.")
        return temporary_path, size
    except Exception:
        if temporary_path:
            _remove_temp_file(temporary_path)
        raise
    finally:
        upload.file.close()


def _remove_temp_file(path: str) -> None:
    """Remove a staged upload without masking its primary outcome."""
    try:
        os.unlink(path)
    except FileNotFoundError:
        pass
    except OSError as error:
        log_exception_safely(logger, "Temporary upload cleanup failed", error)


@router.post(
    "/upload",
    response_model=DocumentUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload and ingest PDF documents",
    description=(
        "Accepts multiple PDFs. Each file is validated and ingested independently; batch "
        "responses may use HTTP 207 when one or more files fail. Authentication and "
        "distributed upload rate limiting must be added before public deployment."
    ),
)
def upload_documents(
    response: Response,
    files: Annotated[
        list[UploadFile],
        File(description="Select one or more PDF files."),
    ],
) -> DocumentUploadResponse:
    """Validate and ingest a bounded batch of PDFs with isolated per-file failures."""
    if not files:
        raise InvalidUploadError("At least one PDF file is required.")
    if len(files) > settings.MAX_UPLOAD_FILES:
        for upload in files:
            upload.file.close()
        raise InvalidUploadError(
            f"At most {settings.MAX_UPLOAD_FILES} files may be uploaded at once.",
            status_code=413,
        )

    results: list[UploadedDocumentResult] = []
    has_server_failure = False
    for index, upload in enumerate(files):
        filename = sanitize_filename(upload.filename)
        try:
            if PurePosixPath(filename).suffix.lower() != ".pdf":
                raise InvalidUploadError("Only files with a .pdf extension are supported.", 415)
                       
            mime_type = (upload.content_type or "").split(";", maxsplit=1)[0].strip().lower()
            if mime_type and mime_type not in _ALLOWED_PDF_MIME_TYPES:
                raise InvalidUploadError("The upload MIME type must be application/pdf.", 415)

            temporary_path, file_size = _stage_pdf(upload)
            try:
                result = ingest_uploaded_pdf(temporary_path, filename, file_size)
            finally:
                _remove_temp_file(temporary_path)

            results.append(
                UploadedDocumentResult(
                    filename=filename,
                    status="duplicate" if result.get("duplicate") else "ingested",
                    document_id=uuid.UUID(result["document_id"]),
                    chunk_count=result["total_chunks"],
                )
            )
            logger.info(
                "PDF upload completed document_id=%s duplicate=%s",
                result["document_id"],
                result.get("duplicate", False),
            )
        except APIError as error:
            has_server_failure = has_server_failure or error.status_code >= 500
            results.append(
                UploadedDocumentResult(
                    filename=filename,
                    status="failed",
                    error=error.message,
                )
            )
            logger.warning("PDF upload rejected file_index=%s code=%s", index, error.code)
        except Exception as error:
            has_server_failure = True
            log_exception_safely(logger, "Unexpected PDF upload failure", error)
            results.append(
                UploadedDocumentResult(
                    filename=filename,
                    status="failed",
                    error="The document could not be processed.",
                )
            )
        finally:
            upload.file.close()

    failed_results = [item for item in results if item.status == "failed"]
    if failed_results and has_server_failure and len(failed_results) == len(results):
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    elif failed_results:
        response.status_code = status.HTTP_207_MULTI_STATUS
    return DocumentUploadResponse(results=results)


@router.get(
    "",
    response_model=DocumentListResponse,
    summary="List documents (administrative)",
    description="Unauthenticated administrative endpoint; restrict to staff before public deployment.",
)
def get_documents(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    is_active: bool | None = Query(default=None),
    db: Session = Depends(get_db),
) -> DocumentListResponse:
    """Return paginated document metadata with actual chunk counts."""
    return list_documents(limit, offset, is_active, db)


@router.patch(
    "/{document_id}/status",
    response_model=DocumentStatusResponse,
    summary="Activate or deactivate a document (administrative)",
    description="Unauthenticated administrative endpoint; restrict to staff before public deployment.",
)
def patch_document_status(
    document_id: uuid.UUID,
    request: DocumentStatusRequest,
    db: Session = Depends(get_db),
) -> DocumentStatusResponse:
    """Change retrieval availability without deleting associated chunks."""
    return set_document_active(document_id, request.is_active, db)


@router.delete(
    "/{document_id}",
    response_model=DocumentDeleteResponse,
    summary="Delete document metadata and chunks",
    description=(
        "Permanently deletes document metadata and database chunks through the existing "
        "foreign-key cascade. No Supabase Storage integration exists, so stored binaries "
        "are not deleted by this endpoint. This unauthenticated administrative route must "
        "be restricted to staff before public deployment."
    ),
)
def remove_document(
    document_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> DocumentDeleteResponse:
    """Delete document metadata and chunks; no remote object deletion is available."""
    return delete_document(document_id, db)