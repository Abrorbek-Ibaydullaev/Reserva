from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth import get_user_model
from .models import UserProfile, Notification

User = get_user_model()


class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False


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


admin.site.register(User, UserAdmin)
admin.site.register(Notification, NotificationAdmin)
