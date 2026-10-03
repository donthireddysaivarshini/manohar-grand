"""
Serializers for Payment domain (/api/v1/payments/).
"""
from rest_framework import serializers
from django.conf import settings
from .models import PaymentOrder


class PaymentOrderCreateSerializer(serializers.Serializer):
    """
    Serializer for creating a Razorpay payment order for a held booking.
    Only accepts the booking_reference and optional idempotency_key.
    Monetary amounts are NEVER accepted from the frontend.
    """
    booking_reference = serializers.CharField(
        max_length=30,
        required=True,
        help_text="Unique customer-facing booking reference (e.g., MG-2026-X8K9M)"
    )
    idempotency_key = serializers.CharField(
        max_length=120,
        required=False,
        default="",
        allow_blank=True,
        help_text="Optional client idempotency key to prevent double submissions"
    )

    def validate_booking_reference(self, value):
        return value.strip().upper()


class PaymentOrderResponseSerializer(serializers.ModelSerializer):
    """
    Public safe serializer for Razorpay Checkout initialization.
    Exposes public razorpay_key_id, razorpay_order_id, amount in paise, and booking details.
    NEVER exposes razorpay_key_secret or webhook_secret.
    """
    booking_reference = serializers.CharField(source='booking.booking_reference', read_only=True)
    payment_id = serializers.UUIDField(source='id', read_only=True)
    razorpay_key_id = serializers.SerializerMethodField(read_only=True)
    amount = serializers.IntegerField(source='amount_paise', read_only=True)
    amount_inr = serializers.DecimalField(source='amount', max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = PaymentOrder
        fields = [
            'booking_reference',
            'payment_id',
            'razorpay_order_id',
            'razorpay_key_id',
            'amount',
            'amount_inr',
            'currency',
            'purpose',
            'status',
            'created_at',
        ]
        read_only_fields = fields

    def get_razorpay_key_id(self, obj) -> str:
        """Returns the public Razorpay Key ID for client checkout initialization."""
        return getattr(settings, 'RAZORPAY_KEY_ID', '')
