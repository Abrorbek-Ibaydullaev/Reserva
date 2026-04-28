from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from datetime import datetime, timedelta, date, time
from django.db.models import Q
from .models import BusinessHours, Employee, EmployeeWeeklyHours, EmployeeSchedule, EmployeeTimeOff, Resource
from .models import ensure_default_business_hours, ensure_default_employee_weekly_hours
from .serializers import (
    BusinessHoursSerializer,
    EmployeeSerializer,
    EmployeeWeeklyHoursSerializer,
    EmployeeScheduleSerializer,
    EmployeeTimeOffSerializer,
    ResourceSerializer,
    AvailabilityCheckSerializer,
    TimeSlotSerializer
)
from apps.appointments.models import Appointment
from apps.services.models import Service
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


class BusinessHoursView(generics.ListCreateAPIView):
    """Manage business hours."""
    serializer_class = BusinessHoursSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        if self.request.method == 'GET':
            business_owner_id = self.request.query_params.get('business_owner')

            if business_owner_id:
                try:
                    business_owner = User.objects.get(id=business_owner_id, user_type='business_owner')
                except User.DoesNotExist:
                    return BusinessHours.objects.none()

                ensure_default_business_hours(business_owner)
                return BusinessHours.objects.filter(business_owner=business_owner)

            if self.request.user.is_authenticated:
                ensure_default_business_hours(self.request.user)
                return BusinessHours.objects.filter(business_owner=self.request.user)

            return BusinessHours.objects.none()

        ensure_default_business_hours(self.request.user)
        return BusinessHours.objects.filter(business_owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(business_owner=self.request.user)


class EmployeeListView(generics.ListCreateAPIView):
    """List and create employees."""
    serializer_class = EmployeeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Employee.objects.select_related('user').prefetch_related('services')
        user = self.request.user
        business_owner_id = self.request.query_params.get('business_owner')

        if self.request.method == 'GET':
            if user.user_type == 'business_owner':
                queryset = queryset.filter(business_owner=user)
            elif user.user_type == 'employee':
                queryset = queryset.filter(business_owner__employees__user=user).distinct()
            else:
                if not business_owner_id:
                    return Employee.objects.none()
                queryset = queryset.filter(business_owner_id=business_owner_id, is_active=True)
        else:
            queryset = queryset.filter(business_owner=user)

        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        return queryset

    def perform_create(self, serializer):
        serializer.save(business_owner=self.request.user)


class EmployeeDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete an employee."""
    serializer_class = EmployeeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Employee.objects.filter(business_owner=self.request.user).select_related(
            'user'
        ).prefetch_related('services')


class BusinessHoursDetailView(generics.RetrieveUpdateAPIView):
    """Retrieve or update a single business-hours record."""
    serializer_class = BusinessHoursSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        ensure_default_business_hours(self.request.user)
        return BusinessHours.objects.filter(business_owner=self.request.user)


class EmployeeScheduleView(generics.ListCreateAPIView):
    """Manage employee schedules."""
    serializer_class = EmployeeScheduleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        employee_id = self.kwargs.get('employee_id')
        return EmployeeSchedule.objects.filter(employee_id=employee_id, employee__business_owner=self.request.user)


class EmployeeScheduleDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Manage a single employee schedule."""
    serializer_class = EmployeeScheduleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        employee_id = self.kwargs.get('employee_id')
        return EmployeeSchedule.objects.filter(
            employee_id=employee_id,
            employee__business_owner=self.request.user,
        )


class EmployeeTimeOffListView(generics.ListCreateAPIView):
    """List and create time off requests."""
    serializer_class = EmployeeTimeOffSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return EmployeeTimeOff.objects.filter(employee__business_owner=self.request.user)

    def perform_create(self, serializer):
        employee_id = self.request.data.get('employee')
        employee = Employee.objects.get(id=employee_id)
        serializer.save(employee=employee)


class EmployeeTimeOffDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a time off request."""
    serializer_class = EmployeeTimeOffSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return EmployeeTimeOff.objects.filter(employee__business_owner=self.request.user)


class EmployeeSelfProfileView(generics.RetrieveUpdateAPIView):
    """Allow employees to manage their own employee profile."""
    serializer_class = EmployeeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return Employee.objects.select_related('user').prefetch_related('services').get(user=self.request.user)


class EmployeeSelfWeeklyHoursListView(generics.ListAPIView):
    """Allow employees to view their weekly working hours."""
    serializer_class = EmployeeWeeklyHoursSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        employee = Employee.objects.get(user=self.request.user)
        ensure_default_employee_weekly_hours(employee)
        return EmployeeWeeklyHours.objects.filter(employee=employee)


class EmployeeSelfWeeklyHoursDetailView(generics.RetrieveUpdateAPIView):
    """Allow employees to update one weekly working-hours row."""
    serializer_class = EmployeeWeeklyHoursSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        employee = Employee.objects.get(user=self.request.user)
        ensure_default_employee_weekly_hours(employee)
        return EmployeeWeeklyHours.objects.filter(employee=employee)


class EmployeeSelfScheduleListCreateView(generics.ListCreateAPIView):
    """Allow employees to manage their own schedules."""
    serializer_class = EmployeeScheduleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return EmployeeSchedule.objects.filter(employee__user=self.request.user).select_related('employee')

    def perform_create(self, serializer):
        employee = Employee.objects.get(user=self.request.user)
        serializer.save(employee=employee)


class EmployeeSelfScheduleDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Allow employees to update their own schedules."""
    serializer_class = EmployeeScheduleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return EmployeeSchedule.objects.filter(employee__user=self.request.user).select_related('employee')


class EmployeeSelfTimeOffListCreateView(generics.ListCreateAPIView):
    """Allow employees to set their own personal duty / unavailable periods."""
    serializer_class = EmployeeTimeOffSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return EmployeeTimeOff.objects.filter(employee__user=self.request.user).select_related('employee')

    def perform_create(self, serializer):
        employee = Employee.objects.get(user=self.request.user)
        serializer.save(employee=employee, status='approved')


class EmployeeSelfTimeOffDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Allow employees to update their own personal duty / unavailable periods."""
    serializer_class = EmployeeTimeOffSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return EmployeeTimeOff.objects.filter(employee__user=self.request.user).select_related('employee')

    def perform_update(self, serializer):
        serializer.save(status='approved')


class ResourceListView(generics.ListCreateAPIView):
    """List and create resources."""
    serializer_class = ResourceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Resource.objects.filter(business_owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(business_owner=self.request.user)


class ResourceDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a resource."""
    serializer_class = ResourceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Resource.objects.filter(business_owner=self.request.user)


class CheckAvailabilityView(APIView):
    """Check if a time slot is available."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = AvailabilityCheckSerializer(data=request.data)
        if serializer.is_valid():
            data = serializer.validated_data

            service = Service.objects.get(id=data['service_id'])
            employee_id = data.get('employee_id')
            resource_id = data.get('resource_id')
            date = data['date']
            start_time = data['start_time']
            end_time = data['end_time']

            # Check business hours
            day_of_week = date.weekday()
            try:
                business_hours = BusinessHours.objects.get(
                    business_owner=service.business_owner,
                    day_of_week=day_of_week
                )
                if not business_hours.is_open:
                    return Response({
                        'available': False,
                        'message': 'Business is closed on this day'
                    }, status=status.HTTP_200_OK)

                if not business_hours.is_24_hours:
                    if start_time < business_hours.opening_time or end_time > business_hours.closing_time:
                        return Response({
                            'available': False,
                            'message': 'Outside business hours'
                        }, status=status.HTTP_200_OK)
            except BusinessHours.DoesNotExist:
                return Response({
                    'available': False,
                    'message': 'Business hours not set for this day'
                }, status=status.HTTP_200_OK)

            # Check employee availability if specified
            if employee_id:
                employee = Employee.objects.get(id=employee_id)

                # Check employee schedule
                if not employee_matches_slot(employee, date, start_time, end_time):
                    return Response({
                        'available': False,
                        'message': 'Employee not available at this time'
                    }, status=status.HTTP_200_OK)

                # Check employee time off
                time_off_entries = EmployeeTimeOff.objects.filter(
                    employee=employee,
                    start_date__lte=date,
                    end_date__gte=date,
                    status='approved'
                )

                if has_time_off_overlap(time_off_entries, start_time, end_time):
                    return Response({
                        'available': False,
                        'message': 'Employee is on time off'
                    }, status=status.HTTP_200_OK)

                # Check employee appointments
                conflicting_appointments = Appointment.objects.filter(
                    employee=employee,
                    date=date,
                    status__in=['confirmed', 'pending'],
                    start_time__lt=end_time,
                    end_time__gt=start_time
                ).exists()

                if conflicting_appointments:
                    return Response({
                        'available': False,
                        'message': 'Employee has conflicting appointment'
                    }, status=status.HTTP_200_OK)

            # Check resource availability if specified
            if resource_id:
                resource = Resource.objects.get(id=resource_id)

                # Check resource appointments
                conflicting_appointments = Appointment.objects.filter(
                    resource=resource,
                    date=date,
                    status__in=['confirmed', 'pending'],
                    start_time__lt=end_time,
                    end_time__gt=start_time
                ).exists()

                if conflicting_appointments:
                    return Response({
                        'available': False,
                        'message': 'Resource is already booked'
                    }, status=status.HTTP_200_OK)

            return Response({
                'available': True,
                'message': 'Time slot is available'
            }, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AvailableTimeSlotsView(APIView):
    """Get available time slots for a service."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        service_id = request.query_params.get('service_id')
        date_str = request.query_params.get('date')
        employee_id = request.query_params.get('employee_id')

        if not service_id or not date_str:
            return Response({'error': 'service_id and date are required'},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            service = Service.objects.get(id=service_id)
            date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except (Service.DoesNotExist, ValueError):
            return Response({'error': 'Invalid service or date format'},
                            status=status.HTTP_400_BAD_REQUEST)

        employee = None
        available_employee_pool = Employee.objects.filter(
            business_owner=service.business_owner,
            is_active=True,
        ).prefetch_related('services')
        service_has_explicit_staff = Employee.objects.filter(
            business_owner=service.business_owner,
            is_active=True,
            services=service,
        ).exists()

        if service_has_explicit_staff:
            available_employee_pool = available_employee_pool.filter(services=service).distinct()

        if employee_id:
            try:
                employee = Employee.objects.get(
                    id=employee_id,
                    business_owner=service.business_owner,
                    is_active=True,
                )
            except Employee.DoesNotExist:
                return Response({
                    'slots': [],
                    'reason': 'The selected staff member is unavailable.',
                }, status=status.HTTP_200_OK)

            if service_has_explicit_staff and not employee.services.filter(id=service.id).exists():
                return Response({
                    'slots': [],
                    'reason': 'The selected staff member does not provide this service.',
                }, status=status.HTTP_200_OK)

        # Get business hours for the day
        day_of_week = date.weekday()
        ensure_default_business_hours(service.business_owner)
        try:
            business_hours = BusinessHours.objects.get(
                business_owner=service.business_owner,
                day_of_week=day_of_week
            )
        except BusinessHours.DoesNotExist:
            return Response({
                'slots': [],
                'reason': 'This business has no working hours configured for that day.',
            }, status=status.HTTP_200_OK)

        if not business_hours.is_open:
            return Response({
                'slots': [],
                'reason': 'This business is closed on the selected day.',
            }, status=status.HTTP_200_OK)

        # Generate time slots
        time_slots = []
        slot_duration = service.duration

        if business_hours.is_24_hours:
            business_hours.opening_time = time(0, 0)
            business_hours.closing_time = time(23, 59)

        if not business_hours.opening_time or not business_hours.closing_time:
            return Response({
                'slots': [],
                'reason': 'Business hours are not fully configured for that day.',
            }, status=status.HTTP_200_OK)

        current_time = business_hours.opening_time

        while current_time < business_hours.closing_time:
            end_time = (datetime.combine(date, current_time) +
                        timedelta(minutes=slot_duration)).time()

            if end_time > business_hours.closing_time:
                break

            time_slots.append({
                'date': date,
                'start_time': current_time,
                'end_time': end_time,
            })

            # Move to next slot with 15-minute intervals
            current_time = (datetime.combine(date, current_time) +
                            timedelta(minutes=15)).time()

        current_local_time = timezone.localtime().time()
        if date == timezone.localdate():
            time_slots = [
                slot for slot in time_slots
                if slot['start_time'] > current_local_time
            ]

        # Filter out unavailable slots
        available_slots = []
        for slot in time_slots:
            if employee:
                if not employee_matches_slot(employee, date, slot['start_time'], slot['end_time']):
                    continue

                employee_time_off = EmployeeTimeOff.objects.filter(
                    employee=employee,
                    start_date__lte=date,
                    end_date__gte=date,
                    status='approved',
                )

                if has_time_off_overlap(employee_time_off, slot['start_time'], slot['end_time']):
                    continue

                employee_conflict = Appointment.objects.filter(
                    employee=employee,
                    date=date,
                    status__in=['confirmed', 'pending'],
                    start_time__lt=slot['end_time'],
                    end_time__gt=slot['start_time'],
                ).exists()

                if employee_conflict:
                    continue

                slot['employee_id'] = employee.id
                slot['employee_name'] = employee.user.get_full_name() or employee.user.email
            else:
                matching_employee_found = False

                for candidate in available_employee_pool:
                    if not employee_matches_slot(candidate, date, slot['start_time'], slot['end_time']):
                        continue

                    candidate_time_off = EmployeeTimeOff.objects.filter(
                        employee=candidate,
                        start_date__lte=date,
                        end_date__gte=date,
                        status='approved',
                    )
                    if has_time_off_overlap(candidate_time_off, slot['start_time'], slot['end_time']):
                        continue

                    employee_conflict = Appointment.objects.filter(
                        employee=candidate,
                        date=date,
                        status__in=['confirmed', 'pending'],
                        start_time__lt=slot['end_time'],
                        end_time__gt=slot['start_time'],
                    ).exists()
                    if employee_conflict:
                        continue

                    matching_employee_found = True
                    break

                if not matching_employee_found and available_employee_pool.exists():
                    continue

            available_slots.append(slot)

        serializer = TimeSlotSerializer(available_slots, many=True)
        reason = None
        if not available_slots:
            reason = 'No free time slots are left for this date.'

        return Response({
            'slots': serializer.data,
            'reason': reason,
        }, status=status.HTTP_200_OK)
