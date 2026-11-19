"""Safe, consistent application errors for API routes and services."""


class APIError(Exception):
    """An expected API failure with a safe client-facing message."""

    def __init__(self, status_code: int, code: str, message: str) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.code = code
        self.message = message


class NotFoundError(APIError):
    """A requested database resource does not exist."""

    def __init__(self, resource: str) -> None:
        super().__init__(404, "not_found", f"{resource} was not found.")


class InvalidResourceError(APIError):
    """A resource exists but cannot be used for the requested operation."""

    def __init__(self, message: str) -> None:
        super().__init__(422, "invalid_resource", message)


class ServiceUnavailableError(APIError):
    """A required internal service is temporarily unavailable."""

    def __init__(self, message: str) -> None:
        super().__init__(503, "service_unavailable", message)


class UpstreamServiceError(APIError):
    """An upstream service returned an unusable response or failed."""

    def __init__(self, message: str) -> None:
        super().__init__(502, "upstream_failure", message)


class DatabaseOperationError(APIError):
    """A database operation failed without exposing database details."""

    def __init__(self) -> None:
        super().__init__(503, "database_unavailable", "Database service is temporarily unavailable.")


class InvalidUploadError(APIError):
    """An uploaded file is invalid or unsupported."""

    def __init__(self, message: str, status_code: int = 400) -> None:
        super().__init__(status_code, "invalid_upload", message)