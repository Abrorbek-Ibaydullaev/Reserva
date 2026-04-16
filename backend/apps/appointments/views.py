from rest_framework import generics, permissions, status, filters, serializers
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404
from django.db.models import Q
from datetime import datetime, timedelta
from decimal import Decimal
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
from apps.schedules.models import (
    BusinessHours,
    Employee,
    EmployeeSchedule,
    EmployeeTimeOff,
    EmployeeWeeklyHours,
    ensure_default_business_hours,
    ensure_default_employee_weekly_hours,
)
from apps.services.models import Service
from apps.users.models import Notification
from django.contrib.auth import get_user_model

User = get_user_model()


def has_time_off_overlap(time_off_entries, slot_start, slot_end):
    for entry in time_off_entries:
        if entry.is_all_day:
            return True

        if not entry.start_time or not entry.end_time:
            return True

        if entry.start_time < slot_end and entry.end_time > slot_start:
            return True

    return False


def employee_matches_slot(employee, target_date, slot_start, slot_end):
    date_specific_schedule_exists = EmployeeSchedule.objects.filter(
        employee=employee,
        date=target_date,
    ).exists()

    if date_specific_schedule_exists:
        return EmployeeSchedule.objects.filter(
            employee=employee,
            date=target_date,
            start_time__lte=slot_start,
            end_time__gte=slot_end,
            is_available=True,
        ).exists()

    ensure_default_employee_weekly_hours(employee)
    weekly_hours = EmployeeWeeklyHours.objects.filter(
        employee=employee,
        day_of_week=target_date.weekday(),
    ).first()

    if not weekly_hours or not weekly_hours.is_working:
        return False

    if not weekly_hours.start_time or not weekly_hours.end_time:
        return False

    return weekly_hours.start_time <= slot_start and weekly_hours.end_time >= slot_end


class AppointmentListView(generics.ListCreateAPIView):
    """List and create appointments."""
    permission_classes = [permissions.IsAuthenticated]

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
        if self.request.user.user_type != 'customer':
            raise ValidationError({
                'error': 'Booking not allowed',
                'details': 'Only customers can create appointments.',
            })

        service = serializer.validated_data['service']
        employee = serializer.validated_data.get('employee')
        resource = serializer.validated_data.get('resource')
        date = serializer.validated_data['date']
        start_time = serializer.validated_data['start_time']
        duration = serializer.validated_data['duration']

        start_datetime = datetime.combine(date, start_time)
        end_time = (start_datetime + timedelta(minutes=duration)).time()

        appointment_start = timezone.make_aware(start_datetime, timezone.get_current_timezone())
        if appointment_start <= timezone.localtime():
            raise ValidationError({
                'error': 'Time slot is not available',
                'details': 'Selected time has already passed.',
            })

        day_of_week = date.weekday()
        ensure_default_business_hours(service.business_owner)
        try:
            business_hours = BusinessHours.objects.get(
                business_owner=service.business_owner,
                day_of_week=day_of_week
            )
        except BusinessHours.DoesNotExist as exc:
            raise ValidationError({
                'error': 'Time slot is not available',
                'details': 'Business hours are not set for this day',
            }) from exc

        if not business_hours.is_open:
            raise ValidationError({
                'error': 'Time slot is not available',
                'details': 'Business is closed on this day',
            })

        if not business_hours.is_24_hours:
            if start_time < business_hours.opening_time or end_time > business_hours.closing_time:
                raise ValidationError({
                    'error': 'Time slot is not available',
                    'details': 'Selected time is outside business hours',
                })

        if employee:
            if not employee_matches_slot(employee, date, start_time, end_time):
                raise ValidationError({
                    'error': 'Time slot is not available',
                    'details': 'Selected employee is not working at that time.',
                })

            employee_has_conflict = Appointment.objects.filter(
                employee=employee,
                date=date,
                status__in=['confirmed', 'pending'],
                start_time__lt=end_time,
                end_time__gt=start_time
            ).exists()

            if employee_has_conflict:
                raise ValidationError({
                    'error': 'Time slot is not available',
                    'details': 'Selected employee is not available at that time',
                })

            employee_time_off = EmployeeTimeOff.objects.filter(
                employee=employee,
                start_date__lte=date,
                end_date__gte=date,
                status='approved'
            )

            if has_time_off_overlap(employee_time_off, start_time, end_time):
                raise ValidationError({
                    'error': 'Time slot is not available',
                    'details': 'Selected employee is on time off',
                })
        else:
            eligible_employees = Employee.objects.filter(
                business_owner=service.business_owner,
                is_active=True,
            )
            service_has_explicit_staff = eligible_employees.filter(services=service).exists()
            if service_has_explicit_staff:
                eligible_employees = eligible_employees.filter(services=service).distinct()

            if eligible_employees.exists():
                has_available_employee = False

                for candidate in eligible_employees:
                    if not employee_matches_slot(candidate, date, start_time, end_time):
                        continue

                    candidate_time_off = EmployeeTimeOff.objects.filter(
                        employee=candidate,
                        start_date__lte=date,
                        end_date__gte=date,
                        status='approved',
                    )
                    if has_time_off_overlap(candidate_time_off, start_time, end_time):
                        continue

                    candidate_conflict = Appointment.objects.filter(
                        employee=candidate,
                        date=date,
                        status__in=['confirmed', 'pending'],
                        start_time__lt=end_time,
                        end_time__gt=start_time,
                    ).exists()
                    if candidate_conflict:
                        continue

                    has_available_employee = True
                    break

                if not has_available_employee:
                    raise ValidationError({
                        'error': 'Time slot is not available',
                        'details': 'No staff member is available at that time.',
                    })

        if resource:
            resource_has_conflict = Appointment.objects.filter(
                resource=resource,
                date=date,
                status__in=['confirmed', 'pending'],
                start_time__lt=end_time,
                end_time__gt=start_time
            ).exists()

            if resource_has_conflict:
                raise ValidationError({
                    'error': 'Time slot is not available',
                    'details': 'Required resource is already booked',
                })

        appointment = serializer.save()

        Notification.objects.create(
            user=service.business_owner,
            notification_type='appointment_confirmation',
            title='New Appointment Request',
            message=f'New appointment request from {self.request.user.email} for {service.name}'
        )

        Notification.objects.create(
            user=self.request.user,
            notification_type='appointment_confirmation',
            title='Appointment Requested',
            message=f'Your appointment for {service.name} has been requested'
        )


class BusinessDashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.user_type != 'business_owner':
            return Response(
                {'detail': 'Only business owners can access dashboard statistics.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        today = timezone.localdate()
        now = timezone.localtime()
        next_30_days = today + timedelta(days=30)
        current_window_start = today - timedelta(days=29)
        previous_window_start = today - timedelta(days=59)
        previous_window_end = today - timedelta(days=30)
        seven_day_start = today - timedelta(days=6)

        appointments = list(
            Appointment.objects.filter(business_owner=request.user)
            .select_related('customer', 'service', 'employee__user')
            .order_by('-date', '-start_time')
        )
        services = list(Service.objects.filter(business_owner=request.user))
        employees = list(
            Employee.objects.filter(business_owner=request.user)
            .select_related('user')
            .prefetch_related('services')
        )

        completed_appointments = [item for item in appointments if item.status == 'completed']
        pending_appointments = [item for item in appointments if item.status == 'pending']
        cancelled_appointments = [item for item in appointments if item.status == 'cancelled']
        confirmed_appointments = [item for item in appointments if item.status == 'confirmed']
        no_show_appointments = [item for item in appointments if item.status == 'no_show']

        today_appointments = [
            item for item in appointments if item.date == today and item.status != 'cancelled'
        ]
        upcoming_appointments = [
            item for item in appointments
            if item.date >= today and item.status in ['pending', 'confirmed']
        ]
        upcoming_week_appointments = [
            item for item in upcoming_appointments if item.date <= today + timedelta(days=6)
        ]
        current_month_appointments = [
            item for item in appointments
            if item.date >= current_window_start and item.date <= today
        ]
        previous_month_appointments = [
            item for item in appointments
            if previous_window_start <= item.date <= previous_window_end
        ]

        total_revenue = sum(Decimal(item.total_amount or 0) for item in completed_appointments)
        revenue_30_days = sum(
            Decimal(item.total_amount or 0)
            for item in completed_appointments
            if current_window_start <= item.date <= today
        )
        previous_revenue_30_days = sum(
            Decimal(item.total_amount or 0)
            for item in completed_appointments
            if previous_window_start <= item.date <= previous_window_end
        )

        average_booking_value = (
            total_revenue / len(completed_appointments)
            if completed_appointments else Decimal('0')
        )

        def build_delta(current, previous):
            if previous == 0:
                return 100 if current > 0 else 0
            return round(((current - previous) / previous) * 100)

        status_counts = {}
        for item in appointments:
            status_counts[item.status] = status_counts.get(item.status, 0) + 1

        trend_data = []
        for offset in range(13, -1, -1):
            day = today - timedelta(days=offset)
            day_appointments = [item for item in appointments if item.date == day]
            day_completed = [item for item in day_appointments if item.status == 'completed']
            trend_data.append({
                'date': day.isoformat(),
                'label': day.strftime('%b %d'),
                'bookings': len(day_appointments),
                'completed': len(day_completed),
                'revenue': float(sum(Decimal(item.total_amount or 0) for item in day_completed)),
            })

        weekday_names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        weekday_map = {name: {'day': name, 'appointments': 0, 'revenue': 0.0} for name in weekday_names}
        for item in appointments:
            name = weekday_names[item.date.weekday()]
            weekday_map[name]['appointments'] += 1
            if item.status == 'completed':
                weekday_map[name]['revenue'] += float(Decimal(item.total_amount or 0))
        busiest_days = list(weekday_map.values())

        service_map = {}
        for service in services:
            service_map[service.id] = {
                'id': service.id,
                'name': service.name,
                'is_active': service.is_active,
                'appointments': 0,
                'completed': 0,
                'pending': 0,
                'revenue': 0.0,
            }
        for item in appointments:
            service_entry = service_map.get(item.service_id)
            if not service_entry:
                continue
            service_entry['appointments'] += 1
            if item.status == 'completed':
                service_entry['completed'] += 1
                service_entry['revenue'] += float(Decimal(item.total_amount or 0))
            if item.status == 'pending':
                service_entry['pending'] += 1
        top_services = sorted(
            service_map.values(),
            key=lambda item: (item['revenue'], item['appointments']),
            reverse=True,
        )[:5]

        employee_map = {}
        for employee in employees:
            employee_map[employee.id] = {
                'id': employee.id,
                'name': employee.user.get_full_name() or employee.user.email,
                'position': employee.position,
                'is_active': employee.is_active,
                'appointments': 0,
                'completed': 0,
                'upcoming': 0,
                'revenue': 0.0,
            }
        unassigned_appointments = 0
        for item in appointments:
            if not item.employee_id:
                unassigned_appointments += 1
                continue
            employee_entry = employee_map.get(item.employee_id)
            if not employee_entry:
                continue
            employee_entry['appointments'] += 1
            if item.status == 'completed':
                employee_entry['completed'] += 1
                employee_entry['revenue'] += float(Decimal(item.total_amount or 0))
            if item.date >= today and item.status in ['pending', 'confirmed']:
                employee_entry['upcoming'] += 1
        top_employees = sorted(
            employee_map.values(),
            key=lambda item: (item['completed'], item['revenue'], item['appointments']),
            reverse=True,
        )[:5]

        ensure_default_business_hours(request.user)
        business_hours = list(BusinessHours.objects.filter(business_owner=request.user))
        open_days = [hours for hours in business_hours if hours.is_open]
        today_hours = next((hours for hours in business_hours if hours.day_of_week == today.weekday()), None)

        today_employee_schedules = list(
            EmployeeSchedule.objects.filter(
                employee__business_owner=request.user,
                date=today,
                is_available=True,
            ).select_related('employee__user')
        )
        today_time_off = list(
            EmployeeTimeOff.objects.filter(
                employee__business_owner=request.user,
                start_date__lte=today,
                end_date__gte=today,
                status='approved',
            ).select_related('employee__user')
        )
        today_time_off_ids = {entry.employee_id for entry in today_time_off}

        scheduled_employee_ids = {entry.employee_id for entry in today_employee_schedules}
        weekly_workers_today = []
        if not scheduled_employee_ids:
            for employee in employees:
                if employee.id in today_time_off_ids or not employee.is_active:
                    continue
                ensure_default_employee_weekly_hours(employee)
                weekly_hours = EmployeeWeeklyHours.objects.filter(
                    employee=employee,
                    day_of_week=today.weekday(),
                    is_working=True,
                ).first()
                if weekly_hours:
                    weekly_workers_today.append(employee.id)

        staff_on_duty_today = len(scheduled_employee_ids) if scheduled_employee_ids else len(weekly_workers_today)
        unread_notifications = Notification.objects.filter(user=request.user, is_read=False).count()
        pending_time_off_requests = EmployeeTimeOff.objects.filter(
            employee__business_owner=request.user,
            status='pending',
        ).count()

        alert_items = []
        if pending_appointments:
            alert_items.append({
                'type': 'pending',
                'title': 'Pending confirmations',
                'value': len(pending_appointments),
                'description': 'Appointments waiting for a business response.',
            })
        if pending_time_off_requests:
            alert_items.append({
                'type': 'time_off',
                'title': 'Time off requests',
                'value': pending_time_off_requests,
                'description': 'Employee leave requests need review.',
            })
        if unassigned_appointments:
            alert_items.append({
                'type': 'unassigned',
                'title': 'Unassigned bookings',
                'value': unassigned_appointments,
                'description': 'Appointments without a selected employee.',
            })
        if today_hours and today_hours.is_open and staff_on_duty_today == 0:
            alert_items.append({
                'type': 'staffing',
                'title': 'No staff on duty today',
                'value': 0,
                'description': 'Business is open today but no available employee was detected.',
            })

        recent_appointments = []
        for item in appointments[:8]:
            recent_appointments.append({
                'id': item.id,
                'customer_name': item.customer.get_full_name() or item.customer.email,
                'customer_email': item.customer.email,
                'service_name': item.service.name,
                'employee_name': item.employee.user.get_full_name() if item.employee_id else 'Unassigned',
                'date': item.date.isoformat(),
                'start_time': item.start_time.strftime('%H:%M'),
                'status': item.status,
                'amount': float(Decimal(item.total_amount or 0)),
            })

        return Response({
            'overview': {
                'total_appointments': len(appointments),
                'today_appointments': len(today_appointments),
                'upcoming_7_days': len(upcoming_week_appointments),
                'pending_appointments': len(pending_appointments),
                'confirmed_appointments': len(confirmed_appointments),
                'completed_appointments': len(completed_appointments),
                'cancelled_appointments': len(cancelled_appointments),
                'no_show_appointments': len(no_show_appointments),
                'active_services': len([item for item in services if item.is_active]),
                'total_services': len(services),
                'active_employees': len([item for item in employees if item.is_active]),
                'total_employees': len(employees),
                'total_revenue': float(total_revenue),
                'revenue_30_days': float(revenue_30_days),
                'average_booking_value': float(average_booking_value),
                'completion_rate': round((len(completed_appointments) / len(appointments)) * 100, 1) if appointments else 0,
                'cancellation_rate': round((len(cancelled_appointments) / len(appointments)) * 100, 1) if appointments else 0,
                'no_show_rate': round((len(no_show_appointments) / len(appointments)) * 100, 1) if appointments else 0,
                'appointment_delta_30_days': build_delta(len(current_month_appointments), len(previous_month_appointments)),
                'revenue_delta_30_days': build_delta(float(revenue_30_days), float(previous_revenue_30_days)),
            },
            'status_breakdown': [
                {'status': key, 'count': value}
                for key, value in sorted(status_counts.items(), key=lambda item: item[1], reverse=True)
            ],
            'trends': trend_data,
            'busiest_days': busiest_days,
            'top_services': top_services,
            'top_employees': top_employees,
            'recent_appointments': recent_appointments,
            'schedule_overview': {
                'open_days_per_week': len(open_days),
                'staff_on_duty_today': staff_on_duty_today,
                'employees_on_time_off_today': len(today_time_off_ids),
                'today_is_open': bool(today_hours and today_hours.is_open),
                'today_opening_time': today_hours.opening_time.strftime('%H:%M') if today_hours and today_hours.opening_time else None,
                'today_closing_time': today_hours.closing_time.strftime('%H:%M') if today_hours and today_hours.closing_time else None,
            },
            'alerts': alert_items,
            'notifications': {
                'unread': unread_notifications,
            },
            'generated_at': now.isoformat(),
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


class CancelAppointmentView(APIView):
    """Cancel an appointment."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        appointment = get_object_or_404(Appointment, id=pk)
        user = request.user

        if user.user_type == 'customer':
            if appointment.customer != user:
                return Response({'error': 'You cannot cancel this appointment.'},
                                status=status.HTTP_403_FORBIDDEN)
        elif user.user_type in ['business_owner', 'employee', 'admin']:
            owns_appointment = appointment.business_owner == user
            assigned_employee = appointment.employee and appointment.employee.user == user
            if not owns_appointment and not assigned_employee and user.user_type != 'admin':
                return Response({'error': 'You cannot cancel this appointment.'},
                                status=status.HTTP_403_FORBIDDEN)
        else:
            return Response({'error': 'You cannot cancel this appointment.'},
                            status=status.HTTP_403_FORBIDDEN)

        if appointment.status not in ['pending', 'confirmed', 'rescheduled']:
            return Response({'error': 'Only active appointments can be cancelled.'},
                            status=status.HTTP_400_BAD_REQUEST)

        reason_text = (request.data.get('reason') or '').strip()
        appointment.status = 'cancelled'
        appointment.cancelled_at = datetime.now()
        appointment.save()

        AppointmentCancellation.objects.update_or_create(
            appointment=appointment,
            defaults={
                'cancelled_by': user,
                'custom_reason': reason_text or 'No reason provided',
            }
        )

        AppointmentHistory.objects.create(
            appointment=appointment,
            changed_by=user,
            from_status='confirmed',
            to_status='cancelled',
            notes=reason_text or 'Appointment cancelled'
        )

        if appointment.customer != user:
            Notification.objects.create(
                user=appointment.customer,
                notification_type='appointment_cancellation',
                title='Appointment Cancelled',
                message=f'Your appointment for {appointment.service.name} has been cancelled'
            )

        if appointment.business_owner != user:
            Notification.objects.create(
                user=appointment.business_owner,
                notification_type='appointment_cancellation',
                title='Appointment Cancelled',
                message=f'Appointment #{appointment.appointment_number} has been cancelled'
            )

        return Response(AppointmentSerializer(appointment).data, status=status.HTTP_200_OK)


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
        now = timezone.localtime()
        today = now.date()
        current_time = now.time()

        if user.user_type == 'customer':
            return Appointment.objects.filter(
                customer=user,
                status__in=['pending', 'confirmed']
            ).filter(
                Q(date__gt=today) | Q(date=today, start_time__gt=current_time)
            ).order_by('date', 'start_time')
        elif user.user_type in ['business_owner', 'employee', 'admin']:
            if user.user_type == 'employee':
                return Appointment.objects.filter(
                    employee__user=user,
                    status__in=['pending', 'confirmed']
                ).filter(
                    Q(date__gt=today) | Q(date=today, start_time__gt=current_time)
                ).order_by('date', 'start_time')
            else:
                return Appointment.objects.filter(
                    business_owner=user,
                    status__in=['pending', 'confirmed']
                ).filter(
                    Q(date__gt=today) | Q(date=today, start_time__gt=current_time)
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
