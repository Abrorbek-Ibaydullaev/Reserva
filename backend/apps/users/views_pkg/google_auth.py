"""Google Sign-In (OAuth 2.0 / Google Identity Services).

Verifies the Google ID token (the JWT credential from the frontend GSI SDK)
with Google's official auth library, then signs the user in / creates an
account and issues our own JWTs.

Two entry points share the same verification:
  * GoogleAuthView          — customer app (reserva.services): upsert.
  * BusinessGoogleAuthView  — biz app (biz.reserva.services): login-only,
    approved business owners only, never creates (see business_auth.py).
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


class GoogleTokenError(Exception):
    """A Google credential could not be verified. Carries an HTTP status."""

    def __init__(self, detail, status_code):
        super().__init__(detail)
        self.detail = detail
        self.status_code = status_code


def verify_google_credential(token):
    """Verify a Google ID token and return the parsed claims (idinfo).

    The returned dict's 'email' is normalised to lower-case. Raises
    GoogleTokenError(detail, status_code) on any problem so callers can turn
    it straight into a Response.
    """
    if not token:
        raise GoogleTokenError(_('Missing Google credential.'), status.HTTP_400_BAD_REQUEST)

    client_id = getattr(settings, 'GOOGLE_CLIENT_ID', '') or None
    if not client_id:
        raise GoogleTokenError(
            _('Google sign-in is not configured on the server.'),
            status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    try:
        idinfo = google_id_token.verify_oauth2_token(
            token, google_requests.Request(), client_id
        )
    except ValueError:
        raise GoogleTokenError(_('Invalid or expired Google token.'), status.HTTP_401_UNAUTHORIZED)

    if idinfo.get('iss') not in _GOOGLE_ISSUERS:
        raise GoogleTokenError(_('Invalid token issuer.'), status.HTTP_401_UNAUTHORIZED)

    email = (idinfo.get('email') or '').strip().lower()
    if not email:
        raise GoogleTokenError(_('Google account has no email address.'), status.HTTP_400_BAD_REQUEST)
    if idinfo.get('email_verified') is False:
        raise GoogleTokenError(_('Your Google email address is not verified.'), status.HTTP_400_BAD_REQUEST)

    idinfo['email'] = email
    return idinfo


def issue_tokens(user, request, created=False):
    """Build the standard auth response ({access, refresh, user, created})."""
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


def save_google_avatar(user, url):
    """Best-effort download of the Google profile picture. Never raises."""
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
    """POST /api/auth/google/ — customer app: sign in or sign up (upsert)."""

    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        token = request.data.get('credential') or request.data.get('id_token')
        try:
            idinfo = verify_google_credential(token)
        except GoogleTokenError as exc:
            return Response({'detail': exc.detail}, status=exc.status_code)

        email = idinfo['email']
        first_name = idinfo.get('given_name', '') or ''
        last_name = idinfo.get('family_name', '') or ''
        picture_url = idinfo.get('picture', '') or ''

        user = User.objects.filter(email__iexact=email).first()
        created = False

        if user is None:
            created = True
            user = User.objects.create_user(
                email=email, password=None,
                first_name=first_name, last_name=last_name, is_verified=True,
            )
            if save_google_avatar(user, picture_url):
                user.save(update_fields=['profile_picture'])
        else:
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
            if not user.profile_picture and save_google_avatar(user, picture_url):
                dirty.append('profile_picture')
            if dirty:
                user.save(update_fields=dirty)

        return issue_tokens(user, request, created=created)
