from django.urls import path
from . import views

urlpatterns = [
    # Business hours
    path('business-hours/', views.BusinessHoursView.as_view(), name='business-hours'),

    # Employees
    path('employees/', views.EmployeeListView.as_view(), name='employee-list'),
    path('employees/<int:pk>/', views.EmployeeDetailView.as_view(),
         name='employee-detail'),

    # Employee schedules
    path('employees/<int:employee_id>/schedules/',
         views.EmployeeScheduleView.as_view(), name='employee-schedule'),

    # Time off
    path('time-off/', views.EmployeeTimeOffListView.as_view(), name='time-off-list'),
    path('time-off/<int:pk>/', views.EmployeeTimeOffDetailView.as_view(),
         name='time-off-detail'),

    # Resources
    path('resources/', views.ResourceListView.as_view(), name='resource-list'),
    path('resources/<int:pk>/', views.ResourceDetailView.as_view(),
         name='resource-detail'),

    # Availability
    path('check-availability/', views.CheckAvailabilityView.as_view(),
         name='check-availability'),
    path('available-slots/', views.AvailableTimeSlotsView.as_view(),
         name='available-slots'),
]
