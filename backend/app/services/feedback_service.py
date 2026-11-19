"""Business logic for assistant-message feedback."""

import logging

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.exceptions import (
    DatabaseOperationError,
    InvalidResourceError,
    NotFoundError,
)
from app.core.logging_config import log_exception_safely
from app.models.chat_message import ChatMessage
from app.models.feedback import Feedback
from app.schemas.feedback import (
    FeedbackListItem,
    FeedbackListResponse,
    FeedbackMessageInfo,
    FeedbackSubmissionResponse,
)

logger = logging.getLogger(__name__)


def _rollback(db: Session) -> None:
    """Roll back a failed feedback transaction."""
    try:
        db.rollback()
    except SQLAlchemyError as error:
        log_exception_safely(logger, "Feedback transaction rollback failed", error)


def submit_feedback(
    message_id: int,
    rating: int,
    comment: str | None,
    db: Session,
) -> FeedbackSubmissionResponse:
    """Create feedback or update the existing feedback for the same message."""
    try:
        message = (
            db.query(ChatMessage)
            .filter(ChatMessage.id == message_id)
            .with_for_update()
            .one_or_none()
        )
        if message is None:
            raise NotFoundError("Chat message")
        if message.role != "assistant":
            raise InvalidResourceError("Feedback can only be submitted for assistant messages.")

        feedback = (
            db.query(Feedback)
            .filter(Feedback.message_id == message_id)
            .order_by(Feedback.id.desc())
            .first()
        )
        updated_existing = feedback is not None
        if feedback is None:
            feedback = Feedback(message_id=message_id, rating=rating, comment=comment)
            db.add(feedback)
        else:
            feedback.rating = rating
            feedback.comment = comment
        db.commit()
    except (NotFoundError, InvalidResourceError):
        raise
    except SQLAlchemyError as error:
        _rollback(db)
        log_exception_safely(logger, "Feedback persistence failed", error)
        raise DatabaseOperationError() from None

    logger.info(
        "Feedback saved message_id=%s feedback_id=%s updated=%s",
        message_id,
        feedback.id,
        updated_existing,
    )
    return FeedbackSubmissionResponse(
        feedback_id=feedback.id,
        message_id=message_id,
        rating=feedback.rating,
        updated_existing=updated_existing,
    )


def list_feedback(
    limit: int,
    offset: int,
    rating: int | None,
    db: Session,
) -> FeedbackListResponse:
    """Return paginated feedback joined to its message and session."""
    try:
        query = db.query(Feedback, ChatMessage).join(
            ChatMessage, ChatMessage.id == Feedback.message_id
        )
        if rating is not None:
            query = query.filter(Feedback.rating == rating)
        total = query.count()
        rows = (
            query.order_by(Feedback.created_at.desc(), Feedback.id.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )
        items = [
            FeedbackListItem(
                id=feedback.id,
                message_id=feedback.message_id,
                rating=feedback.rating,
                comment=feedback.comment,
                created_at=feedback.created_at,
                updated_at=feedback.updated_at,
                message=FeedbackMessageInfo(
                    session_id=str(message.session_id),
                    role=message.role,
                    content=message.content,
                ),
            )
            for feedback, message in rows
        ]
        logger.info(
            "Feedback listed result_count=%d total=%d rating=%s offset=%d",
            len(items),
            total,
            rating,
            offset,
        )
        return FeedbackListResponse(items=items, total=total, limit=limit, offset=offset)
    except SQLAlchemyError as error:
        _rollback(db)
        log_exception_safely(logger, "Feedback listing failed", error)
        raise DatabaseOperationError() from None