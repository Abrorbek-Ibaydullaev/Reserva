from rest_framework import generics, permissions, status, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404
from django.db.models import Q
from datetime import datetime, timedelta
from .models import Appointment, AppointmentHistory, CancellationReason, AppointmentCancellation
from .serializers import (
    AppointmentSerializer,
    CreateAppointmentSerializer,
    UpdateAppointmentStatusSerializer,
    RescheduleAppointmentSerializer,
    AppointmentHistorySerializer,
    CancellationReasonSerializer,
    AppointmentCancellationSerializer
)
from apps.schedules.views import CheckAvailabilityView
from apps.services.models import Service
# from apps.users.models import Notification
from django.contrib.auth import get_user_model

User = get_user_model()


class AppointmentListView(generics.ListCreateAPIView):
    """List and create appointments."""

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CreateAppointmentSerializer
        return AppointmentSerializer

    def get_queryset(self):
        user = self.request.user
        user_type = user.user_type

        if user_type == 'customer':
            return Appointment.objects.filter(customer=user)
        elif user_type in ['business_owner', 'employee', 'admin']:
            # Business owners see their business appointments
            # Employees see appointments assigned to them
            if user_type == 'employee':
                return Appointment.objects.filter(employee__user=user)
            else:
                return Appointment.objects.filter(business_owner=user)
        else:
            return Appointment.objects.none()

    def perform_create(self, serializer):
        # Check availability before creating appointment
        availability_check = CheckAvailabilityView()
        availability_check.request = self.request

        # Get service to check business owner
        service_id = self.request.data.get('service')
        service = Service.objects.get(id=service_id)

        # Prepare data for availability check
        availability_data = {
            'service_id': service_id,
            'employee_id': self.request.data.get('employee'),
            'date': self.request.data.get('date'),
            'start_time': self.request.data.get('start_time'),
            'end_time': '',  # Will be calculated
            'resource_id': self.request.data.get('resource')
        }

        # Calculate end time
        from datetime import datetime, timedelta
        date = datetime.strptime(availability_data['date'], '%Y-%m-%d').date()
        start_time = datetime.strptime(
            availability_data['start_time'], '%H:%M').time()
        duration = int(self.request.data.get('duration', 60))

        start_datetime = datetime.combine(date, start_time)
        end_datetime = start_datetime + timedelta(minutes=duration)
        availability_data['end_time'] = end_datetime.time()

        # Check availability
        availability_response = availability_check.post(
            availability_check.request)

        if availability_response.status_code == 200 and availability_response.data.get('available'):
            appointment = serializer.save()

            # Create notification for business owner
            Notification.objects.create(
                user=service.business_owner,
                notification_type='appointment_confirmation',
                title='New Appointment Request',
                message=f'New appointment request from {self.request.user.email} for {service.name}'
            )

            # Create notification for customer
            Notification.objects.create(
                user=self.request.user,
                notification_type='appointment_confirmation',
                title='Appointment Requested',
                message=f'Your appointment for {service.name} has been requested'
            )
        else:
            raise serializers.ValidationError({
                'error': 'Time slot is not available',
                'details': availability_response.data.get('message', 'Unknown error')
            })


class AppointmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete an appointment."""
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.user_type == 'customer':
            return Appointment.objects.filter(customer=user)
        elif user.user_type in ['business_owner', 'employee', 'admin']:
            if user.user_type == 'employee':
                return Appointment.objects.filter(employee__user=user)
            else:
                return Appointment.objects.filter(business_owner=user)
        else:
            return Appointment.objects.none()

    def perform_update(self, serializer):
        old_status = self.get_object().status
        appointment = serializer.save()

        # Track status changes
        new_status = appointment.status
        if old_status != new_status:
            AppointmentHistory.objects.create(
                appointment=appointment,
                changed_by=self.request.user,
                from_status=old_status,
                to_status=new_status,
                notes=f'Status changed from {old_status} to {new_status}'
            )

            # Create notifications based on status change
            self._create_status_notification(
                appointment, old_status, new_status)

    def _create_status_notification(self, appointment, old_status, new_status):
        """Create notifications for status changes."""
        notification_messages = {
            'confirmed': {
                'customer': f'Your appointment for {appointment.service.name} has been confirmed',
                'business': f'Appointment #{appointment.appointment_number} has been confirmed'
            },
            'cancelled': {
                'customer': f'Your appointment for {appointment.service.name} has been cancelled',
                'business': f'Appointment #{appointment.appointment_number} has been cancelled'
            },
            'completed': {
                'customer': f'Your appointment for {appointment.service.name} has been marked as completed',
                'business': f'Appointment #{appointment.appointment_number} has been completed'
            },
            'rescheduled': {
                'customer': f'Your appointment for {appointment.service.name} has been rescheduled',
                'business': f'Appointment #{appointment.appointment_number} has been rescheduled'
            }
        }

        if new_status in notification_messages:
            # Notify customer
            Notification.objects.create(
                user=appointment.customer,
                notification_type=f'appointment_{new_status}',
                title=f'Appointment {new_status.title()}',
                message=notification_messages[new_status]['customer']
            )

            # Notify business owner
            Notification.objects.create(
                user=appointment.business_owner,
                notification_type=f'appointment_{new_status}',
                title=f'Appointment {new_status.title()}',
                message=notification_messages[new_status]['business']
            )


class UpdateAppointmentStatusView(generics.UpdateAPIView):
    """Update appointment status."""
    serializer_class = UpdateAppointmentStatusSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.user_type in ['business_owner', 'employee', 'admin']:
            if user.user_type == 'employee':
                return Appointment.objects.filter(employee__user=user)
            else:
                return Appointment.objects.filter(business_owner=user)
        else:
            return Appointment.objects.none()

    def update(self, request, *args, **kwargs):
        appointment = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        old_status = appointment.status
        new_status = serializer.validated_data['status']
        notes = serializer.validated_data.get('notes', '')

        # Update appointment
        appointment.status = new_status

        # Update timestamps based on status
        if new_status == 'confirmed' and old_status != 'confirmed':
            appointment.confirmed_at = datetime.now()
        elif new_status == 'cancelled' and old_status != 'cancelled':
            appointment.cancelled_at = datetime.now()
        elif new_status == 'completed' and old_status != 'completed':
            appointment.completed_at = datetime.now()

        appointment.save()

        # Create history entry
        AppointmentHistory.objects.create(
            appointment=appointment,
            changed_by=request.user,
            from_status=old_status,
            to_status=new_status,
            notes=notes or f'Status changed from {old_status} to {new_status}'
        )

        # Create notifications
        self._create_status_notification(appointment, old_status, new_status)

        return Response(AppointmentSerializer(appointment).data, status=status.HTTP_200_OK)

    def _create_status_notification(self, appointment, old_status, new_status):
        """Same as in AppointmentDetailView"""
        notification_messages = {
            'confirmed': {
                'customer': f'Your appointment for {appointment.service.name} has been confirmed',
                'business': f'Appointment #{appointment.appointment_number} has been confirmed'
            },
            'cancelled': {
                'customer': f'Your appointment for {appointment.service.name} has been cancelled',
                'business': f'Appointment #{appointment.appointment_number} has been cancelled'
            },
            'completed': {
                'customer': f'Your appointment for {appointment.service.name} has been marked as completed',
                'business': f'Appointment #{appointment.appointment_number} has been completed'
            },
            'rescheduled': {
                'customer': f'Your appointment for {appointment.service.name} has been rescheduled',
                'business': f'Appointment #{appointment.appointment_number} has been rescheduled'
            }
        }

        if new_status in notification_messages:
            Notification.objects.create(
                user=appointment.customer,
                notification_type=f'appointment_{new_status}',
                title=f'Appointment {new_status.title()}',
                message=notification_messages[new_status]['customer']
            )

            Notification.objects.create(
                user=appointment.business_owner,
                notification_type=f'appointment_{new_status}',
                title=f'Appointment {new_status.title()}',
                message=notification_messages[new_status]['business']
            )


class RescheduleAppointmentView(generics.UpdateAPIView):
    """Reschedule an appointment."""
    serializer_class = RescheduleAppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.user_type == 'customer':
            return Appointment.objects.filter(customer=user, status__in=['pending', 'confirmed'])
        elif user.user_type in ['business_owner', 'employee', 'admin']:
            return Appointment.objects.filter(business_owner=user, status__in=['pending', 'confirmed'])
        else:
            return Appointment.objects.none()

    def update(self, request, *args, **kwargs):
        appointment = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Check availability for new time
        availability_check = CheckAvailabilityView()
        availability_check.request = request

        availability_data = {
            'service_id': appointment.service.id,
            'employee_id': appointment.employee.id if appointment.employee else None,
            'date': serializer.validated_data['date'],
            'start_time': serializer.validated_data['start_time'],
            'end_time': '',  # Will be calculated
            'resource_id': appointment.resource.id if appointment.resource else None
        }

        # Calculate end time
        from datetime import datetime, timedelta
        date = serializer.validated_data['date']
        start_time = serializer.validated_data['start_time']
        duration = appointment.duration

        start_datetime = datetime.combine(date, start_time)
        end_datetime = start_datetime + timedelta(minutes=duration)
        availability_data['end_time'] = end_datetime.time()

        # Check availability
        availability_response = availability_check.post(
            availability_check.request)

        if availability_response.status_code == 200 and availability_response.data.get('available'):
            # Update appointment
            old_date = appointment.date
            old_start_time = appointment.start_time

            appointment.date = date
            appointment.start_time = start_time
            appointment.end_time = end_datetime.time()
            appointment.status = 'rescheduled'
            appointment.save()

            # Create history entry
            AppointmentHistory.objects.create(
                appointment=appointment,
                changed_by=request.user,
                from_status='confirmed',
                to_status='rescheduled',
                notes=serializer.validated_data.get('notes',
                                                    f'Rescheduled from {old_date} {old_start_time} to {date} {start_time}')
            )

            # Create notifications
            Notification.objects.create(
                user=appointment.customer,
                notification_type='appointment_rescheduled',
                title='Appointment Rescheduled',
                message=f'Your appointment for {appointment.service.name} has been rescheduled to {date} at {start_time}'
            )

            Notification.objects.create(
                user=appointment.business_owner,
                notification_type='appointment_rescheduled',
                title='Appointment Rescheduled',
                message=f'Appointment #{appointment.appointment_number} has been rescheduled to {date} at {start_time}'
            )

            return Response(AppointmentSerializer(appointment).data, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': 'New time slot is not available',
                'details': availability_response.data.get('message', 'Unknown error')
            }, status=status.HTTP_400_BAD_REQUEST)


class CustomerAppointmentsView(generics.ListAPIView):
    """Get appointments for a specific customer."""
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        customer_id = self.kwargs.get('customer_id')

        # Only business owners can view customer appointments
        if self.request.user.user_type in ['business_owner', 'admin']:
            return Appointment.objects.filter(
                business_owner=self.request.user,
                customer_id=customer_id
            )
        return Appointment.objects.none()


class TodayAppointmentsView(generics.ListAPIView):
    """Get today's appointments."""
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        today = datetime.now().date()

        if user.user_type == 'customer':
            return Appointment.objects.filter(customer=user, date=today)
        elif user.user_type in ['business_owner', 'employee', 'admin']:
            if user.user_type == 'employee':
                return Appointment.objects.filter(employee__user=user, date=today)
            else:
                return Appointment.objects.filter(business_owner=user, date=today)
        else:
            return Appointment.objects.none()


class UpcomingAppointmentsView(generics.ListAPIView):
    """Get upcoming appointments."""
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        today = datetime.now().date()

        if user.user_type == 'customer':
            return Appointment.objects.filter(
                customer=user,
                date__gte=today,
                status__in=['pending', 'confirmed']
            ).order_by('date', 'start_time')
        elif user.user_type in ['business_owner', 'employee', 'admin']:
            if user.user_type == 'employee':
                return Appointment.objects.filter(
                    employee__user=user,
                    date__gte=today,
                    status__in=['pending', 'confirmed']
                ).order_by('date', 'start_time')
            else:
                return Appointment.objects.filter(
                    business_owner=user,
                    date__gte=today,
                    status__in=['pending', 'confirmed']
                ).order_by('date', 'start_time')
        else:
            return Appointment.objects.none()


class AppointmentHistoryListView(generics.ListAPIView):
    """Get appointment history."""
    serializer_class = AppointmentHistorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        appointment_id = self.kwargs.get('appointment_id')
        appointment = get_object_or_404(Appointment, id=appointment_id)

        # Check permissions
        user = self.request.user
        if user.user_type == 'customer':
            if appointment.customer != user:
                return AppointmentHistory.objects.none()
        elif user.user_type in ['business_owner', 'employee', 'admin']:
            if user.user_type == 'employee' and appointment.employee.user != user:
                if appointment.business_owner != user:
                    return AppointmentHistory.objects.none()

        return AppointmentHistory.objects.filter(appointment=appointment)


class CancellationReasonListView(generics.ListAPIView):
    """Get cancellation reasons."""
    serializer_class = CancellationReasonSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return CancellationReason.objects.filter(is_active=True)
