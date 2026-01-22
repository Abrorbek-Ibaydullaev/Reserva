from django.db import models
from django.contrib.auth import get_user_model
from apps.services.models import Service, ServiceAddon
from apps.schedules.models import Employee, Resource
import uuid

User = get_user_model()


class Appointment(models.Model):
    """Appointment/booking model."""

    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('no_show', 'No Show'),
        ('rescheduled', 'Rescheduled'),
    )

    PAYMENT_STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('partially_paid', 'Partially Paid'),
        ('refunded', 'Refunded'),
        ('cancelled', 'Cancelled'),
    )

    PAYMENT_METHOD_CHOICES = (
        ('credit_card', 'Credit Card'),
        ('debit_card', 'Debit Card'),
        ('paypal', 'PayPal'),
        ('stripe', 'Stripe'),
        ('cash', 'Cash'),
        ('other', 'Other'),
    )

    # Basic information
    appointment_number = models.CharField(
        max_length=50, unique=True, default=uuid.uuid4)
    customer = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='appointments')
    business_owner = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='business_appointments')
    service = models.ForeignKey(
        Service, on_delete=models.CASCADE, related_name='appointments')
    employee = models.ForeignKey(
        Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name='appointments')

    # Time information
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    duration = models.IntegerField(help_text="Duration in minutes")

    # Status
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_status = models.CharField(
        max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    payment_method = models.CharField(
        max_length=20, choices=PAYMENT_METHOD_CHOICES, blank=True, null=True)

    # Financial information
    service_price = models.DecimalField(max_digits=10, decimal_places=2)
    addons_total = models.DecimalField(
        max_digits=10, decimal_places=2, default=0)
    tax_amount = models.DecimalField(
        max_digits=10, decimal_places=2, default=0)
    discount_amount = models.DecimalField(
        max_digits=10, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    amount_paid = models.DecimalField(
        max_digits=10, decimal_places=2, default=0)

    # Payment information
    stripe_payment_intent_id = models.CharField(
        max_length=255, blank=True, null=True)
    stripe_refund_id = models.CharField(max_length=255, blank=True, null=True)

    # Additional information
    notes = models.TextField(blank=True, null=True)
    customer_notes = models.TextField(
        blank=True, null=True, help_text="Notes from the customer")
    internal_notes = models.TextField(
        blank=True, null=True, help_text="Internal business notes")

    # Resource booking
    resource = models.ForeignKey(
        Resource, on_delete=models.SET_NULL, null=True, blank=True, related_name='appointments')

    # Reminders and notifications
    reminder_sent = models.BooleanField(default=False)
    confirmation_sent = models.BooleanField(default=False)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    confirmed_at = models.DateTimeField(blank=True, null=True)
    cancelled_at = models.DateTimeField(blank=True, null=True)
    completed_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ['-date', '-start_time']
        indexes = [
            models.Index(fields=['appointment_number']),
            models.Index(fields=['customer', 'date']),
            models.Index(fields=['business_owner', 'date']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"{self.appointment_number} - {self.customer.email} - {self.service.name}"

    def save(self, *args, **kwargs):
        if not self.appointment_number:
            self.appointment_number = str(uuid.uuid4())[:8].upper()

        # Calculate end time if not provided
        if not self.end_time and self.start_time and self.duration:
            from datetime import datetime, timedelta
            start_datetime = datetime.combine(self.date, self.start_time)
            end_datetime = start_datetime + timedelta(minutes=self.duration)
            self.end_time = end_datetime.time()

        # Calculate total amount
        self.total_amount = float(self.service_price) + float(
            self.addons_total) + float(self.tax_amount) - float(self.discount_amount)

        super().save(*args, **kwargs)


class AppointmentAddon(models.Model):
    """Addons selected for an appointment."""
    appointment = models.ForeignKey(
        Appointment, on_delete=models.CASCADE, related_name='selected_addons')
    addon = models.ForeignKey(ServiceAddon, on_delete=models.CASCADE)
    quantity = models.IntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        unique_together = ['appointment', 'addon']

    def __str__(self):
        return f"{self.addon.name} x{self.quantity} - {self.appointment.appointment_number}"


class AppointmentHistory(models.Model):
    """Track appointment status changes and notes."""
    appointment = models.ForeignKey(
        Appointment, on_delete=models.CASCADE, related_name='history')
    changed_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name='appointment_changes')
    from_status = models.CharField(max_length=20, blank=True, null=True)
    to_status = models.CharField(max_length=20)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = "Appointment Histories"

    def __str__(self):
        return f"{self.appointment.appointment_number} - {self.from_status} → {self.to_status}"


class CancellationReason(models.Model):
    """Common cancellation reasons."""
    reason = models.CharField(max_length=255, unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.reason


class AppointmentCancellation(models.Model):
    """Track appointment cancellations."""
    appointment = models.OneToOneField(
        Appointment, on_delete=models.CASCADE, related_name='cancellation_details')
    cancelled_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name='cancelled_appointments')
    reason = models.ForeignKey(
        CancellationReason, on_delete=models.SET_NULL, null=True, blank=True)
    custom_reason = models.TextField(blank=True, null=True)
    refund_amount = models.DecimalField(
        max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Cancellation - {self.appointment.appointment_number}"
