"""
Booking domain models: Booking and BookingRoom.
Preserves category-level customer reservations with optional reception physical room assignment.
"""
import uuid
from typing import List
from datetime import date
from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.validators import MinValueValidator
from django.core.exceptions import ValidationError
from apps.inventory.services import get_stay_nights, calculate_nights_count


class Booking(models.Model):
    """
    Authoritative Booking model representing customer reservations, offline front-desk bookings,
    and temporary 15-minute checkout holds.
    """
    SOURCE_CHOICES = [
        ('website', 'Online Website Direct'),
        ('walk_in', 'Front Desk Walk-In'),
        ('phone', 'Phone Reservation'),
        ('whatsapp', 'WhatsApp Direct'),
        ('reception', 'Front Desk Offline'),
        ('corporate', 'Corporate Bulk Deal'),
    ]

    STATUS_CHOICES = [
        ('held', 'Temporary Hold (15 Min)'),
        ('confirmed', 'Confirmed Reservation'),
        ('checked_in', 'Checked In'),
        ('checked_out', 'Checked Out'),
        ('cancelled', 'Cancelled'),
        ('expired', 'Hold Expired'),
        ('no_show', 'No Show'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    access_token = models.UUIDField(
        default=uuid.uuid4,
        editable=False,
        db_index=True,
        help_text="Cryptographic unguessable access token for unauthenticated customer lookup and hold release"
    )
    booking_reference = models.CharField(
        max_length=30,
        unique=True,
        db_index=True,
        editable=False,
        help_text="Customer-facing booking reference (e.g., MG-2026-X8K9M)"
    )
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='customer_bookings',
        help_text="Authenticated customer account (null for anonymous/walk-in guests)"
    )
    guest_name = models.CharField(
        max_length=150,
        help_text="Primary guest contact full name"
    )
    guest_phone = models.CharField(
        max_length=20,
        blank=True,
        help_text="Primary guest mobile phone number"
    )
    guest_email = models.EmailField(
        blank=True,
        help_text="Primary guest contact email address"
    )
    source = models.CharField(
        max_length=20,
        choices=SOURCE_CHOICES,
        default='website',
        db_index=True,
        help_text="Booking origin channel"
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='held',
        db_index=True,
        help_text="Current state in the booking lifecycle"
    )
    check_in_date = models.DateField(
        db_index=True,
        help_text="Scheduled arrival date (inclusive)"
    )
    check_out_date = models.DateField(
        db_index=True,
        help_text="Scheduled departure date (exclusive check-out date)"
    )
    total_adults = models.PositiveIntegerField(
        default=1,
        validators=[MinValueValidator(1)],
        help_text="Total adult occupants across all booked rooms"
    )
    total_children = models.PositiveIntegerField(
        default=0,
        help_text="Total child occupants across all booked rooms"
    )
    hold_expires_at = models.DateTimeField(
        null=True,
        blank=True,
        db_index=True,
        help_text="Timestamp when temporary hold expires if unpaid"
    )
    special_requests = models.TextField(
        blank=True,
        help_text="Guest special requests submitted at booking time"
    )
    internal_notes = models.TextField(
        blank=True,
        help_text="Front desk and housekeeping operational notes"
    )
    is_overbooking = models.BooleanField(
        default=False,
        help_text="Flag indicating an authorized administrator capacity override"
    )
    overbooking_reason = models.TextField(
        blank=True,
        help_text="Mandatory justification note if overbooking was authorized"
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_bookings',
        help_text="Staff user who created the booking (null for direct customer web bookings)"
    )

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'check_in_date', 'check_out_date']),
            models.Index(fields=['customer', 'status']),
            models.Index(fields=['hold_expires_at', 'status']),
        ]
        verbose_name = 'Booking'
        verbose_name_plural = 'Bookings'

    def __str__(self):
        return f"{self.booking_reference} - {self.guest_name} ({self.get_status_display()})"

    @property
    def nights_count(self) -> int:
        return calculate_nights_count(self.check_in_date, self.check_out_date)

    @property
    def consumed_nights(self) -> List[date]:
        return get_stay_nights(self.check_in_date, self.check_out_date)

    @property
    def is_hold_valid(self) -> bool:
        """Evaluates whether the hold is currently active and unexpired."""
        if self.status != 'held':
            return False
        if self.hold_expires_at is None:
            return True
        return self.hold_expires_at > timezone.now()

    @property
    def is_active_occupant(self) -> bool:
        """Determines if this reservation currently consumes hotel night inventory."""
        if self.status in ('confirmed', 'checked_in'):
            return True
        if self.status == 'held' and self.is_hold_valid:
            return True
        return False

    @property
    def total_rooms_count(self) -> int:
        return sum(room.room_quantity for room in self.rooms.all())

    @property
    def assigned_rooms_count(self) -> int:
        return self.rooms.filter(physical_room__isnull=False).count()

    @property
    def is_fully_assigned(self) -> bool:
        total = self.total_rooms_count
        return total > 0 and self.assigned_rooms_count >= total

    @property
    def assignment_summary(self) -> dict:
        """Returns structured metrics of physical room assignments for staff consoles."""
        by_cat = {}
        # Aggregate required quantities by category
        for br in self.rooms.all():
            cat_id = str(br.category_id)
            if cat_id not in by_cat:
                by_cat[cat_id] = {
                    'category_id': cat_id,
                    'category_name': br.category.name,
                    'category_slug': br.category.slug,
                    'required_quantity': 0,
                    'assigned_quantity': 0,
                    'assigned_rooms': [],
                }
            by_cat[cat_id]['required_quantity'] += br.room_quantity
            if br.physical_room:
                by_cat[cat_id]['assigned_quantity'] += 1
                by_cat[cat_id]['assigned_rooms'].append({
                    'id': str(br.physical_room.id),
                    'room_number': br.physical_room.room_number,
                    'floor': br.physical_room.floor,
                    'operational_status': br.physical_room.operational_status,
                })

        for cat_info in by_cat.values():
            cat_info['remaining_quantity'] = max(0, cat_info['required_quantity'] - cat_info['assigned_quantity'])

        return {
            'total_required': self.total_rooms_count,
            'total_assigned': self.assigned_rooms_count,
            'remaining_to_assign': max(0, self.total_rooms_count - self.assigned_rooms_count),
            'is_fully_assigned': self.is_fully_assigned,
            'categories': list(by_cat.values()),
        }

    def clean(self):
        super().clean()
        if self.check_in_date and self.check_out_date:
            if self.check_out_date <= self.check_in_date:
                raise ValidationError({
                    'check_out_date': 'Check-out date must be strictly after check-in date.'
                })
        if self.is_overbooking and not self.overbooking_reason.strip():
            raise ValidationError({
                'overbooking_reason': 'An overbooking justification reason is required when is_overbooking=True.'
            })

    def save(self, *args, **kwargs):
        if not self.booking_reference:
            from .services import generate_booking_reference
            self.booking_reference = generate_booking_reference()
        self.full_clean()
        super().save(*args, **kwargs)


class BookingRoom(models.Model):
    """
    Category-level reservation item linking a Booking to a RoomCategory with a room quantity.
    Allows optional physical room assignment by reception at check-in or beforehand.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking = models.ForeignKey(
        Booking,
        on_delete=models.CASCADE,
        related_name='rooms',
        help_text="Parent booking reservation"
    )
    category = models.ForeignKey(
        'rooms.RoomCategory',
        on_delete=models.PROTECT,
        related_name='booked_rooms',
        help_text="Reserved accommodation category"
    )
    room_quantity = models.PositiveIntegerField(
        default=1,
        validators=[MinValueValidator(1)],
        help_text="Number of rooms of this category reserved in this booking line"
    )
    physical_room = models.ForeignKey(
        'rooms.PhysicalRoom',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_booking_rooms',
        help_text="Assigned physical room door unit (optional, assigned by reception)"
    )
    assigned_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Timestamp when physical room was allocated"
    )
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_booking_units',
        help_text="Staff user who performed the physical room assignment"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['booking', 'category']),
            models.Index(fields=['physical_room']),
        ]
        verbose_name = 'Booked Room Item'
        verbose_name_plural = 'Booked Room Items'

    def __str__(self):
        physical_str = f" [Room {self.physical_room.room_number}]" if self.physical_room else " [Unassigned]"
        return f"{self.booking.booking_reference}: {self.room_quantity}x {self.category.name}{physical_str}"

    def clean(self):
        super().clean()
        if self.physical_room and self.category_id:
            if self.physical_room.category_id != self.category_id:
                raise ValidationError({
                    'physical_room': f"Physical room {self.physical_room.room_number} belongs to {self.physical_room.category.name}, not {self.category.name}."
                })


class BookingGuest(models.Model):
    """
    Stay guest model representing individual guest occupants staying on a booking reservation.
    Separates the customer account holder from the actual physical stay guests.
    """
    GUEST_TYPE_CHOICES = [
        ('adult', 'Adult'),
        ('child', 'Child'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking = models.ForeignKey(
        Booking,
        on_delete=models.CASCADE,
        related_name='guest_roster',
        help_text="Associated booking reservation"
    )
    full_name = models.CharField(
        max_length=150,
        help_text="Full name of the stay guest"
    )
    guest_type = models.CharField(
        max_length=10,
        choices=GUEST_TYPE_CHOICES,
        default='adult',
        help_text="Classification as adult or child"
    )
    age = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Optional age in years"
    )
    phone = models.CharField(
        max_length=20,
        blank=True,
        help_text="Optional contact phone number"
    )
    email = models.EmailField(
        blank=True,
        help_text="Optional contact email address"
    )
    is_primary = models.BooleanField(
        default=False,
        help_text="Flag indicating whether this is the primary stay guest"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-is_primary', 'created_at']
        indexes = [
            models.Index(fields=['booking', 'guest_type']),
        ]
        verbose_name = 'Stay Guest'
        verbose_name_plural = 'Stay Guests'

    def __str__(self):
        primary_str = " (Primary)" if self.is_primary else ""
        return f"{self.full_name} [{self.get_guest_type_display()}]{primary_str} - {self.booking.booking_reference}"

    def clean(self):
        super().clean()
        if self.full_name:
            self.full_name = self.full_name.strip()
            if not self.full_name:
                raise ValidationError({'full_name': 'Guest full name cannot be blank.'})

