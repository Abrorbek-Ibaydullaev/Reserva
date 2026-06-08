"""Cryptographic helpers for the OTP-based password reset flow.

Rules:
- OTPs are generated with ``secrets.randbelow`` (CSPRNG).
- Only SHA-256 hex digests are ever persisted.
- Hash comparisons use ``hmac.compare_digest`` to prevent timing attacks.
"""

import secrets
import hashlib
import hmac


def generate_otp() -> str:
    """Return a cryptographically-random 6-digit OTP string (100000–999999)."""
    return str(secrets.randbelow(900_000) + 100_000)


def hash_otp(otp: str) -> str:
    """Return the SHA-256 hex digest of *otp*."""
    return hashlib.sha256(otp.encode()).hexdigest()


def verify_otp_hash(plain_otp: str, stored_hash: str) -> bool:
    """Constant-time comparison between the hash of *plain_otp* and *stored_hash*."""
    candidate_hash = hash_otp(plain_otp)
    return hmac.compare_digest(candidate_hash, stored_hash)


def generate_reset_token() -> str:
    """Return a 43-character URL-safe random token (256 bits of entropy)."""
    return secrets.token_urlsafe(32)


def hash_reset_token(token: str) -> str:
    """Return the SHA-256 hex digest of *token*."""
    return hashlib.sha256(token.encode()).hexdigest()
