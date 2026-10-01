"""
Tests for Booking and BookingRoom models in apps/bookings.
"""
from datetime import date, timedelta
import pytest
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from apps.rooms.models import RoomCategory, PhysicalRoom
from apps.bookings.models import Booking, BookingRoom

User = get_user_model()


@pytest.mark.django_db
class TestBookingModels:
    """Test suite covering Booking and BookingRoom models."""

    @pytest.fixture
    def setup_domain(self):
        ac = RoomCategory.objects.create(
            slug='ac-room',
            name='AC Room',
            included_adults=2,
            max_total_occupancy=4,
            is_active=True
        )
        non_ac = RoomCategory.objects.create(
            slug='non-ac-room',
            name='Non-AC Room',
            included_adults=2,
            max_total_occupancy=2,
            is_active=True
        )
        room_101 = PhysicalRoom.objects.create(
            category=ac,
            room_number='101',
            floor=1,
            operational_status='operational'
        )
        room_201 = PhysicalRoom.objects.create(
            category=non_ac,
            room_number='201',
            floor=2,
            operational_status='operational'
        )
        user = User.objects.create_user(
            email='guest@example.com',
            password='GuestPassword123!',
            first_name='Ananya',
            last_name='Sharma'
        )
        return {
            'ac': ac,
            'non_ac': non_ac,
            'room_101': room_101,
            'room_201': room_201,
            'user': user
        }

    def test_create_booking_auto_generates_unique_reference(self, setup_domain):
        booking = Booking.objects.create(
            customer=setup_domain['user'],
            guest_name='Ananya Sharma',
            guest_phone='+91-9876543210',
            guest_email='guest@example.com',
            source='website',
            status='held',
            check_in_date=date(2026, 10, 10),
            check_out_date=date(2026, 10, 13),
            total_adults=2,
            hold_expires_at=timezone.now() + timedelta(minutes=15)
        )

        assert booking.booking_reference.startswith('MG-')
        assert len(booking.booking_reference) >= 11
        assert booking.nights_count == 3
        assert booking.is_hold_valid is True
        assert booking.is_active_occupant is True

    def test_booking_date_validation_rejects_inverted_dates(self):
        booking = Booking(
            guest_name='Test Guest',
            check_in_date=date(2026, 10, 15),
            check_out_date=date(2026, 10, 10),
            total_adults=1
        )
        with pytest.raises(ValidationError) as exc:
            booking.clean()
        assert 'check_out_date' in exc.value.message_dict

    def test_booking_hold_expiry_evaluation(self, setup_domain):
        # 1. Unexpired hold
        unexpired_hold = Booking.objects.create(
            guest_name='Guest 1',
            check_in_date=date(2026, 10, 10),
            check_out_date=date(2026, 10, 12),
            status='held',
            hold_expires_at=timezone.now() + timedelta(minutes=10)
        )
        assert unexpired_hold.is_hold_valid is True
        assert unexpired_hold.is_active_occupant is True

        # 2. Expired hold
        expired_hold = Booking.objects.create(
            guest_name='Guest 2',
            check_in_date=date(2026, 10, 10),
            check_out_date=date(2026, 10, 12),
            status='held',
            hold_expires_at=timezone.now() - timedelta(minutes=5)
        )
        assert expired_hold.is_hold_valid is False
        assert expired_hold.is_active_occupant is False

    def test_overbooking_validation_requires_reason(self):
        # Overbooking with empty reason raises ValidationError
        booking = Booking(
            guest_name='Overbooked Guest',
            check_in_date=date(2026, 10, 10),
            check_out_date=date(2026, 10, 12),
            is_overbooking=True,
            overbooking_reason=''
        )
        with pytest.raises(ValidationError) as exc:
            booking.clean()
        assert 'overbooking_reason' in exc.value.message_dict

    def test_booking_room_category_relationship_and_assignment(self, setup_domain):
        booking = Booking.objects.create(
            guest_name='Walk-in Guest',
            source='walk_in',
            status='confirmed',
            check_in_date=date(2026, 10, 10),
            check_out_date=date(2026, 10, 12),
            total_adults=2
        )

        # 1. Category level reservation without physical assignment initially
        booked_room = BookingRoom.objects.create(
            booking=booking,
            category=setup_domain['ac'],
            room_quantity=1
        )
        assert booked_room.physical_room is None
        assert booking.total_rooms_count == 1

        # 2. Reception assigns valid physical room matching the category
        booked_room.physical_room = setup_domain['room_101']
        booked_room.assigned_at = timezone.now()
        booked_room.full_clean()
        booked_room.save()
        assert booked_room.physical_room.room_number == '101'

    def test_booking_room_category_mismatch_rejected(self, setup_domain):
        booking = Booking.objects.create(
            guest_name='Guest',
            check_in_date=date(2026, 10, 10),
            check_out_date=date(2026, 10, 12)
        )

        # Attempting to assign a Non-AC physical room (201) to an AC Room line raises ValidationError
        mismatched_room = BookingRoom(
            booking=booking,
            category=setup_domain['ac'],
            room_quantity=1,
            physical_room=setup_domain['room_201']
        )
        with pytest.raises(ValidationError) as exc:
            mismatched_room.clean()
        assert 'physical_room' in exc.value.message_dict
