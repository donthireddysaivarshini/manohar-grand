from django.contrib import admin
from core.services import record_audit_log
from .models import GalleryMedia, HotelConfiguration


@admin.register(GalleryMedia)
class GalleryMediaAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'is_featured', 'display_order', 'is_active', 'updated_at']
    list_filter = ['category', 'is_featured', 'is_active']
    search_fields = ['title', 'caption', 'alt_text']
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(HotelConfiguration)
class HotelConfigurationAdmin(admin.ModelAdmin):
    list_display = [
        'hotel_name',
        'standard_check_in_time',
        'standard_check_out_time',
        'max_late_checkout_hours',
        'is_active',
        'updated_at',
    ]
    readonly_fields = ['id', 'created_at', 'updated_at']

    def has_add_permission(self, request):
        # Disallow creating multiple singleton configurations
        if HotelConfiguration.objects.exists():
            return False
        return self.has_change_permission(request)

    def has_delete_permission(self, request, obj=None):
        # Do not allow deleting the singleton config
        return False

    def has_change_permission(self, request, obj=None):
        if not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        if hasattr(request.user, 'staff_profile') and request.user.staff_profile:
            return request.user.staff_profile.role == 'superadmin'
        return False

    def save_model(self, request, obj, form, change):
        old_values = {}
        action = 'config_change' if change else 'create'
        if change and obj.pk:
            try:
                old_instance = HotelConfiguration.objects.get(pk=obj.pk)
                old_values = {
                    'hotel_name': old_instance.hotel_name,
                    'standard_check_in_time': str(old_instance.standard_check_in_time),
                    'standard_check_out_time': str(old_instance.standard_check_out_time),
                    'max_late_checkout_hours': old_instance.max_late_checkout_hours,
                    'cancellation_policy_text': old_instance.cancellation_policy_text,
                }
            except HotelConfiguration.DoesNotExist:
                pass

        super().save_model(request, obj, form, change)

        new_values = {
            'hotel_name': obj.hotel_name,
            'standard_check_in_time': str(obj.standard_check_in_time),
            'standard_check_out_time': str(obj.standard_check_out_time),
            'max_late_checkout_hours': obj.max_late_checkout_hours,
            'cancellation_policy_text': obj.cancellation_policy_text,
        }

        record_audit_log(
            action=action,
            resource_type='HotelConfiguration',
            resource_id=str(obj.id),
            actor=request.user,
            old_values=old_values,
            new_values=new_values,
            reason="Updated hotel operational configuration via Django admin",
        )

