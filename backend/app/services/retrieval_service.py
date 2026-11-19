
from sqlalchemy import or_

from app.db.session import SessionLocal
from app.models.document import DocumentChunk
from app.models.document_metadata import Document
from app.services.embedding_service import generate_query_embedding


def retrieve_relevant_chunks(query: str, top_k: int = 5):
    # 1. Generate embedding for the user's question
    query_embedding = generate_query_embedding(query)

    db = SessionLocal()

    try:
        # 2. Calculate cosine distance and retrieve closest chunks
        results = (
            db.query(
                DocumentChunk,
                DocumentChunk.embedding.cosine_distance(
                    query_embedding
                ).label("distance")
            )
            .outerjoin(Document, Document.id == DocumentChunk.document_id)
            .filter(DocumentChunk.embedding.isnot(None))
            .filter(
                or_(
                    DocumentChunk.document_id.is_(None),
                    Document.is_active.is_(True),
                )
            )
            .order_by("distance")
            .limit(top_k)
            .all()
        )

        # 3. Format retrieved results
        retrieved_chunks = []

        for document, distance in results:
            retrieved_chunks.append({
                "content": document.content,
                "source_filename": document.source_filename,
                "page_number": document.page_number,
                "chunk_index": document.chunk_index,
                "similarity": round(1 - distance, 4)
            })

        return retrieved_chunks

    finally:
        db.close()
