"""
Comprehensive automated tests for Phase 4 Step 2:
Customer Account + Booking Management + Cancellation Foundation
"""
import uuid
from datetime import date, timedelta
from decimal import Decimal
import pytest
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from apps.authentication.models import CustomerProfile, StaffProfile
from apps.rooms.models import RoomCategory, PhysicalRoom
from apps.pricing.models import RoomRatePlan, TaxRule
from apps.cms.models import HotelConfiguration
from apps.bookings.models import Booking, BookingRoom, BookingGuest
from apps.bookings.services import create_booking_hold, transition_booking_status
from apps.pricing.services import create_booking_price_snapshot

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def hotel_config(db):
    config = HotelConfiguration.get_solo()
    config.hotel_name = "Manohar Grand"
    config.check_in_time = "12:00:00"
    config.check_out_time = "11:00:00"
    config.cancellation_policy_text = "Confirmed reservations are strictly non-refundable and non-cancellable."
    config.save()
    return config


@pytest.fixture
def room_categories(db):
    ac_cat = RoomCategory.objects.create(
        name="Deluxe AC",
        slug="deluxe-ac",
        included_adults=2,
        included_children=0,
        max_total_occupancy=3,
        is_active=True,
    )
    non_ac_cat = RoomCategory.objects.create(
        name="Standard Non-AC",
        slug="standard-non-ac",
        included_adults=2,
        included_children=0,
        max_total_occupancy=2,
        is_active=True,
    )
    # Physical rooms
    PhysicalRoom.objects.create(room_number="101", category=ac_cat, floor=1, operational_status="operational")
    PhysicalRoom.objects.create(room_number="102", category=ac_cat, floor=1, operational_status="operational")
    PhysicalRoom.objects.create(room_number="201", category=non_ac_cat, floor=2, operational_status="operational")

    # Rate plans
    RoomRatePlan.objects.create(
        category=ac_cat,
        name="Standard Tariff",
        base_price_per_night=Decimal("1599.00"),
        extra_adult_charge=Decimal("350.00"),
        extra_child_charge=Decimal("300.00"),
        is_active=True,
    )
    RoomRatePlan.objects.create(
        category=non_ac_cat,
        name="Standard Tariff",
        base_price_per_night=Decimal("1299.00"),
        extra_adult_charge=Decimal("350.00"),
        extra_child_charge=Decimal("300.00"),
        is_active=True,
    )

    # Tax rule
    TaxRule.objects.create(
        name="GST 5%",
        tax_rate=Decimal("5.00"),
        tax_type="percentage",
        is_active=True,
    )

    return ac_cat, non_ac_cat


@pytest.fixture
def customers(db):
    customer_a = User.objects.create_user(
        email="cust_a@example.com",
        first_name="Ramesh",
        last_name="Kumar",
        phone="9876543210",
        auth_provider="google",
    )
    customer_a.customer_profile.city = "Hyderabad"
    customer_a.customer_profile.state = "Telangana"
    customer_a.customer_profile.save()

    customer_b = User.objects.create_user(
        email="cust_b@example.com",
        first_name="Suresh",
        last_name="Reddy",
        phone="9876543211",
        auth_provider="google",
    )
    customer_b.customer_profile.city = "Vijayawada"
    customer_b.customer_profile.state = "Andhra Pradesh"
    customer_b.customer_profile.save()

    return customer_a, customer_b


@pytest.fixture
def staff_users(db):
    receptionist = User.objects.create_user(
        email="recep@manohargrand.com",
        password="StaffPassword123!",
        first_name="Front",
        last_name="Desk",
        is_staff=True,
    )
    StaffProfile.objects.create(user=receptionist, role="receptionist", employee_id="REC001", is_active_duty=True)

    manager = User.objects.create_user(
        email="manager@manohargrand.com",
        password="StaffPassword123!",
        first_name="Hotel",
        last_name="Manager",
        is_staff=True,
    )
    StaffProfile.objects.create(user=manager, role="manager", employee_id="MGR001", is_active_duty=True)

    superadmin = User.objects.create_user(
        email="owner@manohargrand.com",
        password="StaffPassword123!",
        first_name="Hotel",
        last_name="Owner",
        is_staff=True,
        is_superuser=True,
    )
    StaffProfile.objects.create(user=superadmin, role="superadmin", employee_id="ADM001", is_active_duty=True)

    return receptionist, manager, superadmin


# ==============================================================================
# A. CUSTOMER PROFILE TESTS
# ==============================================================================
@pytest.mark.django_db
class TestCustomerProfileAPI:
    def test_authenticated_customer_can_retrieve_profile(self, api_client, customers):
        customer_a, _ = customers
        api_client.force_authenticate(user=customer_a)

        response = api_client.get(reverse('auth-me'))
        assert response.status_code == status.HTTP_200_OK
        data = response.json()['data']
        assert data['email'] == "cust_a@example.com"
        assert data['first_name'] == "Ramesh"
        assert data['last_name'] == "Kumar"
        assert data['role'] == "customer"
        assert data['customer_profile']['city'] == "Hyderabad"
        assert data['customer_profile']['state'] == "Telangana"

    def test_customer_can_update_allowed_profile_fields(self, api_client, customers):
        customer_a, _ = customers
        api_client.force_authenticate(user=customer_a)

        payload = {
            "first_name": "Rameshwar",
            "last_name": "Sharma",
            "phone": "9998887776",
            "city": "Secunderabad",
            "state": "Telangana",
        }
        response = api_client.patch(reverse('auth-profile-update'), payload, format='json')
        assert response.status_code == status.HTTP_200_OK
        data = response.json()['data']
        assert data['first_name'] == "Rameshwar"
        assert data['last_name'] == "Sharma"
        assert data['phone'] == "9998887776"
        assert data['customer_profile']['city'] == "Secunderabad"

    def test_customer_cannot_modify_role_or_staff_permissions(self, api_client, customers):
        customer_a, _ = customers
        api_client.force_authenticate(user=customer_a)

        payload = {
            "role": "manager",
            "is_staff": True,
            "is_superuser": True,
            "auth_provider": "local",
        }
        response = api_client.patch(reverse('auth-profile-update'), payload, format='json')
        assert response.status_code == status.HTTP_200_OK

        customer_a.refresh_from_db()
        assert customer_a.role == "customer"
        assert customer_a.is_staff is False
        assert customer_a.is_superuser is False
        assert customer_a.auth_provider == "google"

    def test_unauthenticated_profile_access_rejected(self, api_client):
        response = api_client.get(reverse('auth-me'))
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

        response = api_client.patch(reverse('auth-profile-update'), {"first_name": "Test"}, format='json')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


# ==============================================================================
# B. CUSTOMER BOOKING HISTORY TESTS
# ==============================================================================
@pytest.mark.django_db
class TestCustomerBookingHistoryAPI:
    def test_customer_sees_only_own_bookings(self, api_client, hotel_config, room_categories, customers):
        ac_cat, _ = room_categories
        customer_a, customer_b = customers
        today = date.today()

        # Customer A booking
        b_a = create_booking_hold(
            rooms_request=[{'category': ac_cat, 'room_quantity': 1}],
            check_in_date=today + timedelta(days=2),
            check_out_date=today + timedelta(days=4),
            guest_name="Ramesh Kumar",
            customer=customer_a,
        )

        # Customer B booking
        b_b = create_booking_hold(
            rooms_request=[{'category': ac_cat, 'room_quantity': 1}],
            check_in_date=today + timedelta(days=5),
            check_out_date=today + timedelta(days=7),
            guest_name="Suresh Reddy",
            customer=customer_b,
        )

        api_client.force_authenticate(user=customer_a)
        response = api_client.get(reverse('bookings:customer-booking-list'))
        assert response.status_code == status.HTTP_200_OK
        data = response.json()['data']
        assert len(data) == 1
        assert data[0]['booking_reference'] == b_a.booking_reference
        assert 'access_token' not in data[0]

        # Customer B
        api_client.force_authenticate(user=customer_b)
        response = api_client.get(reverse('bookings:customer-booking-list'))
        assert response.status_code == status.HTTP_200_OK
        data = response.json()['data']
        assert len(data) == 1
        assert data[0]['booking_reference'] == b_b.booking_reference

    def test_empty_booking_history_works(self, api_client, customers):
        customer_a, _ = customers
        api_client.force_authenticate(user=customer_a)

        response = api_client.get(reverse('bookings:customer-booking-list'))
        assert response.status_code == status.HTTP_200_OK
        res_json = response.json()
        assert res_json['count'] == 0
        assert res_json['data'] == []

    def test_booking_history_filters(self, api_client, hotel_config, room_categories, customers):
        ac_cat, _ = room_categories
        customer_a, _ = customers
        today = date.today()

        # Upcoming confirmed
        b1 = create_booking_hold(
            rooms_request=[{'category': ac_cat, 'room_quantity': 1}],
            check_in_date=today + timedelta(days=10),
            check_out_date=today + timedelta(days=12),
            guest_name="Ramesh Kumar",
            customer=customer_a,
        )
        transition_booking_status(b1, 'confirmed')

        # Past / cancelled
        b2 = create_booking_hold(
            rooms_request=[{'category': ac_cat, 'room_quantity': 1}],
            check_in_date=today + timedelta(days=1),
            check_out_date=today + timedelta(days=3),
            guest_name="Ramesh Kumar",
            customer=customer_a,
        )
        transition_booking_status(b2, 'cancelled')

        api_client.force_authenticate(user=customer_a)

        # Filter by status=confirmed
        res_confirmed = api_client.get(reverse('bookings:customer-booking-list') + '?status=confirmed')
        assert res_confirmed.status_code == status.HTTP_200_OK
        assert len(res_confirmed.json()['data']) == 1
        assert res_confirmed.json()['data'][0]['booking_reference'] == b1.booking_reference

        # Filter by view=upcoming
        res_upcoming = api_client.get(reverse('bookings:customer-booking-list') + '?view=upcoming')
        assert res_upcoming.status_code == status.HTTP_200_OK
        assert len(res_upcoming.json()['data']) == 1
        assert res_upcoming.json()['data'][0]['booking_reference'] == b1.booking_reference

        # Filter by view=past
        res_past = api_client.get(reverse('bookings:customer-booking-list') + '?view=past')
        assert res_past.status_code == status.HTTP_200_OK
        assert len(res_past.json()['data']) == 1
        assert res_past.json()['data'][0]['booking_reference'] == b2.booking_reference


# ==============================================================================
# C. BOOKING DETAIL ACCESS SECURITY TESTS
# ==============================================================================
@pytest.mark.django_db
class TestBookingDetailSecurityAPI:
    def test_owner_can_retrieve_booking_detail(self, api_client, hotel_config, room_categories, customers):
        ac_cat, _ = room_categories
        customer_a, _ = customers
        today = date.today()

        booking = create_booking_hold(
            rooms_request=[{'category': ac_cat, 'room_quantity': 1}],
            check_in_date=today + timedelta(days=2),
            check_out_date=today + timedelta(days=4),
            guest_name="Ramesh Kumar",
            customer=customer_a,
        )

        api_client.force_authenticate(user=customer_a)
        url = reverse('bookings:booking-detail-lookup', kwargs={'booking_reference': booking.booking_reference})
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()['data']
        assert data['booking_reference'] == booking.booking_reference
        assert data['pricing'] is not None

    def test_valid_access_token_allows_retrieval(self, api_client, hotel_config, room_categories):
        ac_cat, _ = room_categories
        today = date.today()

        booking = create_booking_hold(
            rooms_request=[{'category': ac_cat, 'room_quantity': 1}],
            check_in_date=today + timedelta(days=2),
            check_out_date=today + timedelta(days=4),
            guest_name="Guest User",
            customer=None,
        )

        # Unauthenticated query with ?token=
        url = reverse('bookings:booking-detail-lookup', kwargs={'booking_reference': booking.booking_reference})
        response = api_client.get(f"{url}?token={booking.access_token}")
        assert response.status_code == status.HTTP_200_OK
        assert response.json()['data']['booking_reference'] == booking.booking_reference

        # Query with X-Booking-Token header
        response_hdr = api_client.get(url, HTTP_X_BOOKING_TOKEN=str(booking.access_token))
        assert response_hdr.status_code == status.HTTP_200_OK

    def test_unauthorized_user_and_reference_guessing_rejected(self, api_client, hotel_config, room_categories, customers):
        ac_cat, _ = room_categories
        customer_a, customer_b = customers
        today = date.today()

        booking = create_booking_hold(
            rooms_request=[{'category': ac_cat, 'room_quantity': 1}],
            check_in_date=today + timedelta(days=2),
            check_out_date=today + timedelta(days=4),
            guest_name="Ramesh Kumar",
            customer=customer_a,
        )

        url = reverse('bookings:booking-detail-lookup', kwargs={'booking_reference': booking.booking_reference})

        # 1. Unauthenticated without token
        res1 = api_client.get(url)
        assert res1.status_code == status.HTTP_403_FORBIDDEN

        # 2. Unauthenticated with invalid token
        res2 = api_client.get(f"{url}?token={uuid.uuid4()}")
        assert res2.status_code == status.HTTP_403_FORBIDDEN

        # 3. Customer B trying to access Customer A's booking
        api_client.force_authenticate(user=customer_b)
        res3 = api_client.get(url)
        assert res3.status_code == status.HTTP_403_FORBIDDEN

    def test_authorized_staff_can_access_booking(self, api_client, hotel_config, room_categories, customers, staff_users):
        ac_cat, _ = room_categories
        customer_a, _ = customers
        receptionist, manager, superadmin = staff_users
        today = date.today()

        booking = create_booking_hold(
            rooms_request=[{'category': ac_cat, 'room_quantity': 1}],
            check_in_date=today + timedelta(days=2),
            check_out_date=today + timedelta(days=4),
            guest_name="Ramesh Kumar",
            customer=customer_a,
        )

        url = reverse('bookings:booking-detail-lookup', kwargs={'booking_reference': booking.booking_reference})

        for staff in [receptionist, manager, superadmin]:
            api_client.force_authenticate(user=staff)
            response = api_client.get(url)
            assert response.status_code == status.HTTP_200_OK
            assert response.json()['data']['booking_reference'] == booking.booking_reference


# ==============================================================================
# D. GUEST STAY INFORMATION & VALIDATION TESTS
# ==============================================================================
@pytest.mark.django_db
class TestGuestStayInfoAPI:
    def test_owner_can_update_guest_info_and_roster(self, api_client, hotel_config, room_categories, customers):
        ac_cat, _ = room_categories
        customer_a, _ = customers
        today = date.today()

        booking = create_booking_hold(
            rooms_request=[{'category': ac_cat, 'room_quantity': 1}],
            check_in_date=today + timedelta(days=2),
            check_out_date=today + timedelta(days=4),
            guest_name="Ramesh Kumar",
            customer=customer_a,
        )

        api_client.force_authenticate(user=customer_a)
        url = reverse('bookings:booking-detail-lookup', kwargs={'booking_reference': booking.booking_reference})

        payload = {
            "guest_name": "Ramesh Kumar Updated",
            "guest_phone": "9991112223",
            "guest_email": "ramesh.new@example.com",
            "special_requests": "Quiet room on upper floor please.",
            "guests": [
                {
                    "full_name": "Ramesh Kumar",
                    "guest_type": "adult",
                    "age": 35,
                    "phone": "9991112223",
                    "is_primary": True,
                },
                {
                    "full_name": "Sita Kumar",
                    "guest_type": "adult",
                    "age": 32,
                    "phone": "",
                    "is_primary": False,
                }
            ]
        }

        response = api_client.patch(url, payload, format='json')
        assert response.status_code == status.HTTP_200_OK
        data = response.json()['data']
        assert data['guest_name'] == "Ramesh Kumar Updated"
        assert data['guest_phone'] == "9991112223"
        assert data['special_requests'] == "Quiet room on upper floor please."
        assert len(data['guests']) == 2

        booking.refresh_from_db()
        assert booking.guest_name == "Ramesh Kumar Updated"
        assert booking.guest_roster.count() == 2

    def test_another_customer_cannot_update_guest_details(self, api_client, hotel_config, room_categories, customers):
        ac_cat, _ = room_categories
        customer_a, customer_b = customers
        today = date.today()

        booking = create_booking_hold(
            rooms_request=[{'category': ac_cat, 'room_quantity': 1}],
            check_in_date=today + timedelta(days=2),
            check_out_date=today + timedelta(days=4),
            guest_name="Ramesh Kumar",
            customer=customer_a,
        )

        api_client.force_authenticate(user=customer_b)
        url = reverse('bookings:booking-detail-lookup', kwargs={'booking_reference': booking.booking_reference})

        response = api_client.patch(url, {"guest_name": "Hacked Name"}, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_guest_count_exceeding_capacity_rejected(self, api_client, hotel_config, room_categories, customers):
        ac_cat, _ = room_categories  # max_occupancy is 3
        customer_a, _ = customers
        today = date.today()

        booking = create_booking_hold(
            rooms_request=[{'category': ac_cat, 'room_quantity': 1}],
            check_in_date=today + timedelta(days=2),
            check_out_date=today + timedelta(days=4),
            guest_name="Ramesh Kumar",
            customer=customer_a,
        )

        api_client.force_authenticate(user=customer_a)
        url = reverse('bookings:booking-detail-lookup', kwargs={'booking_reference': booking.booking_reference})

        # 4 guests for 1 Deluxe AC room (max capacity is 3)
        payload = {
            "guests": [
                {"full_name": f"Guest {i}", "guest_type": "adult"}
                for i in range(1, 5)
            ]
        }
        response = api_client.patch(url, payload, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "exceeds maximum allowable capacity" in str(response.json()['error'])


# ==============================================================================
# E. CANCELLATION RULES & STATE TRANSITIONS
# ==============================================================================
@pytest.mark.django_db
class TestCancellationRulesAPI:
    def test_held_booking_can_be_cancelled_or_released(self, api_client, hotel_config, room_categories, customers):
        ac_cat, _ = room_categories
        customer_a, _ = customers
        today = date.today()

        booking = create_booking_hold(
            rooms_request=[{'category': ac_cat, 'room_quantity': 1}],
            check_in_date=today + timedelta(days=2),
            check_out_date=today + timedelta(days=4),
            guest_name="Ramesh Kumar",
            customer=customer_a,
        )

        api_client.force_authenticate(user=customer_a)
        url = reverse('bookings:booking-cancel', kwargs={'booking_reference': booking.booking_reference})

        response = api_client.post(url, {})
        assert response.status_code == status.HTTP_200_OK
        assert response.json()['data']['status'] == 'cancelled'

        booking.refresh_from_db()
        assert booking.status == 'cancelled'

    def test_confirmed_booking_cannot_be_customer_cancelled(self, api_client, hotel_config, room_categories, customers):
        ac_cat, _ = room_categories
        customer_a, _ = customers
        today = date.today()

        booking = create_booking_hold(
            rooms_request=[{'category': ac_cat, 'room_quantity': 1}],
            check_in_date=today + timedelta(days=2),
            check_out_date=today + timedelta(days=4),
            guest_name="Ramesh Kumar",
            customer=customer_a,
        )
        transition_booking_status(booking, 'confirmed')

        api_client.force_authenticate(user=customer_a)
        url = reverse('bookings:booking-cancel', kwargs={'booking_reference': booking.booking_reference})

        response = api_client.post(url, {})
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        res_json = response.json()
        assert res_json['error']['code'] == 'CANCELLATION_NOT_PERMITTED'
        assert "non-cancellable" in res_json['error']['message']

        booking.refresh_from_db()
        assert booking.status == 'confirmed'

    def test_receptionist_cannot_cancel_confirmed_booking(self, api_client, hotel_config, room_categories, customers, staff_users):
        ac_cat, _ = room_categories
        customer_a, _ = customers
        receptionist, _, _ = staff_users
        today = date.today()

        booking = create_booking_hold(
            rooms_request=[{'category': ac_cat, 'room_quantity': 1}],
            check_in_date=today + timedelta(days=2),
            check_out_date=today + timedelta(days=4),
            guest_name="Ramesh Kumar",
            customer=customer_a,
        )
        transition_booking_status(booking, 'confirmed')

        api_client.force_authenticate(user=receptionist)
        url = reverse('bookings:booking-cancel', kwargs={'booking_reference': booking.booking_reference})

        response = api_client.post(url, {"reason": "Customer called front desk"})
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.json()['error']['code'] == 'CANCELLATION_NOT_PERMITTED'

        booking.refresh_from_db()
        assert booking.status == 'confirmed'

    def test_manager_and_superadmin_can_perform_administrative_cancellation(self, api_client, hotel_config, room_categories, customers, staff_users):
        ac_cat, _ = room_categories
        customer_a, _ = customers
        _, manager, superadmin = staff_users
        today = date.today()

        # Manager cancellation
        b1 = create_booking_hold(
            rooms_request=[{'category': ac_cat, 'room_quantity': 1}],
            check_in_date=today + timedelta(days=2),
            check_out_date=today + timedelta(days=4),
            guest_name="Ramesh Kumar",
            customer=customer_a,
        )
        transition_booking_status(b1, 'confirmed')

        api_client.force_authenticate(user=manager)
        url1 = reverse('bookings:booking-cancel', kwargs={'booking_reference': b1.booking_reference})
        res1 = api_client.post(url1, {"reason": "Severe AC failure emergency override"})
        assert res1.status_code == status.HTTP_200_OK
        assert res1.json()['data']['status'] == 'cancelled'

        # SuperAdmin cancellation
        b2 = create_booking_hold(
            rooms_request=[{'category': ac_cat, 'room_quantity': 1}],
            check_in_date=today + timedelta(days=5),
            check_out_date=today + timedelta(days=7),
            guest_name="Ramesh Kumar",
            customer=customer_a,
        )
        transition_booking_status(b2, 'confirmed')

        api_client.force_authenticate(user=superadmin)
        url2 = reverse('bookings:booking-cancel', kwargs={'booking_reference': b2.booking_reference})
        res2 = api_client.post(url2, {"reason": "Owner authorized emergency cancellation"})
        assert res2.status_code == status.HTTP_200_OK
        assert res2.json()['data']['status'] == 'cancelled'


# ==============================================================================
# F. PRICE SNAPSHOT INVARIANCE TESTS
# ==============================================================================
@pytest.mark.django_db
class TestPriceSnapshotInvariance:
    def test_price_snapshot_remains_unchanged_after_rate_change(self, api_client, hotel_config, room_categories, customers):
        ac_cat, _ = room_categories
        customer_a, _ = customers
        today = date.today()

        booking = create_booking_hold(
            rooms_request=[{'category': ac_cat, 'room_quantity': 1}],
            check_in_date=today + timedelta(days=2),
            check_out_date=today + timedelta(days=4),  # 2 nights @ 1599 = 3198 + 5% GST (159.90) = 3357.90
            guest_name="Ramesh Kumar",
            customer=customer_a,
        )

        initial_gross = booking.price_snapshot.gross_total
        assert initial_gross == Decimal("3357.90")

        # Mutate room rate plan to higher tariff
        rate_plan = RoomRatePlan.objects.get(category=ac_cat)
        rate_plan.base_price_per_night = Decimal("2599.00")
        rate_plan.save()

        # Retrieve booking via customer detail API
        api_client.force_authenticate(user=customer_a)
        url = reverse('bookings:booking-detail-lookup', kwargs={'booking_reference': booking.booking_reference})
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK

        data = response.json()['data']
        assert Decimal(str(data['pricing']['gross_total'])) == initial_gross
        assert Decimal(str(data['pricing']['room_subtotal'])) == Decimal("3198.00")
        assert Decimal(str(data['pricing']['tax_amount'])) == Decimal("159.90")

        # Snapshot in database is completely unchanged
        booking.refresh_from_db()
        assert booking.price_snapshot.gross_total == initial_gross


# ==============================================================================
# G. RBAC & ISOLATION TESTS
# ==============================================================================
@pytest.mark.django_db
class TestCustomerRBACIsolation:
    def test_customer_cannot_access_staff_admin_endpoints(self, api_client, customers):
        customer_a, _ = customers
        api_client.force_authenticate(user=customer_a)

        # Admin reservations list
        response = api_client.get('/api/v1/admin/bookings/')
        assert response.status_code in (status.HTTP_403_FORBIDDEN, status.HTTP_401_UNAUTHORIZED)

        # Admin walk-in creation
        response = api_client.post('/api/v1/admin/bookings/walk-in/', {})
        assert response.status_code in (status.HTTP_403_FORBIDDEN, status.HTTP_401_UNAUTHORIZED)
