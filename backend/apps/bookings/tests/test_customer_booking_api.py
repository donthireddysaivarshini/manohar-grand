"""
API Integration tests for Customer Booking List and Secure Detail Lookup (/api/v1/bookings/).
Validates customer ownership, unguessable token security, and customer privacy.
"""
from datetime import date
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from apps.authentication.models import StaffProfile
from apps.rooms.models import RoomCategory, PhysicalRoom
from apps.bookings.models import Booking
from apps.bookings.services import create_booking_hold

User = get_user_model()


@pytest.mark.django_db
class TestCustomerBookingAPI:

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
        self.room_101 = PhysicalRoom.objects.create(
            category=self.ac_category,
            room_number="101",
            operational_status='operational',
        )

        self.customer_a = User.objects.create_user(
            email='customer_a@example.com',
            password='PasswordA123!',
            first_name='Alice',
            last_name='Smith'
        )

        self.customer_b = User.objects.create_user(
            email='customer_b@example.com',
            password='PasswordB123!',
            first_name='Bob',
            last_name='Jones'
        )

        self.receptionist = User.objects.create_user(
            email='receptionist@manohargrand.com',
            password='ReceptPassword123!',
            first_name='Front',
            last_name='Desk',
            is_staff=True
        )
        StaffProfile.objects.create(user=self.receptionist, role='receptionist', employee_id='EMP-REC')

        # Create bookings for customer A and customer B
        self.booking_a = create_booking_hold(
            rooms_request=[{'category': self.ac_category, 'room_quantity': 1}],
            check_in_date=date(2026, 12, 1),
            check_out_date=date(2026, 12, 3),
            guest_name="Alice Smith",
            customer=self.customer_a,
        )

        self.booking_b = create_booking_hold(
            rooms_request=[{'category': self.ac_category, 'room_quantity': 1}],
            check_in_date=date(2026, 12, 5),
            check_out_date=date(2026, 12, 8),
            guest_name="Bob Jones",
            customer=self.customer_b,
        )

    # 1. Customer Booking Listing
    def test_customer_a_sees_only_own_bookings(self):
        """Authenticated customer A sees only their own reservations."""
        self.client.force_authenticate(user=self.customer_a)
        response = self.client.get('/api/v1/bookings/')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['success'] is True
        assert response.data['count'] == 1
        assert response.data['data'][0]['booking_reference'] == self.booking_a.booking_reference

    def test_customer_cannot_spoof_ownership_with_query_param(self):
        """Querying ?customer_id= does not allow customer A to see customer B's bookings."""
        self.client.force_authenticate(user=self.customer_a)
        response = self.client.get(f'/api/v1/bookings/?customer_id={self.customer_b.id}')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1
        assert response.data['data'][0]['booking_reference'] == self.booking_a.booking_reference

    def test_unauthenticated_customer_list_rejected(self):
        """Unauthenticated GET /api/v1/bookings/ is rejected with 401/403."""
        response = self.client.get('/api/v1/bookings/')
        assert response.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)

    # 2. Customer Booking Detail
    def test_owner_can_view_booking_detail_without_token(self):
        """Authenticated owner can access their booking detail directly."""
        self.client.force_authenticate(user=self.customer_a)
        response = self.client.get(f'/api/v1/bookings/{self.booking_a.booking_reference}/')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['data']['booking_reference'] == self.booking_a.booking_reference

    def test_guest_with_valid_access_token_can_view_detail(self):
        """Unauthenticated guest with valid ?token= query parameter can view booking detail."""
        response = self.client.get(f'/api/v1/bookings/{self.booking_a.booking_reference}/?token={self.booking_a.access_token}')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['data']['booking_reference'] == self.booking_a.booking_reference

    def test_guest_with_header_token_can_view_detail(self):
        """Unauthenticated guest with X-Booking-Token header can view booking detail."""
        response = self.client.get(
            f'/api/v1/bookings/{self.booking_a.booking_reference}/',
            HTTP_X_BOOKING_TOKEN=str(self.booking_a.access_token)
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data['data']['booking_reference'] == self.booking_a.booking_reference

    def test_unauthorized_user_guessing_reference_alone_rejected(self):
        """A user guessing a booking reference without access token receives 403 Forbidden."""
        # Unauthenticated without token
        response = self.client.get(f'/api/v1/bookings/{self.booking_a.booking_reference}/')
        assert response.status_code == status.HTTP_403_FORBIDDEN

        # Another authenticated customer without token
        self.client.force_authenticate(user=self.customer_b)
        response_b = self.client.get(f'/api/v1/bookings/{self.booking_a.booking_reference}/')
        assert response_b.status_code == status.HTTP_403_FORBIDDEN

    def test_invalid_token_rejected(self):
        """Providing an invalid access token returns 403 Forbidden."""
        response = self.client.get(f'/api/v1/bookings/{self.booking_a.booking_reference}/?token=00000000-0000-0000-0000-000000000000')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_staff_can_view_booking_detail_without_token(self):
        """Front desk staff can view any booking detail."""
        self.client.force_authenticate(user=self.receptionist)
        response = self.client.get(f'/api/v1/bookings/{self.booking_a.booking_reference}/')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['data']['booking_reference'] == self.booking_a.booking_reference
