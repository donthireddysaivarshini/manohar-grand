"""
Tests for Booking state machine transitions and audit logging in apps/bookings.
"""
from datetime import date, timedelta
import pytest
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from apps.bookings.models import Booking
from apps.bookings.services import transition_booking_status
from core.models import AuditLog

User = get_user_model()


@pytest.mark.django_db
class TestBookingStateMachine:
    """Test suite covering booking state machine transitions and audit trails."""

    @pytest.fixture
    def staff_user(self):
        return User.objects.create_superuser(
            email='reception@manohargrand.com',
            password='StaffPassword123!',
            first_name='Front',
            last_name='Desk'
        )

    @pytest.fixture
    def active_booking(self):
        return Booking.objects.create(
            guest_name='Rahul Varma',
            guest_phone='+91-9876543210',
            status='held',
            check_in_date=date(2026, 10, 10),
            check_out_date=date(2026, 10, 13),
            hold_expires_at=timezone.now() + timedelta(minutes=15)
        )

    def test_valid_lifecycle_held_to_confirmed_to_checked_in_to_checked_out(self, active_booking, staff_user):
        # 1. HELD -> CONFIRMED (payment/confirmation)
        transition_booking_status(active_booking, 'confirmed', actor=staff_user, reason='Payment verified')
        assert active_booking.status == 'confirmed'
        assert active_booking.hold_expires_at is None

        # Verify AuditLog created
        audit_entry = AuditLog.objects.filter(resource_type='Booking', resource_id=str(active_booking.id), action='status_change').first()
        assert audit_entry is not None
        assert audit_entry.old_values['status'] == 'held'
        assert audit_entry.new_values['status'] == 'confirmed'

        # 2. CONFIRMED -> CHECKED_IN (guest arrival)
        transition_booking_status(active_booking, 'checked_in', actor=staff_user, reason='Guest arrived at reception')
        assert active_booking.status == 'checked_in'

        # 3. CHECKED_IN -> CHECKED_OUT (departure)
        transition_booking_status(active_booking, 'checked_out', actor=staff_user, reason='Guest checked out')
        assert active_booking.status == 'checked_out'

    def test_held_to_expired(self, active_booking, staff_user):
        transition_booking_status(active_booking, 'expired', actor=staff_user, reason='Hold window timed out')
        assert active_booking.status == 'expired'

    def test_held_to_cancelled(self, active_booking, staff_user):
        transition_booking_status(active_booking, 'cancelled', actor=staff_user, reason='Guest abandoned checkout')
        assert active_booking.status == 'cancelled'

    def test_confirmed_to_no_show(self, active_booking, staff_user):
        transition_booking_status(active_booking, 'confirmed', actor=staff_user)
        transition_booking_status(active_booking, 'no_show', actor=staff_user, reason='Guest did not arrive on check-in date')
        assert active_booking.status == 'no_show'

    def test_invalid_transitions_rejected(self, active_booking, staff_user):
        # 1. HELD directly to CHECKED_IN is invalid
        with pytest.raises(ValidationError) as exc:
            transition_booking_status(active_booking, 'checked_in', actor=staff_user)
        assert 'status' in exc.value.message_dict

        # 2. Transitioning to EXPIRED then attempting to CONFIRM is invalid
        transition_booking_status(active_booking, 'expired', actor=staff_user)
        with pytest.raises(ValidationError) as exc:
            transition_booking_status(active_booking, 'confirmed', actor=staff_user)
        assert 'status' in exc.value.message_dict

        # 3. CANCELLED is a terminal state and cannot transition to CHECKED_IN
        cancelled_booking = Booking.objects.create(
            guest_name='Cancelled Guest',
            status='cancelled',
            check_in_date=date(2026, 10, 10),
            check_out_date=date(2026, 10, 12)
        )
        with pytest.raises(ValidationError) as exc:
            transition_booking_status(cancelled_booking, 'checked_in', actor=staff_user)
        assert 'status' in exc.value.message_dict
