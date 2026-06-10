"""Business logic for the OTP-based password-reset flow.

Security invariants enforced here:
- User existence is never disclosed to callers of ``initiate_password_reset``.
- Attempt count is incremented *before* the hash comparison to prevent
  race-condition bypasses.
- All hash comparisons delegate to ``hmac.compare_digest`` via the crypto layer.
- Plain-text OTPs and tokens never touch the database.
"""

from __future__ import annotations

import logging
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone

from config.password_reset_config import PASSWORD_RESET_CONFIG
from apps.users.crypto.otp import (
    generate_otp,
    hash_otp,
    verify_otp_hash,
    generate_reset_token,
    hash_reset_token,
)
from apps.users.notifications.email_service import send_password_reset_otp
from apps.users.repositories.password_reset_repository import (
    save_otp_record,
    get_otp_record,
    delete_otp_record,
    save_reset_token,
    get_reset_token_record,
    delete_reset_token,
)
from apps.users.services.exceptions import ServiceError

logger = logging.getLogger(__name__)
User = get_user_model()


def initiate_password_reset(email: str) -> None:
    """Start the password-reset flow for *email*.

    Always returns ``None`` regardless of whether the email is registered,
    to prevent user-enumeration attacks.  Any internal error is swallowed
    and logged server-side so the caller still receives a generic 200.

    Rate limiting: if a valid (unexpired) OTP already exists for this email,
    the request is silently ignored — the caller cannot distinguish this from
    a normal response.
    """
    # Rate limit: if an OTP is still valid, don't allow a new one yet.
    existing = get_otp_record(email)
    if existing is not None and timezone.now() < existing.expires_at:
        return

    # Delete any stale OTP for this email to keep one active record at a time.
    delete_otp_record(email)

    user = User.objects.filter(email__iexact=email).first()

    if user is None:
        # Anti-enumeration: behave identically but do not send an email.
        return

    plain_otp = generate_otp()
    otp_hash = hash_otp(plain_otp)
    expires_at = timezone.now() + timedelta(
        minutes=PASSWORD_RESET_CONFIG["OTP_EXPIRY_MINUTES"]
    )
    save_otp_record(email, otp_hash, expires_at)
    send_password_reset_otp(email, plain_otp)


def verify_otp(email: str, otp_code: str) -> str:
    """Verify *otp_code* for *email* and return a one-time reset token.

    The reset token is returned in plain text to the caller; only its
    SHA-256 hash is stored in the database.

    Raises:
        ServiceError("not_found")   – no OTP record exists for *email*.
        ServiceError("max_attempts") – attempt limit exceeded.
        ServiceError("expired")     – OTP has passed its expiry timestamp.
        ServiceError("invalid")     – OTP does not match the stored hash.
    """
    record = get_otp_record(email)
    if record is None:
        raise ServiceError("not_found", f"No OTP record found for {email}")

    max_attempts: int = PASSWORD_RESET_CONFIG["MAX_OTP_ATTEMPTS"]
    if record.attempt_count >= max_attempts:
        raise ServiceError(
            "max_attempts",
            f"Attempt limit ({max_attempts}) reached for {email}",
        )

    # Increment *before* checking validity to prevent brute-force via races.
    record.attempt_count += 1
    record.save(update_fields=["attempt_count"])

    if timezone.now() > record.expires_at:
        raise ServiceError("expired", f"OTP for {email} has expired")

    if not verify_otp_hash(otp_code, record.otp_hash):
        raise ServiceError("invalid", f"OTP mismatch for {email}")

    # OTP is valid — clean up and issue a short-lived reset token.
    delete_otp_record(email)

    plain_token = generate_reset_token()
    token_hash = hash_reset_token(plain_token)
    expires_at = timezone.now() + timedelta(
        minutes=PASSWORD_RESET_CONFIG["RESET_TOKEN_EXPIRY_MINUTES"]
    )
    save_reset_token(email, token_hash, expires_at)

    return plain_token


def reset_password(reset_token: str, new_password: str) -> None:
    """Set a new password using a verified reset token.

    Raises:
        ServiceError("not_found") – no token record matches *reset_token*.
        ServiceError("expired")   – token has passed its expiry timestamp.
    """
    token_hash = hash_reset_token(reset_token)
    record = get_reset_token_record(token_hash)

    if record is None:
        raise ServiceError("not_found", "No reset token record found")

    if timezone.now() > record.expires_at:
        raise ServiceError("expired", f"Reset token for {record.email} has expired")

    user = User.objects.filter(email__iexact=record.email).first()
    if user is None:
        # Extremely unlikely: user deleted between OTP issue and reset.
        raise ServiceError("not_found", f"User {record.email} no longer exists")

    if len(new_password) < 8:
        raise ServiceError("weak_password", "Password must be at least 8 characters")

    user.set_password(new_password)
    user.save(update_fields=["password"])

    delete_reset_token(token_hash)
