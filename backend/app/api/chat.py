"""HTTP routes for chat requests and anonymous conversation history."""

import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.schemas.chat import (
    ChatHistoryResponse,
    ChatRequest,
    ChatResponse,
    ChatSessionListResponse,
)
from app.services.chat_service import (
    create_chat_exchange,
    get_chat_history,
    list_chat_sessions,
)

router = APIRouter(prefix="/api/chat", tags=["Chat"])


@router.post(
    "",
    response_model=ChatResponse,
    summary="Ask a question",
    description="Creates or continues an anonymous chat session and returns a grounded answer.",
)
def post_chat(request: ChatRequest, db: Session = Depends(get_db)) -> ChatResponse:
    """Retrieve relevant context, generate an answer, and persist the exchange."""
    return create_chat_exchange(request.question, request.session_id, db)


@router.get(
    "/sessions",
    response_model=ChatSessionListResponse,
    summary="List recent chat sessions (staff only)",
    description=(
        "Administrative listing of anonymous sessions. Authentication is not implemented; "
        "restrict this route to staff before public deployment."
    ),
)
def get_chat_sessions(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> ChatSessionListResponse:
    """Return recent sessions and activity timestamps; protect before deployment."""
    return list_chat_sessions(limit, offset, db)


@router.get(
    "/{session_id}",
    response_model=ChatHistoryResponse,
    summary="Get chat history",
    description="Returns chronological messages for the supplied anonymous session UUID.",
)
def get_chat_session(
    session_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> ChatHistoryResponse:
    """Return a session's persisted messages in chronological order."""
    return get_chat_history(session_id, db)