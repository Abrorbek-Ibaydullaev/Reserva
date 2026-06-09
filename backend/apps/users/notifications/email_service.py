"""Email notifications for the OTP password-reset flow.

Uses Django's ``send_mail`` so the backend (SMTP vs. console) is controlled
entirely by settings — no credentials are hard-coded here.

Email dispatch runs in a daemon thread so the HTTP response is returned
immediately and the Gunicorn worker is never blocked by the SMTP handshake.
"""

import logging
import threading

from django.conf import settings
from django.core.mail import send_mail

from config.password_reset_config import PASSWORD_RESET_CONFIG

logger = logging.getLogger(__name__)


def send_password_reset_otp(to_email: str, otp_code: str) -> None:
    """Send an OTP code email to *to_email*.

    The plain OTP is passed in from the caller (who generated it just before
    calling this function) and is NOT persisted anywhere inside this function.

    Args:
        to_email:  Recipient email address.
        otp_code:  The 6-digit plain-text OTP (displayed in the email body).
    """
    from_email: str = settings.DEFAULT_FROM_EMAIL
    expiry_minutes: int = PASSWORD_RESET_CONFIG["OTP_EXPIRY_MINUTES"]

    subject = "Your Reserva password reset code"

    plain_message = (
        f"Your Reserva password reset code is: {otp_code}\n\n"
        f"This code expires in {expiry_minutes} minutes.\n\n"
        "Do not share this code with anyone.\n\n"
        "If you did not request a password reset, you can safely ignore this email."
    )

    html_message = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Reserva password reset code</title>
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:ui-sans-serif,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0"
         style="background-color:#0f172a;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:480px;background-color:#1e293b;
               border-radius:16px;border:1px solid #334155;padding:40px 32px;">

          <!-- Logo row -->
          <tr>
            <td style="padding-bottom:32px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:#2563eb;border-radius:10px;
                             width:36px;height:36px;text-align:center;
                             vertical-align:middle;">
                    <span style="color:#ffffff;font-size:18px;line-height:36px;">&#128197;</span>
                  </td>
                  <td style="padding-left:10px;font-size:18px;font-weight:700;
                             color:#f1f5f9;">Reserva</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Heading -->
          <tr>
            <td style="font-size:22px;font-weight:700;color:#f1f5f9;
                       padding-bottom:12px;">
              Password reset code
            </td>
          </tr>

          <!-- Body copy -->
          <tr>
            <td style="font-size:14px;color:#94a3b8;line-height:1.6;
                       padding-bottom:28px;">
              Use the code below to reset your Reserva account password.
              The code expires in <strong style="color:#f1f5f9;">{expiry_minutes} minutes</strong>.
            </td>
          </tr>

          <!-- OTP display -->
          <tr>
            <td align="center" style="padding-bottom:28px;">
              <div style="display:inline-block;background-color:#0f172a;
                          border:2px solid #2563eb;border-radius:12px;
                          padding:20px 36px;">
                <span style="font-size:40px;font-weight:900;
                             letter-spacing:10px;color:#f1f5f9;
                             font-family:ui-monospace,monospace;">
                  {otp_code}
                </span>
              </div>
            </td>
          </tr>

          <!-- Warning -->
          <tr>
            <td style="font-size:13px;color:#f97316;font-weight:600;
                       padding-bottom:20px;text-align:center;">
              Do not share this code with anyone.
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="border-top:1px solid #334155;padding-top:20px;
                       font-size:12px;color:#64748b;">
              If you did not request a password reset, you can safely ignore
              this email. Your password will not change.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

    def _send() -> None:
        try:
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=from_email,
                recipient_list=[to_email],
                html_message=html_message,
                fail_silently=False,
            )
        except Exception:
            logger.exception("Failed to send password reset OTP email to %s", to_email)

    thread = threading.Thread(target=_send, daemon=True)
    thread.start()
