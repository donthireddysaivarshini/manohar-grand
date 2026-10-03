"""
Payments domain models: PaymentOrder.
Authoritative representation of online payment orders (Razorpay) linked to Bookings.
Distinguishes internal UUID payment_id from Razorpay order_id and payment_id.
"""
import uuid
from decimal import Decimal
from django.db import models
from django.core.validators import MinValueValidator


class PaymentOrder(models.Model):
    """
    Authoritative PaymentOrder model representing gateway orders generated for reservations.
    Stores exact monetary figures in Decimal (INR) and provider integer paise.
    """
    PURPOSE_CHOICES = [
        ('advance', '50% Advance Deposit'),
        ('balance', 'Remaining Balance'),
        ('full', 'Full Stay Payment'),
    ]

    STATUS_CHOICES = [
        ('created', 'Created'),
        ('authorized', 'Authorized'),
        ('captured', 'Captured'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
        ('refunded', 'Refunded'),
        ('partially_refunded', 'Partially Refunded'),
    ]

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text="Internal unique payment order identifier"
    )
    booking = models.ForeignKey(
        'bookings.Booking',
        on_delete=models.CASCADE,
        related_name='payment_orders',
        help_text="Target reservation associated with this payment order"
    )
    purpose = models.CharField(
        max_length=20,
        choices=PURPOSE_CHOICES,
        default='advance',
        db_index=True,
        help_text="Payment phase / purpose (advance, balance, full)"
    )
    currency = models.CharField(
        max_length=3,
        default='INR',
        help_text="Three-letter ISO currency code (default INR)"
    )
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        help_text="Payable amount in standard currency units (INR)"
    )
    amount_paise = models.PositiveBigIntegerField(
        help_text="Payable amount in integer paise sent to Razorpay (amount * 100)"
    )
    razorpay_order_id = models.CharField(
        max_length=100,
        unique=True,
        db_index=True,
        help_text="Authoritative Razorpay gateway order identifier (order_XXXXX)"
    )
    razorpay_payment_id = models.CharField(
        max_length=100,
        blank=True,
        db_index=True,
        help_text="Razorpay payment identifier populated after customer payment execution (pay_XXXXX)"
    )
    razorpay_signature = models.CharField(
        max_length=255,
        blank=True,
        help_text="Cryptographic payment signature verified via HMAC-SHA256"
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='created',
        db_index=True,
        help_text="Current payment order status in gateway lifecycle"
    )
    provider = models.CharField(
        max_length=30,
        default='razorpay',
        help_text="Payment gateway provider name"
    )
    idempotency_key = models.CharField(
        max_length=120,
        blank=True,
        db_index=True,
        help_text="Client or server idempotency key preventing duplicate gateway order generation"
    )
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text="Provider payload metadata, notes, and diagnostic context"
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Payment Order'
        verbose_name_plural = 'Payment Orders'
        indexes = [
            models.Index(fields=['booking', 'purpose', 'status']),
        ]

    def __str__(self):
        return f"PaymentOrder {self.id} [{self.purpose.upper()}] - {self.booking.booking_reference} (₹{self.amount}) [{self.status}]"
