"""Shared FastAPI dependencies."""

import logging
from collections.abc import Generator

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.logging_config import log_exception_safely
from app.db.session import SessionLocal

logger = logging.getLogger(__name__)


def get_db() -> Generator[Session, None, None]:
    """Yield a request-scoped database session and always close it."""
    db = SessionLocal()
    try:
        yield db
    except Exception:
        try:
            db.rollback()
        except SQLAlchemyError as rollback_error:
            log_exception_safely(logger, "Database rollback failed", rollback_error)
        raise
    finally:
        try:
            db.close()
        except SQLAlchemyError as close_error:
            log_exception_safely(logger, "Database session close failed", close_error)