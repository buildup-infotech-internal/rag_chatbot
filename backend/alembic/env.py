
from logging.config import fileConfig

from alembic import context

from app.db.base import Base
from app.db.database import engine
from app.models.document import DocumentChunk
from app.models.document_metadata import Document
from app.models.chat_session import ChatSession
from app.models.chat_message import ChatMessage
from app.models.feedback import Feedback

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# SQLAlchemy metadata for Alembic autogeneration
target_metadata = Base.metadata


def run_migrations_offline():
    """Run migrations without creating a DB connection."""

    context.configure(
        url=engine.url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    """Run migrations using the existing SQLAlchemy engine."""

    with engine.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
