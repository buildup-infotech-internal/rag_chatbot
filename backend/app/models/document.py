from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column
from pgvector.sqlalchemy import Vector

from app.db.base import Base

from sqlalchemy import ForeignKey
from sqlalchemy.dialects.postgresql import UUID
import uuid


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, index=True
    )
    document_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    source_filename: Mapped[str] = mapped_column(
        String(255), nullable=False
    )
    page_number: Mapped[int] = mapped_column(
        Integer, nullable=False
    )
    chunk_index: Mapped[int] = mapped_column(
        Integer, nullable=False
    )
    embedding: Mapped[list[float] | None] = mapped_column(
        Vector(384), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )