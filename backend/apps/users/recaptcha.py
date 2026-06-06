"""
Server-side Google reCAPTCHA v2 verification utility.

Usage in a DRF serializer:
    from apps.users.recaptcha import verify_recaptcha

    def validate(self, attrs):
        token = attrs.pop('recaptcha_token', None)
        if not verify_recaptcha(token):
            raise serializers.ValidationError(
                {'recaptcha': 'reCAPTCHA verification failed. Please try again.'}
            )
        return attrs
"""

import requests
from django.conf import settings

RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify'

# In development the default secret key is the placeholder string.
# Google also provides a special test secret key that always passes:
#   6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe
# Set RECAPTCHA_SECRET_KEY to that value in your .env during local testing.
_SKIP_SENTINEL = 'your-recaptcha-secret-key-here'


def verify_recaptcha(token: str | None, remote_ip: str | None = None) -> bool:
    """
    Verify a reCAPTCHA v2 token with Google's API.

    Returns True when the token is valid.
    Returns True (skips check) when DEBUG=True or when the secret key is
    still the placeholder — so local development works without real tokens.
    Returns False on any verification failure in production.
    """
    # Skip entirely in DEBUG mode (local development)
    if getattr(settings, 'DEBUG', False):
        return True

    secret = getattr(settings, 'RECAPTCHA_SECRET_KEY', _SKIP_SENTINEL)

    # Also skip when the secret key is still the dev placeholder
    if secret == _SKIP_SENTINEL:
        return True

    if not token:
        return False

    payload = {'secret': secret, 'response': token}
    if remote_ip:
        payload['remoteip'] = remote_ip

    try:
        resp = requests.post(RECAPTCHA_VERIFY_URL, data=payload, timeout=5)
        resp.raise_for_status()
        result = resp.json()
        return bool(result.get('success'))
    except Exception:
        # If Google's API is unreachable, fail open in dev and fail closed in
        # production (production always has a real key, so the skip above won't
        # trigger).
        return False
