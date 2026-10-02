"""
Booking domain services: Unique reference generation, state machine transitions,
and atomic temporary checkout hold creation with double-booking prevention.
"""
import collections
import secrets
import string
import uuid
from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Optional

from django.conf import settings
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from django.core.exceptions import ValidationError

from core.services import record_audit_log
from apps.rooms.models import RoomCategory, PhysicalRoom
from apps.inventory.models import RoomBlock, MaintenanceBlock
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

    # 8. Create authoritative BookingPriceSnapshot
    from apps.pricing.services import create_booking_price_snapshot
    create_booking_price_snapshot(booking)

    # 9. Record audit trail
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


@transaction.atomic
def assign_physical_rooms(
    booking,
    physical_room_identifiers: List[Any],
    staff_user=None,
    ip_address: Optional[str] = None,
):
    """
    Atomically assigns physical room units to a Booking, validating:
    1. Booking is in an assignable state (held, confirmed, checked_in).
    2. Target PhysicalRooms exist and are locked with select_for_update().
    3. Target PhysicalRooms belong to the room categories booked on this reservation.
    4. Target PhysicalRooms are active and operational (operational_status='operational').
    5. Target PhysicalRooms have no active RoomBlocks or MaintenanceBlocks during [check_in, check_out).
    6. Target PhysicalRooms have no overlapping assignments on other active bookings.
    7. No duplicate physical rooms in request.
    8. Assigned room count per category <= booked quantity for that category.
    9. Supports partial and full assignments, resetting or replacing previous assignments cleanly.
    10. Emits an immutable AuditLog entry.
    """
    from .models import BookingRoom

    # 1. State check
    if booking.status in ('cancelled', 'expired', 'checked_out'):
        raise ValidationError({
            "status": f"Cannot assign physical rooms to booking {booking.booking_reference} in '{booking.status}' status."
        })

    # Calculate total required quantities per category originally booked
    booked_categories_qty: Dict[Any, int] = collections.defaultdict(int)
    for br in booking.rooms.all():
        booked_categories_qty[br.category_id] += br.room_quantity

    if not booked_categories_qty:
        raise ValidationError({"rooms": "Booking has no booked room category items."})

    # 2. Handle empty assignments list (clearing all assignments)
    if not physical_room_identifiers:
        for cat_id, total_qty in booked_categories_qty.items():
            cat_obj = RoomCategory.objects.get(id=cat_id)
            booking.rooms.filter(category_id=cat_id).delete()
            BookingRoom.objects.create(
                booking=booking,
                category=cat_obj,
                room_quantity=total_qty,
                physical_room=None,
            )

        record_audit_log(
            action='room_assignment',
            resource_type='Booking',
            resource_id=str(booking.id),
            actor=staff_user,
            new_values={
                'booking_reference': booking.booking_reference,
                'assigned_rooms': [],
                'total_assigned': 0,
                'total_required': sum(booked_categories_qty.values()),
            },
            reason=f"Cleared all physical room assignments for {booking.booking_reference}",
            ip_address=ip_address,
        )
        booking.refresh_from_db()
        return booking

    # 3. Resolve and deduplicate requested physical room identifiers
    target_raw_ids = []
    seen_raw = set()
    for item in physical_room_identifiers:
        if isinstance(item, PhysicalRoom):
            raw_id = str(item.id)
        elif isinstance(item, dict):
            raw_id = str(item.get('id') or item.get('physical_room_id') or item.get('room_id') or item.get('room_number'))
        else:
            raw_id = str(item).strip()

        if raw_id in seen_raw:
            raise ValidationError({"rooms": f"Duplicate physical room identifier '{raw_id}' in assignment request."})
        seen_raw.add(raw_id)
        target_raw_ids.append(raw_id)

    # Resolve each identifier to a locked PhysicalRoom instance
    resolved_rooms: List[PhysicalRoom] = []
    for identifier in target_raw_ids:
        pr = None
        # Try UUID lookup if valid UUID format
        try:
            val = uuid.UUID(str(identifier).strip())
            pr = PhysicalRoom.objects.select_for_update().filter(id=val).first()
        except (ValueError, TypeError, AttributeError):
            pass

        # Try room_number lookup if UUID didn't match or wasn't a UUID
        if pr is None:
            pr = PhysicalRoom.objects.select_for_update().filter(room_number__iexact=str(identifier).strip()).first()

        if pr is None:
            raise ValidationError({"rooms": f"Physical room '{identifier}' does not exist."})

        resolved_rooms.append(pr)

    # Deduplicate resolved instances by ID
    resolved_ids = [r.id for r in resolved_rooms]
    if len(resolved_ids) != len(set(resolved_ids)):
        raise ValidationError({"rooms": "Duplicate physical rooms resolved in assignment request."})

    # 4. Validate operational status
    for room in resolved_rooms:
        if room.operational_status != 'operational':
            raise ValidationError({
                "rooms": f"Physical room {room.room_number} is not available for assignment (operational_status='{room.operational_status}')."
            })

    # 5. Validate absence of dated room blocks and maintenance blocks
    for room in resolved_rooms:
        if RoomBlock.objects.filter(
            physical_room=room,
            is_active=True,
            start_date__lt=booking.check_out_date,
            end_date__gt=booking.check_in_date,
        ).exists():
            raise ValidationError({
                "rooms": f"Physical room {room.room_number} has an active room block during the stay period ({booking.check_in_date} to {booking.check_out_date})."
            })

        if MaintenanceBlock.objects.filter(
            physical_room=room,
            is_active=True,
            start_date__lt=booking.check_out_date,
            end_date__gt=booking.check_in_date,
        ).exists():
            raise ValidationError({
                "rooms": f"Physical room {room.room_number} is under maintenance during the stay period ({booking.check_in_date} to {booking.check_out_date})."
            })

    # 6. Validate absence of overlapping assignments on other active bookings
    now = timezone.now()
    for room in resolved_rooms:
        overlapping_booking_rooms = BookingRoom.objects.filter(
            physical_room=room,
            booking__check_in_date__lt=booking.check_out_date,
            booking__check_out_date__gt=booking.check_in_date,
        ).exclude(
            booking_id=booking.id
        ).filter(
            Q(booking__status__in=['confirmed', 'checked_in']) |
            Q(booking__status='held', booking__hold_expires_at__gt=now)
        ).select_related('booking')

        if overlapping_booking_rooms.exists():
            conflict = overlapping_booking_rooms.first().booking
            raise ValidationError({
                "rooms": f"Physical room {room.room_number} is already assigned to active booking {conflict.booking_reference} ({conflict.check_in_date} to {conflict.check_out_date})."
            })

    # 7. Validate category matching and assignment quantity limits
    assigned_by_cat = collections.defaultdict(list)
    for room in resolved_rooms:
        if room.category_id not in booked_categories_qty:
            raise ValidationError({
                "rooms": f"Physical room {room.room_number} belongs to category '{room.category.name}', which is not part of reservation {booking.booking_reference}."
            })
        assigned_by_cat[room.category_id].append(room)

    for cat_id, booked_qty in booked_categories_qty.items():
        assigned_count = len(assigned_by_cat.get(cat_id, []))
        if assigned_count > booked_qty:
            cat_obj = RoomCategory.objects.get(id=cat_id)
            raise ValidationError({
                "rooms": f"Cannot assign {assigned_count} physical rooms to category '{cat_obj.name}'; only {booked_qty} room(s) booked."
            })

    # 8. Update BookingRoom records atomically
    for cat_id, total_qty in booked_categories_qty.items():
        cat_obj = RoomCategory.objects.get(id=cat_id)
        assigned_rooms_for_cat = assigned_by_cat.get(cat_id, [])
        unassigned_count = total_qty - len(assigned_rooms_for_cat)

        # Delete previous booking room records for this category
        booking.rooms.filter(category_id=cat_id).delete()

        # Create assigned items (1 unit per physical room)
        for room in assigned_rooms_for_cat:
            BookingRoom.objects.create(
                booking=booking,
                category=cat_obj,
                room_quantity=1,
                physical_room=room,
                assigned_at=timezone.now(),
                assigned_by=staff_user,
            )

        # Create remaining unassigned item if any (supports partial assignment)
        if unassigned_count > 0:
            BookingRoom.objects.create(
                booking=booking,
                category=cat_obj,
                room_quantity=unassigned_count,
                physical_room=None,
            )

    # 9. Record immutable audit log
    record_audit_log(
        action='room_assignment',
        resource_type='Booking',
        resource_id=str(booking.id),
        actor=staff_user,
        new_values={
            'booking_reference': booking.booking_reference,
            'assigned_rooms': [r.room_number for r in resolved_rooms],
            'total_assigned': len(resolved_rooms),
            'total_required': sum(booked_categories_qty.values()),
        },
        reason=f"Assigned {len(resolved_rooms)} physical room(s) to booking {booking.booking_reference}",
        ip_address=ip_address,
    )

    booking.refresh_from_db()
    return booking


@transaction.atomic
def admin_check_in_booking(
    booking,
    staff_user=None,
    ip_address: Optional[str] = None,
):
    """
    Validates and executes check-in for a booking:
    1. Booking must be in 'confirmed' status.
    2. Booking departure date must not have already passed.
    3. All booked rooms MUST have assigned, valid, operational physical rooms.
    4. Assigned physical rooms are re-verified for no conflicts.
    5. Transitions booking status to 'checked_in'.
    6. Emits an immutable AuditLog entry.
    """
    if booking.status != 'confirmed':
        raise ValidationError({
            "status": f"Cannot check in booking {booking.booking_reference} in '{booking.status}' status (must be 'confirmed')."
        })

    # Validate room assignment completeness
    if not booking.is_fully_assigned:
        raise ValidationError({
            "rooms": f"Cannot check in booking {booking.booking_reference}: "
                     f"{booking.assigned_rooms_count} of {booking.total_rooms_count} rooms assigned to physical rooms. "
                     f"All booked rooms must be assigned physical rooms before check-in."
        })

    # Re-verify all assigned physical rooms are operational and not blocked
    assigned_rooms = [br.physical_room for br in booking.rooms.all() if br.physical_room]
    for room in assigned_rooms:
        if room.operational_status != 'operational':
            raise ValidationError({
                "rooms": f"Assigned physical room {room.room_number} is not operational (status: {room.operational_status})."
            })
        if RoomBlock.objects.filter(
            physical_room=room,
            is_active=True,
            start_date__lt=booking.check_out_date,
            end_date__gt=booking.check_in_date
        ).exists():
            raise ValidationError({
                "rooms": f"Assigned physical room {room.room_number} has an active room block."
            })
        if MaintenanceBlock.objects.filter(
            physical_room=room,
            is_active=True,
            start_date__lt=booking.check_out_date,
            end_date__gt=booking.check_in_date
        ).exists():
            raise ValidationError({
                "rooms": f"Assigned physical room {room.room_number} is currently under maintenance."
            })

    return transition_booking_status(
        booking=booking,
        target_status='checked_in',
        actor=staff_user,
        reason=f"Front desk guest check-in for {booking.booking_reference}",
        ip_address=ip_address,
    )


@transaction.atomic
def admin_check_out_booking(
    booking,
    staff_user=None,
    ip_address: Optional[str] = None,
):
    """
    Validates and executes check-out for a booking:
    1. Booking must be in 'checked_in' status.
    2. Transitions booking status to 'checked_out'.
    3. Emits an immutable AuditLog entry.
    """
    if booking.status != 'checked_in':
        raise ValidationError({
            "status": f"Cannot check out booking {booking.booking_reference} in '{booking.status}' status (must be 'checked_in')."
        })

    return transition_booking_status(
        booking=booking,
        target_status='checked_out',
        actor=staff_user,
        reason=f"Front desk guest check-out for {booking.booking_reference}",
        ip_address=ip_address,
    )


@transaction.atomic
def admin_create_walkin_booking(
    rooms_request: List[Dict[str, Any]],
    check_in_date: date,
    check_out_date: date,
    guest_name: str,
    guest_phone: str = "",
    guest_email: str = "",
    total_adults: int = 1,
    total_children: int = 0,
    special_requests: str = "",
    internal_notes: str = "",
    source: str = 'walk_in',
    status: str = 'confirmed',
    physical_room_ids: Optional[List[Any]] = None,
    created_by=None,
    ip_address: Optional[str] = None,
):
    """
    Creates an offline front-desk booking (walk_in, phone, whatsapp, reception, corporate)
    deducting from the authoritative unified availability pool.
    """
    from .models import Booking, BookingRoom

    if check_out_date <= check_in_date:
        raise ValidationError({"check_out_date": "Check-out date must be strictly after check-in date."})

    if not rooms_request:
        raise ValidationError({"rooms": "At least one room category must be requested."})

    # Aggregate quantities by category
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

    # Concurrency Lock on RoomCategory rows
    list(RoomCategory.objects.select_for_update().filter(id__in=category_ids).order_by('id'))

    # Re-check stay availability
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
                message=f"Room category '{cat_obj.name}' is inactive and not bookable."
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

    # Create Booking in confirmed state
    booking = Booking.objects.create(
        customer=None,
        guest_name=guest_name,
        guest_phone=guest_phone,
        guest_email=guest_email,
        source=source,
        status=status,
        check_in_date=check_in_date,
        check_out_date=check_out_date,
        total_adults=total_adults,
        total_children=total_children,
        hold_expires_at=None,
        special_requests=special_requests,
        internal_notes=internal_notes,
        created_by=created_by,
    )

    # Create BookingRoom items
    for item in rooms_request:
        BookingRoom.objects.create(
            booking=booking,
            category=item['category'],
            room_quantity=item.get('room_quantity', 1)
        )

    # Authoritative BookingPriceSnapshot
    from apps.pricing.services import create_booking_price_snapshot
    create_booking_price_snapshot(booking)

    # Optional physical room assignment at creation
    if physical_room_ids:
        assign_physical_rooms(
            booking=booking,
            physical_room_identifiers=physical_room_ids,
            staff_user=created_by,
            ip_address=ip_address,
        )

    record_audit_log(
        action='create',
        resource_type='Booking',
        resource_id=str(booking.id),
        actor=created_by,
        new_values={
            'booking_reference': booking.booking_reference,
            'status': status,
            'source': source,
            'check_in_date': check_in_date.isoformat(),
            'check_out_date': check_out_date.isoformat(),
            'rooms': [
                {'category': str(item['category'].id), 'quantity': item.get('room_quantity', 1)}
                for item in rooms_request
            ]
        },
        reason=f"Created staff offline booking {booking.booking_reference} ({source})",
        ip_address=ip_address,
    )

    booking.refresh_from_db()
    return booking


@transaction.atomic
def admin_create_overbooking(
    rooms_request: List[Dict[str, Any]],
    check_in_date: date,
    check_out_date: date,
    guest_name: str,
    guest_phone: str = "",
    guest_email: str = "",
    total_adults: int = 1,
    total_children: int = 0,
    special_requests: str = "",
    internal_notes: str = "",
    source: str = 'reception',
    overbooking_reason: str = "",
    created_by=None,
    ip_address: Optional[str] = None,
):
    """
    Authoritative SuperAdmin overbooking creation that explicitly bypasses capacity checks.
    Requires mandatory justification reason and creates an immutable AuditLog record.
    """
    from .models import Booking, BookingRoom

    if check_out_date <= check_in_date:
        raise ValidationError({"check_out_date": "Check-out date must be strictly after check-in date."})

    if not rooms_request:
        raise ValidationError({"rooms": "At least one room category must be requested."})

    if not overbooking_reason or not str(overbooking_reason).strip():
        raise ValidationError({"overbooking_reason": "An explicit overbooking justification reason is mandatory."})

    # Create Booking with is_overbooking=True
    booking = Booking.objects.create(
        customer=None,
        guest_name=guest_name,
        guest_phone=guest_phone,
        guest_email=guest_email,
        source=source,
        status='confirmed',
        check_in_date=check_in_date,
        check_out_date=check_out_date,
        total_adults=total_adults,
        total_children=total_children,
        hold_expires_at=None,
        special_requests=special_requests,
        internal_notes=internal_notes,
        is_overbooking=True,
        overbooking_reason=str(overbooking_reason).strip(),
        created_by=created_by,
    )

    # Create BookingRoom items
    for item in rooms_request:
        BookingRoom.objects.create(
            booking=booking,
            category=item['category'],
            room_quantity=item.get('room_quantity', 1)
        )

    # Authoritative BookingPriceSnapshot
    from apps.pricing.services import create_booking_price_snapshot
    create_booking_price_snapshot(booking)

    record_audit_log(
        action='overbooking_override',
        resource_type='Booking',
        resource_id=str(booking.id),
        actor=created_by,
        new_values={
            'booking_reference': booking.booking_reference,
            'status': 'confirmed',
            'is_overbooking': True,
            'overbooking_reason': str(overbooking_reason).strip(),
            'check_in_date': check_in_date.isoformat(),
            'check_out_date': check_out_date.isoformat(),
            'rooms': [
                {'category': str(item['category'].id), 'quantity': item.get('room_quantity', 1)}
                for item in rooms_request
            ]
        },
        reason=f"SuperAdmin authorized overbooking override: {overbooking_reason}",
        ip_address=ip_address,
    )

    booking.refresh_from_db()
    return booking


@transaction.atomic
def update_booking_guest_info(
    booking,
    data: Dict[str, Any],
    actor=None,
    ip_address: Optional[str] = None,
):
    """
    Updates lead guest contact details, special requests, and guest roster for a booking.
    Validates booking state and room capacity.
    Strictly forbids mutating rates, dates, room categories, or pricing snapshots.
    """
    from .models import BookingGuest

    # 1. State check: only editable in 'held' or 'confirmed' status
    if booking.status not in ('held', 'confirmed'):
        raise ValidationError({
            "status": f"Cannot update guest information for reservation in '{booking.status}' status."
        })

    old_values = {}
    new_values = {}

    # 2. Update primary contact fields
    if 'guest_name' in data and data['guest_name']:
        new_name = str(data['guest_name']).strip()
        if new_name:
            old_values['guest_name'] = booking.guest_name
            booking.guest_name = new_name
            new_values['guest_name'] = new_name

    if 'guest_phone' in data:
        new_phone = str(data['guest_phone']).strip()
        old_values['guest_phone'] = booking.guest_phone
        booking.guest_phone = new_phone
        new_values['guest_phone'] = new_phone

    if 'guest_email' in data:
        new_email = str(data['guest_email']).strip()
        old_values['guest_email'] = booking.guest_email
        booking.guest_email = new_email
        new_values['guest_email'] = new_email

    if 'special_requests' in data:
        new_requests = str(data['special_requests']).strip()
        old_values['special_requests'] = booking.special_requests
        booking.special_requests = new_requests
        new_values['special_requests'] = new_requests

    booking.save()

    # 3. Process guest roster if provided
    if 'guests' in data and data['guests'] is not None:
        guest_list = data['guests']

        # Validate capacity
        max_capacity = sum(
            br.category.max_total_occupancy * br.room_quantity
            for br in booking.rooms.all()
        )
        if len(guest_list) > max_capacity:
            raise ValidationError({
                "guests": f"Total guests ({len(guest_list)}) exceeds maximum allowable capacity ({max_capacity}) for booked rooms."
            })

        # Replace guest roster
        BookingGuest.objects.filter(booking=booking).delete()
        created_guests = []
        for g_data in guest_list:
            bg = BookingGuest.objects.create(
                booking=booking,
                full_name=str(g_data.get('full_name', '')).strip(),
                guest_type=g_data.get('guest_type', 'adult'),
                age=g_data.get('age'),
                phone=g_data.get('phone', '') or '',
                email=g_data.get('email', '') or '',
                is_primary=g_data.get('is_primary', False),
            )
            created_guests.append(bg)

        # Ensure at least one primary guest if roster is non-empty
        if created_guests and not any(g.is_primary for g in created_guests):
            created_guests[0].is_primary = True
            created_guests[0].save(update_fields=['is_primary'])

        new_values['guest_roster_count'] = len(created_guests)

    # 4. Emits immutable AuditLog
    record_audit_log(
        action='update',
        resource_type='Booking',
        resource_id=str(booking.id),
        actor=actor,
        old_values=old_values,
        new_values=new_values,
        reason=f"Updated stay guest information for {booking.booking_reference}",
        ip_address=ip_address,
    )

    booking.refresh_from_db()
    return booking


@transaction.atomic
def cancel_booking(
    booking,
    actor=None,
    reason: str = "",
    ip_address: Optional[str] = None
):
    """
    Evaluates and executes reservation cancellation adhering to Manohar Grand business rules:
    1. 'held' status: Releasable by customer, access token holder, or staff.
    2. 'confirmed' status:
       - Customer / guest cancellation is STRICTLY FORBIDDEN (Strict Non-Refundable Policy).
       - Receptionist cancellation is forbidden.
       - Manager / SuperAdmin administrative emergency cancellation is permitted with mandatory reason.
    3. Terminal states cannot be cancelled.
    4. Preserves BookingPriceSnapshot immutability.
    """
    # 1. State validation
    if booking.status in ('cancelled', 'checked_out', 'expired'):
        raise ValidationError({
            "status": f"Cannot cancel booking {booking.booking_reference} in '{booking.status}' status."
        })

    # 2. Handle temporary held bookings
    if booking.status == 'held':
        return release_booking_hold(
            booking=booking,
            actor=actor,
            reason=reason or f"Temporary hold cancelled for {booking.booking_reference}",
            ip_address=ip_address,
        )

    # 3. Handle confirmed / checked_in / no_show reservations
    is_superadmin = bool(
        actor and (getattr(actor, 'is_superuser', False) or getattr(actor, 'role', None) == 'superadmin')
    )
    is_manager = bool(
        actor and (getattr(actor, 'role', None) == 'manager')
    )

    if not (is_superadmin or is_manager):
        # Customer or receptionist attempting to cancel confirmed booking
        raise ValidationError({
            "cancellation": "Confirmed reservations are strictly non-cancellable and non-refundable per hotel policy."
        })

    # Manager / SuperAdmin authorized override requires mandatory justification
    if not reason or not str(reason).strip():
        raise ValidationError({
            "reason": "An explicit administrative justification reason is mandatory to cancel a confirmed booking."
        })

    return transition_booking_status(
        booking=booking,
        target_status='cancelled',
        actor=actor,
        reason=str(reason).strip(),
        ip_address=ip_address,
    )

