from django.contrib import admin
from .models import Category, Service, ServiceImage, ServiceReview, ServiceAddon


class ServiceImageInline(admin.TabularInline):
    model = ServiceImage
    extra = 1


class ServiceAddonInline(admin.TabularInline):
    model = ServiceAddon
    extra = 1


class ServiceReviewInline(admin.TabularInline):
    model = ServiceReview
    extra = 0
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ('name', 'business_owner', 'category',
                    'price', 'duration', 'is_active')
    list_filter = ('category', 'is_active', 'created_at')
    search_fields = ('name', 'description', 'business_owner__email')
    prepopulated_fields = {'slug': ('name',)}
    inlines = [ServiceImageInline, ServiceAddonInline, ServiceReviewInline]
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at')
    search_fields = ('name', 'description')
    prepopulated_fields = {'slug': ('name',)} if hasattr(
        Category, 'slug') else {}


@admin.register(ServiceReview)
class ServiceReviewAdmin(admin.ModelAdmin):
    list_display = ('service', 'customer', 'rating',
                    'is_verified', 'created_at')
    list_filter = ('rating', 'is_verified', 'created_at')
    search_fields = ('service__name', 'customer__email', 'comment')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(ServiceAddon)
class ServiceAddonAdmin(admin.ModelAdmin):
    list_display = ('service', 'name', 'price', 'duration', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('service__name', 'name')
    readonly_fields = ('created_at',)
