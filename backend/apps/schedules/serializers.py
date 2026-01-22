from rest_framework import serializers
from .models import BusinessHours, Employee, EmployeeSchedule, EmployeeTimeOff, Resource
from apps.users.serializers import UserSerializer
from apps.services.serializers import ServiceListSerializer


class BusinessHoursSerializer(serializers.ModelSerializer):
    class Meta:
        model = BusinessHours
        fields = '__all__'
        read_only_fields = ('business_owner',)


class EmployeeSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    services_details = ServiceListSerializer(
        source='services', many=True, read_only=True)

    class Meta:
        model = Employee
        fields = '__all__'
        read_only_fields = ('business_owner', 'created_at', 'updated_at')


class EmployeeScheduleSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(
        source='employee.user.get_full_name', read_only=True)

    class Meta:
        model = EmployeeSchedule
        fields = '__all__'


class EmployeeTimeOffSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(
        source='employee.user.get_full_name', read_only=True)
    approved_by_name = serializers.CharField(
        source='approved_by.get_full_name', read_only=True, allow_null=True)

    class Meta:
        model = EmployeeTimeOff
        fields = '__all__'
        read_only_fields = ('employee', 'approved_by',
                            'created_at', 'updated_at')


class ResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resource
        fields = '__all__'
        read_only_fields = ('business_owner', 'created_at', 'updated_at')


class AvailabilityCheckSerializer(serializers.Serializer):
    """Serializer for checking availability."""
    service_id = serializers.IntegerField()
    employee_id = serializers.IntegerField(required=False, allow_null=True)
    date = serializers.DateField()
    start_time = serializers.TimeField()
    end_time = serializers.TimeField()
    resource_id = serializers.IntegerField(required=False, allow_null=True)


class TimeSlotSerializer(serializers.Serializer):
    """Serializer for available time slots."""
    date = serializers.DateField()
    start_time = serializers.TimeField()
    end_time = serializers.TimeField()
    employee_id = serializers.IntegerField(required=False, allow_null=True)
    employee_name = serializers.CharField(required=False, allow_null=True)
    resource_id = serializers.IntegerField(required=False, allow_null=True)
    resource_name = serializers.CharField(required=False, allow_null=True)
