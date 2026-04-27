from rest_framework import serializers
from .models import Category, Service, ServiceImage, ServiceReview, ServiceAddon
from django.contrib.auth import get_user_model

User = get_user_model()


def build_absolute_media_url(request, value):
    if not value:
        return value
    if request:
        return request.build_absolute_uri(value)
    return value


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'


class ServiceImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceImage
        fields = '__all__'

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['image'] = build_absolute_media_url(
            self.context.get('request'),
            data.get('image'),
        )
        return data


class ServiceAddonSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceAddon
        fields = '__all__'


class ServiceReviewSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(
        source='customer.get_full_name', read_only=True)
    customer_email = serializers.EmailField(
        source='customer.email', read_only=True)

    class Meta:
        model = ServiceReview
        fields = '__all__'
        read_only_fields = ('customer', 'service', 'is_verified', 'created_at', 'updated_at')


class ServiceSerializer(serializers.ModelSerializer):
    business_owner_name = serializers.CharField(
    source='business_owner.get_full_name', read_only=True)
    category_name = serializers.CharField(
    source='category.name', read_only=True)
    service_images = ServiceImageSerializer(many=True, read_only=True)
    addons = ServiceAddonSerializer(many=True, read_only=True)
    reviews = ServiceReviewSerializer(many=True, read_only=True)
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()

    class Meta:
        model = Service
        fields = '__all__'
        read_only_fields = ('business_owner', 'created_at',
                            'updated_at', 'slug')

    def get_average_rating(self, obj):
        reviews = obj.reviews.all()
        if reviews:
            return sum(review.rating for review in reviews) / len(reviews)
        return 0

    def get_review_count(self, obj):
        return obj.reviews.count()

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['thumbnail'] = build_absolute_media_url(
            self.context.get('request'),
            data.get('thumbnail'),
        )
        data['images'] = [
            build_absolute_media_url(self.context.get('request'), value)
            for value in (data.get('images') or [])
        ]
        return data


class ServiceListSerializer(serializers.ModelSerializer):
    business_owner_name = serializers.CharField(
    source='business_owner.get_full_name', read_only=True)
    category_name = serializers.CharField(
    source='category.name', read_only=True)
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.IntegerField(
        source='reviews.count', read_only=True)
    service_images = ServiceImageSerializer(many=True, read_only=True)
    reviews = ServiceReviewSerializer(many=True, read_only=True)

    class Meta:
        model = Service
        fields = ('id', 'name', 'description', 'price', 'duration', 'thumbnail',
                  'images', 'service_images', 'category',
                  'business_owner_name', 'category_name', 'average_rating',
                  'review_count', 'reviews', 'is_active', 'slug')

    def get_average_rating(self, obj):
        reviews = obj.reviews.all()
        if reviews:
            return sum(review.rating for review in reviews) / len(reviews)
        return 0

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['thumbnail'] = build_absolute_media_url(
            self.context.get('request'),
            data.get('thumbnail'),
        )
        data['images'] = [
            build_absolute_media_url(self.context.get('request'), value)
            for value in (data.get('images') or [])
        ]
        return data
