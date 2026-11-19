
import hashlib
from pathlib import Path

from sqlalchemy.exc import IntegrityError

from app.db.session import SessionLocal
from app.models.document import DocumentChunk
from app.models.document_metadata import Document
from app.services.pdf_processor import process_pdf
from app.services.embedding_service import generate_document_embeddings


class UnreadablePDFError(Exception):
    """The PDF parsed successfully but contains no extractable text."""


def _result(document: Document, duplicate: bool) -> dict:
    """Format the stable ingestion response for new and duplicate files."""
    return {
        "document_id": str(document.id),
        "filename": document.filename,
        "total_chunks": document.total_chunks,
        "status": document.status,
        "duplicate": duplicate,
    }


def ingest_pdf(
    pdf_path: str,
    *,
    filename: str | None = None,
    file_size: int | None = None,
) -> dict:
    """Extract, embed and persist a PDF; identical content is idempotent."""
    path = Path(pdf_path)
    filename = filename or path.name
    file_size = file_size if file_size is not None else path.stat().st_size
    digest = hashlib.sha256()
    with path.open("rb") as source_file:
        for block in iter(lambda: source_file.read(1024 * 1024), b""):
            digest.update(block)
    content_sha256 = digest.hexdigest()

    lookup_db = SessionLocal()
    try:
        existing = lookup_db.query(Document).filter(
            Document.content_sha256 == content_sha256
        ).first()
    finally:
        lookup_db.close()
    if existing is not None:
        return _result(existing, duplicate=True)

    # Keep CPU-heavy parsing and embedding outside a database transaction.
    chunks = process_pdf(str(path))

    if not chunks:
        raise UnreadablePDFError("No readable text found in the PDF.")

    texts = [chunk["content"] for chunk in chunks]
    embeddings = generate_document_embeddings(texts)

    if len(embeddings) != len(chunks):
        raise RuntimeError("Embedding count does not match chunk count.")

    db = SessionLocal()
    try:
        # A concurrent identical upload may have completed while embeddings ran.
        existing = db.query(Document).filter(
            Document.content_sha256 == content_sha256
        ).first()
        if existing is not None:
            return _result(existing, duplicate=True)

        document = Document(
            filename=filename,
            file_size=file_size,
            content_sha256=content_sha256,
            status="processing",
            is_active=False,
            total_chunks=0
        )
        db.add(document)
        db.flush()

        records = []
        for chunk, embedding in zip(chunks, embeddings):
            records.append(
                DocumentChunk(
                    document_id=document.id,
                    content=chunk["content"],
                    source_filename=filename,
                    page_number=chunk["page_number"],
                    chunk_index=chunk["chunk_index"],
                    embedding=embedding
                )
            )
        db.add_all(records)

        document.total_chunks = len(records)
        document.status = "active"
        document.is_active = True
        db.commit()
        return _result(document, duplicate=False)
    except IntegrityError:
        db.rollback()
        # A concurrent upload of the same content may win the unique-index race.
        existing = db.query(Document).filter(
            Document.content_sha256 == content_sha256
        ).first()
        if existing is not None:
            return _result(existing, duplicate=True)
        raise
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
