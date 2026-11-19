
import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from app.api.chat import router as chat_router
from app.api.documents import router as documents_router
from app.api.feedback import router as feedback_router
from app.core.config import settings
from app.core.exceptions import APIError
from app.core.logging_config import configure_logging, log_exception_safely

configure_logging(settings.LOG_LEVEL)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Multilingual RAG Chatbot API",
    description=(
        "Document-based question answering API. Administrative feedback/session routes "
        "are unauthenticated and must be access-restricted before production deployment."
    )
)

cors_origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
)

app.include_router(chat_router)
app.include_router(feedback_router)
app.include_router(documents_router)


@app.exception_handler(APIError)
async def api_error_handler(request: Request, error: APIError) -> JSONResponse:
    """Return safe service errors in one stable response envelope."""
    return JSONResponse(
        status_code=error.status_code,
        content={"error": {"code": error.code, "message": error.message}},
    )


@app.exception_handler(RequestValidationError)
async def request_validation_error_handler(
    request: Request,
    error: RequestValidationError,
) -> JSONResponse:
    """Report validation failures without echoing user input or raw error details."""
    logger.warning("Request validation failed path=%s", request.url.path)
    return JSONResponse(
        status_code=422,
        content={
            "error": {
                "code": "validation_error",
                "message": "Request data is invalid or missing required fields.",
            }
        },
    )


@app.exception_handler(SQLAlchemyError)
async def database_error_handler(request: Request, error: SQLAlchemyError) -> JSONResponse:
    """Hide SQL and connection details from clients."""
    log_exception_safely(logger, "Unhandled database operation failed", error)
    return JSONResponse(
        status_code=503,
        content={
            "error": {
                "code": "database_unavailable",
                "message": "Database service is temporarily unavailable.",
            }
        },
    )


@app.exception_handler(Exception)
async def unexpected_error_handler(request: Request, error: Exception) -> JSONResponse:
    """Log unexpected failures safely and return a generic server error."""
    log_exception_safely(logger, "Unhandled API failure", error)
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "internal_error",
                "message": "An unexpected error occurred.",
            }
        },
    )

@app.get("/")
def home():
    return {
        "message": "RAG Chatbot API is running!"
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }
