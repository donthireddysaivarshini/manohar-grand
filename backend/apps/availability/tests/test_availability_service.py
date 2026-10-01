"""
Unit tests for central AvailabilityService calculations.
Covers physical inventory derivation, dated blocks, booking consumption, hold expiration,
and multi-night stay bottlenecks.
"""
from datetime import date, timedelta
import pytest
from django.utils import timezone

from apps.rooms.models import RoomCategory, PhysicalRoom
from apps.inventory.models import RoomBlock, MaintenanceBlock
from apps.bookings.models import Booking, BookingRoom
from apps.availability.services import AvailabilityService


@pytest.mark.django_db
class TestAvailabilityServiceCalculations:

    @pytest.fixture(autouse=True)
    def setup_base_data(self):
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

    def test_empty_inventory_returns_zero_availability(self):
        """A. Empty inventory: category with 0 physical rooms has 0 capacity."""
        res = AvailabilityService.calculate_stay_availability(
            check_in=date(2026, 10, 10),
            check_out=date(2026, 10, 13),
            category_ids=[self.ac_category.id]
        )
        cat_data = res['categories'][0]
        assert cat_data['total_operational_capacity'] == 0
        assert cat_data['minimum_available_rooms'] == 0
        assert cat_data['is_available'] is False

    def test_physical_inventory_derived_from_operational_physical_rooms(self):
        """B. Physical inventory derived from PhysicalRoom records."""
        for i in range(5):
            PhysicalRoom.objects.create(
                category=self.ac_category,
                room_number=f"10{i}",
                operational_status='operational'
            )

        res = AvailabilityService.calculate_stay_availability(
            check_in=date(2026, 10, 10),
            check_out=date(2026, 10, 12),
            category_ids=[self.ac_category.id]
        )
        cat_data = res['categories'][0]
        assert cat_data['total_operational_capacity'] == 5
        assert cat_data['minimum_available_rooms'] == 5
        assert cat_data['is_available'] is True

    def test_inactive_category_is_unavailable(self):
        """C. Inactive category has 0 capacity and is marked unavailable."""
        self.ac_category.is_active = False
        self.ac_category.save()

        PhysicalRoom.objects.create(
            category=self.ac_category,
            room_number="101",
            operational_status='operational'
        )

        res = AvailabilityService.calculate_stay_availability(
            check_in=date(2026, 10, 10),
            check_out=date(2026, 10, 12),
            category_ids=[self.ac_category.id]
        )
        cat_data = res['categories'][0]
        assert cat_data['total_operational_capacity'] == 0
        assert cat_data['minimum_available_rooms'] == 0
        assert cat_data['is_available'] is False

    def test_inactive_physical_room_excluded_from_baseline(self):
        """D. Inactive physical room (operational_status='inactive') does not count towards baseline."""
        PhysicalRoom.objects.create(
            category=self.ac_category,
            room_number="101",
            operational_status='operational'
        )
        PhysicalRoom.objects.create(
            category=self.ac_category,
            room_number="102",
            operational_status='inactive'  # Decommissioned
        )

        res = AvailabilityService.calculate_stay_availability(
            check_in=date(2026, 10, 10),
            check_out=date(2026, 10, 12),
            category_ids=[self.ac_category.id]
        )
        cat_data = res['categories'][0]
        assert cat_data['total_operational_capacity'] == 1
        assert cat_data['minimum_available_rooms'] == 1

    def test_maintenance_and_blocked_statuses_excluded_from_baseline(self):
        """E & F. Globally maintenance, blocked, and inactive rooms do not count."""
        PhysicalRoom.objects.create(category=self.ac_category, room_number="101", operational_status='operational')
        PhysicalRoom.objects.create(category=self.ac_category, room_number="102", operational_status='maintenance')
        PhysicalRoom.objects.create(category=self.ac_category, room_number="103", operational_status='blocked')
        PhysicalRoom.objects.create(category=self.ac_category, room_number="104", operational_status='inactive')

        res = AvailabilityService.calculate_stay_availability(
            check_in=date(2026, 10, 10),
            check_out=date(2026, 10, 12),
            category_ids=[self.ac_category.id]
        )
        cat_data = res['categories'][0]
        assert cat_data['total_operational_capacity'] == 1
        assert cat_data['minimum_available_rooms'] == 1

    def test_room_block_dated_behavior(self):
        """G. RoomBlock makes room unavailable only during block date interval."""
        room1 = PhysicalRoom.objects.create(category=self.ac_category, room_number="101", operational_status='operational')
        room2 = PhysicalRoom.objects.create(category=self.ac_category, room_number="102", operational_status='operational')

        # Block room1 from Oct 11 to Oct 13 (nights 11, 12)
        RoomBlock.objects.create(
            physical_room=room1,
            start_date=date(2026, 10, 11),
            end_date=date(2026, 10, 13),
            reason='VIP reservation hold'
        )

        # Stay 1: Oct 10 to Oct 11 (night 10) -> Both rooms available
        res1 = AvailabilityService.calculate_stay_availability(
            check_in=date(2026, 10, 10),
            check_out=date(2026, 10, 11),
            category_ids=[self.ac_category.id]
        )
        assert res1['categories'][0]['minimum_available_rooms'] == 2

        # Stay 2: Oct 10 to Oct 13 (nights 10, 11, 12) -> Night 10 has 2, Night 11 has 1, Night 12 has 1 -> Min = 1
        res2 = AvailabilityService.calculate_stay_availability(
            check_in=date(2026, 10, 10),
            check_out=date(2026, 10, 13),
            category_ids=[self.ac_category.id]
        )
        cat2 = res2['categories'][0]
        assert cat2['minimum_available_rooms'] == 1
        assert cat2['nightly_availability'][0]['available_rooms'] == 2  # Oct 10
        assert cat2['nightly_availability'][1]['available_rooms'] == 1  # Oct 11
        assert cat2['nightly_availability'][2]['available_rooms'] == 1  # Oct 12

    def test_maintenance_block_dated_behavior(self):
        """H. MaintenanceBlock reduces availability during maintenance interval."""
        room = PhysicalRoom.objects.create(category=self.ac_category, room_number="101", operational_status='operational')

        MaintenanceBlock.objects.create(
            physical_room=room,
            start_date=date(2026, 10, 12),
            end_date=date(2026, 10, 15),
            maintenance_type='deep_clean',
            reason='Scheduled sanitization'
        )

        # Stay Oct 10 - Oct 12 (nights 10, 11) -> 1 room available
        res1 = AvailabilityService.calculate_stay_availability(
            check_in=date(2026, 10, 10),
            check_out=date(2026, 10, 12),
            category_ids=[self.ac_category.id]
        )
        assert res1['categories'][0]['minimum_available_rooms'] == 1

        # Stay Oct 10 - Oct 14 (nights 10, 11, 12, 13) -> Night 12 & 13 have 0 -> Min = 0
        res2 = AvailabilityService.calculate_stay_availability(
            check_in=date(2026, 10, 10),
            check_out=date(2026, 10, 14),
            category_ids=[self.ac_category.id]
        )
        assert res2['categories'][0]['minimum_available_rooms'] == 0

    def test_overlapping_blocks_on_same_room_deduplicated(self):
        """I. Overlapping RoomBlock and MaintenanceBlock on the same physical room counted once."""
        room = PhysicalRoom.objects.create(category=self.ac_category, room_number="101", operational_status='operational')

        # Both blocks cover Oct 10 to Oct 12 on Room 101
        RoomBlock.objects.create(
            physical_room=room,
            start_date=date(2026, 10, 10),
            end_date=date(2026, 10, 12),
            reason='Admin Block'
        )
        MaintenanceBlock.objects.create(
            physical_room=room,
            start_date=date(2026, 10, 10),
            end_date=date(2026, 10, 12),
            maintenance_type='repair',
            reason='AC unit repair'
        )

        res = AvailabilityService.calculate_stay_availability(
            check_in=date(2026, 10, 10),
            check_out=date(2026, 10, 12),
            category_ids=[self.ac_category.id]
        )
        cat = res['categories'][0]
        # Room blocked count on night 10 should be 1, not 2
        assert cat['nightly_availability'][0]['blocked_rooms'] == 1
        assert cat['nightly_availability'][0]['available_rooms'] == 0

    def test_confirmed_booking_reduces_availability(self):
        """J. Confirmed booking room_quantity reduces category availability."""
        for i in range(3):
            PhysicalRoom.objects.create(category=self.ac_category, room_number=f"10{i}", operational_status='operational')

        booking = Booking.objects.create(
            guest_name="Ramesh",
            guest_phone="+919876543210",
            source="website",
            status="confirmed",
            check_in_date=date(2026, 10, 10),
            check_out_date=date(2026, 10, 13),
        )
        BookingRoom.objects.create(
            booking=booking,
            category=self.ac_category,
            room_quantity=2
        )

        res = AvailabilityService.calculate_stay_availability(
            check_in=date(2026, 10, 10),
            check_out=date(2026, 10, 13),
            category_ids=[self.ac_category.id]
        )
        cat = res['categories'][0]
        assert cat['total_operational_capacity'] == 3
        assert cat['minimum_available_rooms'] == 1
        assert cat['nightly_availability'][0]['booked_rooms'] == 2
        assert cat['nightly_availability'][0]['available_rooms'] == 1

    def test_valid_held_booking_reduces_availability(self):
        """K. Valid unexpired HELD booking reduces category availability."""
        PhysicalRoom.objects.create(category=self.ac_category, room_number="101", operational_status='operational')

        now = timezone.now()
        booking = Booking.objects.create(
            guest_name="Suresh",
            guest_phone="+919876543211",
            source="website",
            status="held",
            check_in_date=date(2026, 10, 10),
            check_out_date=date(2026, 10, 12),
            hold_expires_at=now + timedelta(minutes=15)
        )
        BookingRoom.objects.create(
            booking=booking,
            category=self.ac_category,
            room_quantity=1
        )

        res = AvailabilityService.calculate_stay_availability(
            check_in=date(2026, 10, 10),
            check_out=date(2026, 10, 12),
            category_ids=[self.ac_category.id],
            now=now
        )
        assert res['categories'][0]['minimum_available_rooms'] == 0

    def test_expired_hold_does_not_reduce_availability(self):
        """L. Expired HELD booking is dynamically ignored by availability engine."""
        PhysicalRoom.objects.create(category=self.ac_category, room_number="101", operational_status='operational')

        now = timezone.now()
        # Hold expired 5 minutes ago
        booking = Booking.objects.create(
            guest_name="Priya",
            guest_phone="+919876543212",
            source="website",
            status="held",
            check_in_date=date(2026, 10, 10),
            check_out_date=date(2026, 10, 12),
            hold_expires_at=now - timedelta(minutes=5)
        )
        BookingRoom.objects.create(
            booking=booking,
            category=self.ac_category,
            room_quantity=1
        )

        res = AvailabilityService.calculate_stay_availability(
            check_in=date(2026, 10, 10),
            check_out=date(2026, 10, 12),
            category_ids=[self.ac_category.id],
            now=now
        )
        cat = res['categories'][0]
        assert cat['total_operational_capacity'] == 1
        assert cat['minimum_available_rooms'] == 1
        assert cat['is_available'] is True

    def test_cancelled_and_expired_bookings_do_not_reduce_availability(self):
        """M & N. Cancelled and expired status bookings do not consume capacity."""
        PhysicalRoom.objects.create(category=self.ac_category, room_number="101", operational_status='operational')

        b_cancel = Booking.objects.create(
            guest_name="Guest Cancelled",
            guest_phone="+919876543213",
            source="website",
            status="cancelled",
            check_in_date=date(2026, 10, 10),
            check_out_date=date(2026, 10, 12),
        )
        BookingRoom.objects.create(booking=b_cancel, category=self.ac_category, room_quantity=1)

        b_expire = Booking.objects.create(
            guest_name="Guest Expired",
            guest_phone="+919876543214",
            source="website",
            status="expired",
            check_in_date=date(2026, 10, 10),
            check_out_date=date(2026, 10, 12),
        )
        BookingRoom.objects.create(booking=b_expire, category=self.ac_category, room_quantity=1)

        res = AvailabilityService.calculate_stay_availability(
            check_in=date(2026, 10, 10),
            check_out=date(2026, 10, 12),
            category_ids=[self.ac_category.id]
        )
        assert res['categories'][0]['minimum_available_rooms'] == 1

    def test_checked_out_and_checked_in_booking_semantics(self):
        """O & P. Checked_in consumes inventory; checked_out does not consume future dates."""
        room1 = PhysicalRoom.objects.create(category=self.ac_category, room_number="101", operational_status='operational')
        room2 = PhysicalRoom.objects.create(category=self.ac_category, room_number="102", operational_status='operational')

        # Active checked_in booking
        b_in = Booking.objects.create(
            guest_name="In House Guest",
            guest_phone="+919876543215",
            source="walk_in",
            status="checked_in",
            check_in_date=date(2026, 10, 10),
            check_out_date=date(2026, 10, 12),
        )
        BookingRoom.objects.create(booking=b_in, category=self.ac_category, room_quantity=1, physical_room=room1)

        # Past checked_out booking for earlier dates
        b_out = Booking.objects.create(
            guest_name="Past Guest",
            guest_phone="+919876543216",
            source="phone",
            status="checked_out",
            check_in_date=date(2026, 10, 8),
            check_out_date=date(2026, 10, 10),
        )
        BookingRoom.objects.create(booking=b_out, category=self.ac_category, room_quantity=1, physical_room=room2)

        res = AvailabilityService.calculate_stay_availability(
            check_in=date(2026, 10, 10),
            check_out=date(2026, 10, 12),
            category_ids=[self.ac_category.id]
        )
        cat = res['categories'][0]
        # Total capacity = 2, checked_in consumes 1, checked_out on 10th ends at 10th -> Available = 1
        assert cat['minimum_available_rooms'] == 1

    def test_checkout_date_boundary_no_collision(self):
        """S. Booking ending on requested check_in date does NOT cause collision [check_in, check_out)."""
        PhysicalRoom.objects.create(category=self.ac_category, room_number="101", operational_status='operational')

        # Existing booking Oct 10 to Oct 12
        b = Booking.objects.create(
            guest_name="Guest A",
            guest_phone="+919876543217",
            source="website",
            status="confirmed",
            check_in_date=date(2026, 10, 10),
            check_out_date=date(2026, 10, 12),
        )
        BookingRoom.objects.create(booking=b, category=self.ac_category, room_quantity=1)

        # New search check_in Oct 12 to Oct 14
        res = AvailabilityService.calculate_stay_availability(
            check_in=date(2026, 10, 12),
            check_out=date(2026, 10, 14),
            category_ids=[self.ac_category.id]
        )
        assert res['categories'][0]['minimum_available_rooms'] == 1
        assert res['categories'][0]['is_available'] is True

    def test_multi_night_bottleneck_minimum_availability(self):
        """Q & R. Stay availability equals minimum availability across all consumed nights."""
        for i in range(5):
            PhysicalRoom.objects.create(category=self.ac_category, room_number=f"10{i}", operational_status='operational')

        # Booking 1: Oct 10 to Oct 13 (3 nights, 1 room)
        b1 = Booking.objects.create(
            guest_name="B1", guest_phone="+919876543201", source="website", status="confirmed",
            check_in_date=date(2026, 10, 10), check_out_date=date(2026, 10, 13)
        )
        BookingRoom.objects.create(booking=b1, category=self.ac_category, room_quantity=1)

        # Booking 2: Oct 11 to Oct 12 (1 night, 2 rooms)
        b2 = Booking.objects.create(
            guest_name="B2", guest_phone="+919876543202", source="website", status="confirmed",
            check_in_date=date(2026, 10, 11), check_out_date=date(2026, 10, 12)
        )
        BookingRoom.objects.create(booking=b2, category=self.ac_category, room_quantity=2)

        # Nights:
        # Oct 10: 5 - 1 = 4 available
        # Oct 11: 5 - (1 + 2) = 2 available (Bottleneck)
        # Oct 12: 5 - 1 = 4 available
        res = AvailabilityService.calculate_stay_availability(
            check_in=date(2026, 10, 10),
            check_out=date(2026, 10, 13),
            category_ids=[self.ac_category.id]
        )
        cat = res['categories'][0]
        assert cat['minimum_available_rooms'] == 2
        assert cat['nightly_availability'][0]['available_rooms'] == 4  # Oct 10
        assert cat['nightly_availability'][1]['available_rooms'] == 2  # Oct 11
        assert cat['nightly_availability'][2]['available_rooms'] == 4  # Oct 12

    def test_requested_quantity_validation(self):
        """T. is_available is True when requested_quantity <= min, False when requested_quantity > min."""
        for i in range(3):
            PhysicalRoom.objects.create(category=self.ac_category, room_number=f"10{i}", operational_status='operational')

        res_ok = AvailabilityService.calculate_stay_availability(
            check_in=date(2026, 10, 10),
            check_out=date(2026, 10, 12),
            category_ids=[self.ac_category.id],
            requested_quantity=3
        )
        assert res_ok['categories'][0]['is_available'] is True

        res_excess = AvailabilityService.calculate_stay_availability(
            check_in=date(2026, 10, 10),
            check_out=date(2026, 10, 12),
            category_ids=[self.ac_category.id],
            requested_quantity=4
        )
        assert res_excess['categories'][0]['is_available'] is False

    def test_assigned_physical_room_does_not_double_count(self):
        """V. BookingRoom with assigned physical_room does not double-count consumption."""
        room = PhysicalRoom.objects.create(category=self.ac_category, room_number="101", operational_status='operational')

        b = Booking.objects.create(
            guest_name="Guest Assigned",
            guest_phone="+919876543203",
            source="website",
            status="confirmed",
            check_in_date=date(2026, 10, 10),
            check_out_date=date(2026, 10, 12),
        )
        # BookingRoom with assigned physical_room
        BookingRoom.objects.create(
            booking=b,
            category=self.ac_category,
            room_quantity=1,
            physical_room=room
        )

        res = AvailabilityService.calculate_stay_availability(
            check_in=date(2026, 10, 10),
            check_out=date(2026, 10, 12),
            category_ids=[self.ac_category.id]
        )
        cat = res['categories'][0]
        # Capacity 1 - 1 booked = 0 available (NOT -1)
        assert cat['total_operational_capacity'] == 1
        assert cat['minimum_available_rooms'] == 0

    def test_multi_category_availability(self):
        """U & W. Multi-category query computes availability for both AC and Non-AC independently."""
        # 4 AC rooms, 2 Non-AC rooms
        for i in range(4):
            PhysicalRoom.objects.create(category=self.ac_category, room_number=f"AC-10{i}", operational_status='operational')
        for i in range(2):
            PhysicalRoom.objects.create(category=self.non_ac_category, room_number=f"NAC-20{i}", operational_status='operational')

        # Booking on AC
        b_ac = Booking.objects.create(
            guest_name="AC Guest", guest_phone="+919876543204", source="website", status="confirmed",
            check_in_date=date(2026, 10, 10), check_out_date=date(2026, 10, 12)
        )
        BookingRoom.objects.create(booking=b_ac, category=self.ac_category, room_quantity=2)

        res = AvailabilityService.calculate_stay_availability(
            check_in=date(2026, 10, 10),
            check_out=date(2026, 10, 12)
        )

        assert len(res['categories']) == 2
        ac_data = next(c for c in res['categories'] if c['category_slug'] == 'deluxe-ac-room')
        nac_data = next(c for c in res['categories'] if c['category_slug'] == 'standard-non-ac-room')

        assert ac_data['total_operational_capacity'] == 4
        assert ac_data['minimum_available_rooms'] == 2

        assert nac_data['total_operational_capacity'] == 2
        assert nac_data['minimum_available_rooms'] == 2
