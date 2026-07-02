"""Google Sign-In (OAuth 2.0 / Google Identity Services).

A single endpoint that accepts a Google ID token (the JWT credential returned
by the Google Identity Services SDK on the frontend), verifies it with Google's
official auth library, then either signs the user in or creates a new account
(upsert) and returns our own application's JWT tokens.
"""

from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.utils.translation import gettext as _
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests

from ..serializers import UserSerializer

User = get_user_model()

_GOOGLE_ISSUERS = ('accounts.google.com', 'https://accounts.google.com')


def _save_google_avatar(user, url):
    """Best-effort download of the Google profile picture into the ImageField.

    Never raises — a failed avatar download must not block authentication.
    Returns True if an image was saved.
    """
    if not url:
        return False
    try:
        import requests as http

        resp = http.get(url, timeout=5)
        if resp.status_code == 200 and resp.content:
            user.profile_picture.save(
                f'google_{user.pk}.jpg', ContentFile(resp.content), save=False
            )
            return True
    except Exception:
        pass
    return False


class GoogleAuthView(APIView):
    """POST /api/auth/google/  — sign in or sign up with a Google ID token.

    Request body:  { "credential": "<google-id-token-jwt>" }
    Response:      { "access", "refresh", "user", "created" }
    """

    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        token = request.data.get('credential') or request.data.get('id_token')
        if not token:
            return Response(
                {'detail': _('Missing Google credential.')},
                status=status.HTTP_400_BAD_REQUEST,
            )

        client_id = getattr(settings, 'GOOGLE_CLIENT_ID', '') or None
        if not client_id:
            return Response(
                {'detail': _('Google sign-in is not configured on the server.')},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        # Verify signature, expiry and audience (aud == our client_id) with Google.
        try:
            idinfo = google_id_token.verify_oauth2_token(
                token, google_requests.Request(), client_id
            )
        except ValueError:
            return Response(
                {'detail': _('Invalid or expired Google token.')},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if idinfo.get('iss') not in _GOOGLE_ISSUERS:
            return Response(
                {'detail': _('Invalid token issuer.')},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        email = (idinfo.get('email') or '').strip().lower()
        if not email:
            return Response(
                {'detail': _('Google account has no email address.')},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if idinfo.get('email_verified') is False:
            return Response(
                {'detail': _('Your Google email address is not verified.')},
                status=status.HTTP_400_BAD_REQUEST,
            )

        first_name = idinfo.get('given_name', '') or ''
        last_name = idinfo.get('family_name', '') or ''
        picture_url = idinfo.get('picture', '') or ''

        # ── Upsert: sign in if the email exists, otherwise create the account ──
        user = User.objects.filter(email__iexact=email).first()
        created = False

        if user is None:
            created = True
            # password=None → unusable password, so only Google login works
            # for this account until they set a password via reset.
            user = User.objects.create_user(
                email=email,
                password=None,
                first_name=first_name,
                last_name=last_name,
                is_verified=True,  # Google has already verified this email
            )
            if _save_google_avatar(user, picture_url):
                user.save(update_fields=['profile_picture'])
        else:
            # Backfill any details still missing on an existing account.
            dirty = []
            if not user.first_name and first_name:
                user.first_name = first_name
                dirty.append('first_name')
            if not user.last_name and last_name:
                user.last_name = last_name
                dirty.append('last_name')
            if not user.is_verified:
                user.is_verified = True
                dirty.append('is_verified')
            if not user.profile_picture and _save_google_avatar(user, picture_url):
                dirty.append('profile_picture')
            if dirty:
                user.save(update_fields=dirty)

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserSerializer(user, context={'request': request}).data,
                'created': created,
            },
            status=status.HTTP_200_OK,
        )
