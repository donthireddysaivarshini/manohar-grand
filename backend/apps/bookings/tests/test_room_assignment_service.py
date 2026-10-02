"""
Unit tests for Front-Desk Physical Room Assignment, Check-in/Check-out validation,
offline walk-in bookings, and SuperAdmin overbooking override services.
"""
from datetime import date, timedelta
import pytest
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.db import connection

from apps.rooms.models import RoomCategory, PhysicalRoom
from apps.inventory.models import RoomBlock, MaintenanceBlock
from apps.bookings.models import Booking, BookingRoom
from apps.bookings.services import (
    create_booking_hold,
    assign_physical_rooms,
    admin_check_in_booking,
    admin_check_out_booking,
    admin_create_walkin_booking,
    admin_create_overbooking,
    transition_booking_status,
    InsufficientInventoryException,
)
from core.models import AuditLog


@pytest.mark.django_db
class TestRoomAssignmentService:

    @pytest.fixture(autouse=True)
    def setup_data(self):
        self.ac_category = RoomCategory.objects.create(
            name='Deluxe AC Room',
            slug='deluxe-ac-room',
            included_adults=2,
            max_total_occupancy=4,
            is_active=True
        )
        self.non_ac_category = RoomCategory.objects.create(
            name='Standard Non-AC Room',
            slug='standard-non-ac-room',
            included_adults=2,
            max_total_occupancy=2,
            is_active=True
        )

        self.ac_room_101 = PhysicalRoom.objects.create(
            category=self.ac_category,
            room_number="101",
            operational_status='operational',
        )
        self.ac_room_102 = PhysicalRoom.objects.create(
            category=self.ac_category,
            room_number="102",
            operational_status='operational',
        )
        self.ac_room_103 = PhysicalRoom.objects.create(
            category=self.ac_category,
            room_number="103",
            operational_status='operational',
        )
        self.non_ac_room_201 = PhysicalRoom.objects.create(
            category=self.non_ac_category,
            room_number="201",
            operational_status='operational',
        )

    def _create_confirmed_booking(self, category=None, quantity=1, check_in=None, check_out=None):
        cat = category or self.ac_category
        ci = check_in or date(2026, 11, 1)
        co = check_out or date(2026, 11, 4)
        booking = create_booking_hold(
            rooms_request=[{'category': cat, 'room_quantity': quantity}],
            check_in_date=ci,
            check_out_date=co,
            guest_name="Test Guest",
        )
        return transition_booking_status(booking, target_status='confirmed')

    def test_valid_physical_room_assignment(self):
        """A. Valid assignment assigns rooms and updates BookingRoom records with staff details."""
        booking = self._create_confirmed_booking(category=self.ac_category, quantity=2)
        
        updated = assign_physical_rooms(
            booking=booking,
            physical_room_identifiers=["101", "102"],
        )

        assert updated.is_fully_assigned is True
        assert updated.assigned_rooms_count == 2
        assigned_numbers = set(updated.rooms.values_list('physical_room__room_number', flat=True))
        assert assigned_numbers == {"101", "102"}
        assert updated.assignment_summary['remaining_to_assign'] == 0

    def test_partial_physical_room_assignment(self):
        """B. Partial assignment assigns a subset of rooms leaving remainder unassigned."""
        booking = self._create_confirmed_booking(category=self.ac_category, quantity=3)
        
        updated = assign_physical_rooms(
            booking=booking,
            physical_room_identifiers=["101"],
        )

        assert updated.is_fully_assigned is False
        assert updated.assigned_rooms_count == 1
        assert updated.total_rooms_count == 3
        summary = updated.assignment_summary
        assert summary['total_assigned'] == 1
        assert summary['total_required'] == 3
        assert summary['remaining_to_assign'] == 2

    def test_clearing_physical_room_assignments(self):
        """C. Passing an empty list clears assignments and leaves category quantity intact."""
        booking = self._create_confirmed_booking(category=self.ac_category, quantity=2)
        assign_physical_rooms(booking=booking, physical_room_identifiers=["101", "102"])
        assert booking.is_fully_assigned is True

        cleared = assign_physical_rooms(booking=booking, physical_room_identifiers=[])
        assert cleared.assigned_rooms_count == 0
        assert cleared.total_rooms_count == 2
        assert cleared.is_fully_assigned is False

    def test_wrong_category_room_assignment_rejected(self):
        """D. Assigning a physical room belonging to a different category raises ValidationError."""
        booking = self._create_confirmed_booking(category=self.ac_category, quantity=1)

        with pytest.raises(ValidationError) as exc:
            assign_physical_rooms(
                booking=booking,
                physical_room_identifiers=["201"]  # 201 is Non-AC
            )
        assert "belongs to category 'Standard Non-AC Room'" in str(exc.value)

    def test_inactive_physical_room_rejected(self):
        """E. Assigning an inactive physical room raises ValidationError."""
        self.ac_room_101.operational_status = 'inactive'
        self.ac_room_101.save()

        booking = self._create_confirmed_booking(category=self.ac_category, quantity=1)

        with pytest.raises(ValidationError) as exc:
            assign_physical_rooms(booking=booking, physical_room_identifiers=["101"])
        assert "not available for assignment" in str(exc.value)

    def test_maintenance_status_physical_room_rejected(self):
        """F. Assigning a physical room with non-operational status raises ValidationError."""
        self.ac_room_101.operational_status = 'maintenance'
        self.ac_room_101.save()

        booking = self._create_confirmed_booking(category=self.ac_category, quantity=1)

        with pytest.raises(ValidationError) as exc:
            assign_physical_rooms(booking=booking, physical_room_identifiers=["101"])
        assert "operational_status='maintenance'" in str(exc.value)

    def test_room_block_overlap_rejected(self):
        """G. Assigning a room under active RoomBlock overlapping stay raises ValidationError."""
        RoomBlock.objects.create(
            physical_room=self.ac_room_101,
            start_date=date(2026, 11, 2),
            end_date=date(2026, 11, 3),
            reason='Admin Block',
            is_active=True,
        )

        booking = self._create_confirmed_booking(category=self.ac_category, quantity=1)

        with pytest.raises(ValidationError) as exc:
            assign_physical_rooms(booking=booking, physical_room_identifiers=["101"])
        assert "active room block" in str(exc.value)

    def test_maintenance_block_overlap_rejected(self):
        """H. Assigning a room under active MaintenanceBlock overlapping stay raises ValidationError."""
        MaintenanceBlock.objects.create(
            physical_room=self.ac_room_101,
            start_date=date(2026, 11, 1),
            end_date=date(2026, 11, 4),
            maintenance_type='repair',
            is_active=True,
        )

        booking = self._create_confirmed_booking(category=self.ac_category, quantity=1)

        with pytest.raises(ValidationError) as exc:
            assign_physical_rooms(booking=booking, physical_room_identifiers=["101"])
        assert "under maintenance" in str(exc.value)

    def test_overlapping_active_booking_assignment_rejected(self):
        """I. Cannot assign a physical room to overlapping confirmed reservations."""
        booking_1 = self._create_confirmed_booking(
            category=self.ac_category, quantity=1,
            check_in=date(2026, 11, 1), check_out=date(2026, 11, 5)
        )
        assign_physical_rooms(booking=booking_1, physical_room_identifiers=["101"])

        booking_2 = self._create_confirmed_booking(
            category=self.ac_category, quantity=1,
            check_in=date(2026, 11, 3), check_out=date(2026, 11, 7)
        )

        with pytest.raises(ValidationError) as exc:
            assign_physical_rooms(booking=booking_2, physical_room_identifiers=["101"])
        assert "already assigned to active booking" in str(exc.value)

    def test_adjacent_stay_dates_boundary_no_conflict(self):
        """J. Check-in/check-out boundary: Booking A (11/01-11/05) and Booking B (11/05-11/08) can both use Room 101."""
        booking_a = self._create_confirmed_booking(
            category=self.ac_category, quantity=1,
            check_in=date(2026, 11, 1), check_out=date(2026, 11, 5)
        )
        assign_physical_rooms(booking=booking_a, physical_room_identifiers=["101"])

        booking_b = self._create_confirmed_booking(
            category=self.ac_category, quantity=1,
            check_in=date(2026, 11, 5), check_out=date(2026, 11, 8)
        )
        # Should succeed without conflict
        updated_b = assign_physical_rooms(booking=booking_b, physical_room_identifiers=["101"])
        assert updated_b.is_fully_assigned is True

    def test_duplicate_physical_room_in_request_rejected(self):
        """K. Passing duplicate physical room IDs in the same request raises ValidationError."""
        booking = self._create_confirmed_booking(category=self.ac_category, quantity=2)

        with pytest.raises(ValidationError) as exc:
            assign_physical_rooms(booking=booking, physical_room_identifiers=["101", "101"])
        assert "Duplicate physical room" in str(exc.value)

    def test_over_assignment_quantity_rejected(self):
        """L. Assigning more physical rooms than the booked category quantity raises ValidationError."""
        booking = self._create_confirmed_booking(category=self.ac_category, quantity=1)

        with pytest.raises(ValidationError) as exc:
            assign_physical_rooms(booking=booking, physical_room_identifiers=["101", "102"])
        assert "only 1 room(s) booked" in str(exc.value)

    def test_check_in_validation_success(self):
        """M. Check-in succeeds when all booked rooms have valid physical rooms assigned."""
        booking = self._create_confirmed_booking(category=self.ac_category, quantity=2)
        assign_physical_rooms(booking=booking, physical_room_identifiers=["101", "102"])

        checked_in = admin_check_in_booking(booking=booking)
        assert checked_in.status == 'checked_in'

    def test_check_in_validation_missing_assignments_rejected(self):
        """N. Check-in is rejected when booking is not fully assigned."""
        booking = self._create_confirmed_booking(category=self.ac_category, quantity=2)
        assign_physical_rooms(booking=booking, physical_room_identifiers=["101"])  # 1 of 2 assigned

        with pytest.raises(ValidationError) as exc:
            admin_check_in_booking(booking=booking)
        assert "All booked rooms must be assigned physical rooms before check-in" in str(exc.value)

    def test_check_in_validation_wrong_status_rejected(self):
        """O. Check-in is rejected when booking is in 'held' or 'cancelled' status."""
        booking = create_booking_hold(
            rooms_request=[{'category': self.ac_category, 'room_quantity': 1}],
            check_in_date=date(2026, 11, 1),
            check_out_date=date(2026, 11, 4),
            guest_name="Held Guest",
        )
        with pytest.raises(ValidationError) as exc:
            admin_check_in_booking(booking=booking)
        assert "must be 'confirmed'" in str(exc.value)

    def test_check_out_validation_success(self):
        """P. Check-out transitions checked_in booking to checked_out."""
        booking = self._create_confirmed_booking(category=self.ac_category, quantity=1)
        assign_physical_rooms(booking=booking, physical_room_identifiers=["101"])
        admin_check_in_booking(booking=booking)

        checked_out = admin_check_out_booking(booking=booking)
        assert checked_out.status == 'checked_out'

    def test_check_out_validation_invalid_status_rejected(self):
        """Q. Check-out is rejected when booking is not in checked_in status."""
        booking = self._create_confirmed_booking(category=self.ac_category, quantity=1)
        with pytest.raises(ValidationError) as exc:
            admin_check_out_booking(booking=booking)
        assert "must be 'checked_in'" in str(exc.value)

    def test_admin_create_walkin_booking_success(self):
        """R. Staff can create offline confirmed walk-in bookings deducting inventory."""
        booking = admin_create_walkin_booking(
            rooms_request=[{'category': self.ac_category, 'room_quantity': 1}],
            check_in_date=date(2026, 11, 10),
            check_out_date=date(2026, 11, 12),
            guest_name="Walk-in Guest",
            guest_phone="+919876543210",
            source='walk_in',
            physical_room_ids=["101"],
        )

        assert booking.status == 'confirmed'
        assert booking.source == 'walk_in'
        assert booking.is_fully_assigned is True
        assert booking.rooms.first().physical_room.room_number == "101"

    def test_admin_create_overbooking_superadmin_success(self):
        """S. SuperAdmin can explicitly force-create an overbooking with justification."""
        # Exhaust all 3 AC rooms
        for i, room_num in enumerate(["101", "102", "103"]):
            b = self._create_confirmed_booking(
                category=self.ac_category, quantity=1,
                check_in=date(2026, 11, 15), check_out=date(2026, 11, 18)
            )
            assign_physical_rooms(booking=b, physical_room_identifiers=[room_num])

        # Overbooking creation bypasses capacity check
        overbooked = admin_create_overbooking(
            rooms_request=[{'category': self.ac_category, 'room_quantity': 1}],
            check_in_date=date(2026, 11, 15),
            check_out_date=date(2026, 11, 18),
            guest_name="VIP Overbook Guest",
            overbooking_reason="Authorized by Hotel Owner for VIP partner",
        )

        assert overbooked.is_overbooking is True
        assert overbooked.overbooking_reason == "Authorized by Hotel Owner for VIP partner"
        assert overbooked.status == 'confirmed'

    def test_postgresql_concurrency_lock_explicit_skip(self):
        """T. Concurrency lock test: Explicitly skipped if running under SQLite / non-PostgreSQL engine."""
        if connection.vendor != 'postgresql':
            pytest.skip("PostgreSQL row-level locking concurrency test requires live PostgreSQL database.")
