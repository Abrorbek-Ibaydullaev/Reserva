"""
Email utilities for the users app.
"""

from django.conf import settings
from django.core.mail import send_mail


def send_password_reset_email(to_email: str, reset_token: str) -> None:
    """Send a password-reset email containing a single-use link.

    The link is built from FRONTEND_URL so it points at the correct
    environment (local dev vs. production).  Both a plain-text and an
    HTML version are included; mail clients will choose the richer one.

    Args:
        to_email:    Recipient email address.
        reset_token: URL-safe token stored in PasswordResetToken.token.
    """
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173').rstrip('/')
    reset_url = f'{frontend_url}/reset-password?token={reset_token}'
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@reserva.uz')

    subject = 'Reset your password - Reserva'

    plain_message = (
        'You requested a password reset for your Reserva account.\n\n'
        f'Click the link below to choose a new password. '
        'The link expires in 1 hour.\n\n'
        f'{reset_url}\n\n'
        'If you did not request this, you can safely ignore this email. '
        'Your password will not change.'
    )

    html_message = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset your password</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:ui-sans-serif,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:480px;background-color:#ffffff;border-radius:16px;border:1px solid #e2e8f0;padding:40px 32px;">
          <tr>
            <td style="padding-bottom:32px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:#2563eb;border-radius:10px;width:36px;height:36px;text-align:center;vertical-align:middle;">
                    <span style="color:#ffffff;font-size:18px;line-height:36px;">&#128197;</span>
                  </td>
                  <td style="padding-left:10px;font-size:18px;font-weight:700;color:#0f172a;">Reserva</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="font-size:22px;font-weight:700;color:#0f172a;padding-bottom:12px;">
              Reset your password
            </td>
          </tr>
          <tr>
            <td style="font-size:14px;color:#64748b;line-height:1.6;padding-bottom:28px;">
              We received a request to reset the password for your Reserva account.
              Click the button below to choose a new password. This link expires in
              <strong>1 hour</strong>.
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:28px;">
              <a href="{reset_url}"
                 style="display:inline-block;background-color:#2563eb;color:#ffffff;
                        font-size:14px;font-weight:700;text-decoration:none;
                        border-radius:10px;padding:12px 28px;">
                Reset password
              </a>
            </td>
          </tr>
          <tr>
            <td style="font-size:13px;color:#94a3b8;line-height:1.6;padding-bottom:20px;">
              Or copy and paste this URL into your browser:<br />
              <a href="{reset_url}" style="color:#2563eb;word-break:break-all;">{reset_url}</a>
            </td>
          </tr>
          <tr>
            <td style="border-top:1px solid #e2e8f0;padding-top:20px;font-size:12px;color:#94a3b8;">
              If you did not request a password reset, you can safely ignore this email.
              Your password will not change.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

    send_mail(
        subject=subject,
        message=plain_message,
        from_email=from_email,
        recipient_list=[to_email],
        html_message=html_message,
        fail_silently=True,
    )
