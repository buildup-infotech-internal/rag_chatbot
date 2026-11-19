"""Request and response schemas for chat endpoints."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ChatRequest(BaseModel):
    """User question and optional conversation session identifier."""

    model_config = ConfigDict(extra="forbid")

    question: str = Field(..., min_length=1)
    session_id: uuid.UUID | None = None

    @field_validator("question")
    @classmethod
    def question_must_not_be_blank(cls, value: str) -> str:
        """Reject whitespace-only questions and normalize surrounding space."""
        value = value.strip()
        if not value:
            raise ValueError("question must not be blank")
        return value

class SourceReference(BaseModel):
    """A document location used to produce an answer."""

    source_filename: str
    page_number: int


class ChatResponse(BaseModel):
    """Answer and persisted assistant-message reference."""

    session_id: uuid.UUID
    answer: str
    sources: list[SourceReference]
    message_id: int


class ChatMessageResponse(BaseModel):
    """One persisted message in chronological conversation history."""

    id: int
    role: str
    content: str
    sources: list[SourceReference] | None
    created_at: datetime


class ChatHistoryResponse(BaseModel):
    """Conversation history for one anonymous session."""

    session_id: uuid.UUID
    messages: list[ChatMessageResponse]


class ChatSessionListItem(BaseModel):
    """Anonymous chat session summary for staff use."""

    session_id: uuid.UUID
    created_at: datetime
    last_activity_at: datetime | None


class ChatSessionListResponse(BaseModel):
    """Paginated administrative session listing."""

    items: list[ChatSessionListItem]
    total: int
    limit: int
    offset: int