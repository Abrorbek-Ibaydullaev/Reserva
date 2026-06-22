"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.urls import path, include
from django.contrib import admin
from django.conf import settings
from django.views.static import serve  # 👈 Crucial import for production serving
from rest_framework_simplejwt.views import TokenRefreshView
from apps.users.views import (
    CustomTokenObtainPairView,
    UserRegistrationView,
    UserProfileView,
    ChangePasswordView,
    NotificationListView,
    MarkNotificationAsReadView,
    MarkAllNotificationsAsReadView,
    ClearAllNotificationsView,
)
from apps.users.views_pkg.password_reset import (
    OTPForgotPasswordView,
    OTPVerifyOTPView,
    OTPResetPasswordView,
)
from config.views import get_translations

urlpatterns = [
    path('admin/', admin.site.urls),

    # Authentication endpoints
    path('api/auth/login/', CustomTokenObtainPairView.as_view(),
         name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/register/', UserRegistrationView.as_view(), name='register'),
    path('api/auth/profile/', UserProfileView.as_view(), name='user-profile'),
    path('api/auth/change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('api/auth/forgot-password/', OTPForgotPasswordView.as_view(), name='forgot-password'),
    path('api/auth/verify-otp/', OTPVerifyOTPView.as_view(), name='verify-otp'),
    path('api/auth/reset-password/', OTPResetPasswordView.as_view(), name='reset-password'),

    # Translations (mobile OTA bridge — web uses static /locales/ files)
    path('api/locales/<str:lang>/', get_translations, name='get-translations'),

    # App endpoints
    path('api/notifications/', NotificationListView.as_view(),
         name='notification-list-root'),
    path('api/notifications/<int:pk>/read/',
         MarkNotificationAsReadView.as_view(), name='mark-notification-read-root'),
    path('api/notifications/read-all/', MarkAllNotificationsAsReadView.as_view(),
         name='mark-all-notifications-read-root'),
    path('api/notifications/clear-all/', ClearAllNotificationsView.as_view(),
         name='clear-all-notifications-root'),
    path('api/users/', include('apps.users.urls')),
    path('api/services/', include('apps.services.urls')),
    path('api/schedules/', include('apps.schedules.urls')),
    path('api/appointments/', include('apps.appointments.urls')),
]

# 🛠️ Fix: Explicitly serve media from your Railway Volume in both Dev and Prod
if settings.MEDIA_URL:
    urlpatterns += [
        path(
            f"{settings.MEDIA_URL.lstrip('/')}<path:path>",
            serve,
            {"document_root": settings.MEDIA_ROOT},
        )
    ]
