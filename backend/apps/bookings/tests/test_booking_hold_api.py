"""
API integration tests for booking hold creation, secure reservation lookup, and hold release.
"""
from datetime import date
import pytest
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient

from apps.rooms.models import RoomCategory, PhysicalRoom
from apps.bookings.models import Booking, BookingRoom
from apps.bookings.services import create_booking_hold

User = get_user_model()


@pytest.mark.django_db
class TestBookingHoldAPI:

    @pytest.fixture(autouse=True)
    def setup_data(self):
        self.client = APIClient()
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

        for i in range(3):
            PhysicalRoom.objects.create(
                category=self.ac_category,
                room_number=f"AC-10{i}",
                operational_status='operational'
            )

        self.customer = User.objects.create_user(
            email='customer@example.com',
            password='TestPassword123!',
            first_name='Ananya',
            last_name='Sharma'
        )

        self.staff_user = User.objects.create_user(
            email='receptionist@manohargrand.com',
            password='TestPassword123!',
            first_name='FrontDesk',
            last_name='Staff',
            is_staff=True
        )

    def test_post_booking_hold_success(self):
        """POST /api/v1/bookings/hold/ creates a temporary hold with status 201."""
        payload = {
            "check_in": "2026-10-10",
            "check_out": "2026-10-13",
            "rooms": [
                {"category_id": str(self.ac_category.id), "room_quantity": 2}
            ],
            "guest_name": "Rajesh Varma",
            "guest_phone": "+919876543210",
            "guest_email": "rajesh@example.com",
            "total_adults": 3,
            "total_children": 1,
            "special_requests": "Upper floor preferred"
        }

        response = self.client.post('/api/v1/bookings/hold/', payload, format='json')
        assert response.status_code == status.HTTP_201_CREATED

        data = response.json()
        assert data['success'] is True
        booking_data = data['data']
        assert booking_data['booking_reference'].startswith('MG-')
        assert 'access_token' in booking_data
        assert booking_data['status'] == 'held'
        assert booking_data['check_in_date'] == '2026-10-10'
        assert booking_data['check_out_date'] == '2026-10-13'
        assert booking_data['nights_count'] == 3
        assert booking_data['total_rooms_count'] == 2
        assert len(booking_data['rooms']) == 1

    def test_post_booking_hold_single_room_shorthand(self):
        """POST /api/v1/bookings/hold/ with category slug and quantity shorthand."""
        payload = {
            "check_in": "2026-10-10",
            "check_out": "2026-10-12",
            "category": "deluxe-ac-room",
            "room_quantity": 1,
            "guest_name": "Sneha Roy",
            "guest_phone": "+919876543211",
        }

        response = self.client.post('/api/v1/bookings/hold/', payload, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.json()['data']['total_rooms_count'] == 1

    def test_post_booking_hold_authenticated_customer_linked(self):
        """Authenticated customer creates hold; customer FK is automatically attached."""
        self.client.force_authenticate(user=self.customer)

        payload = {
            "check_in": "2026-10-10",
            "check_out": "2026-10-12",
            "category_id": str(self.ac_category.id),
            "room_quantity": 1,
            "guest_name": "Ananya Sharma",
        }

        response = self.client.post('/api/v1/bookings/hold/', payload, format='json')
        assert response.status_code == status.HTTP_201_CREATED

        booking_ref = response.json()['data']['booking_reference']
        booking_obj = Booking.objects.get(booking_reference=booking_ref)
        assert booking_obj.customer == self.customer

    def test_post_booking_hold_invalid_dates_rejected(self):
        """check_out <= check_in returns 400 Bad Request."""
        payload = {
            "check_in": "2026-10-15",
            "check_out": "2026-10-10",
            "category": "deluxe-ac-room",
            "guest_name": "Invalid Date Guest",
        }

        response = self.client.post('/api/v1/bookings/hold/', payload, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.json()['error']['code'] == 'VALIDATION_ERROR'

    def test_post_booking_hold_insufficient_inventory_returns_409_conflict(self):
        """When requested rooms exceed available capacity, returns HTTP 409 Conflict with INVENTORY_EXHAUSTED."""
        payload = {
            "check_in": "2026-10-10",
            "check_out": "2026-10-12",
            "category_id": str(self.ac_category.id),
            "room_quantity": 10,  # Only 3 exist
            "guest_name": "Overbook Attempt",
        }

        response = self.client.post('/api/v1/bookings/hold/', payload, format='json')
        assert response.status_code == status.HTTP_409_CONFLICT

        data = response.json()
        assert data['success'] is False
        assert data['error']['code'] == 'INVENTORY_EXHAUSTED'
        assert data['error']['details']['requested_quantity'] == 10
        assert data['error']['details']['available_quantity'] == 3

    def test_get_booking_detail_with_valid_access_token(self):
        """GET /api/v1/bookings/{ref}/?token={access_token} succeeds for unauthenticated guest."""
        booking = create_booking_hold(
            rooms_request=[{'category': self.ac_category, 'room_quantity': 1}],
            check_in_date=date(2026, 10, 10),
            check_out_date=date(2026, 10, 12),
            guest_name="Guest With Token",
        )

        url = f"/api/v1/bookings/{booking.booking_reference}/?token={booking.access_token}"
        response = self.client.get(url)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data['success'] is True
        assert data['data']['booking_reference'] == booking.booking_reference
        assert data['data']['status'] == 'held'

    def test_get_booking_detail_without_token_forbidden(self):
        """GET /api/v1/bookings/{ref}/ without access token returns 403 Forbidden."""
        booking = create_booking_hold(
            rooms_request=[{'category': self.ac_category, 'room_quantity': 1}],
            check_in_date=date(2026, 10, 10),
            check_out_date=date(2026, 10, 12),
            guest_name="Protected Guest",
        )

        url = f"/api/v1/bookings/{booking.booking_reference}/"
        response = self.client.get(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert response.json()['error']['code'] == 'PERMISSION_DENIED'

    def test_get_booking_detail_owner_and_staff_access(self):
        """Booking owner and staff can access reservation without supplying token in URL."""
        booking = create_booking_hold(
            rooms_request=[{'category': self.ac_category, 'room_quantity': 1}],
            check_in_date=date(2026, 10, 10),
            check_out_date=date(2026, 10, 12),
            guest_name="Ananya Sharma",
            customer=self.customer,
        )

        # 1. Owner access
        self.client.force_authenticate(user=self.customer)
        url = f"/api/v1/bookings/{booking.booking_reference}/"
        res_owner = self.client.get(url)
        assert res_owner.status_code == status.HTTP_200_OK

        # 2. Staff access
        self.client.force_authenticate(user=self.staff_user)
        res_staff = self.client.get(url)
        assert res_staff.status_code == status.HTTP_200_OK

        # 3. Other customer access without token -> 403
        other_customer = User.objects.create_user(email='other@example.com', password='Password123!')
        self.client.force_authenticate(user=other_customer)
        res_other = self.client.get(url)
        assert res_other.status_code == status.HTTP_403_FORBIDDEN

    def test_post_booking_hold_release_success(self):
        """POST /api/v1/bookings/{ref}/release/ releases hold and frees inventory."""
        booking = create_booking_hold(
            rooms_request=[{'category': self.ac_category, 'room_quantity': 3}],
            check_in_date=date(2026, 10, 10),
            check_out_date=date(2026, 10, 12),
            guest_name="Cancel Candidate",
        )

        url = f"/api/v1/bookings/{booking.booking_reference}/release/?token={booking.access_token}"
        response = self.client.post(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.json()['data']['status'] == 'cancelled'

        booking.refresh_from_db()
        assert booking.status == 'cancelled'
