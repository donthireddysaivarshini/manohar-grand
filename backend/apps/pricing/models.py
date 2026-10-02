import uuid
from decimal import Decimal
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError


class RoomRatePlan(models.Model):
    """
    Room Rate Plan model representing versioned and effective-dated tariff configurations.
    Historical rate records remain permanently intact so past booking snapshots can always
    reference their authoritative rates.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    category = models.ForeignKey(
        'rooms.RoomCategory',
        on_delete=models.PROTECT,
        related_name='rate_plans',
        help_text="Associated room category"
    )
    name = models.CharField(
        max_length=100,
        default='Standard Tariff',
        help_text="Name of the rate plan (e.g., 'Standard Tariff', 'Seasonal Tariff', 'Corporate Rate')"
    )
    currency = models.CharField(
        max_length=3,
        default='INR',
        help_text="ISO 4217 Currency Code (default: INR)"
    )
    base_price_per_night = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text="Base accommodation cost per night for included guest occupancy (AC: ₹1,599; Non-AC: ₹1,299)"
    )
    extra_adult_charge = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('350.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text="Nightly charge per additional adult beyond included occupancy (Confirmed baseline: ₹350.00)"
    )
    extra_child_charge = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('300.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text="Nightly charge per additional child beyond included occupancy (Confirmed baseline: ₹300.00)"
    )
    late_checkout_hourly_rate = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('150.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text="Hourly surcharge for late checkout up to 3 hours (AC: ₹150.00/hr; Non-AC: ₹100.00/hr)"
    )
    effective_from = models.DateField(
        null=True,
        blank=True,
        db_index=True,
        help_text="Start date for rate validity (null indicates unbounded start)"
    )
    effective_to = models.DateField(
        null=True,
        blank=True,
        db_index=True,
        help_text="End date for rate validity (null indicates active indefinitely)"
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        help_text="Status toggle for this rate plan"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-is_active', '-effective_from', '-created_at']
        indexes = [
            models.Index(fields=['category', 'is_active', 'effective_from', 'effective_to']),
        ]
        verbose_name = 'Room Rate Plan'
        verbose_name_plural = 'Room Rate Plans'

    def __str__(self):
        status = "Active" if self.is_active else "Inactive"
        return f"{self.category.name} - {self.name} (₹{self.base_price_per_night}/night) [{status}]"

    def clean(self):
        super().clean()
        if self.base_price_per_night is not None and self.base_price_per_night < Decimal('0.00'):
            raise ValidationError({'base_price_per_night': 'Base price per night cannot be negative.'})
        if self.extra_adult_charge is not None and self.extra_adult_charge < Decimal('0.00'):
            raise ValidationError({'extra_adult_charge': 'Extra adult charge cannot be negative.'})
        if self.extra_child_charge is not None and self.extra_child_charge < Decimal('0.00'):
            raise ValidationError({'extra_child_charge': 'Extra child charge cannot be negative.'})
        if self.late_checkout_hourly_rate is not None and self.late_checkout_hourly_rate < Decimal('0.00'):
            raise ValidationError({'late_checkout_hourly_rate': 'Late checkout hourly rate cannot be negative.'})

        if self.effective_from and self.effective_to:
            if self.effective_to < self.effective_from:
                raise ValidationError({
                    'effective_to': 'Effective end date cannot be earlier than effective start date.'
                })


class TaxRule(models.Model):
    """
    Tax Rule model representing dynamic and historical tax rates (e.g., GST 5%).
    Effective dates ensure changes to tax regulations do not alter past transactions.
    """
    TAX_TYPE_CHOICES = [
        ('percentage', 'Percentage (%)'),
        ('fixed', 'Fixed Amount (INR)'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(
        max_length=100,
        default='GST',
        help_text="Name of the tax rule (e.g., 'GST (Accommodation)')"
    )
    tax_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('5.00'),
        validators=[MinValueValidator(Decimal('0.00')), MaxValueValidator(Decimal('100.00'))],
        help_text="Tax percentage or fixed amount (Confirmed baseline: 5.00%)"
    )
    tax_type = models.CharField(
        max_length=20,
        choices=TAX_TYPE_CHOICES,
        default='percentage',
        help_text="Method of tax calculation"
    )
    effective_from = models.DateField(
        null=True,
        blank=True,
        db_index=True,
        help_text="Start date for tax rule validity (null indicates unbounded start)"
    )
    effective_to = models.DateField(
        null=True,
        blank=True,
        db_index=True,
        help_text="End date for tax rule validity (null indicates valid indefinitely)"
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        help_text="Status toggle for this tax rule"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-is_active', '-effective_from', '-created_at']
        indexes = [
            models.Index(fields=['is_active', 'effective_from', 'effective_to']),
        ]
        verbose_name = 'Tax Rule'
        verbose_name_plural = 'Tax Rules'

    def __str__(self):
        suffix = "%" if self.tax_type == 'percentage' else " INR"
        status = "Active" if self.is_active else "Inactive"
        return f"{self.name} ({self.tax_rate}{suffix}) [{status}]"

    def clean(self):
        super().clean()
        if self.tax_rate is not None and self.tax_rate < Decimal('0.00'):
            raise ValidationError({'tax_rate': 'Tax rate cannot be negative.'})
        if self.tax_type == 'percentage' and self.tax_rate is not None and self.tax_rate > Decimal('100.00'):
            raise ValidationError({'tax_rate': 'Percentage tax rate cannot exceed 100%.'})

        if self.effective_from and self.effective_to:
            if self.effective_to < self.effective_from:
                raise ValidationError({
                    'effective_to': 'Effective end date cannot be earlier than effective start date.'
                })


class BookingPriceSnapshot(models.Model):
    """
    Immutable financial pricing snapshot created for a Booking reservation.
    Preserves authoritative room tariffs, extra guest fees, taxes, discounts, and advance/balance splits
    so historical bookings remain invariant to future tariff or tax rule modifications.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking = models.OneToOneField(
        'bookings.Booking',
        on_delete=models.CASCADE,
        related_name='price_snapshot',
        help_text="Associated booking reservation"
    )
    currency = models.CharField(
        max_length=3,
        default='INR',
        help_text="ISO 4217 Currency Code (default: INR)"
    )
    room_subtotal = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text="Total base room accommodation tariff before extra guests, surcharges, and taxes"
    )
    extra_guest_total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text="Total surcharges for extra adult and child occupants beyond included occupancy"
    )
    late_checkout_total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text="Total hourly late checkout charges"
    )
    miscellaneous_charges = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text="Other authorized charges or surcharges"
    )
    discount_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text="Authorized discount amount deducted from taxable subtotal"
    )
    taxable_subtotal = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text="Total taxable accommodation amount (Room + Extra Guests + Late Checkout + Misc - Discount)"
    )
    tax_rule_name = models.CharField(
        max_length=100,
        default='GST',
        help_text="Name of the applied tax rule (e.g., 'GST (Accommodation 5%)')"
    )
    tax_rate_percent = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('5.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text="Tax percentage applied"
    )
    tax_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text="Calculated tax amount (e.g., GST 5%)"
    )
    gross_total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text="Authoritative total payable amount (Taxable Subtotal + Tax Amount)"
    )
    advance_amount_due = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text="50% advance deposit due online via Razorpay"
    )
    balance_amount_due = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text="Remaining 50% balance payable at front desk prior to room key handover"
    )
    itemized_breakdown = models.JSONField(
        default=dict,
        blank=True,
        help_text="Complete structured breakdown of nightly rates, occupancy, surcharges, and tax calculations"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Booking Price Snapshot'
        verbose_name_plural = 'Booking Price Snapshots'

    def __str__(self):
        ref = getattr(self.booking, 'booking_reference', str(self.booking_id))
        return f"Snapshot for {ref}: ₹{self.gross_total} ({self.currency})"

