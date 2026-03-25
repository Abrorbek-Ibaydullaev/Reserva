from datetime import time
from django.db import models
from django.contrib.auth import get_user_model
from apps.services.models import Service

User = get_user_model()


DEFAULT_BUSINESS_HOURS = {
    0: (True, time(9, 0), time(18, 0)),
    1: (True, time(9, 0), time(18, 0)),
    2: (True, time(9, 0), time(18, 0)),
    3: (True, time(9, 0), time(18, 0)),
    4: (True, time(9, 0), time(18, 0)),
    5: (True, time(10, 0), time(16, 0)),
    6: (False, None, None),
}


def ensure_default_business_hours(business_owner):
    """Bootstrap a basic weekly schedule for businesses with no configured hours."""
    existing_hours = BusinessHours.objects.filter(business_owner=business_owner)
    if existing_hours.exists():
        return

    for day_of_week, (is_open, opening_time, closing_time) in DEFAULT_BUSINESS_HOURS.items():
        BusinessHours.objects.create(
            business_owner=business_owner,
            day_of_week=day_of_week,
            is_open=is_open,
            opening_time=opening_time,
            closing_time=closing_time,
            is_24_hours=False,
        )


class BusinessHours(models.Model):
    """Business operating hours."""

    DAYS_OF_WEEK = (
        (0, 'Monday'),
        (1, 'Tuesday'),
        (2, 'Wednesday'),
        (3, 'Thursday'),
        (4, 'Friday'),
        (5, 'Saturday'),
        (6, 'Sunday'),
    )

    business_owner = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='business_hours')
    day_of_week = models.IntegerField(choices=DAYS_OF_WEEK)
    is_open = models.BooleanField(default=True)
    opening_time = models.TimeField(blank=True, null=True)
    closing_time = models.TimeField(blank=True, null=True)
    is_24_hours = models.BooleanField(default=False)

    class Meta:
        unique_together = ['business_owner', 'day_of_week']
        ordering = ['day_of_week']

    def __str__(self):
        return f"{self.get_day_of_week_display()} - {self.business_owner.email}"


class Employee(models.Model):
    """Business employees/staff members."""

    business_owner = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='employees')
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='employee_profiles')
    services = models.ManyToManyField(
        Service, related_name='employees', blank=True)
    position = models.CharField(max_length=100)
    bio = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    color_code = models.CharField(
        max_length=7, default='#4A90E2', help_text="Color for calendar display")

    # Availability
    max_daily_appointments = models.IntegerField(default=10)
    appointment_buffer = models.IntegerField(
        default=15, help_text="Buffer time between appointments (minutes)")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['business_owner', 'user']

    def __str__(self):
        return f"{self.user.get_full_name()} - {self.business_owner.email}"


class EmployeeSchedule(models.Model):
    """Employee working schedule."""

    employee = models.ForeignKey(
        Employee, on_delete=models.CASCADE, related_name='schedules')
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_available = models.BooleanField(default=True)
    notes = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['date', 'start_time']
        unique_together = ['employee', 'date', 'start_time']

    def __str__(self):
        return f"{self.employee.user.get_full_name()} - {self.date} {self.start_time}"


class EmployeeTimeOff(models.Model):
    """Employee time off/vacation requests."""

    TIME_OFF_TYPES = (
        ('vacation', 'Vacation'),
        ('sick', 'Sick Leave'),
        ('personal', 'Personal Day'),
        ('other', 'Other'),
    )

    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
    )

    employee = models.ForeignKey(
        Employee, on_delete=models.CASCADE, related_name='time_off_requests')
    time_off_type = models.CharField(max_length=20, choices=TIME_OFF_TYPES)
    start_date = models.DateField()
    end_date = models.DateField()
    start_time = models.TimeField(blank=True, null=True)
    end_time = models.TimeField(blank=True, null=True)
    is_all_day = models.BooleanField(default=True)
    reason = models.TextField()
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='pending')
    approved_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_time_off')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.employee.user.get_full_name()} - {self.time_off_type} ({self.start_date} to {self.end_date})"


class Resource(models.Model):
    """Business resources (rooms, equipment, etc.) for scheduling."""

    RESOURCE_TYPES = (
        ('room', 'Room'),
        ('equipment', 'Equipment'),
        ('vehicle', 'Vehicle'),
        ('other', 'Other'),
    )

    business_owner = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='resources')
    name = models.CharField(max_length=200)
    resource_type = models.CharField(max_length=20, choices=RESOURCE_TYPES)
    description = models.TextField(blank=True, null=True)
    capacity = models.IntegerField(
        default=1, help_text="Maximum number of people/items")
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.business_owner.email}"
