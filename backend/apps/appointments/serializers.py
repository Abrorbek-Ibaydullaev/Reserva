from rest_framework import serializers
from .models import Appointment, AppointmentAddon, AppointmentHistory, CancellationReason, AppointmentCancellation
from apps.users.serializers import UserSerializer
from apps.services.serializers import ServiceSerializer, ServiceAddonSerializer
from apps.schedules.serializers import EmployeeSerializer, ResourceSerializer


class AppointmentAddonSerializer(serializers.ModelSerializer):
    addon_details = ServiceAddonSerializer(source='addon', read_only=True)

    class Meta:
        model = AppointmentAddon
        fields = '__all__'
        read_only_fields = ('price',)


class AppointmentHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.CharField(
        source='changed_by.get_full_name', read_only=True, allow_null=True)

    class Meta:
        model = AppointmentHistory
        fields = '__all__'
        read_only_fields = ('appointment', 'changed_by', 'created_at')


class CancellationReasonSerializer(serializers.ModelSerializer):
    class Meta:
        model = CancellationReason
        fields = '__all__'


class AppointmentCancellationSerializer(serializers.ModelSerializer):
    cancelled_by_name = serializers.CharField(
        source='cancelled_by.get_full_name', read_only=True, allow_null=True)
    reason_text = serializers.CharField(
        source='reason.reason', read_only=True, allow_null=True)

    class Meta:
        model = AppointmentCancellation
        fields = '__all__'
        read_only_fields = ('appointment', 'cancelled_by', 'created_at')


class AppointmentSerializer(serializers.ModelSerializer):
    customer_details = UserSerializer(source='customer', read_only=True)
    business_owner_details = UserSerializer(
        source='business_owner', read_only=True)
    service_details = ServiceSerializer(source='service', read_only=True)
    employee_details = EmployeeSerializer(source='employee', read_only=True)
    resource_details = ResourceSerializer(source='resource', read_only=True)
    selected_addons = AppointmentAddonSerializer(many=True, read_only=True)
    history = AppointmentHistorySerializer(many=True, read_only=True)
    cancellation_details = AppointmentCancellationSerializer(read_only=True)

    class Meta:
        model = Appointment
        fields = '__all__'
        read_only_fields = ('appointment_number', 'customer', 'business_owner',
                            'created_at', 'updated_at', 'confirmed_at',
                            'cancelled_at', 'completed_at')


class CreateAppointmentSerializer(serializers.ModelSerializer):
    addons = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        write_only=True
    )

    class Meta:
        model = Appointment
        fields = ('service', 'employee', 'date', 'start_time', 'duration',
                  'customer_notes', 'resource', 'addons')

    def create(self, validated_data):
        addons_data = validated_data.pop('addons', [])

        # Get service to calculate price
        service = validated_data['service']
        validated_data['service_price'] = service.price
        validated_data['business_owner'] = service.business_owner
        validated_data['customer'] = self.context['request'].user

        # Calculate end time
        from datetime import datetime, timedelta
        date = validated_data['date']
        start_time = validated_data['start_time']
        duration = validated_data['duration']

        start_datetime = datetime.combine(date, start_time)
        end_datetime = start_datetime + timedelta(minutes=duration)
        validated_data['end_time'] = end_datetime.time()

        # Calculate addons total
        addons_total = 0
        for addon_data in addons_data:
            addon_id = addon_data.get('addon_id')
            quantity = addon_data.get('quantity', 1)

            from apps.services.models import ServiceAddon
            try:
                addon = ServiceAddon.objects.get(id=addon_id, service=service)
                addons_total += float(addon.price) * quantity
            except ServiceAddon.DoesNotExist:
                continue

        validated_data['addons_total'] = addons_total
        validated_data['total_amount'] = float(service.price) + addons_total

        # Create appointment
        appointment = Appointment.objects.create(**validated_data)

        # Create appointment addons
        for addon_data in addons_data:
            addon_id = addon_data.get('addon_id')
            quantity = addon_data.get('quantity', 1)

            try:
                addon = ServiceAddon.objects.get(id=addon_id, service=service)
                AppointmentAddon.objects.create(
                    appointment=appointment,
                    addon=addon,
                    quantity=quantity,
                    price=addon.price
                )
            except ServiceAddon.DoesNotExist:
                continue

        # Create initial history entry
        AppointmentHistory.objects.create(
            appointment=appointment,
            changed_by=self.context['request'].user,
            to_status='pending',
            notes='Appointment created'
        )

        return appointment


class UpdateAppointmentStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Appointment.STATUS_CHOICES)
    notes = serializers.CharField(required=False, allow_blank=True)


class RescheduleAppointmentSerializer(serializers.Serializer):
    date = serializers.DateField()
    start_time = serializers.TimeField()
    notes = serializers.CharField(required=False, allow_blank=True)
