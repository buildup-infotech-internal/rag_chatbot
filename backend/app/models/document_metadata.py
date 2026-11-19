
import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, BigInteger, Boolean, Index, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Document(Base):
    __tablename__ = "documents"
    __table_args__ = (
        Index("uq_documents_content_sha256", "content_sha256", unique=True),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    filename: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    storage_path: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True
    )

    file_size: Mapped[int | None] = mapped_column(
        BigInteger,
        nullable=True
    )

    content_sha256: Mapped[str | None] = mapped_column(
        String(64),
        nullable=True
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False
    )

    status: Mapped[str] = mapped_column(
        String(20),
        default="processing",
        nullable=False
    )

    total_chunks: Mapped[int] = mapped_column(
        default=0,
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
