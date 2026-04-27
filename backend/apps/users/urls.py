from django.urls import path
from . import views

urlpatterns = [
    # Authentication
    path('register/', views.UserRegistrationView.as_view(), name='register'),
    path('login/', views.CustomTokenObtainPairView.as_view(), name='login'),

    # User management
    path('me/', views.UserDetailView.as_view(), name='user-detail'),
    path('profile/', views.UserProfileView.as_view(), name='user-profile'),
    path('gallery/', views.BusinessGalleryImageListCreateView.as_view(), name='business-gallery-list-create'),
    path('gallery/<int:pk>/', views.BusinessGalleryImageDetailView.as_view(), name='business-gallery-detail'),
    path('change-password/', views.ChangePasswordView.as_view(),
         name='change-password'),

    # Business management
    path('businesses/', views.BusinessListView.as_view(), name='business-list'),

    # Telegram
    path('telegram/', views.TelegramLinkView.as_view(), name='telegram-link'),

    # Notifications
    path('notifications/', views.NotificationListView.as_view(),
         name='notification-list'),
    path('notifications/<int:pk>/read/',
         views.MarkNotificationAsReadView.as_view(), name='mark-notification-read'),
    path('notifications/read-all/', views.MarkAllNotificationsAsReadView.as_view(),
         name='mark-all-notifications-read'),
]
