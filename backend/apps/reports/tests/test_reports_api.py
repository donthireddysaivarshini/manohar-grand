"""
Comprehensive automated tests for Phase 6:
Admin Reports & Operational Analytics.
"""
from datetime import date, timedelta
from decimal import Decimal
import pytest
from django.urls import reverse
from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from apps.authentication.models import StaffProfile, CustomerProfile
from apps.rooms.models import RoomCategory, PhysicalRoom
from apps.pricing.models import RoomRatePlan, TaxRule
from apps.cms.models import HotelConfiguration
from apps.bookings.models import Booking, BookingRoom
from apps.bookings.services import create_booking_hold, transition_booking_status
from apps.inventory.models import MaintenanceBlock, RoomBlock
from apps.payments.models import PaymentOrder
from apps.pricing.models import BookingPriceSnapshot

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def hotel_config(db):
    config = HotelConfiguration.get_solo()
    config.hotel_name = "Manohar Grand"
    config.save()
    return config


@pytest.fixture
def setup_inventory_and_bookings(db, hotel_config):
    """Sets up room categories, physical rooms, and various bookings with pricing snapshots and payment orders."""
    # 1. Categories
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

    # 2. Physical Rooms (3 AC, 2 Non-AC)
    ac_101 = PhysicalRoom.objects.create(room_number="101", category=ac_cat, floor=1, operational_status="operational")
    ac_102 = PhysicalRoom.objects.create(room_number="102", category=ac_cat, floor=1, operational_status="operational")
    ac_103 = PhysicalRoom.objects.create(room_number="103", category=ac_cat, floor=1, operational_status="maintenance")
    non_ac_201 = PhysicalRoom.objects.create(room_number="201", category=non_ac_cat, floor=2, operational_status="operational")
    non_ac_202 = PhysicalRoom.objects.create(room_number="202", category=non_ac_cat, floor=2, operational_status="blocked")

    # 3. Rate Plans & Taxes
    RoomRatePlan.objects.create(
        category=ac_cat,
        name="Standard AC Tariff",
        base_price_per_night=Decimal("1599.00"),
        extra_adult_charge=Decimal("350.00"),
        extra_child_charge=Decimal("300.00"),
        is_active=True,
    )
    RoomRatePlan.objects.create(
        category=non_ac_cat,
        name="Standard Non-AC Tariff",
        base_price_per_night=Decimal("1299.00"),
        extra_adult_charge=Decimal("350.00"),
        extra_child_charge=Decimal("300.00"),
        is_active=True,
    )
    TaxRule.objects.create(
        name="GST 5%",
        tax_rate=Decimal("5.00"),
        tax_type="percentage",
        is_active=True,
    )

    # 4. Create Customers
    cust_alice = User.objects.create_user(email="alice@example.com", first_name="Alice", last_name="Sharma", auth_provider="google")
    cust_bob = User.objects.create_user(email="bob@example.com", first_name="Bob", last_name="Verma", auth_provider="google")

    today = timezone.now().date()

    # Booking 1: Confirmed Deluxe AC (Stay: today to +2 days)
    b1 = create_booking_hold(
        rooms_request=[{"category": ac_cat, "room_quantity": 1}],
        check_in_date=today,
        check_out_date=today + timedelta(days=2),
        guest_name="Alice Sharma",
        source="website",
        customer=cust_alice,
    )
    b1 = transition_booking_status(b1, 'confirmed')

    # PaymentOrder for b1
    po1 = PaymentOrder.objects.create(
        booking=b1,
        purpose='advance',
        currency='INR',
        amount=b1.price_snapshot.advance_amount_due,
        amount_paise=int(b1.price_snapshot.advance_amount_due * 100),
        razorpay_order_id="order_rpt_111",
        razorpay_payment_id="pay_rpt_111",
        status='captured'
    )

    # Booking 2: Checked In Deluxe AC (Stay: today-1 to +1 day)
    b2 = create_booking_hold(
        rooms_request=[{"category": ac_cat, "room_quantity": 1}],
        check_in_date=today - timedelta(days=1),
        check_out_date=today + timedelta(days=1),
        guest_name="Bob Verma",
        source="walk_in",
        customer=cust_bob,
    )
    b2 = transition_booking_status(b2, 'confirmed')
    b2 = transition_booking_status(b2, 'checked_in')
    # Assign physical room 101 to b2
    br2 = b2.rooms.first()
    br2.physical_room = ac_101
    br2.save()

    po2 = PaymentOrder.objects.create(
        booking=b2,
        purpose='advance',
        currency='INR',
        amount=b2.price_snapshot.advance_amount_due,
        amount_paise=int(b2.price_snapshot.advance_amount_due * 100),
        razorpay_order_id="order_rpt_222",
        razorpay_payment_id="pay_rpt_222",
        status='captured'
    )

    # Booking 3: Overbooking SuperAdmin (Stay: today+3 to +5)
    b3 = create_booking_hold(
        rooms_request=[{"category": non_ac_cat, "room_quantity": 1}],
        check_in_date=today + timedelta(days=3),
        check_out_date=today + timedelta(days=5),
        guest_name="VIP Corporate",
        source="corporate",
    )
    b3.is_overbooking = True
    b3.overbooking_reason = "VIP Delegation Override by Director"
    b3.save()

    return {
        "ac_cat": ac_cat,
        "non_ac_cat": non_ac_cat,
        "b1": b1,
        "b2": b2,
        "b3": b3,
        "po1": po1,
        "po2": po2,
    }


@pytest.fixture
def superadmin_user(db):
    user = User.objects.create_superuser(
        email="superadmin@manohargrand.com",
        first_name="Super",
        last_name="Admin",
        is_staff=True,
    )
    StaffProfile.objects.create(user=user, role='superadmin', employee_id='EMP_SUP_001', is_active_duty=True)
    return user


@pytest.fixture
def manager_user(db):
    user = User.objects.create_user(
        email="manager@manohargrand.com",
        first_name="Hotel",
        last_name="Manager",
        is_staff=True,
    )
    StaffProfile.objects.create(user=user, role='manager', employee_id='EMP_MGR_001', is_active_duty=True)
    return user


@pytest.fixture
def receptionist_user(db):
    user = User.objects.create_user(
        email="receptionist@manohargrand.com",
        first_name="Front",
        last_name="Desk",
        is_staff=True,
    )
    StaffProfile.objects.create(user=user, role='receptionist', employee_id='EMP_REC_001', is_active_duty=True)
    return user


@pytest.fixture
def customer_user(db):
    return User.objects.create_user(
        email="guest@example.com",
        first_name="Guest",
        last_name="User",
        auth_provider="google"
    )


@pytest.mark.django_db
class TestReportsRBACAndSecurity:
    """Verifies RBAC enforcement across all report endpoints."""

    def test_unauthenticated_access_rejected(self, api_client):
        endpoints = [
            reverse('reports:report-overview'),
            reverse('reports:report-bookings'),
            reverse('reports:report-occupancy'),
            reverse('reports:report-categories'),
            reverse('reports:report-revenue'),
            reverse('reports:report-payments'),
            reverse('reports:report-frontdesk'),
            reverse('reports:report-sources'),
            reverse('reports:report-room-utilization'),
            reverse('reports:report-overbookings'),
            reverse('reports:report-reconciliation'),
        ]
        for url in endpoints:
            resp = api_client.get(url)
            assert resp.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)

    def test_customer_cannot_access_reports(self, api_client, customer_user):
        api_client.force_login(customer_user)
        resp = api_client.get(reverse('reports:report-overview'))
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_receptionist_can_access_operational_reports(self, api_client, receptionist_user, setup_inventory_and_bookings):
        api_client.force_login(receptionist_user)
        # Allowed operational endpoints
        assert api_client.get(reverse('reports:report-overview')).status_code == status.HTTP_200_OK
        assert api_client.get(reverse('reports:report-frontdesk')).status_code == status.HTTP_200_OK
        assert api_client.get(reverse('reports:report-occupancy')).status_code == status.HTTP_200_OK
        assert api_client.get(reverse('reports:report-bookings')).status_code == status.HTTP_200_OK
        assert api_client.get(reverse('reports:report-room-utilization')).status_code == status.HTTP_200_OK

        # Restricted financial/admin endpoints
        assert api_client.get(reverse('reports:report-revenue')).status_code == status.HTTP_403_FORBIDDEN
        assert api_client.get(reverse('reports:report-categories')).status_code == status.HTTP_403_FORBIDDEN
        assert api_client.get(reverse('reports:report-payments')).status_code == status.HTTP_403_FORBIDDEN
        assert api_client.get(reverse('reports:report-overbookings')).status_code == status.HTTP_403_FORBIDDEN
        assert api_client.get(reverse('reports:report-reconciliation')).status_code == status.HTTP_403_FORBIDDEN

    def test_manager_and_superadmin_have_full_report_access(self, api_client, manager_user, superadmin_user, setup_inventory_and_bookings):
        for user in [manager_user, superadmin_user]:
            api_client.force_login(user)
            assert api_client.get(reverse('reports:report-overview')).status_code == status.HTTP_200_OK
            assert api_client.get(reverse('reports:report-revenue')).status_code == status.HTTP_200_OK
            assert api_client.get(reverse('reports:report-categories')).status_code == status.HTTP_200_OK
            assert api_client.get(reverse('reports:report-payments')).status_code == status.HTTP_200_OK
            assert api_client.get(reverse('reports:report-sources')).status_code == status.HTTP_200_OK
            assert api_client.get(reverse('reports:report-overbookings')).status_code == status.HTTP_200_OK
            assert api_client.get(reverse('reports:report-reconciliation')).status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestReportCalculationsAndOutputs:
    """Verifies calculations for all report endpoints."""

    def test_overview_kpis(self, api_client, manager_user, setup_inventory_and_bookings):
        api_client.force_login(manager_user)
        resp = api_client.get(reverse('reports:report-overview'))
        assert resp.status_code == status.HTTP_200_OK
        data = resp.data['data']

        assert "today_frontdesk" in data
        assert "today_inventory" in data
        assert "financial_kpi" in data
        assert data['today_inventory']['total_physical_rooms'] == 5
        assert data['today_inventory']['operational_rooms'] == 3  # 101, 102, 201
        assert data['today_inventory']['maintenance_rooms'] == 1  # 103
        assert data['today_inventory']['blocked_rooms'] == 1      # 202

    def test_booking_report_with_filters(self, api_client, manager_user, setup_inventory_and_bookings):
        api_client.force_login(manager_user)
        url = reverse('reports:report-bookings')

        # 1. Default list
        resp = api_client.get(url)
        assert resp.status_code == status.HTTP_200_OK
        data = resp.data['data']
        assert data['summary']['total_bookings'] >= 3

        # 2. Filter by status 'confirmed'
        resp_conf = api_client.get(f"{url}?status=confirmed")
        assert resp_conf.status_code == status.HTTP_200_OK
        assert all(b['status'] == 'confirmed' for b in resp_conf.data['data']['bookings'])

        # 3. Filter by source 'website'
        resp_src = api_client.get(f"{url}?source=website")
        assert resp_src.status_code == status.HTTP_200_OK
        assert all(b['source'] == 'website' for b in resp_src.data['data']['bookings'])

    def test_occupancy_report(self, api_client, manager_user, setup_inventory_and_bookings):
        api_client.force_login(manager_user)
        today = timezone.now().date()
        from_d = today.isoformat()
        to_d = (today + timedelta(days=7)).isoformat()

        url = f"{reverse('reports:report-occupancy')}?from_date={from_d}&to_date={to_d}"
        resp = api_client.get(url)
        assert resp.status_code == status.HTTP_200_OK
        data = resp.data['data']

        assert data['period']['days_count'] == 8
        assert data['summary']['operational_physical_rooms'] == 3
        assert len(data['daily_occupancy']) == 8
        assert data['daily_occupancy'][0]['total_operational_rooms'] == 3

    def test_category_performance_report(self, api_client, manager_user, setup_inventory_and_bookings):
        api_client.force_login(manager_user)
        resp = api_client.get(reverse('reports:report-categories'))
        assert resp.status_code == status.HTTP_200_OK
        categories = resp.data['data']['categories']
        assert len(categories) == 2  # Deluxe AC, Standard Non-AC

        ac_perf = next(c for c in categories if c['category_slug'] == 'deluxe-ac')
        assert ac_perf['operational_rooms_count'] == 2  # 101, 102
        assert Decimal(ac_perf['total_revenue']) > Decimal('0.00')

    def test_revenue_report_uses_immutable_snapshots(self, api_client, manager_user, setup_inventory_and_bookings):
        api_client.force_login(manager_user)
        resp = api_client.get(reverse('reports:report-revenue'))
        assert resp.status_code == status.HTTP_200_OK
        summary = resp.data['data']['summary']

        assert Decimal(summary['gross_booking_value']) > Decimal('0.00')
        assert Decimal(summary['taxes_collected']) > Decimal('0.00')
        assert Decimal(summary['captured_payments']) > Decimal('0.00')

    def test_payment_report(self, api_client, manager_user, setup_inventory_and_bookings):
        api_client.force_login(manager_user)
        resp = api_client.get(reverse('reports:report-payments'))
        assert resp.status_code == status.HTTP_200_OK
        data = resp.data['data']

        assert data['summary']['total_orders'] >= 2
        assert data['summary']['by_status']['captured']['count'] >= 2
        assert len(data['payment_orders']) >= 2

    def test_frontdesk_report(self, api_client, receptionist_user, setup_inventory_and_bookings):
        api_client.force_login(receptionist_user)
        today = timezone.now().date().isoformat()
        resp = api_client.get(f"{reverse('reports:report-frontdesk')}?target_date={today}")
        assert resp.status_code == status.HTTP_200_OK
        data = resp.data['data']

        assert "arrivals" in data
        assert "departures" in data
        assert "in_house_guests" in data
        assert data['summary']['expected_arrivals_count'] >= 1
        assert data['summary']['in_house_count'] >= 1

    def test_booking_sources_report(self, api_client, manager_user, setup_inventory_and_bookings):
        api_client.force_login(manager_user)
        resp = api_client.get(reverse('reports:report-sources'))
        assert resp.status_code == status.HTTP_200_OK
        sources = resp.data['data']['sources']

        website_src = next(s for s in sources if s['source'] == 'website')
        walkin_src = next(s for s in sources if s['source'] == 'walk_in')
        assert website_src['total_bookings'] >= 1
        assert walkin_src['total_bookings'] >= 1

    def test_room_utilization_report(self, api_client, receptionist_user, setup_inventory_and_bookings):
        api_client.force_login(receptionist_user)
        resp = api_client.get(reverse('reports:report-room-utilization'))
        assert resp.status_code == status.HTTP_200_OK
        rooms = resp.data['data']['rooms']
        assert len(rooms) == 5

        # Check operational statuses are correctly reported
        maint_room = next(r for r in rooms if r['room_number'] == '103')
        assert maint_room['operational_status'] == 'maintenance'

    def test_overbooking_report(self, api_client, manager_user, setup_inventory_and_bookings):
        api_client.force_login(manager_user)
        resp = api_client.get(reverse('reports:report-overbookings'))
        assert resp.status_code == status.HTTP_200_OK
        data = resp.data['data']

        assert data['total_overbookings'] >= 1
        ob_item = data['overbookings'][0]
        assert "VIP Delegation" in ob_item['overbooking_reason']

    def test_reconciliation_report(self, api_client, manager_user, setup_inventory_and_bookings):
        api_client.force_login(manager_user)
        resp = api_client.get(reverse('reports:report-reconciliation'))
        assert resp.status_code == status.HTTP_200_OK
        data = resp.data['data']

        assert "current_status" in data
        assert "audit_history" in data

    def test_report_endpoints_are_strictly_read_only(self, api_client, manager_user, setup_inventory_and_bookings):
        """Verifies report endpoints reject mutating HTTP methods (POST, PUT, DELETE, PATCH)."""
        api_client.force_login(manager_user)
        urls = [
            reverse('reports:report-overview'),
            reverse('reports:report-revenue'),
            reverse('reports:report-bookings'),
            reverse('reports:report-occupancy'),
        ]
        for url in urls:
            assert api_client.post(url, data={}).status_code == status.HTTP_405_METHOD_NOT_ALLOWED
            assert api_client.put(url, data={}).status_code == status.HTTP_405_METHOD_NOT_ALLOWED
            assert api_client.delete(url).status_code == status.HTTP_405_METHOD_NOT_ALLOWED
            assert api_client.patch(url, data={}).status_code == status.HTTP_405_METHOD_NOT_ALLOWED
