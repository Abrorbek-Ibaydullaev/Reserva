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
    list_display = ('name', 'is_predefined', 'created_at')
    search_fields = ('name', 'description')
    readonly_fields = ('created_at', 'updated_at', 'name', 'description', 'icon', 'image', 'is_predefined')
    
    def has_add_permission(self, request):
        """Prevent adding new categories through admin."""
        return False
    
    def has_delete_permission(self, request, obj=None):
        """Prevent deleting categories through admin."""
        return False
    
    def has_change_permission(self, request, obj=None):
        """Allow viewing but not editing categories."""
        return True


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
