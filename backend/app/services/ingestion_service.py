
from pathlib import Path

from app.db.session import SessionLocal
from app.models.document import DocumentChunk
from app.models.document_metadata import Document
from app.services.pdf_processor import process_pdf
from app.services.embedding_service import generate_document_embeddings


def ingest_pdf(pdf_path: str):
    filename = Path(pdf_path).name

    # 1. Extract PDF and generate chunks
    chunks = process_pdf(pdf_path)

    if not chunks:
        raise ValueError("No readable text found in the PDF.")

    # 2. Generate embeddings
    texts = [chunk["content"] for chunk in chunks]
    embeddings = generate_document_embeddings(texts)

    if len(embeddings) != len(chunks):
        raise ValueError("Embedding count does not match chunk count.")

    db = SessionLocal()

    try:
        # 3. Create the parent document record
        document = Document(
            filename=filename,
            status="processing",
            is_active=False,
            total_chunks=0
        )

        db.add(document)
        db.flush()

        # 4. Remove old unlinked chunks for this test PDF
        db.query(DocumentChunk).filter(
            DocumentChunk.source_filename == filename,
            DocumentChunk.document_id.is_(None)
        ).delete(synchronize_session=False)

        # 5. Link every new chunk to its document
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

        # 6. Mark document as active after successful insertion
        document.total_chunks = len(records)
        document.status = "active"
        document.is_active = True

        db.commit()

        return {
            "document_id": str(document.id),
            "filename": filename,
            "total_chunks": len(records),
            "status": document.status
        }

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()
