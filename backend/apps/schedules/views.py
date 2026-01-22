from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from datetime import datetime, timedelta, date, time
from django.db.models import Q
from .models import BusinessHours, Employee, EmployeeSchedule, EmployeeTimeOff, Resource
from .serializers import (
    BusinessHoursSerializer,
    EmployeeSerializer,
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


class BusinessHoursView(generics.ListCreateAPIView):
    """Manage business hours."""
    serializer_class = BusinessHoursSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return BusinessHours.objects.filter(business_owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(business_owner=self.request.user)


class EmployeeListView(generics.ListCreateAPIView):
    """List and create employees."""
    serializer_class = EmployeeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Employee.objects.filter(business_owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(business_owner=self.request.user)


class EmployeeDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete an employee."""
    serializer_class = EmployeeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Employee.objects.filter(business_owner=self.request.user)


class EmployeeScheduleView(generics.ListCreateAPIView):
    """Manage employee schedules."""
    serializer_class = EmployeeScheduleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        employee_id = self.kwargs.get('employee_id')
        return EmployeeSchedule.objects.filter(employee_id=employee_id, employee__business_owner=self.request.user)


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
                employee_schedule = EmployeeSchedule.objects.filter(
                    employee=employee,
                    date=date,
                    start_time__lte=start_time,
                    end_time__gte=end_time,
                    is_available=True
                ).exists()

                if not employee_schedule:
                    return Response({
                        'available': False,
                        'message': 'Employee not available at this time'
                    }, status=status.HTTP_200_OK)

                # Check employee time off
                time_off = EmployeeTimeOff.objects.filter(
                    employee=employee,
                    start_date__lte=date,
                    end_date__gte=date,
                    status='approved'
                ).exists()

                if time_off:
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

        # Get business hours for the day
        day_of_week = date.weekday()
        try:
            business_hours = BusinessHours.objects.get(
                business_owner=service.business_owner,
                day_of_week=day_of_week
            )
        except BusinessHours.DoesNotExist:
            return Response([], status=status.HTTP_200_OK)

        if not business_hours.is_open:
            return Response([], status=status.HTTP_200_OK)

        # Generate time slots
        time_slots = []
        slot_duration = service.duration
        current_time = business_hours.opening_time

        if business_hours.is_24_hours:
            business_hours.closing_time = time(23, 59)

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

        # Filter out unavailable slots
        available_slots = []
        for slot in time_slots:
            # Check for conflicts
            conflicts = Appointment.objects.filter(
                service=service,
                date=date,
                status__in=['confirmed', 'pending'],
                start_time__lt=slot['end_time'],
                end_time__gt=slot['start_time']
            ).exists()

            if not conflicts:
                available_slots.append(slot)

        serializer = TimeSlotSerializer(available_slots, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
