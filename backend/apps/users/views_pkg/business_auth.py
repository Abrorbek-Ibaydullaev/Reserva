"""Business onboarding auth for biz.reserva.services.

  * BusinessRegistrationView  — POST /api/auth/business/register/
      Manual owner + business registration (no social sign-up). New accounts
      are created unapproved (profile.is_approved=False).

  * BusinessGoogleAuthView    — POST /api/auth/business/google/
      "Sign in with Google" for existing, APPROVED business owners ONLY.
      Never creates an account. Fails gracefully otherwise.
"""

from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.utils.translation import gettext as _

from ..serializers import BusinessRegistrationSerializer
from .google_auth import (
    GoogleTokenError,
    verify_google_credential,
    issue_tokens,
)

User = get_user_model()

# Exact copy required by the product spec.
NO_BUSINESS_ACCOUNT_MSG = _(
    'No business account found with this email. '
    'Please register your business manually first.'
)


class BusinessRegistrationView(APIView):
    """Manual business-owner registration (biz.reserva.services)."""

    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        email = User.objects.normalize_email(request.data.get('email', '')).strip()
        if email and User.objects.filter(email__iexact=email).exists():
            return Response(
                {'detail': _('An account with this email already exists. Please sign in instead.')},
                status=status.HTTP_409_CONFLICT,
            )

        serializer = BusinessRegistrationSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Log the new owner in immediately. The account is unapproved until an
        # admin approves it — approval only gates the Google sign-in shortcut.
        return issue_tokens(user, request, created=True)


class BusinessGoogleAuthView(APIView):
    """Google sign-in for existing, approved business owners only.

    Verifies the Google token, then requires the email to already belong to an
    approved business_owner. Never creates a new account.
    """

    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        token = request.data.get('credential') or request.data.get('id_token')
        try:
            idinfo = verify_google_credential(token)
        except GoogleTokenError as exc:
            return Response({'detail': exc.detail}, status=exc.status_code)

        user = User.objects.filter(email__iexact=idinfo['email']).first()
        profile = getattr(user, 'profile', None) if user else None
        eligible = (
            user is not None
            and user.user_type == 'business_owner'
            and getattr(profile, 'is_approved', False)
        )

        if not eligible:
            # Do NOT create an account — fail gracefully with the exact message.
            return Response(
                {'detail': NO_BUSINESS_ACCOUNT_MSG},
                status=status.HTTP_403_FORBIDDEN,
            )

        return issue_tokens(user, request, created=False)
