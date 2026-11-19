"""Application logging setup and payload-safe exception logging."""

import logging


def configure_logging(level: str = "INFO") -> None:
    """Configure a concise root logger without enabling SQL parameter logs."""
    logging.basicConfig(
        level=getattr(logging, level.upper(), logging.INFO),
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )


def log_exception_safely(
    logger: logging.Logger,
    message: str,
    error: BaseException,
) -> None:
    """Record traceback context without formatting exception payload text."""
    redacted_error = RuntimeError(type(error).__name__)
    logger.exception(
        message,
        exc_info=(RuntimeError, redacted_error, error.__traceback__),
    )