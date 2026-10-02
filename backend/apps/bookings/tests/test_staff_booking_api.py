"""
API Integration tests for Staff Booking Operations (/api/v1/admin/bookings/).
Validates RBAC, filters, room assignment, check-in, check-out, walk-in, and overbooking endpoints.
"""
from datetime import date
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from apps.authentication.models import StaffProfile
from apps.rooms.models import RoomCategory, PhysicalRoom
from apps.bookings.models import Booking, BookingRoom
from apps.bookings.services import (
    create_booking_hold,
    transition_booking_status,
    assign_physical_rooms,
)

User = get_user_model()


@pytest.mark.django_db
class TestStaffBookingAPI:

    @pytest.fixture(autouse=True)
    def setup_data(self):
        self.client = APIClient()

        # Categories & Physical Rooms
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

        # Users & Roles
        self.superadmin = User.objects.create_superuser(
            email='superadmin@manohargrand.com',
            password='AdminPassword123!',
            first_name='Super',
            last_name='Admin'
        )
        StaffProfile.objects.create(user=self.superadmin, role='superadmin', employee_id='EMP-SUPER')

        self.manager = User.objects.create_user(
            email='manager@manohargrand.com',
            password='ManagerPassword123!',
            first_name='Hotel',
            last_name='Manager',
            is_staff=True
        )
        StaffProfile.objects.create(user=self.manager, role='manager', employee_id='EMP-MGR')

        self.receptionist = User.objects.create_user(
            email='receptionist@manohargrand.com',
            password='ReceptPassword123!',
            first_name='Front',
            last_name='Desk',
            is_staff=True
        )
        StaffProfile.objects.create(user=self.receptionist, role='receptionist', employee_id='EMP-REC')

        self.customer = User.objects.create_user(
            email='guest@example.com',
            password='CustomerPassword123!',
            first_name='Regular',
            last_name='Customer'
        )

    def _create_test_booking(self, status_val='confirmed', guest_name="John Doe", ref_date=None):
        ci = ref_date or date(2026, 12, 1)
        co = ci.replace(day=ci.day + 3)
        booking = create_booking_hold(
            rooms_request=[{'category': self.ac_category, 'room_quantity': 1}],
            check_in_date=ci,
            check_out_date=co,
            guest_name=guest_name,
            guest_phone="+919876543210",
            guest_email="john@example.com",
        )
        if status_val != 'held':
            booking = transition_booking_status(booking, target_status=status_val)
        return booking

    # 1. Staff Listing & Filters
    def test_receptionist_can_list_bookings(self):
        """Receptionist can view admin reservations data grid."""
        self._create_test_booking()
        self.client.force_authenticate(user=self.receptionist)
        response = self.client.get('/api/v1/admin/bookings/')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['success'] is True
        assert len(response.data['data']) >= 1

    def test_manager_and_superadmin_can_list_bookings(self):
        """Manager and SuperAdmin can view admin reservations."""
        self._create_test_booking()
        
        self.client.force_authenticate(user=self.manager)
        resp_mgr = self.client.get('/api/v1/admin/bookings/')
        assert resp_mgr.status_code == status.HTTP_200_OK

        self.client.force_authenticate(user=self.superadmin)
        resp_admin = self.client.get('/api/v1/admin/bookings/')
        assert resp_admin.status_code == status.HTTP_200_OK

    def test_customer_cannot_access_admin_booking_list(self):
        """Public customers receive 403 Forbidden on admin booking listing."""
        self.client.force_authenticate(user=self.customer)
        response = self.client.get('/api/v1/admin/bookings/')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_unauthenticated_cannot_access_admin_booking_list(self):
        """Unauthenticated requests receive 401/403 on admin booking listing."""
        response = self.client.get('/api/v1/admin/bookings/')
        assert response.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)

    def test_admin_booking_list_search_and_filters(self):
        """Staff list supports query search, status filter, and date filters."""
        self._create_test_booking(guest_name="Special Guest Alpha", ref_date=date(2026, 12, 5))
        self._create_test_booking(guest_name="Regular Guest Beta", ref_date=date(2026, 12, 10))

        self.client.force_authenticate(user=self.receptionist)
        
        # Search by name
        resp = self.client.get('/api/v1/admin/bookings/?search=Special')
        assert resp.status_code == status.HTTP_200_OK
        assert len(resp.data['data']) == 1
        assert resp.data['data'][0]['guest_name'] == "Special Guest Alpha"

        # Filter by check_in_date
        resp_date = self.client.get('/api/v1/admin/bookings/?check_in_date=2026-12-10')
        assert resp_date.status_code == status.HTTP_200_OK
        assert len(resp_date.data['data']) == 1
        assert resp_date.data['data'][0]['guest_name'] == "Regular Guest Beta"

    # 2. Staff Detail View
    def test_admin_booking_detail_view(self):
        """Staff can view full details by booking reference or UUID."""
        booking = self._create_test_booking()
        self.client.force_authenticate(user=self.receptionist)

        # Lookup by reference
        resp_ref = self.client.get(f'/api/v1/admin/bookings/{booking.booking_reference}/')
        assert resp_ref.status_code == status.HTTP_200_OK
        assert resp_ref.data['data']['booking_reference'] == booking.booking_reference

        # Lookup by UUID
        resp_uuid = self.client.get(f'/api/v1/admin/bookings/{booking.id}/')
        assert resp_uuid.status_code == status.HTTP_200_OK
        assert resp_uuid.data['data']['id'] == str(booking.id)

    # 3. Room Assignment API
    def test_admin_assign_rooms_api_success(self):
        """Staff can assign physical rooms to a booking via POST /api/v1/admin/bookings/{id}/assign-rooms/."""
        booking = self._create_test_booking()
        self.client.force_authenticate(user=self.receptionist)

        payload = {
            "physical_room_ids": ["101"]
        }
        response = self.client.post(f'/api/v1/admin/bookings/{booking.booking_reference}/assign-rooms/', payload, format='json')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['success'] is True
        assert response.data['data']['is_fully_assigned'] is True
        assert response.data['data']['assignment_summary']['total_assigned'] == 1

    def test_admin_assign_rooms_validation_error(self):
        """Invalid room assignment returns 400 Bad Request with details."""
        booking = self._create_test_booking()
        self.client.force_authenticate(user=self.receptionist)

        payload = {
            "physical_room_ids": ["999"]  # Non-existent room
        }
        response = self.client.post(f'/api/v1/admin/bookings/{booking.booking_reference}/assign-rooms/', payload, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data['success'] is False
        assert response.data['error']['code'] == 'ASSIGNMENT_VALIDATION_ERROR'

    # 4. Check-in & Check-out APIs
    def test_admin_check_in_and_check_out_flow(self):
        """Staff can check in an assigned booking and check out."""
        booking = self._create_test_booking()
        assign_physical_rooms(booking=booking, physical_room_identifiers=["101"])

        self.client.force_authenticate(user=self.receptionist)

        # Check-in
        resp_ci = self.client.post(f'/api/v1/admin/bookings/{booking.booking_reference}/check-in/')
        assert resp_ci.status_code == status.HTTP_200_OK
        assert resp_ci.data['data']['status'] == 'checked_in'

        # Check-out
        resp_co = self.client.post(f'/api/v1/admin/bookings/{booking.booking_reference}/check-out/')
        assert resp_co.status_code == status.HTTP_200_OK
        assert resp_co.data['data']['status'] == 'checked_out'

    def test_admin_check_in_unassigned_rejected(self):
        """Check-in is rejected if physical rooms are not assigned."""
        booking = self._create_test_booking()
        self.client.force_authenticate(user=self.receptionist)

        response = self.client.post(f'/api/v1/admin/bookings/{booking.booking_reference}/check-in/')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data['error']['code'] == 'CHECKIN_VALIDATION_ERROR'

    # 5. Walk-in Booking Creation
    def test_admin_walk_in_creation_success(self):
        """Receptionist creates offline walk-in booking."""
        self.client.force_authenticate(user=self.receptionist)

        payload = {
            "category": self.ac_category.slug,
            "room_quantity": 1,
            "check_in": "2026-12-20",
            "check_out": "2026-12-22",
            "guest_name": "Walk-in Guest",
            "guest_phone": "+919988776655",
            "source": "walk_in",
            "physical_room_ids": ["101"]
        }
        response = self.client.post('/api/v1/admin/bookings/walk-in/', payload, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['success'] is True
        assert response.data['data']['status'] == 'confirmed'
        assert response.data['data']['source'] == 'walk_in'
        assert response.data['data']['is_fully_assigned'] is True

    # 6. Overbooking API (SuperAdmin Only)
    def test_superadmin_overbooking_creation_success(self):
        """SuperAdmin can create an overbooking with mandatory justification."""
        self.client.force_authenticate(user=self.superadmin)

        payload = {
            "category": self.ac_category.slug,
            "room_quantity": 1,
            "check_in": "2026-12-25",
            "check_out": "2026-12-28",
            "guest_name": "VIP Guest",
            "overbooking_reason": "Executive owner authorization",
        }
        response = self.client.post('/api/v1/admin/bookings/overbooking/', payload, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['data']['is_overbooking'] is True
        assert response.data['data']['overbooking_reason'] == "Executive owner authorization"

    def test_receptionist_and_manager_cannot_create_overbooking(self):
        """Receptionist and Manager are forbidden from overbooking."""
        payload = {
            "category": self.ac_category.slug,
            "room_quantity": 1,
            "check_in": "2026-12-25",
            "check_out": "2026-12-28",
            "guest_name": "VIP Guest",
            "overbooking_reason": "Unauthorized attempt",
        }

        self.client.force_authenticate(user=self.receptionist)
        resp_rec = self.client.post('/api/v1/admin/bookings/overbooking/', payload, format='json')
        assert resp_rec.status_code == status.HTTP_403_FORBIDDEN

        self.client.force_authenticate(user=self.manager)
        resp_mgr = self.client.post('/api/v1/admin/bookings/overbooking/', payload, format='json')
        assert resp_mgr.status_code == status.HTTP_403_FORBIDDEN
