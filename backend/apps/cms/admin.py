from django.contrib import admin
from django.utils.html import format_html
from core.services import record_audit_log
from .models import GalleryMedia, HotelConfiguration, CMSSection, FAQ



@admin.register(GalleryMedia)
class GalleryMediaAdmin(admin.ModelAdmin):
    list_display = ['thumbnail_preview', 'title', 'category', 'is_featured', 'display_order', 'is_active', 'updated_at']
    list_filter = ['category', 'is_featured', 'is_active']
    search_fields = ['title', 'caption', 'alt_text']
    readonly_fields = ['id', 'thumbnail_preview', 'created_at', 'updated_at']

    @admin.display(description='Preview')
    def thumbnail_preview(self, obj):
        if not obj:
            return '-'
        url = obj.image.url if obj.image else obj.image_url
        if url:
            return format_html('<img src="{}" style="width: 60px; height: 42px; object-fit: cover; border-radius: 4px; border: 1px solid #ddd;" />', url)
        return '-'


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


@admin.register(CMSSection)
class CMSSectionAdmin(admin.ModelAdmin):
    list_display = ['section_key', 'title', 'subtitle', 'display_order', 'is_active', 'updated_at']
    list_filter = ['is_active']
    search_fields = ['section_key', 'title', 'subtitle', 'body']
    readonly_fields = ['id', 'created_at', 'updated_at']

    def has_module_permission(self, request):
        if not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        if hasattr(request.user, 'staff_profile') and request.user.staff_profile:
            return request.user.staff_profile.role in ('superadmin', 'manager')
        return False

    def has_view_permission(self, request, obj=None):
        return self.has_module_permission(request)

    def has_change_permission(self, request, obj=None):
        if not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        if hasattr(request.user, 'staff_profile') and request.user.staff_profile:
            # Per 10.ADMIN_PANEL_REQUIREMENTS.md Table 3: CMS Content Management is SuperAdmin/Owner only
            return request.user.staff_profile.role == 'superadmin'
        return False

    def has_add_permission(self, request):
        return self.has_change_permission(request)

    def has_delete_permission(self, request, obj=None):
        return self.has_change_permission(request, obj)

    def save_model(self, request, obj, form, change):
        old_values = {}
        action = 'update' if change else 'create'
        if change and obj.pk:
            try:
                old_instance = CMSSection.objects.get(pk=obj.pk)
                old_values = {
                    'section_key': old_instance.section_key,
                    'title': old_instance.title,
                    'subtitle': old_instance.subtitle,
                    'is_active': old_instance.is_active,
                    'display_order': old_instance.display_order,
                }
            except CMSSection.DoesNotExist:
                pass

        super().save_model(request, obj, form, change)

        new_values = {
            'section_key': obj.section_key,
            'title': obj.title,
            'subtitle': obj.subtitle,
            'is_active': obj.is_active,
            'display_order': obj.display_order,
        }

        record_audit_log(
            action=action,
            resource_type='CMSSection',
            resource_id=str(obj.id),
            actor=request.user,
            old_values=old_values,
            new_values=new_values,
            reason=f"CMS section '{obj.section_key}' updated via admin" if change else f"CMS section '{obj.section_key}' created via admin",
        )


@admin.register(FAQ)
class FAQAdmin(admin.ModelAdmin):
    list_display = ['question', 'category', 'display_order', 'is_active', 'updated_at']
    list_filter = ['category', 'is_active']
    search_fields = ['question', 'answer']
    readonly_fields = ['id', 'created_at', 'updated_at']

    def has_module_permission(self, request):
        if not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        if hasattr(request.user, 'staff_profile') and request.user.staff_profile:
            return request.user.staff_profile.role in ('superadmin', 'manager')
        return False

    def has_view_permission(self, request, obj=None):
        return self.has_module_permission(request)

    def has_change_permission(self, request, obj=None):
        if not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        if hasattr(request.user, 'staff_profile') and request.user.staff_profile:
            # Per 10.ADMIN_PANEL_REQUIREMENTS.md Table 3: CMS Content Management is SuperAdmin/Owner only
            return request.user.staff_profile.role == 'superadmin'
        return False

    def has_add_permission(self, request):
        return self.has_change_permission(request)

    def has_delete_permission(self, request, obj=None):
        return self.has_change_permission(request, obj)

    def save_model(self, request, obj, form, change):
        old_values = {}
        action = 'update' if change else 'create'
        if change and obj.pk:
            try:
                old_instance = FAQ.objects.get(pk=obj.pk)
                old_values = {
                    'question': old_instance.question,
                    'category': old_instance.category,
                    'is_active': old_instance.is_active,
                    'display_order': old_instance.display_order,
                }
            except FAQ.DoesNotExist:
                pass

        super().save_model(request, obj, form, change)

        new_values = {
            'question': obj.question,
            'category': obj.category,
            'is_active': obj.is_active,
            'display_order': obj.display_order,
        }

        record_audit_log(
            action=action,
            resource_type='FAQ',
            resource_id=str(obj.id),
            actor=request.user,
            old_values=old_values,
            new_values=new_values,
            reason=f"FAQ item updated via admin" if change else f"FAQ item created via admin",
        )


