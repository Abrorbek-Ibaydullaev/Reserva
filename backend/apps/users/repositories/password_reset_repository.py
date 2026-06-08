"""Pure database layer for the OTP password-reset flow.

This module contains zero business logic — it only translates between Python
objects and the database.  All expiry checks, attempt counting, and hashing
live in the service layer.
"""

from __future__ import annotations

from datetime import datetime

from apps.users.models import PasswordResetOTP, PasswordResetOTPToken


def save_otp_record(email: str, otp_hash: str, expires_at: datetime) -> PasswordResetOTP:
    """Persist a new OTP record and return it.

    The caller is responsible for deleting any previous record for the same
    email *before* calling this function.
    """
    return PasswordResetOTP.objects.create(
        email=email,
        otp_hash=otp_hash,
        expires_at=expires_at,
    )


def get_otp_record(email: str) -> PasswordResetOTP | None:
    """Return the most-recent OTP record for *email*, or None if not found."""
    return PasswordResetOTP.objects.filter(email=email).order_by('-created_at').first()


def delete_otp_record(email: str) -> None:
    """Delete all OTP records associated with *email*."""
    PasswordResetOTP.objects.filter(email=email).delete()


def save_reset_token(
    email: str, token_hash: str, expires_at: datetime
) -> PasswordResetOTPToken:
    """Persist a new reset-token record and return it."""
    return PasswordResetOTPToken.objects.create(
        email=email,
        token_hash=token_hash,
        expires_at=expires_at,
    )


def get_reset_token_record(token_hash: str) -> PasswordResetOTPToken | None:
    """Return the reset-token record matching *token_hash*, or None."""
    return PasswordResetOTPToken.objects.filter(token_hash=token_hash).first()


def delete_reset_token(token_hash: str) -> None:
    """Delete the reset-token record matching *token_hash*."""
    PasswordResetOTPToken.objects.filter(token_hash=token_hash).delete()
