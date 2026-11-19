"""Request and response models for feedback endpoints."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class FeedbackRequest(BaseModel):
    """Feedback for an assistant message; repeated submission updates it."""

    model_config = ConfigDict(extra="forbid")

    message_id: int = Field(gt=0)
    rating: Literal[-1, 1]
    comment: str | None = Field(default=None, max_length=5000)

    @field_validator("comment")
    @classmethod
    def normalize_comment(cls, value: str | None) -> str | None:
        """Normalize blank comments to null."""
        if value is None:
            return None
        return value.strip() or None


class FeedbackSubmissionResponse(BaseModel):
    """Confirmation that feedback was saved or updated."""

    feedback_id: int
    message_id: int
    rating: int
    updated_existing: bool


class FeedbackMessageInfo(BaseModel):
    """The assistant message and anonymous session associated with feedback."""

    session_id: str
    role: str
    content: str


class FeedbackListItem(BaseModel):
    """Feedback data joined with its message and session details."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    message_id: int
    rating: int
    comment: str | None
    created_at: datetime
    updated_at: datetime
    message: FeedbackMessageInfo


class FeedbackListResponse(BaseModel):
    """Paginated staff feedback response."""

    items: list[FeedbackListItem]
    total: int
    limit: int
    offset: int