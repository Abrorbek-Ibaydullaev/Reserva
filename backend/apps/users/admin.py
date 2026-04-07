from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth import get_user_model
from .models import UserProfile, Notification, BusinessGalleryImage

User = get_user_model()


class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    fieldsets = (
        ('Profile', {
            'fields': ('bio', 'address', 'city', 'state', 'country', 'postal_code'),
        }),
        ('Business Details', {
            'fields': (
                'business_name',
                'business_address',
                'business_phone',
                'business_email',
                'business_website',
                'business_description',
            ),
        }),
        ('Social Links', {
            'fields': ('instagram', 'facebook', 'twitter', 'linkedin'),
        }),
    )


class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'first_name', 'last_name',
                    'user_type', 'is_staff', 'is_verified')
    list_filter = ('user_type', 'is_staff', 'is_superuser', 'is_verified')
    search_fields = ('email', 'first_name', 'last_name', 'phone_number')
    ordering = ('email',)

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'phone_number',
                                      'profile_picture', 'date_of_birth', 'user_type')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser',
                                    'is_verified', 'groups', 'user_permissions')}),
        ('Important dates', {
         'fields': ('last_login', 'created_at', 'updated_at')}),
        ('Payment', {'fields': ('stripe_customer_id',)}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'first_name', 'last_name',
                       'phone_number', 'user_type'),
        }),
    )

    readonly_fields = ('created_at', 'updated_at', 'last_login')
    inlines = [UserProfileInline]


class NotificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'title', 'notification_type',
                    'is_read', 'created_at')
    list_filter = ('notification_type', 'is_read', 'created_at')
    search_fields = ('user__email', 'title', 'message')
    readonly_fields = ('created_at',)
    date_hierarchy = 'created_at'


class BusinessGalleryImageAdmin(admin.ModelAdmin):
    list_display = ('business_owner', 'image_type', 'caption', 'order', 'created_at')
    list_filter = ('image_type', 'created_at')
    search_fields = ('business_owner__email', 'business_owner__first_name', 'business_owner__last_name', 'caption')
    ordering = ('business_owner', 'order', 'created_at')


admin.site.register(User, UserAdmin)
admin.site.register(Notification, NotificationAdmin)
admin.site.register(BusinessGalleryImage, BusinessGalleryImageAdmin)
