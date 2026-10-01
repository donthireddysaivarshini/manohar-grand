"""
Booking domain services: Unique reference generation and state machine transitions.
"""
import secrets
import string
from datetime import datetime
from django.utils import timezone
from django.core.exceptions import ValidationError
from core.services import record_audit_log


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
