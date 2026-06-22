"""Inbound webhook handlers for Reserva.

Currently handles:
- Resend inbound email forwarding for support@reserva.services

Design decisions:
- AllowAny + csrf_exempt: these endpoints are called by external services, not
  logged-in users.  Authentication is handled via HMAC signature verification
  instead of session/JWT tokens.
- Always return HTTP 200 to Resend (even for ignored events) so it does not
  retry the delivery.  The only exception is an explicit HMAC failure (401).
- Raw body (`request.body`) is used for signature verification.  DRF parses
  JSON into `request.data` which loses the exact byte representation needed for
  HMAC comparison.
"""

from __future__ import annotations

import logging
import os

from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

logger = logging.getLogger(__name__)

# The email address Resend forwards ALL inbound domain traffic to.
# Only emails explicitly addressed to this address are processed.
SUPPORT_EMAIL = "support@reserva.services"


@method_decorator(csrf_exempt, name="dispatch")
class ResendInboundWebhookView(APIView):
    """Handle inbound email events forwarded by Resend.

    Resend delivers a POST request to this endpoint whenever a message arrives
    at any address on the reserva.services domain.  The payload envelope looks
    like::

        {
            "type": "email.received",
            "data": {
                "from": "sender@example.com",
                "to": ["support@reserva.services"],
                "subject": "Hello",
                "text": "...",
                "html": "...",
                ...
            }
        }

    Verification uses Resend's Svix-based HMAC-SHA256 scheme.  Set
    RESEND_WEBHOOK_SECRET (starts with ``whsec_``) in the environment to enable
    it.  Without the secret the signature check is skipped (useful in local
    development).
    """

    permission_classes = [AllowAny]
    authentication_classes = []  # No JWT / session auth — Resend is not a user

    def post(self, request: Request) -> Response:
        # ------------------------------------------------------------------
        # Step 1: HMAC signature verification (optional in local dev)
        # ------------------------------------------------------------------
        webhook_secret = os.environ.get("RESEND_WEBHOOK_SECRET", "")

        if webhook_secret:
            verification_error = self._verify_signature(request, webhook_secret)
            if verification_error:
                logger.warning(
                    "Resend webhook signature verification failed: %s",
                    verification_error,
                )
                return Response(
                    {"detail": "Invalid webhook signature."},
                    status=status.HTTP_401_UNAUTHORIZED,
                )
        else:
            logger.warning(
                "RESEND_WEBHOOK_SECRET is not set — skipping signature verification. "
                "Set this variable in production to prevent spoofed requests."
            )

        # ------------------------------------------------------------------
        # Step 2: Parse the JSON payload
        # ------------------------------------------------------------------
        # DRF already parsed the body into request.data (Content-Type:
        # application/json is sent by Resend).  Use it here; raw bytes were
        # only needed above for HMAC.
        payload = request.data
        if not isinstance(payload, dict):
            logger.warning(
                "Resend webhook received unexpected payload type: %s",
                type(payload).__name__,
            )
            return Response({"detail": "ok"}, status=status.HTTP_200_OK)

        # ------------------------------------------------------------------
        # Step 3: Filter for the email.received event type
        # ------------------------------------------------------------------
        event_type = payload.get("type")
        if event_type != "email.received":
            # Resend may send other event types (e.g. delivery status events)
            # to the same endpoint.  Acknowledge and ignore them.
            logger.debug("Resend webhook: ignoring event type '%s'", event_type)
            return Response({"detail": "ok"}, status=status.HTTP_200_OK)

        data = payload.get("data")
        if not isinstance(data, dict):
            logger.warning(
                "Resend webhook: email.received event is missing a 'data' object."
            )
            return Response({"detail": "ok"}, status=status.HTTP_200_OK)

        # ------------------------------------------------------------------
        # Step 4: Extract envelope fields
        # ------------------------------------------------------------------
        sender: str = data.get("from", "")
        subject: str = data.get("subject", "(no subject)")
        recipients: list[str] = data.get("to", [])

        if not isinstance(recipients, list):
            # Guard against a malformed `to` field
            recipients = [recipients] if recipients else []

        # ------------------------------------------------------------------
        # Step 5: Guard — only process emails addressed to the support inbox
        # ------------------------------------------------------------------
        # Resend routes ALL mail received on the domain to this single webhook,
        # so we must explicitly check that the support address appears in `to`.
        support_lower = SUPPORT_EMAIL.lower()
        addressed_to_support = any(
            addr.strip().lower() == support_lower for addr in recipients
        )

        if not addressed_to_support:
            logger.info(
                "Resend webhook: email not addressed to %s (to=%r) — ignoring.",
                SUPPORT_EMAIL,
                recipients,
            )
            return Response({"detail": "ok"}, status=status.HTTP_200_OK)

        # ------------------------------------------------------------------
        # Step 6: Process the support email
        # ------------------------------------------------------------------
        logger.info(
            "Resend inbound support email received — from=%r subject=%r",
            sender,
            subject,
        )

        # TODO: insert database / ticketing system logic here.
        #
        # At this point you have:
        #   sender   (str)  — the Reply-To / From address of the customer
        #   subject  (str)  — the email subject line
        #   recipients (list[str]) — all addresses in the To: field
        #   data["text"]  (str | None) — plain-text body
        #   data["html"]  (str | None) — HTML body
        #   data["message_id"] (str)   — RFC 2822 Message-ID for deduplication
        #   data["created_at"] (str)   — ISO 8601 timestamp from Resend
        #
        # Example next steps:
        #   - Create a SupportTicket model instance
        #   - Trigger a Telegram notification to the admin
        #   - Send an auto-reply via resend.Emails.send(...)

        return Response({"detail": "ok"}, status=status.HTTP_200_OK)

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _verify_signature(self, request: Request, webhook_secret: str) -> str | None:
        """Run Svix HMAC-SHA256 verification.

        Returns None on success, or an error message string on failure.
        Must use `request.body` (raw bytes) — not re-serialised JSON — to
        match the exact byte sequence that Resend signed.
        """
        try:
            import resend  # imported lazily so a missing package only errors here

            svix_id = request.META.get("HTTP_SVIX_ID", "")
            svix_timestamp = request.META.get("HTTP_SVIX_TIMESTAMP", "")
            svix_signature = request.META.get("HTTP_SVIX_SIGNATURE", "")

            if not all([svix_id, svix_timestamp, svix_signature]):
                return (
                    "One or more Svix headers are missing "
                    f"(svix-id={bool(svix_id)}, svix-timestamp={bool(svix_timestamp)}, "
                    f"svix-signature={bool(svix_signature)})"
                )

            # request.body is bytes; decode to str for the Resend SDK
            raw_body: str = request.body.decode("utf-8")

            resend.Webhooks.verify(
                {
                    "payload": raw_body,
                    "headers": {
                        "id": svix_id,
                        "timestamp": svix_timestamp,
                        "signature": svix_signature,
                    },
                    "webhook_secret": webhook_secret,
                }
            )
            return None  # Verification passed

        except ValueError as exc:
            return str(exc)
        except Exception as exc:
            logger.exception("Unexpected error during Resend webhook verification.")
            return f"unexpected error: {exc}"
