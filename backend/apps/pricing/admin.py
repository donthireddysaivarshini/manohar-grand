from django.contrib import admin
from django.forms.models import model_to_dict
from core.services import record_audit_log
from .models import RoomRatePlan, TaxRule


@admin.register(RoomRatePlan)
class RoomRatePlanAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'category',
        'currency',
        'base_price_per_night',
        'extra_adult_charge',
        'extra_child_charge',
        'late_checkout_hourly_rate',
        'effective_from',
        'effective_to',
        'is_active',
    )
    list_filter = ('is_active', 'category', 'currency', 'effective_from')
    search_fields = ('name', 'category__name')
    readonly_fields = ('id', 'created_at', 'updated_at')

    def has_change_permission(self, request, obj=None):
        if not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        if hasattr(request.user, 'staff_profile') and request.user.staff_profile:
            # Only superadmin role can edit pricing in current baseline
            return request.user.staff_profile.role == 'superadmin'
        return False

    def has_add_permission(self, request):
        return self.has_change_permission(request)

    def has_delete_permission(self, request, obj=None):
        return self.has_change_permission(request, obj)

    def save_model(self, request, obj, form, change):
        old_values = {}
        action = 'price_change' if change else 'create'
        if change and obj.pk:
            try:
                old_instance = RoomRatePlan.objects.get(pk=obj.pk)
                old_values = {
                    'base_price_per_night': str(old_instance.base_price_per_night),
                    'extra_adult_charge': str(old_instance.extra_adult_charge),
                    'extra_child_charge': str(old_instance.extra_child_charge),
                    'late_checkout_hourly_rate': str(old_instance.late_checkout_hourly_rate),
                    'is_active': old_instance.is_active,
                }
            except RoomRatePlan.DoesNotExist:
                pass

        super().save_model(request, obj, form, change)

        new_values = {
            'base_price_per_night': str(obj.base_price_per_night),
            'extra_adult_charge': str(obj.extra_adult_charge),
            'extra_child_charge': str(obj.extra_child_charge),
            'late_checkout_hourly_rate': str(obj.late_checkout_hourly_rate),
            'is_active': obj.is_active,
        }

        record_audit_log(
            action=action,
            resource_type='RoomRatePlan',
            resource_id=str(obj.id),
            actor=request.user,
            old_values=old_values,
            new_values=new_values,
            reason="Modified via Django admin interface" if change else "Created via Django admin interface",
        )


@admin.register(TaxRule)
class TaxRuleAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'tax_rate',
        'tax_type',
        'effective_from',
        'effective_to',
        'is_active',
        'created_at',
    )
    list_filter = ('is_active', 'tax_type', 'effective_from')
    search_fields = ('name',)
    readonly_fields = ('id', 'created_at', 'updated_at')

    def has_change_permission(self, request, obj=None):
        if not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        if hasattr(request.user, 'staff_profile') and request.user.staff_profile:
            return request.user.staff_profile.role == 'superadmin'
        return False

    def has_add_permission(self, request):
        return self.has_change_permission(request)

    def has_delete_permission(self, request, obj=None):
        return self.has_change_permission(request, obj)

    def save_model(self, request, obj, form, change):
        old_values = {}
        action = 'config_change' if change else 'create'
        if change and obj.pk:
            try:
                old_instance = TaxRule.objects.get(pk=obj.pk)
                old_values = {
                    'tax_rate': str(old_instance.tax_rate),
                    'tax_type': old_instance.tax_type,
                    'is_active': old_instance.is_active,
                }
            except TaxRule.DoesNotExist:
                pass

        super().save_model(request, obj, form, change)

        new_values = {
            'tax_rate': str(obj.tax_rate),
            'tax_type': obj.tax_type,
            'is_active': obj.is_active,
        }

        record_audit_log(
            action=action,
            resource_type='TaxRule',
            resource_id=str(obj.id),
            actor=request.user,
            old_values=old_values,
            new_values=new_values,
            reason="Modified via Django admin interface" if change else "Created via Django admin interface",
        )
