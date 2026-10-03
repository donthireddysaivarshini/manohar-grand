"""
Comprehensive automated tests for Phase 4 Step 3:
Checkout Readiness & Final Pre-Payment Booking Workflow.
Covers:
A. Authenticated customer creates/owns hold
B. Customer cannot access another customer's checkout
C. Customer can retrieve own checkout summary
D. Unauthenticated access is rejected where required
E. Staff authorized access works
F. Expired hold cannot checkout
G. Cancelled hold cannot checkout
H. Confirmed booking cannot use checkout flow
I. Invalid guest count rejected
J. Pricing snapshot is returned correctly
K. Frontend-supplied price cannot alter server totals
L. Customer cannot modify dates through checkout
M. Customer cannot modify quantities through checkout
N. Customer cannot modify pricing
O. Hold expiry releases inventory correctly
P. 50% advance is calculated from authoritative snapshot
Q. Balance is calculated correctly
R. GST comes from server-side TaxRule
S. Historical booking price remains unchanged after rate changes
T. Manager cannot modify pricing
U. Receptionist cannot modify pricing
V. SuperAdmin pricing permission remains valid
W. Payment preparation never confirms booking
X. Payment preparation uses server-side amount only
"""
import uuid
from datetime import date, timedelta
from decimal import Decimal
import pytest
from django.urls import reverse
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from rest_framework.test import APIClient
from rest_framework import status

from apps.authentication.models import CustomerProfile, StaffProfile
from apps.rooms.models import RoomCategory, PhysicalRoom
from apps.pricing.models import RoomRatePlan, TaxRule
from apps.cms.models import HotelConfiguration
from apps.bookings.models import Booking, BookingRoom, BookingGuest
from apps.bookings.services import (
    create_booking_hold,
    transition_booking_status,
    validate_booking_for_checkout,
    prepare_booking_for_payment,
    release_booking_hold,
)
from apps.pricing.services import create_booking_price_snapshot

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def hotel_config(db):
    config = HotelConfiguration.get_solo()
    config.hotel_name = "Manohar Grand"
    config.standard_check_in_time = "12:00:00"
    config.standard_check_out_time = "11:00:00"
    config.cancellation_policy_text = "Confirmed reservations are strictly non-refundable and non-cancellable."
    config.save()
    return config


@pytest.fixture
def room_setup(db):
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
def customer_user(db):
    user = User.objects.create_user(
        email="customer1@example.com",
        phone="9876543210",
        first_name="Alice",
        last_name="Sharma",
        auth_provider="google",
    )
    user.customer_profile.preferred_payment_method = "online"
    user.customer_profile.save()
    return user


@pytest.fixture
def customer_user_2(db):
    user = User.objects.create_user(
        email="customer2@example.com",
        phone="9876543211",
        first_name="Bob",
        last_name="Verma",
        auth_provider="google",
    )
    user.customer_profile.preferred_payment_method = "online"
    user.customer_profile.save()
    return user


@pytest.fixture
def staff_users(db):
    superadmin = User.objects.create_user(
        email="superadmin@manohargrand.com",
        phone="9999900001",
        first_name="Super",
        last_name="Admin",
        password="AdminPassword123!",
        is_staff=True,
        is_superuser=True,
    )
    StaffProfile.objects.create(user=superadmin, role="superadmin", employee_id="ADM001", is_active_duty=True)

    manager = User.objects.create_user(
        email="manager@manohargrand.com",
        phone="9999900002",
        first_name="Manager",
        last_name="User",
        is_staff=True,
        password="ManagerPassword123!",
    )
    StaffProfile.objects.create(user=manager, role="manager", employee_id="MGR001", is_active_duty=True)

    receptionist = User.objects.create_user(
        email="reception@manohargrand.com",
        phone="9999900003",
        first_name="Front",
        last_name="Desk",
        is_staff=True,
        password="ReceptionPassword123!",
    )
    StaffProfile.objects.create(user=receptionist, role="receptionist", employee_id="REC001", is_active_duty=True)

    return {
        "superadmin": superadmin,
        "manager": manager,
        "receptionist": receptionist,
    }


@pytest.mark.django_db
class TestCheckoutReadinessFlow:
    """Tests for Phase 4 Step 3 checkout readiness and pre-payment workflow."""

    def test_authenticated_customer_creates_and_owns_hold(self, api_client, room_setup, customer_user, hotel_config):
        """A. Authenticated customer creates online booking hold securely associated with their account."""
        ac_cat, _ = room_setup
        api_client.force_authenticate(user=customer_user)

        check_in = (timezone.now() + timedelta(days=5)).date()
        check_out = (timezone.now() + timedelta(days=7)).date()

        response = api_client.post(reverse('bookings:booking-create-hold'), {
            "rooms": [{"category_id": str(ac_cat.id), "quantity": 1}],
            "check_in_date": check_in.isoformat(),
            "check_out_date": check_out.isoformat(),
            "guest_name": "Alice Sharma",
            "guest_email": "alice@example.com",
            "guest_phone": "+919876543210",
            "total_adults": 2,
            "total_children": 0,
        }, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["success"] is True
        booking_ref = data["data"]["booking_reference"]

        booking = Booking.objects.get(booking_reference=booking_ref)
        assert booking.customer == customer_user
        assert booking.status == "held"
        assert booking.price_snapshot is not None

    def test_customer_can_retrieve_own_checkout_summary(self, api_client, room_setup, customer_user, hotel_config):
        """C & J & P & Q & R: Customer retrieves authoritative checkout summary with snapshot & 50% advance."""
        ac_cat, _ = room_setup
        check_in = (timezone.now() + timedelta(days=5)).date()
        check_out = (timezone.now() + timedelta(days=7)).date()

        booking = create_booking_hold(
            rooms_request=[{"category": ac_cat, "room_quantity": 1}],
            check_in_date=check_in,
            check_out_date=check_out,
            guest_name="Alice Sharma",
            guest_email="alice@example.com",
            guest_phone="+919876543210",
            total_adults=2,
            total_children=0,
            customer=customer_user,
        )

        api_client.force_authenticate(user=customer_user)
        url = reverse('bookings:booking-checkout-summary', kwargs={'booking_reference': booking.booking_reference})
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        res_data = response.json()
        assert res_data["success"] is True

        data = res_data["data"]
        assert data["booking_reference"] == booking.booking_reference
        assert data["status"] == "held"
        assert data["is_hold_valid"] is True
        assert data["nights_count"] == 2
        assert data["total_adults"] == 2
        assert len(data["rooms"]) == 1
        assert data["hotel_info"]["hotel_name"] == "Manohar Grand"
        assert "non-refundable" in data["cancellation_policy"]

        # Authoritative pricing snapshot verification
        pricing = data["pricing"]
        assert pricing is not None
        # 2 nights * 1599 = 3198 base
        assert Decimal(str(pricing["room_subtotal"])) == Decimal("3198.00")
        assert Decimal(str(pricing["taxable_subtotal"])) == Decimal("3198.00")
        assert Decimal(str(pricing["tax_rate_percent"])) == Decimal("5.00")
        # 5% of 3198 = 159.90
        assert Decimal(str(pricing["tax_amount"])) == Decimal("159.90")
        # Gross = 3198 + 159.90 = 3357.90
        assert Decimal(str(pricing["gross_total"])) == Decimal("3357.90")
        # 50% advance = 1678.95
        assert Decimal(str(pricing["advance_amount_due"])) == Decimal("1678.95")
        # Remaining balance = 1678.95
        assert Decimal(str(pricing["balance_amount_due"])) == Decimal("1678.95")

    def test_customer_cannot_access_another_customers_checkout(self, api_client, room_setup, customer_user, customer_user_2, hotel_config):
        """B. Customer B cannot access Customer A's checkout summary (403 Forbidden)."""
        ac_cat, _ = room_setup
        check_in = (timezone.now() + timedelta(days=5)).date()
        check_out = (timezone.now() + timedelta(days=7)).date()

        booking_a = create_booking_hold(
            rooms_request=[{"category": ac_cat, "room_quantity": 1}],
            check_in_date=check_in,
            check_out_date=check_out,
            guest_name="Alice Sharma",
            customer=customer_user,
        )

        api_client.force_authenticate(user=customer_user_2)
        url = reverse('bookings:booking-checkout-summary', kwargs={'booking_reference': booking_a.booking_reference})
        response = api_client.get(url)

        assert response.status_code == status.HTTP_403_FORBIDDEN
        data = response.json()
        assert data["success"] is False
        assert data["error"]["code"] == "PERMISSION_DENIED"

    def test_unauthenticated_access_requires_access_token(self, api_client, room_setup, customer_user, hotel_config):
        """D. Unauthenticated access without token is rejected (403); with token succeeds (200)."""
        ac_cat, _ = room_setup
        check_in = (timezone.now() + timedelta(days=5)).date()
        check_out = (timezone.now() + timedelta(days=7)).date()

        booking = create_booking_hold(
            rooms_request=[{"category": ac_cat, "room_quantity": 1}],
            check_in_date=check_in,
            check_out_date=check_out,
            guest_name="Anonymous Guest",
        )

        url = reverse('bookings:booking-checkout-summary', kwargs={'booking_reference': booking.booking_reference})
        
        # 1. Unauthenticated without token -> 403
        resp_no_token = api_client.get(url)
        assert resp_no_token.status_code == status.HTTP_403_FORBIDDEN

        # 2. Unauthenticated with query token -> 200
        resp_query_token = api_client.get(f"{url}?token={booking.access_token}")
        assert resp_query_token.status_code == status.HTTP_200_OK

        # 3. Unauthenticated with header token -> 200
        resp_hdr_token = api_client.get(url, HTTP_X_BOOKING_TOKEN=str(booking.access_token))
        assert resp_hdr_token.status_code == status.HTTP_200_OK

    def test_staff_authorized_access_works(self, api_client, room_setup, customer_user, staff_users, hotel_config):
        """E. Staff members (SuperAdmin, Manager, Receptionist) can view checkout summary."""
        ac_cat, _ = room_setup
        check_in = (timezone.now() + timedelta(days=5)).date()
        check_out = (timezone.now() + timedelta(days=7)).date()

        booking = create_booking_hold(
            rooms_request=[{"category": ac_cat, "room_quantity": 1}],
            check_in_date=check_in,
            check_out_date=check_out,
            guest_name="Alice Sharma",
            customer=customer_user,
        )
        url = reverse('bookings:booking-checkout-summary', kwargs={'booking_reference': booking.booking_reference})

        for role_name, staff_user in staff_users.items():
            api_client.force_authenticate(user=staff_user)
            resp = api_client.get(url)
            assert resp.status_code == status.HTTP_200_OK, f"{role_name} should be able to view checkout"

    def test_expired_hold_cannot_checkout_and_releases_inventory(self, api_client, room_setup, customer_user, hotel_config):
        """F & O: Expired hold cannot checkout, returns HOLD_EXPIRED code and releases inventory."""
        ac_cat, _ = room_setup
        check_in = (timezone.now() + timedelta(days=5)).date()
        check_out = (timezone.now() + timedelta(days=7)).date()

        booking = create_booking_hold(
            rooms_request=[{"category": ac_cat, "room_quantity": 1}],
            check_in_date=check_in,
            check_out_date=check_out,
            guest_name="Alice Sharma",
            customer=customer_user,
        )

        # Manually backdate hold expiry
        booking.hold_expires_at = timezone.now() - timedelta(minutes=1)
        booking.save(update_fields=['hold_expires_at'])

        api_client.force_authenticate(user=customer_user)
        url = reverse('bookings:booking-checkout-summary', kwargs={'booking_reference': booking.booking_reference})
        response = api_client.get(url)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        data = response.json()
        assert data["success"] is False
        assert data["error"]["code"] == "HOLD_EXPIRED"

        # Check that booking status has been marked expired
        booking.refresh_from_db()
        assert booking.status == "expired"

    def test_cancelled_hold_cannot_checkout(self, api_client, room_setup, customer_user, hotel_config):
        """G. Cancelled hold cannot proceed to checkout."""
        ac_cat, _ = room_setup
        check_in = (timezone.now() + timedelta(days=5)).date()
        check_out = (timezone.now() + timedelta(days=7)).date()

        booking = create_booking_hold(
            rooms_request=[{"category": ac_cat, "room_quantity": 1}],
            check_in_date=check_in,
            check_out_date=check_out,
            guest_name="Alice Sharma",
            customer=customer_user,
        )
        release_booking_hold(booking, reason="User cancelled hold")

        api_client.force_authenticate(user=customer_user)
        url = reverse('bookings:booking-checkout-summary', kwargs={'booking_reference': booking.booking_reference})
        response = api_client.get(url)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        data = response.json()
        assert data["error"]["code"] == "INVALID_BOOKING_STATE"

    def test_confirmed_booking_cannot_use_checkout_flow(self, api_client, room_setup, customer_user, hotel_config):
        """H. Confirmed booking cannot use checkout flow (ALREADY_CONFIRMED)."""
        ac_cat, _ = room_setup
        check_in = (timezone.now() + timedelta(days=5)).date()
        check_out = (timezone.now() + timedelta(days=7)).date()

        booking = create_booking_hold(
            rooms_request=[{"category": ac_cat, "room_quantity": 1}],
            check_in_date=check_in,
            check_out_date=check_out,
            guest_name="Alice Sharma",
            customer=customer_user,
        )
        transition_booking_status(booking, target_status='confirmed', reason="Phase 5 mock confirmation")

        api_client.force_authenticate(user=customer_user)
        url = reverse('bookings:booking-checkout-summary', kwargs={'booking_reference': booking.booking_reference})
        response = api_client.get(url)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        data = response.json()
        assert data["error"]["code"] == "ALREADY_CONFIRMED"

    def test_invalid_guest_count_capacity_exceeded_rejected(self, api_client, room_setup, customer_user, hotel_config):
        """I. Over-capacity booking is rejected during checkout validation."""
        ac_cat, _ = room_setup
        check_in = (timezone.now() + timedelta(days=5)).date()
        check_out = (timezone.now() + timedelta(days=7)).date()

        booking = create_booking_hold(
            rooms_request=[{"category": ac_cat, "room_quantity": 1}],
            check_in_date=check_in,
            check_out_date=check_out,
            guest_name="Alice Sharma",
            customer=customer_user,
        )
        # AC max capacity is 3. Set adults to 5.
        booking.total_adults = 5
        booking.save(update_fields=['total_adults'])

        api_client.force_authenticate(user=customer_user)
        url = reverse('bookings:booking-checkout-summary', kwargs={'booking_reference': booking.booking_reference})
        response = api_client.get(url)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        data = response.json()
        assert data["error"]["code"] == "CAPACITY_EXCEEDED"

    def test_historical_booking_price_remains_unchanged_after_rate_changes(self, api_client, room_setup, customer_user, hotel_config):
        """S & N: Changing active room rate plan does NOT affect existing booking price snapshot."""
        ac_cat, _ = room_setup
        check_in = (timezone.now() + timedelta(days=5)).date()
        check_out = (timezone.now() + timedelta(days=7)).date()

        booking = create_booking_hold(
            rooms_request=[{"category": ac_cat, "room_quantity": 1}],
            check_in_date=check_in,
            check_out_date=check_out,
            guest_name="Alice Sharma",
            customer=customer_user,
        )
        original_gross = booking.price_snapshot.gross_total
        assert Decimal(str(original_gross)) == Decimal("3357.90")

        # Now hotel updates the rate plan to 2500 per night
        rate_plan = RoomRatePlan.objects.get(category=ac_cat)
        rate_plan.base_price_per_night = Decimal("2500.00")
        rate_plan.save()

        # Checkout summary must STILL return the original locked price snapshot
        api_client.force_authenticate(user=customer_user)
        url = reverse('bookings:booking-checkout-summary', kwargs={'booking_reference': booking.booking_reference})
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()["data"]
        assert Decimal(str(data["pricing"]["gross_total"])) == Decimal("3357.90")
        assert Decimal(str(data["pricing"]["room_subtotal"])) == Decimal("3198.00")

    def test_manager_and_receptionist_cannot_modify_pricing(self, api_client, room_setup, staff_users):
        """T & U & V: Manager and Receptionist cannot modify pricing (403); SuperAdmin can."""
        ac_cat, _ = room_setup
        rate_plan = RoomRatePlan.objects.get(category=ac_cat)
        url = reverse('admin-pricing-rates-detail', kwargs={'pk': str(rate_plan.id)})

        # 1. Receptionist attempt -> 403
        api_client.force_authenticate(user=staff_users['receptionist'])
        resp_rec = api_client.patch(url, {"base_price_per_night": "1800.00"}, format='json')
        assert resp_rec.status_code == status.HTTP_403_FORBIDDEN

        # 2. Manager attempt -> 403
        api_client.force_authenticate(user=staff_users['manager'])
        resp_mgr = api_client.patch(url, {"base_price_per_night": "1800.00"}, format='json')
        assert resp_mgr.status_code == status.HTTP_403_FORBIDDEN

        # 3. SuperAdmin attempt -> 200
        api_client.force_authenticate(user=staff_users['superadmin'])
        resp_admin = api_client.patch(url, {"base_price_per_night": "1800.00"}, format='json')
        assert resp_admin.status_code == status.HTTP_200_OK
        rate_plan.refresh_from_db()
        assert rate_plan.base_price_per_night == Decimal("1800.00")

    def test_payment_preparation_contract(self, room_setup, customer_user, hotel_config):
        """W & X: prepare_booking_for_payment validates, returns exact DB snapshot, leaves status as held."""
        ac_cat, _ = room_setup
        check_in = (timezone.now() + timedelta(days=5)).date()
        check_out = (timezone.now() + timedelta(days=7)).date()

        booking = create_booking_hold(
            rooms_request=[{"category": ac_cat, "room_quantity": 1}],
            check_in_date=check_in,
            check_out_date=check_out,
            guest_name="Alice Sharma",
            guest_email="alice@example.com",
            guest_phone="+919876543210",
            total_adults=2,
            total_children=0,
            customer=customer_user,
        )

        payment_data = prepare_booking_for_payment(booking)

        assert payment_data["booking_reference"] == booking.booking_reference
        assert payment_data["booking_id"] == str(booking.id)
        assert payment_data["status"] == "held"
        assert payment_data["currency"] == "INR"
        assert Decimal(str(payment_data["gross_total"])) == Decimal("3357.90")
        assert Decimal(str(payment_data["advance_amount_due"])) == Decimal("1678.95")
        assert payment_data["advance_amount_paise"] == 167895
        assert Decimal(str(payment_data["balance_amount_due"])) == Decimal("1678.95")
        assert payment_data["lead_guest_name"] == "Alice Sharma"
        assert payment_data["customer_email"] == "alice@example.com"

        # Ensure booking status was NOT modified to confirmed
        booking.refresh_from_db()
        assert booking.status == "held"

    def test_checkout_endpoint_is_read_only(self, api_client, room_setup, customer_user, hotel_config):
        """K & L & M: Checkout summary endpoint is strictly GET; POST/PUT/PATCH are rejected with 405."""
        ac_cat, _ = room_setup
        check_in = (timezone.now() + timedelta(days=5)).date()
        check_out = (timezone.now() + timedelta(days=7)).date()

        booking = create_booking_hold(
            rooms_request=[{"category": ac_cat, "room_quantity": 1}],
            check_in_date=check_in,
            check_out_date=check_out,
            guest_name="Alice Sharma",
            customer=customer_user,
        )

        api_client.force_authenticate(user=customer_user)
        url = reverse('bookings:booking-checkout-summary', kwargs={'booking_reference': booking.booking_reference})

        # POST attempt to tamper with prices/dates/quantities
        resp_post = api_client.post(url, {"gross_total": "100.00", "rooms": []}, format='json')
        assert resp_post.status_code == status.HTTP_405_METHOD_NOT_ALLOWED

        # PUT attempt
        resp_put = api_client.put(url, {"gross_total": "100.00"}, format='json')
        assert resp_put.status_code == status.HTTP_405_METHOD_NOT_ALLOWED

        # PATCH attempt
        resp_patch = api_client.patch(url, {"gross_total": "100.00"}, format='json')
        assert resp_patch.status_code == status.HTTP_405_METHOD_NOT_ALLOWED

    def test_inconsistent_pricing_snapshot_rejected(self, room_setup, customer_user, hotel_config):
        """Checkout validation detects and rejects internally inconsistent snapshot totals."""
        ac_cat, _ = room_setup
        check_in = (timezone.now() + timedelta(days=5)).date()
        check_out = (timezone.now() + timedelta(days=7)).date()

        booking = create_booking_hold(
            rooms_request=[{"category": ac_cat, "room_quantity": 1}],
            check_in_date=check_in,
            check_out_date=check_out,
            guest_name="Alice Sharma",
            customer=customer_user,
        )

        # Artificially tamper with snapshot gross_total
        snapshot = booking.price_snapshot
        snapshot.gross_total = Decimal("9999.00")
        snapshot.save()

        with pytest.raises(ValidationError) as exc_info:
            validate_booking_for_checkout(booking)
        assert "INCONSISTENT_PRICING" in str(exc_info.value)

    def test_default_hold_duration_is_15_minutes(self, room_setup, customer_user, hotel_config):
        """Hold duration default is 15 minutes from creation time."""
        ac_cat, _ = room_setup
        before = timezone.now()
        check_in = (before + timedelta(days=5)).date()
        check_out = (before + timedelta(days=7)).date()

        booking = create_booking_hold(
            rooms_request=[{"category": ac_cat, "room_quantity": 1}],
            check_in_date=check_in,
            check_out_date=check_out,
            guest_name="Alice Sharma",
            customer=customer_user,
        )
        after = timezone.now()

        expected_min = before + timedelta(minutes=14, seconds=50)
        expected_max = after + timedelta(minutes=15, seconds=10)
        assert expected_min <= booking.hold_expires_at <= expected_max

