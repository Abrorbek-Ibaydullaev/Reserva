"""Service-layer exceptions for the password-reset flow."""


class ServiceError(Exception):
    """Raised by service functions to signal a domain-level failure.

    Attributes:
        code:    Machine-readable error identifier (e.g. "expired", "invalid").
        message: Optional human-readable description (never forwarded to clients).
    """

    def __init__(self, code: str, message: str = "") -> None:
        self.code = code
        self.message = message
        super().__init__(message)
