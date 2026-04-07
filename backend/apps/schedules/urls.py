from django.urls import path
from . import views

urlpatterns = [
    # Business hours
    path('business-hours/', views.BusinessHoursView.as_view(), name='business-hours'),
    path('business-hours/<int:pk>/', views.BusinessHoursDetailView.as_view(),
         name='business-hours-detail'),

    # Employees
    path('employees/', views.EmployeeListView.as_view(), name='employee-list'),
    path('employees/<int:pk>/', views.EmployeeDetailView.as_view(),
         name='employee-detail'),

    # Employee schedules
    path('employees/<int:employee_id>/schedules/',
         views.EmployeeScheduleView.as_view(), name='employee-schedule'),
    path('employees/<int:employee_id>/schedules/<int:pk>/',
         views.EmployeeScheduleDetailView.as_view(), name='employee-schedule-detail'),
    path('me/employee-profile/', views.EmployeeSelfProfileView.as_view(), name='employee-self-profile'),
    path('me/weekly-hours/', views.EmployeeSelfWeeklyHoursListView.as_view(), name='employee-self-weekly-hours-list'),
    path('me/weekly-hours/<int:pk>/', views.EmployeeSelfWeeklyHoursDetailView.as_view(), name='employee-self-weekly-hours-detail'),
    path('me/schedules/', views.EmployeeSelfScheduleListCreateView.as_view(), name='employee-self-schedule-list'),
    path('me/schedules/<int:pk>/', views.EmployeeSelfScheduleDetailView.as_view(), name='employee-self-schedule-detail'),
    path('me/time-off/', views.EmployeeSelfTimeOffListCreateView.as_view(), name='employee-self-time-off-list'),
    path('me/time-off/<int:pk>/', views.EmployeeSelfTimeOffDetailView.as_view(), name='employee-self-time-off-detail'),

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
