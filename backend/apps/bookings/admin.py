"""
Django Admin interface for Booking and BookingRoom models with audit logging.
"""
from django.contrib import admin
from .models import Booking, BookingRoom
from core.services import record_audit_log


class BookingRoomInline(admin.TabularInline):
    model = BookingRoom
    extra = 0
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = [
        'booking_reference',
        'guest_name',
        'guest_phone',
        'source',
        'status',
        'check_in_date',
        'check_out_date',
        'nights_count',
        'total_adults',
        'total_children',
        'is_overbooking',
        'created_at',
    ]
    list_filter = ['status', 'source', 'is_overbooking', 'check_in_date', 'check_out_date']
    search_fields = ['booking_reference', 'guest_name', 'guest_phone', 'guest_email']
    readonly_fields = ['id', 'booking_reference', 'created_at', 'updated_at']
    inlines = [BookingRoomInline]

    def save_model(self, request, obj, form, change):
        if not obj.created_by and request.user.is_authenticated:
            obj.created_by = request.user

        old_values = {}
        action = 'update' if change else 'create'
        if change and obj.pk:
            try:
                old_instance = Booking.objects.get(pk=obj.pk)
                old_values = {
                    'status': old_instance.status,
                    'check_in_date': str(old_instance.check_in_date),
                    'check_out_date': str(old_instance.check_out_date),
                    'guest_name': old_instance.guest_name,
                }
                if old_instance.status != obj.status:
                    action = 'status_change'
            except Booking.DoesNotExist:
                pass

        super().save_model(request, obj, form, change)

        new_values = {
            'status': obj.status,
            'check_in_date': str(obj.check_in_date),
            'check_out_date': str(obj.check_out_date),
            'guest_name': obj.guest_name,
        }

        record_audit_log(
            action=action,
            resource_type='Booking',
            resource_id=str(obj.id),
            actor=request.user,
            old_values=old_values,
            new_values=new_values,
            reason=f"Booking {obj.booking_reference} saved via admin",
            ip_address=request.META.get('REMOTE_ADDR'),
        )


@admin.register(BookingRoom)
class BookingRoomAdmin(admin.ModelAdmin):
    list_display = [
        'booking',
        'category',
        'room_quantity',
        'physical_room',
        'assigned_at',
        'assigned_by',
        'created_at',
    ]
    list_filter = ['category', 'booking__status']
    search_fields = ['booking__booking_reference', 'physical_room__room_number']
    readonly_fields = ['id', 'created_at', 'updated_at']
