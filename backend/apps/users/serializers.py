from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import UserProfile, Notification, BusinessGalleryImage
from django.contrib.auth.password_validation import validate_password
from apps.services.serializers import ServiceListSerializer

User = get_user_model()


def build_absolute_media_url(request, value):
    if not value:
        return value
    if request:
        return request.build_absolute_uri(value)
    return value


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('email', 'password', 'password2', 'first_name',
                  'last_name', 'phone_number', 'user_type')
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True},
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError(
                {"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_first_name = serializers.CharField(
        source='user.first_name', read_only=True)
    user_last_name = serializers.CharField(
        source='user.last_name', read_only=True)

    class Meta:
        model = UserProfile
        fields = '__all__'
        read_only_fields = ('user',)


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'phone_number',
                  'user_type', 'profile_picture', 'date_of_birth', 'is_verified',
                  'created_at', 'profile')
        read_only_fields = ('id', 'created_at', 'is_verified')

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['profile_picture'] = build_absolute_media_url(
            self.context.get('request'),
            data.get('profile_picture'),
        )
        return data


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(
        required=True, validators=[validate_password])


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'
        read_only_fields = ('user', 'created_at')


class BusinessGalleryImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = BusinessGalleryImage
        fields = '__all__'
        read_only_fields = ('business_owner', 'created_at')

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['image'] = build_absolute_media_url(
            self.context.get('request'),
            data.get('image'),
        )
        return data


class BusinessSerializer(serializers.ModelSerializer):
    """Serializer for business owners with service count."""
    full_name = serializers.SerializerMethodField()
    services_count = serializers.SerializerMethodField()
    services = ServiceListSerializer(many=True, read_only=True, source='services_active')
    profile = UserProfileSerializer(read_only=True)
    gallery_images = BusinessGalleryImageSerializer(many=True, read_only=True)

    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'full_name',
                  'phone_number', 'profile_picture', 'services_count', 'services', 'profile', 'gallery_images')

    def get_full_name(self, obj):
        return obj.get_full_name()

    def get_services_count(self, obj):
        return getattr(obj, 'services_count', 0)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['profile_picture'] = build_absolute_media_url(
            self.context.get('request'),
            data.get('profile_picture'),
        )
        return data
