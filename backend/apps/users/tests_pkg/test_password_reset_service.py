"""Tests for the OTP password-reset service layer.

Run with:
    cd /Users/abrorbekibaydullaev/Reserva/backend
    python3.12 -m pytest apps/users/tests_pkg/test_password_reset_service.py -v
"""

from __future__ import annotations

from datetime import timedelta
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from apps.users.services.exceptions import ServiceError
from apps.users.services.password_reset_service import (
    initiate_password_reset,
    reset_password,
    verify_otp,
)
from apps.users.crypto.otp import generate_otp, hash_otp, generate_reset_token, hash_reset_token
from apps.users.repositories.password_reset_repository import (
    save_otp_record,
    save_reset_token,
    delete_otp_record,
)

User = get_user_model()


class TestVerifyOTPFlow(TestCase):
    """Successful OTP verification end-to-end."""

    def setUp(self):
        self.user = User.objects.create_user(
            email="otp-test@example.com", password="OldPassword123"
        )

    @patch("apps.users.services.password_reset_service.send_password_reset_otp")
    def test_full_otp_flow(self, mock_send):
        """initiate -> verify -> reset_password changes the user's password."""
        initiate_password_reset("otp-test@example.com")

        # Email should have been sent exactly once.
        mock_send.assert_called_once()
        call_args = mock_send.call_args
        sent_email = call_args[0][0]
        sent_otp = call_args[0][1]

        self.assertEqual(sent_email, "otp-test@example.com")
        self.assertEqual(len(sent_otp), 6)
        self.assertTrue(sent_otp.isdigit())

        # Verify the OTP.
        reset_token = verify_otp("otp-test@example.com", sent_otp)
        self.assertIsInstance(reset_token, str)
        self.assertTrue(len(reset_token) >= 32)

        # Reset the password.
        reset_password(reset_token, "BrandNewPassword456!")
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("BrandNewPassword456!"))

    @patch("apps.users.services.password_reset_service.send_password_reset_otp")
    def test_non_existent_email_no_error(self, mock_send):
        """initiate_password_reset for unknown email succeeds silently."""
        # Should not raise and should not send email.
        initiate_password_reset("ghost@nowhere.example")
        mock_send.assert_not_called()


class TestOTPExpiry(TestCase):
    """OTP exactly 1 second past expiry is rejected."""

    def setUp(self):
        self.user = User.objects.create_user(
            email="expiry-test@example.com", password="Password123"
        )

    def test_expired_otp_raises(self):
        """An OTP that is 1 second past its expiry should raise ServiceError('expired')."""
        plain_otp = generate_otp()
        otp_hash = hash_otp(plain_otp)
        # Set expiry 1 second in the past.
        expired_at = timezone.now() - timedelta(seconds=1)
        save_otp_record("expiry-test@example.com", otp_hash, expired_at)

        with self.assertRaises(ServiceError) as ctx:
            verify_otp("expiry-test@example.com", plain_otp)

        self.assertEqual(ctx.exception.code, "expired")

    def test_valid_otp_not_expired(self):
        """An OTP still within its window is accepted."""
        plain_otp = generate_otp()
        otp_hash = hash_otp(plain_otp)
        future = timezone.now() + timedelta(minutes=5)
        save_otp_record("expiry-test@example.com", otp_hash, future)

        reset_token = verify_otp("expiry-test@example.com", plain_otp)
        self.assertTrue(len(reset_token) >= 32)


class TestMaxAttempts(TestCase):
    """OTP attempt limit is enforced correctly."""

    def setUp(self):
        self.user = User.objects.create_user(
            email="attempts-test@example.com", password="Password123"
        )

    def test_max_attempts_exceeded(self):
        """After MAX_OTP_ATTEMPTS wrong guesses, the error code is 'max_attempts'."""
        from config.password_reset_config import PASSWORD_RESET_CONFIG

        plain_otp = generate_otp()
        otp_hash = hash_otp(plain_otp)
        future = timezone.now() + timedelta(minutes=5)
        save_otp_record("attempts-test@example.com", otp_hash, future)

        max_attempts = PASSWORD_RESET_CONFIG["MAX_OTP_ATTEMPTS"]
        wrong_otp = "000000"
        # Exhaust all attempts with an incorrect OTP.
        for _ in range(max_attempts):
            try:
                verify_otp("attempts-test@example.com", wrong_otp)
            except ServiceError:
                pass

        # The next attempt, even with the correct OTP, must fail with max_attempts.
        with self.assertRaises(ServiceError) as ctx:
            verify_otp("attempts-test@example.com", plain_otp)

        self.assertEqual(ctx.exception.code, "max_attempts")

    def test_correct_otp_before_limit_succeeds(self):
        """A correct OTP submitted before the attempt limit is still accepted."""
        from config.password_reset_config import PASSWORD_RESET_CONFIG

        plain_otp = generate_otp()
        otp_hash = hash_otp(plain_otp)
        future = timezone.now() + timedelta(minutes=5)
        save_otp_record("attempts-test@example.com", otp_hash, future)

        max_attempts = PASSWORD_RESET_CONFIG["MAX_OTP_ATTEMPTS"]
        # Submit wrong OTP (max_attempts - 1) times.
        for _ in range(max_attempts - 1):
            try:
                verify_otp("attempts-test@example.com", "000000")
            except ServiceError:
                pass

        # The final attempt with the correct OTP should succeed.
        # Reload the record (previous attempts may have been recorded on same obj).
        reset_token = verify_otp("attempts-test@example.com", plain_otp)
        self.assertIsInstance(reset_token, str)

    def tearDown(self):
        delete_otp_record("attempts-test@example.com")


class TestResetTokenExpiry(TestCase):
    """Reset token issued after OTP verification expires correctly."""

    def setUp(self):
        self.user = User.objects.create_user(
            email="token-expiry@example.com", password="Password123"
        )

    def test_expired_reset_token_raises(self):
        plain_token = generate_reset_token()
        token_hash = hash_reset_token(plain_token)
        expired_at = timezone.now() - timedelta(seconds=1)
        save_reset_token("token-expiry@example.com", token_hash, expired_at)

        with self.assertRaises(ServiceError) as ctx:
            reset_password(plain_token, "NewPassword456!")

        self.assertEqual(ctx.exception.code, "expired")

    def test_nonexistent_reset_token_raises(self):
        with self.assertRaises(ServiceError) as ctx:
            reset_password("totally-fake-token", "NewPassword456!")

        self.assertEqual(ctx.exception.code, "not_found")
