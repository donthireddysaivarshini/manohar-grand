"""
Django Admin registration for User, CustomerProfile, and StaffProfile.
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, CustomerProfile, StaffProfile

class CustomerProfileInline(admin.StackedInline):
    model = CustomerProfile
    can_delete = False
    verbose_name_plural = 'Customer Profile'
    fk_name = 'user'

class StaffProfileInline(admin.StackedInline):
    model = StaffProfile
    can_delete = False
    verbose_name_plural = 'Staff Profile'
    fk_name = 'user'

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'first_name', 'last_name', 'phone', 'role', 'auth_provider', 'is_staff', 'is_active', 'created_at')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'auth_provider')
    ordering = ('-created_at',)
    search_fields = ('email', 'first_name', 'last_name', 'phone')
    inlines = (CustomerProfileInline, StaffProfileInline)

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'phone')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Metadata', {'fields': ('auth_provider', 'last_login', 'created_at', 'updated_at')}),
    )
    readonly_fields = ('created_at', 'updated_at', 'last_login')

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password', 'first_name', 'last_name', 'phone', 'is_staff', 'is_active'),
        }),
    )

@admin.register(CustomerProfile)
class CustomerProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'city', 'state', 'created_at')
    search_fields = ('user__email', 'city', 'state')

@admin.register(StaffProfile)
class StaffProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'role', 'employee_id', 'is_active_duty', 'created_at')
    list_filter = ('role', 'is_active_duty')
    search_fields = ('user__email', 'employee_id')
