"""add document content hash for upload deduplication

Revision ID: f31c8e27a9b4
Revises: 459b789152d7
Create Date: 2026-11-19

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f31c8e27a9b4"
down_revision: Union[str, Sequence[str], None] = "459b789152d7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Store SHA-256 fingerprints and prevent duplicate document content."""
    op.add_column("documents", sa.Column("content_sha256", sa.String(length=64), nullable=True))
    op.create_index(
        "uq_documents_content_sha256",
        "documents",
        ["content_sha256"],
        unique=True,
    )


def downgrade() -> None:
    """Remove content fingerprint support."""
    op.drop_index("uq_documents_content_sha256", table_name="documents")
    op.drop_column("documents", "content_sha256")