from rest_framework import generics, permissions, filters, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404
from .models import Category, Service, ServiceReview, ServiceAddon
from .serializers import (
    CategorySerializer,
    ServiceSerializer,
    ServiceListSerializer,
    ServiceReviewSerializer,
    ServiceAddonSerializer
)
from django.contrib.auth import get_user_model

User = get_user_model()


class CategoryListView(generics.ListAPIView):
    """List all pre-defined categories. Categories are managed via management commands only."""
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'description']


class ServiceListView(generics.ListAPIView):
    """List all services with filtering and search."""
    serializer_class = ServiceListSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend,
                       filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'business_owner', 'is_active']
    search_fields = ['name', 'description', 'category__name']
    ordering_fields = ['price', 'created_at', 'name']

    def get_queryset(self):
        queryset = Service.objects.filter(is_active=True)

        # Filter by price range
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')

        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        if max_price:
            queryset = queryset.filter(price__lte=max_price)

        # Filter by duration
        duration = self.request.query_params.get('duration')
        if duration:
            queryset = queryset.filter(duration=duration)

        return queryset


class ServiceDetailView(generics.RetrieveAPIView):
    """Retrieve a specific service."""
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'slug'


class BusinessOwnerServiceListView(generics.ListCreateAPIView):
    """List and create services for a business owner."""
    serializer_class = ServiceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Service.objects.filter(business_owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(business_owner=self.request.user)


class BusinessOwnerServiceDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a service for a business owner."""
    serializer_class = ServiceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Service.objects.filter(business_owner=self.request.user)


class ServiceReviewListView(generics.ListCreateAPIView):
    """List and create reviews for a service."""
    serializer_class = ServiceReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        service_slug = self.kwargs.get('slug')
        service = get_object_or_404(Service, slug=service_slug)
        return ServiceReview.objects.filter(service=service)

    def perform_create(self, serializer):
        service_slug = self.kwargs.get('slug')
        service = get_object_or_404(Service, slug=service_slug)

        # Check if user already reviewed this service
        if ServiceReview.objects.filter(service=service, customer=self.request.user).exists():
            raise serializers.ValidationError(
                "You have already reviewed this service.")

        serializer.save(service=service, customer=self.request.user)


class ServiceAddonListView(generics.ListCreateAPIView):
    """List and create addons for a service."""
    serializer_class = ServiceAddonSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        service_id = self.kwargs.get('service_id')
        service = get_object_or_404(Service, id=service_id)

        # Check if the user owns this service
        if service.business_owner != self.request.user:
            return ServiceAddon.objects.none()

        return ServiceAddon.objects.filter(service=service)

    def perform_create(self, serializer):
        service_id = self.kwargs.get('service_id')
        service = get_object_or_404(Service, id=service_id)

        # Check if the user owns this service
        if service.business_owner != self.request.user:
            raise permissions.PermissionDenied(
                "You don't have permission to add addons to this service.")

        serializer.save(service=service)
