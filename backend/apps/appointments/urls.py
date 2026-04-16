from django.urls import path
from . import views

urlpatterns = [
    # Appointments
    path('', views.AppointmentListView.as_view(), name='appointment-list'),
    path('dashboard-stats/', views.BusinessDashboardStatsView.as_view(),
         name='business-dashboard-stats'),
    path('<int:pk>/', views.AppointmentDetailView.as_view(),
         name='appointment-detail'),

    # Appointment status
    path('<int:pk>/status/', views.UpdateAppointmentStatusView.as_view(),
         name='update-appointment-status'),
    path('<int:pk>/cancel/', views.CancelAppointmentView.as_view(),
         name='cancel-appointment'),
    path('<int:pk>/reschedule/', views.RescheduleAppointmentView.as_view(),
         name='reschedule-appointment'),

    # Filtered appointments
    path('customer/<int:customer_id>/',
         views.CustomerAppointmentsView.as_view(), name='customer-appointments'),
    path('today/', views.TodayAppointmentsView.as_view(),
         name='today-appointments'),
    path('upcoming/', views.UpcomingAppointmentsView.as_view(),
         name='upcoming-appointments'),

    # History
    path('<int:appointment_id>/history/',
         views.AppointmentHistoryListView.as_view(), name='appointment-history'),

    # Cancellation reasons
    path('cancellation-reasons/', views.CancellationReasonListView.as_view(),
         name='cancellation-reasons'),
]
