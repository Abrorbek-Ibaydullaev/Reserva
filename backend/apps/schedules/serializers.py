from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import BusinessHours, Employee, EmployeeWeeklyHours, EmployeeSchedule, EmployeeTimeOff, Resource
from apps.users.serializers import UserSerializer
from apps.services.serializers import ServiceListSerializer

User = get_user_model()


class BusinessHoursSerializer(serializers.ModelSerializer):
    class Meta:
        model = BusinessHours
        fields = '__all__'
        read_only_fields = ('business_owner',)


class EmployeeSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    services_details = ServiceListSerializer(
        source='services', many=True, read_only=True)
    first_name = serializers.CharField(write_only=True, required=False)
    last_name = serializers.CharField(write_only=True, required=False)
    email = serializers.EmailField(write_only=True, required=False)
    password = serializers.CharField(write_only=True, required=False, allow_blank=False)
    phone_number = serializers.CharField(write_only=True, required=False, allow_blank=True)
    service_ids = serializers.ListField(
        child=serializers.IntegerField(), write_only=True, required=False
    )

    class Meta:
        model = Employee
        fields = '__all__'
        read_only_fields = ('business_owner', 'user', 'services', 'created_at', 'updated_at')

    def validate(self, attrs):
        if self.instance is None:
            required_fields = ['first_name', 'last_name', 'email', 'password']
            missing_fields = [field for field in required_fields if not attrs.get(field)]
            if missing_fields:
                raise serializers.ValidationError({
                    field: 'This field is required.'
                    for field in missing_fields
                })

        return attrs

    def create(self, validated_data):
        service_ids = validated_data.pop('service_ids', [])
        first_name = validated_data.pop('first_name')
        last_name = validated_data.pop('last_name')
        email = validated_data.pop('email')
        password = validated_data.pop('password')
        phone_number = validated_data.pop('phone_number', '')

        user = User.objects.create_user(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            phone_number=phone_number,
            user_type='employee',
        )

        employee = Employee.objects.create(user=user, **validated_data)
        if service_ids:
            employee.services.set(service_ids)

        return employee

    def update(self, instance, validated_data):
        service_ids = validated_data.pop('service_ids', None)
        first_name = validated_data.pop('first_name', None)
        last_name = validated_data.pop('last_name', None)
        email = validated_data.pop('email', None)
        password = validated_data.pop('password', None)
        phone_number = validated_data.pop('phone_number', None)

        user = instance.user
        if first_name is not None:
            user.first_name = first_name
        if last_name is not None:
            user.last_name = last_name
        if email is not None:
            user.email = email
        if phone_number is not None:
            user.phone_number = phone_number
        if password:
            user.set_password(password)
        user.save()

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if service_ids is not None:
            instance.services.set(service_ids)

        return instance


class EmployeeScheduleSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(
        source='employee.user.get_full_name', read_only=True)

    class Meta:
        model = EmployeeSchedule
        fields = '__all__'


class EmployeeWeeklyHoursSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(
        source='employee.user.get_full_name', read_only=True)

    class Meta:
        model = EmployeeWeeklyHours
        fields = '__all__'
        read_only_fields = ('employee',)


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
