"""
Django Admin configuration for Payments domain.
"""
from django.contrib import admin
from .models import PaymentOrder, WebhookEventLog


@admin.register(PaymentOrder)
class PaymentOrderAdmin(admin.ModelAdmin):
    list_display = [
        'id',
        'booking_reference_display',
        'purpose',
        'amount',
        'currency',
        'razorpay_order_id',
        'razorpay_payment_id',
        'status',
        'created_at',
    ]
    list_filter = ['purpose', 'status', 'currency', 'provider', 'created_at']
    search_fields = [
        'id',
        'booking__booking_reference',
        'razorpay_order_id',
        'razorpay_payment_id',
        'booking__guest_name',
    ]
    readonly_fields = [
        'id',
        'booking',
        'purpose',
        'currency',
        'amount',
        'amount_paise',
        'razorpay_order_id',
        'razorpay_payment_id',
        'razorpay_signature',
        'status',
        'provider',
        'idempotency_key',
        'metadata',
        'created_at',
        'updated_at',
    ]

    def booking_reference_display(self, obj):
        return obj.booking.booking_reference
    booking_reference_display.short_description = 'Booking Ref'

    def has_add_permission(self, request):
        return False  # PaymentOrders are created via authoritative backend service only

    def has_delete_permission(self, request, obj=None):
        return False  # Financial records are immutable


@admin.register(WebhookEventLog)
class WebhookEventLogAdmin(admin.ModelAdmin):
    list_display = ['id', 'provider', 'event_id', 'event_type', 'status', 'received_at', 'processed_at']
    list_filter = ['provider', 'event_type', 'status', 'received_at']
    search_fields = ['event_id', 'event_type', 'error_message']
    readonly_fields = ['id', 'provider', 'event_id', 'event_type', 'status', 'payload', 'error_message', 'received_at', 'processed_at']

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

