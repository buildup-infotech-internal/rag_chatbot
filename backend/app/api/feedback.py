"""HTTP routes for submitting feedback and staff feedback review."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.core.exceptions import InvalidResourceError
from app.schemas.feedback import (
    FeedbackListResponse,
    FeedbackRequest,
    FeedbackSubmissionResponse,
)
from app.services.feedback_service import list_feedback, submit_feedback

router = APIRouter(prefix="/api/feedback", tags=["Feedback"])


@router.post(
    "",
    response_model=FeedbackSubmissionResponse,
    summary="Submit or update assistant feedback",
)
def post_feedback(
    request: FeedbackRequest,
    db: Session = Depends(get_db),
) -> FeedbackSubmissionResponse:
    """Create feedback or update the previous feedback for the same message."""
    return submit_feedback(request.message_id, request.rating, request.comment, db)


@router.get(
    "",
    response_model=FeedbackListResponse,
    summary="List feedback (staff only)",
    description=(
        "Returns feedback with associated message and session details. This endpoint is "
        "unauthenticated and must be restricted to staff before public deployment."
    ),
)
def get_feedback(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    rating: int | None = Query(default=None, description="Filter by -1 or 1."),
    db: Session = Depends(get_db),
) -> FeedbackListResponse:
    """Return paginated staff feedback, optionally filtered by rating."""
    if rating not in (None, -1, 1):
        raise InvalidResourceError("rating must be either -1 or 1.")
    return list_feedback(limit, offset, rating, db)