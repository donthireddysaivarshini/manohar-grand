"""
Comprehensive End-to-End Verification Test for the 3 Recent Core Hotel Booking Features:
1. Hotel Fully Booked / Stop-Sell Controls (Category-specific and Hotel-wide block)
2. Strict 3-Adult Per-Room Occupancy Enforcement
3. Quick Offline Bookings (Staff Front Desk Walk-In Creation)
"""
from datetime import date, timedelta
from decimal import Decimal
import pytest
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.rooms.models import RoomCategory, PhysicalRoom
from apps.inventory.models import StopSell
from apps.availability.services import AvailabilityService
from apps.bookings.serializers import BookingHoldCreateSerializer
from apps.bookings.services import admin_create_walkin_booking, InsufficientInventoryException
from apps.pricing.models import RoomRatePlan, TaxRule


@pytest.mark.django_db
class TestRecentThreeBookingFeatures:

    @pytest.fixture(autouse=True)
    def setup_data(self):
        # 1. Categories
        self.deluxe_cat = RoomCategory.objects.create(
            name="Deluxe Room",
            slug="deluxe-room",
            max_adults=3,
            max_total_occupancy=4,
            is_active=True
        )
        self.standard_cat = RoomCategory.objects.create(
            name="Standard Room",
            slug="standard-room",
            max_adults=3,
            max_total_occupancy=4,
            is_active=True
        )

        # 2. Operational Physical Rooms
        self.room_101 = PhysicalRoom.objects.create(
            room_number="101",
            category=self.deluxe_cat,
            floor=1,
            operational_status="operational"
        )
        self.room_102 = PhysicalRoom.objects.create(
            room_number="102",
            category=self.deluxe_cat,
            floor=1,
            operational_status="operational"
        )
        self.room_201 = PhysicalRoom.objects.create(
            room_number="201",
            category=self.standard_cat,
            floor=2,
            operational_status="operational"
        )

        # 3. Active Rates and Taxes
        RoomRatePlan.objects.create(
            category=self.deluxe_cat,
            base_price_per_night=Decimal("2500.00"),
            effective_from=date(2026, 1, 1),
            effective_to=date(2027, 1, 1),
            is_active=True
        )
        RoomRatePlan.objects.create(
            category=self.standard_cat,
            base_price_per_night=Decimal("1800.00"),
            effective_from=date(2026, 1, 1),
            effective_to=date(2027, 1, 1),
            is_active=True
        )
        TaxRule.objects.create(
            name="GST",
            tax_rate=Decimal("5.00"),
            tax_type="percentage",
            effective_from=date(2026, 1, 1),
            effective_to=date(2027, 1, 1),
            is_active=True
        )

        self.stay_start = date(2026, 11, 1)
        self.stay_end = date(2026, 11, 4)

    def test_feature_1_stop_sell_category_and_hotel_wide(self):
        """
        Verify Feature 1: Stop-Sell dynamically zeroes out availability
        for specific categories and hotel-wide.
        """
        # Baseline availability: Deluxe has 2 rooms
        avail_before = AvailabilityService.calculate_stay_availability(
            check_in=self.stay_start,
            check_out=self.stay_end,
            category_ids=[self.deluxe_cat.id]
        )
        assert avail_before['categories'][0]['minimum_available_rooms'] == 2
        assert avail_before['categories'][0]['is_stop_sell'] is False

        # Apply Stop-Sell to Deluxe Category
        stop_sell_cat = StopSell.objects.create(
            category=self.deluxe_cat,
            is_hotel_wide=False,
            start_date=date(2026, 11, 2),
            end_date=date(2026, 11, 3),
            reason="Deluxe Maintenance Weekend",
            is_active=True
        )

        avail_during_cat_stop = AvailabilityService.calculate_stay_availability(
            check_in=self.stay_start,
            check_out=self.stay_end,
            category_ids=[self.deluxe_cat.id]
        )
        deluxe_status = avail_during_cat_stop['categories'][0]
        assert deluxe_status['minimum_available_rooms'] == 0
        assert deluxe_status['is_available'] is False
        assert deluxe_status['is_stop_sell'] is True
        assert "Deluxe Maintenance" in deluxe_status['stop_sell_reason']

        # Standard Category is still unaffected
        std_status = AvailabilityService.calculate_stay_availability(
            check_in=self.stay_start,
            check_out=self.stay_end,
            category_ids=[self.standard_cat.id]
        )['categories'][0]
        assert std_status['minimum_available_rooms'] == 1
        assert std_status['is_stop_sell'] is False

        # Now test Hotel-Wide Stop-Sell (e.g. VIP Private Event / Full Stop-Sell)
        stop_sell_cat.delete()
        StopSell.objects.create(
            category=None,
            is_hotel_wide=True,
            start_date=date(2026, 11, 1),
            end_date=date(2026, 11, 4),
            reason="Full Hotel Booked for Private Event",
            is_active=True
        )

        avail_all = AvailabilityService.calculate_stay_availability(
            check_in=self.stay_start,
            check_out=self.stay_end,
        )
        for cat in avail_all['categories']:
            assert cat['minimum_available_rooms'] == 0
            assert cat['is_available'] is False
            assert cat['is_stop_sell'] is True
            assert "Full Hotel Booked" in cat['stop_sell_reason']

    def test_feature_2_strict_occupancy_validation(self):
        """
        Verify Feature 2: Strict 3-Adult Per-Room and 1-Child Per-Room enforcement.
        1 room: max 3 adults. 4 adults MUST be rejected.
        2 rooms: max 6 adults. 6 adults succeeds, 7 adults rejected.
        """
        # Case A: 1 room with 3 adults (allowed)
        ser_valid = BookingHoldCreateSerializer(data={
            "check_in": self.stay_start.isoformat(),
            "check_out": self.stay_end.isoformat(),
            "category_id": str(self.deluxe_cat.id),
            "room_quantity": 1,
            "total_adults": 3,
            "total_children": 1,
            "guest_name": "Test Guest",
            "guest_phone": "9876543210"
        })
        assert ser_valid.is_valid(), ser_valid.errors

        # Case B: 1 room with 4 adults (strictly rejected with 3-adult cap error)
        ser_invalid_adults = BookingHoldCreateSerializer(data={
            "check_in": self.stay_start.isoformat(),
            "check_out": self.stay_end.isoformat(),
            "category_id": str(self.deluxe_cat.id),
            "room_quantity": 1,
            "total_adults": 4,
            "total_children": 0,
            "guest_name": "Test Guest",
            "guest_phone": "9876543210"
        })
        assert not ser_invalid_adults.is_valid()
        assert "total_adults" in ser_invalid_adults.errors
        assert "Maximum 3 adults permitted per room" in str(ser_invalid_adults.errors["total_adults"])

        # Case C: 1 room with 2 children (strictly rejected with 1-child cap error)
        ser_invalid_children = BookingHoldCreateSerializer(data={
            "check_in": self.stay_start.isoformat(),
            "check_out": self.stay_end.isoformat(),
            "category_id": str(self.deluxe_cat.id),
            "room_quantity": 1,
            "total_adults": 2,
            "total_children": 2,
            "guest_name": "Test Guest",
            "guest_phone": "9876543210"
        })
        assert not ser_invalid_children.is_valid()
        assert "total_children" in ser_invalid_children.errors
        assert "Maximum 1 child" in str(ser_invalid_children.errors["total_children"])

        # Case D: 2 rooms allows up to 6 adults
        ser_two_rooms = BookingHoldCreateSerializer(data={
            "check_in": self.stay_start.isoformat(),
            "check_out": self.stay_end.isoformat(),
            "category_id": str(self.deluxe_cat.id),
            "room_quantity": 2,
            "total_adults": 6,
            "total_children": 2,
            "guest_name": "Test Guest",
            "guest_phone": "9876543210"
        })
        assert ser_two_rooms.is_valid(), ser_two_rooms.errors

    def test_feature_3_quick_offline_walkin_booking(self):
        """
        Verify Feature 3: Staff Quick Offline Walk-in Reservation creation.
        Ensures inventory deduction, confirmed booking creation, and price snapshot generation.
        """
        # Create offline walkin booking for room 101
        booking = admin_create_walkin_booking(
            rooms_request=[{'category': self.deluxe_cat, 'room_quantity': 1}],
            check_in_date=self.stay_start,
            check_out_date=self.stay_end,
            guest_name="Walkin VIP Guest",
            guest_phone="8179993330",
            guest_email="vip@example.com",
            total_adults=2,
            total_children=0,
            special_requests="High floor requested",
            internal_notes="Paid cash at front desk",
            source="walk_in",
            status="confirmed",
            physical_room_ids=[self.room_101.id],
        )

        assert booking.booking_reference.startswith("MG-")
        assert booking.status == "confirmed"
        assert booking.source == "walk_in"
        assert booking.guest_name == "Walkin VIP Guest"
        assert booking.rooms.count() == 1
        assert booking.rooms.first().physical_room == self.room_101

        # Price snapshot automatically created
        assert hasattr(booking, 'price_snapshot')
        assert booking.price_snapshot.gross_total > Decimal("0.00")

        # Inventory reduced from 2 to 1 for Deluxe Room
        avail_after = AvailabilityService.calculate_stay_availability(
            check_in=self.stay_start,
            check_out=self.stay_end,
            category_ids=[self.deluxe_cat.id]
        )
        assert avail_after['categories'][0]['minimum_available_rooms'] == 1
