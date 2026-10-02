"""
Booking domain services: Unique reference generation, state machine transitions,
and atomic temporary checkout hold creation with double-booking prevention.
"""
import collections
import secrets
import string
from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Optional

from django.conf import settings
from django.db import transaction
from django.utils import timezone
from django.core.exceptions import ValidationError

from core.services import record_audit_log
from apps.rooms.models import RoomCategory
from apps.availability.services import AvailabilityService


class InsufficientInventoryException(Exception):
    """
    Exception raised when requested room capacity exceeds available physical rooms
    for any night in the requested stay.
    """
    def __init__(
        self,
        category_id: Any,
        category_name: str,
        requested: int,
        available: int,
        check_in: date,
        check_out: date,
        message: Optional[str] = None
    ):
        self.category_id = str(category_id)
        self.category_name = category_name
        self.requested = requested
        self.available = available
        self.check_in = check_in
        self.check_out = check_out
        self.message = message or (
            f"Only {available} room(s) available for '{category_name}' "
            f"between {check_in.isoformat()} and {check_out.isoformat()} (requested: {requested})."
        )
        super().__init__(self.message)


def generate_booking_reference() -> str:
    """
    Generates a secure, human-readable, collision-resistant booking reference.
    Format: MG-<YEAR>-<5 RANDOM UPPERCASE ALPHANUMERIC CHARS> (e.g., MG-2026-X8K9M).
    """
    # Avoid visually ambiguous characters like O, 0, I, 1
    alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"
    year = datetime.now().year

    # Import locally to avoid circular import during module init
    from .models import Booking

    for _ in range(20):
        code = ''.join(secrets.choice(alphabet) for _ in range(5))
        ref = f"MG-{year}-{code}"
        if not Booking.objects.filter(booking_reference=ref).exists():
            return ref

    raise RuntimeError("Failed to generate a unique booking reference after multiple attempts.")


# Authoritative State Transition Graph
VALID_STATUS_TRANSITIONS = {
    'held': {'confirmed', 'expired', 'cancelled'},
    'confirmed': {'checked_in', 'cancelled', 'no_show'},
    'checked_in': {'checked_out', 'cancelled'},
    'no_show': {'cancelled'},
    'checked_out': set(),  # Terminal state
    'cancelled': set(),    # Terminal state
    'expired': set(),      # Terminal state
}


def transition_booking_status(
    booking,
    target_status: str,
    actor=None,
    reason: str = "",
    ip_address: str = None
):
    """
    Executes a validated state transition for a Booking record, emitting an immutable AuditLog entry.
    """
    current_status = booking.status

    if current_status == target_status:
        return booking

    allowed_targets = VALID_STATUS_TRANSITIONS.get(current_status, set())
    if target_status not in allowed_targets:
        raise ValidationError({
            "status": f"Invalid booking status transition from '{current_status}' to '{target_status}'. "
                      f"Permitted next states: {sorted(list(allowed_targets)) or 'None (Terminal state)'}."
        })

    old_values = {'status': current_status}

    # Update status and state-specific fields
    booking.status = target_status
    if target_status == 'confirmed' and booking.hold_expires_at:
        booking.hold_expires_at = None

    booking.save()

    new_values = {'status': target_status}

    record_audit_log(
        action='status_change',
        resource_type='Booking',
        resource_id=str(booking.id),
        actor=actor,
        old_values=old_values,
        new_values=new_values,
        reason=reason or f"Transitioned booking {booking.booking_reference} to {target_status}",
        ip_address=ip_address,
    )

    return booking


@transaction.atomic
def create_booking_hold(
    rooms_request: List[Dict[str, Any]],
    check_in_date: date,
    check_out_date: date,
    guest_name: str,
    guest_phone: str = "",
    guest_email: str = "",
    total_adults: int = 1,
    total_children: int = 0,
    special_requests: str = "",
    source: str = 'website',
    customer=None,
    created_by=None,
    ip_address: Optional[str] = None,
):
    """
    Atomically creates a temporary checkout hold (default 15 minutes) with double-booking prevention.

    Concurrency Protection:
    1. Executes within @transaction.atomic.
    2. Acquires row-level locks on target RoomCategory records using select_for_update().
    3. Re-checks real-time availability across all consumed nights [check_in, check_out).
    4. If any category has insufficient capacity, raises InsufficientInventoryException, rolling back the entire transaction.
    5. Creates Booking (status='held', hold_expires_at=now+15min) and BookingRoom records.
    6. Emits an immutable AuditLog record.

    :param rooms_request: List of items [{'category': RoomCategory, 'room_quantity': int}]
    :param check_in_date: Arrival date (inclusive)
    :param check_out_date: Departure date (exclusive)
    :param guest_name: Full name of primary guest
    :param guest_phone: Primary phone number
    :param guest_email: Primary email address
    :param total_adults: Total adults count
    :param total_children: Total children count
    :param special_requests: Notes/requests
    :param source: Channel source (default 'website')
    :param customer: Authenticated User (optional)
    :param created_by: Staff User (optional)
    :param ip_address: Client IP address
    :return: Created Booking instance
    """
    # Avoid circular import
    from .models import Booking, BookingRoom

    if check_out_date <= check_in_date:
        raise ValidationError({"check_out_date": "Check-out date must be strictly after check-in date."})

    if not rooms_request:
        raise ValidationError({"rooms": "At least one room category must be requested."})

    # 1. Aggregate requested room quantities by category
    category_quantities: Dict[Any, int] = collections.defaultdict(int)
    category_instances: Dict[Any, RoomCategory] = {}

    for item in rooms_request:
        cat = item['category']
        qty = item.get('room_quantity', 1)
        if qty < 1:
            raise ValidationError({"rooms": "Room quantity must be at least 1."})
        category_quantities[cat.id] += qty
        category_instances[cat.id] = cat

    category_ids = list(category_quantities.keys())

    # 2. Concurrency Lock: Lock target RoomCategory rows in PostgreSQL
    # Note: SQLite supports select_for_update() syntactically; production PostgreSQL guarantees row locking.
    list(RoomCategory.objects.select_for_update().filter(id__in=category_ids).order_by('id'))

    # 3. Authoritative Re-check of Availability under atomic transaction
    avail_result = AvailabilityService.calculate_stay_availability(
        check_in=check_in_date,
        check_out=check_out_date,
        category_ids=category_ids,
        requested_quantity=1
    )

    avail_map = {
        c['category_id']: c['minimum_available_rooms']
        for c in avail_result['categories']
    }

    # 4. Verify that each requested category has sufficient capacity for all stay nights
    for cat_id, requested_qty in category_quantities.items():
        cat_obj = category_instances[cat_id]
        available_qty = avail_map.get(str(cat_id), 0)

        if not cat_obj.is_active:
            raise InsufficientInventoryException(
                category_id=cat_id,
                category_name=cat_obj.name,
                requested=requested_qty,
                available=0,
                check_in=check_in_date,
                check_out=check_out_date,
                message=f"Room category '{cat_obj.name}' is currently inactive and not bookable."
            )

        if requested_qty > available_qty:
            raise InsufficientInventoryException(
                category_id=cat_id,
                category_name=cat_obj.name,
                requested=requested_qty,
                available=available_qty,
                check_in=check_in_date,
                check_out=check_out_date
            )

    # 5. Compute hold duration from Django configuration (default 15 minutes)
    hold_duration_minutes = getattr(settings, 'BOOKING_HOLD_DURATION_MINUTES', 15)
    hold_expires_at = timezone.now() + timedelta(minutes=hold_duration_minutes)

    # 6. Create the Booking record
    booking = Booking.objects.create(
        customer=customer,
        guest_name=guest_name,
        guest_phone=guest_phone,
        guest_email=guest_email,
        source=source,
        status='held',
        check_in_date=check_in_date,
        check_out_date=check_out_date,
        total_adults=total_adults,
        total_children=total_children,
        hold_expires_at=hold_expires_at,
        special_requests=special_requests,
        created_by=created_by,
    )

    # 7. Create BookingRoom items
    for item in rooms_request:
        BookingRoom.objects.create(
            booking=booking,
            category=item['category'],
            room_quantity=item.get('room_quantity', 1)
        )

    # 8. Record audit trail
    record_audit_log(
        action='create',
        resource_type='Booking',
        resource_id=str(booking.id),
        actor=customer or created_by,
        new_values={
            'booking_reference': booking.booking_reference,
            'status': 'held',
            'hold_expires_at': hold_expires_at.isoformat(),
            'check_in_date': check_in_date.isoformat(),
            'check_out_date': check_out_date.isoformat(),
            'rooms': [
                {'category': str(item['category'].id), 'quantity': item.get('room_quantity', 1)}
                for item in rooms_request
            ]
        },
        reason=f"Created temporary {hold_duration_minutes}-minute hold {booking.booking_reference}",
        ip_address=ip_address,
    )

    return booking


def release_booking_hold(
    booking,
    actor=None,
    reason: str = "",
    ip_address: Optional[str] = None
):
    """
    Explicitly releases an active temporary hold, transitioning it to 'cancelled' so
    inventory is immediately freed for other guests.
    """
    if booking.status != 'held':
        raise ValidationError({
            "status": f"Cannot release booking {booking.booking_reference} because it is in '{booking.status}' status (must be 'held')."
        })

    return transition_booking_status(
        booking=booking,
        target_status='cancelled',
        actor=actor,
        reason=reason or f"Temporary hold released for {booking.booking_reference}",
        ip_address=ip_address,
    )
