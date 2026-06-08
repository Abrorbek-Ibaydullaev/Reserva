from rest_framework import generics, permissions, status, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.conf import settings
from django.shortcuts import get_object_or_404
from .utils.email import send_password_reset_email
from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError
from datetime import timedelta
import secrets
from django.db.models import Avg, Count
from .models import UserProfile, Notification, BusinessGalleryImage, PasswordResetToken
from .recaptcha import verify_recaptcha
from apps.services.models import Service
from .serializers import (
    UserRegistrationSerializer,
    UserSerializer,
    UserProfileSerializer,
    ChangePasswordSerializer,
    NotificationSerializer,
    BusinessSerializer,
    BusinessGalleryImageSerializer,
)

User = get_user_model()


CITY_ALIASES = {
    'toshkent': ['toshkent', 'tashkent', 'ташкент'],
    'tashkent': ['toshkent', 'tashkent', 'ташкент'],
    'ташкент': ['toshkent', 'tashkent', 'ташкент'],
}


class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom token obtain view to include user data in response.

    Expects an optional 'recaptcha_token' field in the POST body alongside
    the standard 'email' and 'password' fields.
    """

    def post(self, request, *args, **kwargs):
        # Verify reCAPTCHA before processing credentials
        token = request.data.get('recaptcha_token', None)
        remote_ip = request.META.get('REMOTE_ADDR')
        if not verify_recaptcha(token, remote_ip):
            return Response(
                {'detail': 'reCAPTCHA verification failed. Please check the box and try again.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            user = User.objects.get(email=request.data['email'])
            serializer = UserSerializer(user, context={'request': request})
            response.data['user'] = serializer.data
        return response


class UserRegistrationView(generics.CreateAPIView):
    """Register a new user. Returns JWT tokens directly so the client
    never needs a separate login call (which would require a second reCAPTCHA)."""
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        email = User.objects.normalize_email(request.data.get('email', '')).strip()
        if email and User.objects.filter(email__iexact=email).exists():
            return Response(
                {'detail': 'Email already registered'},
                status=status.HTTP_409_CONFLICT,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = RefreshToken.for_user(user)
        user_data = UserSerializer(user, context={'request': request}).data

        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': user_data,
        }, status=status.HTTP_201_CREATED)


class UserProfileView(generics.RetrieveUpdateAPIView):
    """Retrieve or update user profile."""
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        profile, created = UserProfile.objects.get_or_create(
            user=self.request.user)
        return profile


class UserDetailView(generics.RetrieveUpdateAPIView):
    """Retrieve or update user details."""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class ChangePasswordView(generics.UpdateAPIView):
    """Change user password."""
    serializer_class = ChangePasswordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = self.get_object()
        if not user.check_password(serializer.data.get("old_password")):
            return Response({"old_password": ["Wrong password."]}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(serializer.data.get("new_password"))
        user.save()

        return Response({"message": "Password updated successfully."}, status=status.HTTP_200_OK)


class ForgotPasswordView(APIView):
    """Generate a password reset token and email/log the reset link."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = User.objects.normalize_email(request.data.get('email', '')).strip()
        if email:
            user = User.objects.filter(email__iexact=email).first()
            if user:
                # Invalidate any existing unused tokens for this user
                PasswordResetToken.objects.filter(
                    user=user, used_at__isnull=True
                ).update(used_at=timezone.now())

                token = secrets.token_urlsafe(48)
                PasswordResetToken.objects.create(
                    user=user,
                    token=token,
                    expires_at=timezone.now() + timedelta(hours=1),
                )
                frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173').rstrip('/')
                reset_link = f'{frontend_url}/reset-password?token={token}'
                print(f'[Reserva] Password reset link for {user.email}: {reset_link}')
                try:
                    send_password_reset_email(user.email, token)
                except Exception as exc:
                    print(f'[Reserva] Password reset email failed for {user.email}: {exc}')

        return Response(
            {'detail': 'If this email exists, a reset link has been sent.'},
            status=status.HTTP_200_OK,
        )


class ResetPasswordView(APIView):
    """Validate a reset token, update the password, and invalidate the token."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        token = request.data.get('token', '')
        new_password = request.data.get('new_password', '')
        reset_token = PasswordResetToken.objects.select_related('user').filter(token=token).first()

        if not reset_token or not reset_token.is_valid:
            return Response(
                {'detail': 'Invalid or expired reset token.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            validate_password(new_password, reset_token.user)
        except ValidationError as exc:
            return Response({'new_password': exc.messages}, status=status.HTTP_400_BAD_REQUEST)

        reset_token.user.set_password(new_password)
        reset_token.user.save(update_fields=['password'])
        reset_token.used_at = timezone.now()
        reset_token.save(update_fields=['used_at'])
        PasswordResetToken.objects.filter(
            user=reset_token.user,
            used_at__isnull=True,
        ).exclude(pk=reset_token.pk).update(used_at=timezone.now())

        return Response({'detail': 'Password reset successfully.'}, status=status.HTTP_200_OK)


class NotificationListView(generics.ListAPIView):
    """List all notifications for the authenticated user."""
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)


class MarkNotificationAsReadView(generics.UpdateAPIView):
    """Mark a notification as read."""
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    def update(self, request, *args, **kwargs):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({"message": "Notification marked as read."}, status=status.HTTP_200_OK)

    def patch(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs)


class MarkAllNotificationsAsReadView(APIView):
    """Mark all notifications as read."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        Notification.objects.filter(
            user=request.user, is_read=False).update(is_read=True)
        return Response({"message": "All notifications marked as read."}, status=status.HTTP_200_OK)

    def patch(self, request):
        return self.post(request)


class ClearAllNotificationsView(APIView):
    """Delete all notifications for the authenticated user."""
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        deleted_count, _ = Notification.objects.filter(user=request.user).delete()
        return Response(
            {"message": "All notifications cleared.", "deleted": deleted_count},
            status=status.HTTP_200_OK,
        )


class BusinessListView(generics.ListAPIView):
    """List all business owners with their service counts."""
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter]
    search_fields = ['first_name', 'last_name', 'email']

    def get_queryset(self):
        queryset = User.objects.filter(user_type='business_owner').annotate(
            services_count=models.Count('services', filter=models.Q(services__is_active=True)),
            avg_rating=Avg('services__reviews__rating'),
            review_count=Count('services__reviews', distinct=True),
        ).filter(services_count__gt=0).order_by('-services_count').prefetch_related(
            models.Prefetch(
                'services',
                queryset=Service.objects.filter(is_active=True).prefetch_related('service_images'),
                to_attr='services_active',
            ),
            'gallery_images',
        )
        city = self.request.query_params.get('city')
        if city:
            city_value = city.strip().lower()
            city_aliases = CITY_ALIASES.get(city_value, [city.strip()])
            city_filter = models.Q()
            for alias in city_aliases:
                city_filter |= models.Q(profile__city__icontains=alias)
            queryset = queryset.filter(city_filter)
        return queryset

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return BusinessSerializer
        return UserSerializer


class BusinessGalleryImageListCreateView(generics.ListCreateAPIView):
    """List and create gallery images for the authenticated business owner."""
    serializer_class = BusinessGalleryImageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return BusinessGalleryImage.objects.filter(business_owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(business_owner=self.request.user)


class BusinessGalleryImageDetailView(generics.DestroyAPIView):
    """Delete a gallery image for the authenticated business owner."""
    serializer_class = BusinessGalleryImageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return BusinessGalleryImage.objects.filter(business_owner=self.request.user)


class TelegramLinkView(APIView):
    """Return a Telegram deep-link for connecting the current user's account."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from apps.telegram_bot.service import get_telegram_link, make_link_token
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        link = get_telegram_link(request.user.id)
        return Response({
            'link': link,
            'connected': bool(profile.telegram_chat_id),
            'token': make_link_token(request.user.id),
        })

    def delete(self, request):
        """Disconnect Telegram."""
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        profile.telegram_chat_id = None
        profile.save(update_fields=['telegram_chat_id'])
        return Response({'detail': 'Telegram disconnected.'})
