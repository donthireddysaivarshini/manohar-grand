"""
Django Admin interface for Booking and BookingRoom models with audit logging.
"""
from django.contrib import admin
from .models import Booking, BookingRoom, BookingGuest, CancellationRequest
from core.services import record_audit_log


class BookingGuestInline(admin.TabularInline):
    model = BookingGuest
    extra = 0
    readonly_fields = ['created_at', 'updated_at']


class BookingRoomInline(admin.TabularInline):
    model = BookingRoom
    extra = 0
    readonly_fields = ['created_at', 'updated_at']


from django.utils.html import format_html
from django.contrib import messages
from .services import process_booking_cancellation_decision
from apps.pricing.admin import render_itemized_breakdown_html


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = [
        'booking_reference',
        'guest_name',
        'guest_phone',
        'source',
        'status_badge',
        'refund_badge',
        'refund_amount',
        'check_in_date',
        'check_out_date',
        'nights_count',
        'is_overbooking',
        'created_at',
    ]
    list_filter = ['status', 'refund_status', 'source', 'is_overbooking', 'check_in_date', 'check_out_date']
    search_fields = ['booking_reference', 'guest_name', 'guest_phone', 'guest_email', 'refund_reference', 'cancellation_reason']
    readonly_fields = ['id', 'booking_reference', 'access_token', 'financial_breakdown_display', 'cancellation_requested_at', 'cancelled_at', 'created_at', 'updated_at']
    inlines = [BookingRoomInline, BookingGuestInline]
    actions = ['approve_cancellation_and_refund', 'approve_cancellation_zero_refund', 'reject_cancellation_request']

    fieldsets = (
        ('Reservation Core', {
            'fields': (
                'booking_reference',
                'status',
                'customer',
                'source',
                ('check_in_date', 'check_out_date'),
                ('total_adults', 'total_children'),
            )
        }),
        ('Financial Price Breakdown & Taxes', {
            'fields': (
                'financial_breakdown_display',
            ),
        }),
        ('Guest Details', {
            'fields': (
                'guest_name',
                'guest_phone',
                'guest_email',
                'special_requests',
            )
        }),
        ('Cancellation & Refund Management', {
            'fields': (
                'cancellation_reason',
                'cancellation_notes',
                'cancellation_requested_at',
                ('refund_amount', 'cancellation_fee'),
                ('refund_status', 'refund_reference'),
                ('cancelled_at', 'cancelled_by'),
            ),
            'classes': ('collapse',),
        }),
        ('Internal & Operational Notes', {
            'fields': (
                'internal_notes',
                ('is_overbooking', 'overbooking_reason'),
                'created_by',
                'access_token',
                ('created_at', 'updated_at'),
            ),
            'classes': ('collapse',),
        }),
    )

    def financial_breakdown_display(self, obj):
        if hasattr(obj, 'price_snapshot') and obj.price_snapshot:
            return render_itemized_breakdown_html(obj.price_snapshot)
        return format_html('<span style="color: #9CA3AF;">No financial price snapshot generated yet.</span>')
    financial_breakdown_display.short_description = 'Financial Breakdown'

    def status_badge(self, obj):
        colors = {
            'confirmed': '#10B981',
            'checked_in': '#3B82F6',
            'checked_out': '#6B7280',
            'cancellation_requested': '#F59E0B',
            'refund_pending': '#D97706',
            'cancelled': '#EF4444',
            'refunded': '#8B5CF6',
            'held': '#EC4899',
            'expired': '#9CA3AF',
            'no_show': '#B91C1C',
        }
        color = colors.get(obj.status, '#6B7280')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 9999px; font-weight: bold; font-size: 11px;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = 'Status'

    def refund_badge(self, obj):
        if not obj.refund_status or obj.refund_status == 'not_applicable':
            return '-'
        colors = {
            'pending': '#F59E0B',
            'processed': '#10B981',
            'declined': '#6B7280',
            'failed': '#EF4444',
        }
        color = colors.get(obj.refund_status, '#6B7280')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600;">{}</span>',
            color,
            obj.get_refund_status_display()
        )
    refund_badge.short_description = 'Refund'

    @admin.action(description="Approve Cancellation & Process Refund for Selected")
    def approve_cancellation_and_refund(self, request, queryset):
        success_count = 0
        for booking in queryset:
            if booking.status == 'cancellation_requested':
                try:
                    process_booking_cancellation_decision(
                        booking=booking,
                        action='approve_and_refund',
                        staff_user=request.user,
                        refund_mode='manual',
                        manual_reference=f"ADMIN-DIRECT-{request.user.username}",
                        internal_notes="Approved via Django Admin bulk action",
                        ip_address=request.META.get('REMOTE_ADDR')
                    )
                    success_count += 1
                except Exception as exc:
                    self.message_user(request, f"Error processing {booking.booking_reference}: {exc}", level=messages.ERROR)
            else:
                self.message_user(request, f"Skipped {booking.booking_reference}: Not in 'cancellation_requested' status.", level=messages.WARNING)
        if success_count:
            self.message_user(request, f"Successfully approved & marked refunded {success_count} booking(s).", level=messages.SUCCESS)

    @admin.action(description="Approve Cancellation without Refund (Zero Refund / Non-refundable)")
    def approve_cancellation_zero_refund(self, request, queryset):
        success_count = 0
        for booking in queryset:
            if booking.status == 'cancellation_requested':
                try:
                    process_booking_cancellation_decision(
                        booking=booking,
                        action='approve_no_refund',
                        staff_user=request.user,
                        internal_notes="Approved 0% non-refundable via Django Admin bulk action",
                        ip_address=request.META.get('REMOTE_ADDR')
                    )
                    success_count += 1
                except Exception as exc:
                    self.message_user(request, f"Error processing {booking.booking_reference}: {exc}", level=messages.ERROR)
        if success_count:
            self.message_user(request, f"Successfully cancelled {success_count} booking(s) with zero refund.", level=messages.SUCCESS)

    @admin.action(description="Reject Cancellation Request (Keep Confirmed)")
    def reject_cancellation_request(self, request, queryset):
        success_count = 0
        for booking in queryset:
            if booking.status == 'cancellation_requested':
                try:
                    process_booking_cancellation_decision(
                        booking=booking,
                        action='reject',
                        staff_user=request.user,
                        internal_notes="Rejected via Django Admin bulk action",
                        ip_address=request.META.get('REMOTE_ADDR')
                    )
                    success_count += 1
                except Exception as exc:
                    self.message_user(request, f"Error rejecting {booking.booking_reference}: {exc}", level=messages.ERROR)
        if success_count:
            self.message_user(request, f"Successfully rejected {success_count} cancellation request(s) and restored to confirmed.", level=messages.SUCCESS)

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


@admin.register(CancellationRequest)
class CancellationRequestAdmin(admin.ModelAdmin):
    """
    Dedicated admin interface for managing, approving, and refunding guest cancellation requests.
    """
    list_display = [
        'booking_reference',
        'guest_name',
        'guest_phone',
        'cancellation_reason_display',
        'cancellation_requested_at',
        'check_in_date',
        'refund_amount_display',
        'status_badge',
        'refund_badge',
        'actions_shortcut',
    ]
    list_filter = [
        'status',
        'refund_status',
        'check_in_date',
        'cancellation_requested_at',
    ]
    search_fields = [
        'booking_reference',
        'guest_name',
        'guest_phone',
        'guest_email',
        'cancellation_reason',
        'cancellation_notes',
        'refund_reference',
    ]
    readonly_fields = [
        'id',
        'booking_reference',
        'cancellation_requested_at',
        'cancelled_at',
        'cancelled_by',
        'created_at',
        'updated_at',
    ]
    actions = [
        'approve_cancellation_and_refund',
        'approve_cancellation_zero_refund',
        'reject_cancellation_request',
    ]

    fieldsets = (
        ('Cancellation & Refund Review', {
            'fields': (
                ('booking_reference', 'status'),
                ('cancellation_requested_at', 'cancellation_reason'),
                'cancellation_notes',
                ('refund_amount', 'cancellation_fee'),
                ('refund_status', 'refund_reference'),
                ('cancelled_at', 'cancelled_by'),
            )
        }),
        ('Guest & Stay Information', {
            'fields': (
                ('guest_name', 'guest_phone', 'guest_email'),
                ('check_in_date', 'check_out_date'),
                ('total_adults', 'total_children'),
                'special_requests',
            )
        }),
        ('Internal Notes & Audit', {
            'fields': (
                'internal_notes',
                'created_by',
                ('created_at', 'updated_at'),
            ),
            'classes': ('collapse',),
        }),
    )

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.filter(
            status__in=['cancellation_requested', 'refund_pending', 'refunded', 'cancelled']
        )

    def cancellation_reason_display(self, obj):
        reason = obj.cancellation_reason or 'No reason provided'
        if len(reason) > 40:
            reason = reason[:37] + '...'
        return reason
    cancellation_reason_display.short_description = 'Reason'

    def refund_amount_display(self, obj):
        amount = obj.refund_amount if obj.refund_amount is not None else 0
        return format_html('<b>₹{}</b>', f"{amount:,.2f}")
    refund_amount_display.short_description = 'Refund Amount'

    def status_badge(self, obj):
        colors = {
            'confirmed': '#10B981',
            'cancellation_requested': '#F59E0B',
            'refund_pending': '#D97706',
            'cancelled': '#EF4444',
            'refunded': '#8B5CF6',
        }
        color = colors.get(obj.status, '#6B7280')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 4px 10px; border-radius: 9999px; font-weight: bold; font-size: 11px;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = 'Status'

    def refund_badge(self, obj):
        if not obj.refund_status or obj.refund_status == 'not_applicable':
            return '-'
        colors = {
            'pending': '#F59E0B',
            'processed': '#10B981',
            'declined': '#6B7280',
            'failed': '#EF4444',
        }
        color = colors.get(obj.refund_status, '#6B7280')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">{}</span>',
            color,
            obj.get_refund_status_display()
        )
    refund_badge.short_description = 'Refund Status'

    def actions_shortcut(self, obj):
        if obj.status == 'cancellation_requested':
            return format_html(
                '<span style="color: #D97706; font-weight: bold;">⚡ Action Required</span>'
            )
        elif obj.status == 'refund_pending':
            return format_html(
                '<span style="color: #2563EB; font-weight: bold;">💳 Refund Pending</span>'
            )
        return format_html('<span style="color: #6B7280;">Completed</span>')
    actions_shortcut.short_description = 'Review Status'

    # Bulk actions shared from BookingAdmin
    approve_cancellation_and_refund = BookingAdmin.approve_cancellation_and_refund
    approve_cancellation_zero_refund = BookingAdmin.approve_cancellation_zero_refund
    reject_cancellation_request = BookingAdmin.reject_cancellation_request


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

