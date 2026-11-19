"""Business logic for anonymous chat sessions and message history."""

import logging
import uuid

from sqlalchemy import func
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.exceptions import (
    DatabaseOperationError,
    NotFoundError,
    ServiceUnavailableError,
    UpstreamServiceError,
)
from app.core.logging_config import log_exception_safely
from app.models.chat_message import ChatMessage
from app.models.chat_session import ChatSession
from app.schemas.chat import (
    ChatHistoryResponse,
    ChatMessageResponse,
    ChatResponse,
    ChatSessionListItem,
    ChatSessionListResponse,
    SourceReference,
)
from app.services.llm_service import generate_answer
from app.services.retrieval_service import retrieve_relevant_chunks

logger = logging.getLogger(__name__)


def _rollback(db: Session) -> None:
    """Roll back a failed unit of work without logging SQL payloads."""
    try:
        db.rollback()
    except SQLAlchemyError as error:
        log_exception_safely(logger, "Chat transaction rollback failed", error)


def create_chat_exchange(
    question: str,
    requested_session_id: uuid.UUID | None,
    db: Session,
) -> ChatResponse:
    """Retrieve context, generate an answer, and persist the exchange atomically."""
    is_new_session = requested_session_id is None
    session_id = requested_session_id or uuid.uuid4()

    if not is_new_session:
        try:
            if db.get(ChatSession, session_id) is None:
                logger.warning("Unknown chat session requested session_id=%s", session_id)
                raise NotFoundError("Chat session")
            db.rollback()
        except SQLAlchemyError as error:
            _rollback(db)
            log_exception_safely(logger, "Chat session lookup failed", error)
            raise DatabaseOperationError() from None

    logger.info("Chat question received session_id=%s", session_id)
    try:
        chunks = retrieve_relevant_chunks(question)
        if not isinstance(chunks, list):
            raise TypeError("retrieval service returned an invalid result")
    except Exception as error:
        log_exception_safely(logger, "Document retrieval failed for chat request", error)
        raise ServiceUnavailableError("Document retrieval is temporarily unavailable.") from None

    logger.info(
        "Chat retrieval completed session_id=%s chunk_count=%d",
        session_id,
        len(chunks),
    )
    if not chunks:
        logger.warning("No relevant chunks found session_id=%s", session_id)

    try:
        generated = generate_answer(question, chunks)
        answer = generated.get("answer") if isinstance(generated, dict) else None
        if not isinstance(answer, str) or not answer.strip():
            raise ValueError("LLM returned an empty or invalid answer")
        raw_sources = generated.get("sources", [])
        if not isinstance(raw_sources, list):
            raise TypeError("LLM returned invalid sources")
        sources = [SourceReference(**source) for source in raw_sources]
        answer = answer.strip()
    except Exception as error:
        log_exception_safely(logger, "Answer generation failed for chat request", error)
        raise UpstreamServiceError("Answer generation is temporarily unavailable.") from None

    logger.info("Chat answer generated successfully session_id=%s", session_id)
    try:
        if is_new_session:
            db.add(ChatSession(session_id=session_id))
            db.flush()
        db.add(ChatMessage(session_id=session_id, role="user", content=question))
        assistant_message = ChatMessage(
            session_id=session_id,
            role="assistant",
            content=answer,
            sources=[source.model_dump() for source in sources],
        )
        db.add(assistant_message)
        db.commit()
    except SQLAlchemyError as error:
        _rollback(db)
        log_exception_safely(logger, "Failed to persist chat exchange", error)
        raise DatabaseOperationError() from None

    if is_new_session:
        logger.info("New chat session created session_id=%s", session_id)
    logger.info(
        "Chat exchange persisted session_id=%s assistant_message_id=%s",
        session_id,
        assistant_message.id,
    )
    return ChatResponse(
        session_id=session_id,
        answer=answer,
        sources=sources,
        message_id=assistant_message.id,
    )


def get_chat_history(session_id: uuid.UUID, db: Session) -> ChatHistoryResponse:
    """Return a session's messages in stable chronological order."""
    try:
        if db.get(ChatSession, session_id) is None:
            raise NotFoundError("Chat session")
        messages = (
            db.query(ChatMessage)
            .filter(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.created_at.asc(), ChatMessage.id.asc())
            .all()
        )
        return ChatHistoryResponse(
            session_id=session_id,
            messages=[
                ChatMessageResponse(
                    id=message.id,
                    role=message.role,
                    content=message.content,
                    sources=[SourceReference(**item) for item in (message.sources or [])],
                    created_at=message.created_at,
                )
                for message in messages
            ],
        )
    except NotFoundError:
        logger.warning("Chat history requested for unknown session_id=%s", session_id)
        raise
    except SQLAlchemyError as error:
        _rollback(db)
        log_exception_safely(logger, "Chat history lookup failed", error)
        raise DatabaseOperationError() from None


def list_chat_sessions(limit: int, offset: int, db: Session) -> ChatSessionListResponse:
    """List recent sessions for staff workflows; this endpoint is unauthenticated."""
    last_activity = (
        db.query(
            ChatMessage.session_id.label("session_id"),
            func.max(ChatMessage.created_at).label("last_activity_at"),
        )
        .group_by(ChatMessage.session_id)
        .subquery()
    )
    try:
        total = db.query(func.count(ChatSession.session_id)).scalar() or 0
        rows = (
            db.query(
                ChatSession.session_id,
                ChatSession.created_at,
                last_activity.c.last_activity_at,
            )
            .outerjoin(last_activity, last_activity.c.session_id == ChatSession.session_id)
            .order_by(
                last_activity.c.last_activity_at.desc().nullslast(),
                ChatSession.created_at.desc(),
            )
            .offset(offset)
            .limit(limit)
            .all()
        )
        logger.info(
            "Chat sessions listed result_count=%d total=%d offset=%d",
            len(rows),
            total,
            offset,
        )
        return ChatSessionListResponse(
            items=[
                ChatSessionListItem(
                    session_id=row.session_id,
                    created_at=row.created_at,
                    last_activity_at=row.last_activity_at,
                )
                for row in rows
            ],
            total=total,
            limit=limit,
            offset=offset,
        )
    except SQLAlchemyError as error:
        _rollback(db)
        log_exception_safely(logger, "Chat session listing failed", error)
        raise DatabaseOperationError() from None