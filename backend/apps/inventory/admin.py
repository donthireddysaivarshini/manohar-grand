"""
Django Admin interface for RoomBlock and MaintenanceBlock models.
"""
from django.contrib import admin
from .models import RoomBlock, MaintenanceBlock, StopSell
from core.services import record_audit_log


@admin.register(RoomBlock)
class RoomBlockAdmin(admin.ModelAdmin):
    list_display = [
        'physical_room',
        'get_category',
        'start_date',
        'end_date',
        'nights_count',
        'reason',
        'is_active',
        'created_by',
        'created_at',
    ]
    list_filter = ['is_active', 'physical_room__category', 'start_date']
    search_fields = ['physical_room__room_number', 'reason', 'notes']
    readonly_fields = ['id', 'created_at', 'updated_at']

    def get_category(self, obj):
        return obj.physical_room.category.name
    get_category.short_description = 'Category'

    def save_model(self, request, obj, form, change):
        if not obj.created_by and request.user.is_authenticated:
            obj.created_by = request.user
        
        old_values = {}
        action = 'update' if change else 'create'
        if change and obj.pk:
            try:
                old_instance = RoomBlock.objects.get(pk=obj.pk)
                old_values = {
                    'room_number': old_instance.physical_room.room_number,
                    'start_date': str(old_instance.start_date),
                    'end_date': str(old_instance.end_date),
                    'is_active': old_instance.is_active,
                }
            except RoomBlock.DoesNotExist:
                pass

        super().save_model(request, obj, form, change)

        new_values = {
            'room_number': obj.physical_room.room_number,
            'start_date': str(obj.start_date),
            'end_date': str(obj.end_date),
            'is_active': obj.is_active,
        }

        record_audit_log(
            action=action,
            resource_type='RoomBlock',
            resource_id=str(obj.id),
            actor=request.user,
            old_values=old_values,
            new_values=new_values,
            reason=f"RoomBlock for Room {obj.physical_room.room_number} saved via admin",
            ip_address=request.META.get('REMOTE_ADDR'),
        )


@admin.register(MaintenanceBlock)
class MaintenanceBlockAdmin(admin.ModelAdmin):
    list_display = [
        'physical_room',
        'get_category',
        'maintenance_type',
        'start_date',
        'end_date',
        'nights_count',
        'reason',
        'is_active',
        'created_by',
        'created_at',
    ]
    list_filter = ['is_active', 'maintenance_type', 'physical_room__category', 'start_date']
    search_fields = ['physical_room__room_number', 'reason', 'notes']
    readonly_fields = ['id', 'created_at', 'updated_at']

    def get_category(self, obj):
        return obj.physical_room.category.name
    get_category.short_description = 'Category'

    def save_model(self, request, obj, form, change):
        if not obj.created_by and request.user.is_authenticated:
            obj.created_by = request.user

        old_values = {}
        action = 'update' if change else 'create'
        if change and obj.pk:
            try:
                old_instance = MaintenanceBlock.objects.get(pk=obj.pk)
                old_values = {
                    'room_number': old_instance.physical_room.room_number,
                    'maintenance_type': old_instance.maintenance_type,
                    'start_date': str(old_instance.start_date),
                    'end_date': str(old_instance.end_date),
                    'is_active': old_instance.is_active,
                }
            except MaintenanceBlock.DoesNotExist:
                pass

        super().save_model(request, obj, form, change)

        new_values = {
            'room_number': obj.physical_room.room_number,
            'maintenance_type': obj.maintenance_type,
            'start_date': str(obj.start_date),
            'end_date': str(obj.end_date),
            'is_active': obj.is_active,
        }

        record_audit_log(
            action=action,
            resource_type='MaintenanceBlock',
            resource_id=str(obj.id),
            actor=request.user,
            old_values=old_values,
            new_values=new_values,
            reason=f"MaintenanceBlock for Room {obj.physical_room.room_number} saved via admin",
            ip_address=request.META.get('REMOTE_ADDR'),
        )


@admin.register(StopSell)
class StopSellAdmin(admin.ModelAdmin):
    list_display = [
        'get_scope',
        'start_date',
        'end_date',
        'nights_count',
        'reason',
        'is_active',
        'created_by',
        'created_at',
    ]
    list_filter = ['is_active', 'is_hotel_wide', 'category', 'start_date']
    search_fields = ['reason', 'notes']
    readonly_fields = ['id', 'created_at', 'updated_at']

    def get_scope(self, obj):
        return "Entire Hotel (All Rooms)" if obj.is_hotel_wide else f"Category: {obj.category.name if obj.category else 'N/A'}"
    get_scope.short_description = 'Scope'

    def save_model(self, request, obj, form, change):
        if not obj.created_by and request.user.is_authenticated:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)
