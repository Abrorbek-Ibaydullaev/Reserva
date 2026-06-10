"""DRF controller layer for the OTP-based password-reset flow.

Design decisions:
- All three views carry ``permission_classes = []`` — they must be reachable
  by unauthenticated users.
- Internal errors are logged with full stack traces but only generic messages
  are returned to clients (OWASP A09: Security Logging).
- ``ForgotPasswordView`` always returns HTTP 200 to prevent user enumeration.
"""

from __future__ import annotations

import logging

from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.users.services.exceptions import ServiceError
from apps.users.services.password_reset_service import (
    initiate_password_reset,
    reset_password,
    verify_otp,
)

logger = logging.getLogger(__name__)

_GENERIC_INITIATE_MSG = "If that email exists, a reset code was sent."
_GENERIC_RESET_ERROR = "Invalid or expired reset link."


class OTPForgotPasswordView(APIView):
    """POST /api/auth/forgot-password/

    Accepts ``{"email": "..."}`` and always returns HTTP 200 with the same
    message regardless of whether the email is registered.
    """

    permission_classes = []
    authentication_classes = []

    def post(self, request: Request) -> Response:
        email: str = (request.data.get("email") or "").strip().lower()
        try:
            initiate_password_reset(email)
        except Exception:
            logger.exception(
                "Unhandled error in initiate_password_reset for email=%r", email
            )
        return Response({"message": _GENERIC_INITIATE_MSG}, status=status.HTTP_200_OK)


class OTPVerifyOTPView(APIView):
    """POST /api/auth/verify-otp/

    Accepts ``{"email": "...", "otp_code": "..."}`` and returns a
    short-lived reset token on success.
    """

    permission_classes = []
    authentication_classes = []

    def post(self, request: Request) -> Response:
        email: str = (request.data.get("email") or "").strip().lower()
        otp_code: str = (request.data.get("otp_code") or "").strip()

        try:
            reset_token = verify_otp(email, otp_code)
            return Response({"reset_token": reset_token}, status=status.HTTP_200_OK)

        except ServiceError as exc:
            if exc.code == "expired":
                return Response(
                    {"error": "Code expired. Please request a new one."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if exc.code == "max_attempts":
                return Response(
                    {"error": "Too many attempts. Request a new code."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            # "not_found" and "invalid" are intentionally indistinguishable.
            return Response(
                {"error": "Invalid code."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        except Exception:
            logger.exception(
                "Unhandled error in verify_otp for email=%r", email
            )
            return Response(
                {"error": "Invalid code."},
                status=status.HTTP_400_BAD_REQUEST,
            )


class OTPResetPasswordView(APIView):
    """POST /api/auth/reset-password/

    Accepts ``{"reset_token": "...", "password": "..."}`` and sets the new
    password if the token is valid and unexpired.
    """

    permission_classes = []
    authentication_classes = []

    def post(self, request: Request) -> Response:
        reset_token_value: str = (request.data.get("reset_token") or "").strip()
        password: str = request.data.get("password") or ""

        try:
            reset_password(reset_token_value, password)
            return Response(
                {"message": "Password updated successfully."},
                status=status.HTTP_200_OK,
            )

        except ServiceError as exc:
            if exc.code == "weak_password":
                return Response(
                    {"error": "Password must be at least 8 characters."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            return Response(
                {"error": _GENERIC_RESET_ERROR},
                status=status.HTTP_400_BAD_REQUEST,
            )

        except Exception:
            logger.exception(
                "Unhandled error in reset_password (token truncated for safety)"
            )
            return Response(
                {"error": _GENERIC_RESET_ERROR},
                status=status.HTTP_400_BAD_REQUEST,
            )
