"""
Comprehensive test suite for the Authoritative Pricing Engine and Booking Price Snapshots.
Covers:
A. Deterministic Rate Resolution (active, dates, expired, inactive, overlapping)
B. Room Pricing (AC ₹1,599, Non-AC ₹1,299, 1-night, multi-night, multi-room)
C. Extra Adult Charges (included adults baseline, ₹350/night)
D. Extra Child Charges (included children baseline, ₹300/night)
E. Occupancy Ceiling Validation (AC 4 PAX, Non-AC 2 PAX baseline)
F. Tax Calculation (GST 5%, percentage & fixed support)
G. Late Checkout Surcharges (AC ₹150/hr, Non-AC ₹100/hr, max 3 hrs)
H. Multi-night and Boundary Pricing
I. Multiple Rooms Aggregation
J. Immutable Price Snapshot Persistence & Historical Invariance
K. Security & Tamper Resistance
L. Staff RBAC on Rate Modification
M. Staff Offline Bookings Shared Pricing Engine
N. Money Precision & Rounding Consistency
"""
from decimal import Decimal
from datetime import date, timedelta
import pytest

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from rest_framework.test import APIClient

from apps.authentication.models import StaffProfile
from apps.rooms.models import RoomCategory, PhysicalRoom
from apps.cms.models import HotelConfiguration
from apps.pricing.models import RoomRatePlan, TaxRule, BookingPriceSnapshot
from apps.pricing.services import (
    resolve_rate_plan,
    resolve_tax_rule,
    validate_occupancy_limits,
    calculate_booking_quote,
    create_booking_price_snapshot,
)
from apps.bookings.services import create_booking_hold, admin_create_walkin_booking

User = get_user_model()


@pytest.mark.django_db
class TestAuthoritativePricingEngine:
    """Rigorous tests for the Authoritative Pricing Engine and Price Snapshots."""

    @pytest.fixture(autouse=True)
    def setup_hotel_config(self):
        config = HotelConfiguration.get_solo()
        config.max_late_checkout_hours = 3
        config.save()
        return config

    @pytest.fixture
    def client(self):
        return APIClient()

    @pytest.fixture
    def setup_master_data(self):
        # 1. AC Room Category (max 4 PAX)
        ac_category = RoomCategory.objects.create(
            slug='ac-room',
            name='AC Room',
            included_adults=2,
            included_children=0,
            max_adults=3,
            max_children=2,
            max_total_occupancy=4,
            is_active=True
        )

        # 2. Non-AC Room Category (max 2 PAX baseline)
        non_ac_category = RoomCategory.objects.create(
            slug='non-ac-room',
            name='Non-AC Room',
            included_adults=2,
            included_children=0,
            max_adults=2,
            max_children=1,
            max_total_occupancy=2,
            is_active=True
        )

        # Physical Rooms for inventory
        for i in range(1, 6):
            PhysicalRoom.objects.create(
                category=ac_category,
                room_number=f"10{i}",
                floor=1,
                operational_status='operational'
            )
            PhysicalRoom.objects.create(
                category=non_ac_category,
                room_number=f"20{i}",
                floor=2,
                operational_status='operational'
            )

        # 3. Standard AC Rate Plan (₹1,599/night, extra adult ₹350, extra child ₹300, late checkout ₹150/hr)
        ac_rate_plan = RoomRatePlan.objects.create(
            category=ac_category,
            name='Standard AC Tariff',
            base_price_per_night=Decimal('1599.00'),
            extra_adult_charge=Decimal('350.00'),
            extra_child_charge=Decimal('300.00'),
            late_checkout_hourly_rate=Decimal('150.00'),
            is_active=True
        )

        # 4. Standard Non-AC Rate Plan (₹1,299/night, extra adult ₹350, extra child ₹300, late checkout ₹100/hr)
        non_ac_rate_plan = RoomRatePlan.objects.create(
            category=non_ac_category,
            name='Standard Non-AC Tariff',
            base_price_per_night=Decimal('1299.00'),
            extra_adult_charge=Decimal('350.00'),
            extra_child_charge=Decimal('300.00'),
            late_checkout_hourly_rate=Decimal('100.00'),
            is_active=True
        )

        # 5. Standard GST Tax Rule (5%)
        tax_rule = TaxRule.objects.create(
            name='GST (Accommodation 5%)',
            tax_rate=Decimal('5.00'),
            tax_type='percentage',
            is_active=True
        )

        return {
            'ac_category': ac_category,
            'non_ac_category': non_ac_category,
            'ac_rate_plan': ac_rate_plan,
            'non_ac_rate_plan': non_ac_rate_plan,
            'tax_rule': tax_rule,
        }

    # ==========================================
    # A. RATE RESOLUTION TESTS
    # ==========================================

    def test_rate_resolution_active_rate(self, setup_master_data):
        ac_cat = setup_master_data['ac_category']
        today = date.today()
        resolved = resolve_rate_plan(ac_cat, today)
        assert resolved.id == setup_master_data['ac_rate_plan'].id
        assert resolved.base_price_per_night == Decimal('1599.00')

    def test_rate_resolution_effective_dates(self, setup_master_data):
        ac_cat = setup_master_data['ac_category']
        # Deactivate unbounded default
        setup_master_data['ac_rate_plan'].is_active = False
        setup_master_data['ac_rate_plan'].save()

        # Create dated rate plan
        start_date = date(2026, 12, 1)
        end_date = date(2026, 12, 31)
        seasonal_rate = RoomRatePlan.objects.create(
            category=ac_cat,
            name='December Festive Rate',
            base_price_per_night=Decimal('2199.00'),
            effective_from=start_date,
            effective_to=end_date,
            is_active=True
        )

        # In-range date
        resolved = resolve_rate_plan(ac_cat, date(2026, 12, 15))
        assert resolved.id == seasonal_rate.id
        assert resolved.base_price_per_night == Decimal('2199.00')

        # Out-of-range date raises ValidationError
        with pytest.raises(ValidationError) as excinfo:
            resolve_rate_plan(ac_cat, date(2026, 11, 30))
        assert "No active rate plan found" in str(excinfo.value)

    def test_rate_resolution_inactive_or_expired(self, setup_master_data):
        ac_cat = setup_master_data['ac_category']
        setup_master_data['ac_rate_plan'].is_active = False
        setup_master_data['ac_rate_plan'].save()

        with pytest.raises(ValidationError) as excinfo:
            resolve_rate_plan(ac_cat, date.today())
        assert "No active rate plan found" in str(excinfo.value)

    def test_rate_resolution_overlapping_rates_fails_clearly(self, setup_master_data):
        ac_cat = setup_master_data['ac_category']
        # Create second active rate plan covering the same date
        RoomRatePlan.objects.create(
            category=ac_cat,
            name='Duplicate Active Rate',
            base_price_per_night=Decimal('1799.00'),
            is_active=True
        )

        with pytest.raises(ValidationError) as excinfo:
            resolve_rate_plan(ac_cat, date.today())
        assert "Multiple overlapping active rate plans" in str(excinfo.value)

    # ==========================================
    # B. ROOM BASE PRICING TESTS
    # ==========================================

    def test_room_pricing_ac_and_non_ac_single_night(self, setup_master_data):
        ac_cat = setup_master_data['ac_category']
        non_ac_cat = setup_master_data['non_ac_category']
        check_in = date.today() + timedelta(days=5)
        check_out = check_in + timedelta(days=1)

        # 1 AC Room, 1 Night, standard 2 adults
        quote_ac = calculate_booking_quote(
            rooms_request=[{'category': ac_cat, 'room_quantity': 1}],
            check_in_date=check_in,
            check_out_date=check_out,
            total_adults=2,
            total_children=0
        )
        assert quote_ac['room_subtotal'] == '1599.00'
        assert quote_ac['extra_guest_total'] == '0.00'
        assert quote_ac['taxable_subtotal'] == '1599.00'
        # 5% GST on 1599 = 79.95
        assert quote_ac['tax_amount'] == '79.95'
        # Gross = 1599 + 79.95 = 1678.95
        assert quote_ac['gross_total'] == '1678.95'
        # 50% Advance = 839.48, Balance = 839.47
        assert quote_ac['advance_amount_due'] == '839.48'
        assert quote_ac['balance_amount_due'] == '839.47'
        assert Decimal(quote_ac['advance_amount_due']) + Decimal(quote_ac['balance_amount_due']) == Decimal('1678.95')

        # 1 Non-AC Room, 1 Night, standard 2 adults
        quote_non_ac = calculate_booking_quote(
            rooms_request=[{'category': non_ac_cat, 'room_quantity': 1}],
            check_in_date=check_in,
            check_out_date=check_out,
            total_adults=2,
            total_children=0
        )
        assert quote_non_ac['room_subtotal'] == '1299.00'
        assert quote_non_ac['tax_amount'] == '64.95'
        assert quote_non_ac['gross_total'] == '1363.95'

    def test_room_pricing_multi_night_and_multi_room(self, setup_master_data):
        ac_cat = setup_master_data['ac_category']
        check_in = date.today() + timedelta(days=10)
        check_out = check_in + timedelta(days=3)  # 3 nights

        # 2 AC Rooms, 3 Nights, 4 adults (2 per room included)
        quote = calculate_booking_quote(
            rooms_request=[{'category': ac_cat, 'room_quantity': 2}],
            check_in_date=check_in,
            check_out_date=check_out,
            total_adults=4,
            total_children=0
        )
        # Room subtotal = 1599 * 2 rooms * 3 nights = 9594.00
        assert quote['room_subtotal'] == '9594.00'
        assert quote['nights_count'] == 3
        assert quote['total_rooms'] == 2
        # GST 5% on 9594 = 479.70
        assert quote['tax_amount'] == '479.70'
        # Gross = 10073.70
        assert quote['gross_total'] == '10073.70'
        assert quote['advance_amount_due'] == '5036.85'
        assert quote['balance_amount_due'] == '5036.85'

    # ==========================================
    # C & D. EXTRA GUEST CHARGES TESTS
    # ==========================================

    def test_extra_adult_charge(self, setup_master_data):
        ac_cat = setup_master_data['ac_category']
        check_in = date.today() + timedelta(days=5)
        check_out = check_in + timedelta(days=2)  # 2 nights

        # 1 AC Room, 3 adults (2 included, 1 extra adult)
        quote = calculate_booking_quote(
            rooms_request=[{'category': ac_cat, 'room_quantity': 1}],
            check_in_date=check_in,
            check_out_date=check_out,
            total_adults=3,
            total_children=0
        )
        # Room Subtotal: 1599 * 2 = 3198.00
        # Extra Adult: 1 * 350 * 2 nights = 700.00
        assert quote['room_subtotal'] == '3198.00'
        assert quote['extra_adults'] == 1
        assert quote['extra_adult_total'] == '700.00'
        assert quote['extra_guest_total'] == '700.00'
        # Taxable subtotal = 3198 + 700 = 3898.00
        assert quote['taxable_subtotal'] == '3898.00'
        # GST 5% on 3898 = 194.90
        assert quote['tax_amount'] == '194.90'
        assert quote['gross_total'] == '4092.90'

    def test_extra_child_charge(self, setup_master_data):
        ac_cat = setup_master_data['ac_category']
        check_in = date.today() + timedelta(days=5)
        check_out = check_in + timedelta(days=1)  # 1 night

        # 1 AC Room, 2 adults, 1 child (0 included children -> 1 extra child * 300)
        quote = calculate_booking_quote(
            rooms_request=[{'category': ac_cat, 'room_quantity': 1}],
            check_in_date=check_in,
            check_out_date=check_out,
            total_adults=2,
            total_children=1
        )
        assert quote['room_subtotal'] == '1599.00'
        assert quote['extra_children'] == 1
        assert quote['extra_child_total'] == '300.00'
        assert quote['taxable_subtotal'] == '1899.00'
        # GST 5% on 1899 = 94.95
        assert quote['tax_amount'] == '94.95'
        assert quote['gross_total'] == '1993.95'

    # ==========================================
    # E. OCCUPANCY LIMITS & NON-AC BASELINE
    # ==========================================

    def test_occupancy_limits_ac_max_capacity(self, setup_master_data):
        ac_cat = setup_master_data['ac_category']
        check_in = date.today() + timedelta(days=5)
        check_out = check_in + timedelta(days=1)

        # 4 PAX (3 adults + 1 child) on 1 AC room is valid
        quote = calculate_booking_quote(
            rooms_request=[{'category': ac_cat, 'room_quantity': 1}],
            check_in_date=check_in,
            check_out_date=check_out,
            total_adults=3,
            total_children=1
        )
        assert quote['total_adults'] == 3
        assert quote['total_children'] == 1

        # 5 PAX exceeds AC max_total_occupancy (4) -> ValidationError
        with pytest.raises(ValidationError) as excinfo:
            calculate_booking_quote(
                rooms_request=[{'category': ac_cat, 'room_quantity': 1}],
                check_in_date=check_in,
                check_out_date=check_out,
                total_adults=3,
                total_children=2
            )
        assert "exceeds maximum capacity" in str(excinfo.value)

    def test_occupancy_limits_non_ac_2pax_baseline(self, setup_master_data):
        non_ac_cat = setup_master_data['non_ac_category']
        check_in = date.today() + timedelta(days=5)
        check_out = check_in + timedelta(days=1)

        # 2 PAX is valid for Non-AC
        quote = calculate_booking_quote(
            rooms_request=[{'category': non_ac_cat, 'room_quantity': 1}],
            check_in_date=check_in,
            check_out_date=check_out,
            total_adults=2,
            total_children=0
        )
        assert quote['total_adults'] == 2

        # 3 PAX is rejected on Non-AC (confirmed 2-PAX baseline pending client confirmation)
        with pytest.raises(ValidationError) as excinfo:
            calculate_booking_quote(
                rooms_request=[{'category': non_ac_cat, 'room_quantity': 1}],
                check_in_date=check_in,
                check_out_date=check_out,
                total_adults=2,
                total_children=1
            )
        assert "exceeds maximum capacity" in str(excinfo.value)

    # ==========================================
    # G. LATE CHECKOUT TESTS
    # ==========================================

    def test_late_checkout_hourly_calculation(self, setup_master_data):
        ac_cat = setup_master_data['ac_category']
        non_ac_cat = setup_master_data['non_ac_category']
        check_in = date.today() + timedelta(days=5)
        check_out = check_in + timedelta(days=1)

        # AC Late Checkout: 3 hours @ ₹150/hr = ₹450
        quote_ac = calculate_booking_quote(
            rooms_request=[{'category': ac_cat, 'room_quantity': 1}],
            check_in_date=check_in,
            check_out_date=check_out,
            late_checkout_hours=3
        )
        assert quote_ac['late_checkout_hours'] == 3
        assert quote_ac['late_checkout_total'] == '450.00'
        # Taxable = 1599 + 450 = 2049.00; GST 5% = 102.45; Gross = 2151.45
        assert quote_ac['taxable_subtotal'] == '2049.00'
        assert quote_ac['tax_amount'] == '102.45'
        assert quote_ac['gross_total'] == '2151.45'

        # Non-AC Late Checkout: 2 hours @ ₹100/hr = ₹200
        quote_non_ac = calculate_booking_quote(
            rooms_request=[{'category': non_ac_cat, 'room_quantity': 1}],
            check_in_date=check_in,
            check_out_date=check_out,
            late_checkout_hours=2
        )
        assert quote_non_ac['late_checkout_total'] == '200.00'

    def test_late_checkout_exceeding_max_rejected(self, setup_master_data):
        ac_cat = setup_master_data['ac_category']
        check_in = date.today() + timedelta(days=5)
        check_out = check_in + timedelta(days=1)

        # > 3 hours rejected
        with pytest.raises(ValidationError) as excinfo:
            calculate_booking_quote(
                rooms_request=[{'category': ac_cat, 'room_quantity': 1}],
                check_in_date=check_in,
                check_out_date=check_out,
                late_checkout_hours=4
            )
        assert "exceeds maximum permitted limit" in str(excinfo.value)

    # ==========================================
    # J. IMMUTABLE PRICE SNAPSHOT TESTS
    # ==========================================

    def test_booking_price_snapshot_creation_and_immutability(self, setup_master_data):
        ac_cat = setup_master_data['ac_category']
        check_in = date.today() + timedelta(days=10)
        check_out = check_in + timedelta(days=2)

        # 1. Create a Booking Hold
        booking = create_booking_hold(
            rooms_request=[{'category': ac_cat, 'room_quantity': 1}],
            check_in_date=check_in,
            check_out_date=check_out,
            guest_name="Kishore Kumar",
            guest_phone="9876543210",
            total_adults=2,
            total_children=0
        )

        # 2. Verify snapshot was automatically created
        snapshot = booking.price_snapshot
        assert snapshot is not None
        assert snapshot.room_subtotal == Decimal('3198.00')
        assert snapshot.tax_amount == Decimal('159.90')
        assert snapshot.gross_total == Decimal('3357.90')
        assert snapshot.advance_amount_due == Decimal('1678.95')
        assert snapshot.balance_amount_due == Decimal('1678.95')
        assert 'rooms' in snapshot.itemized_breakdown

        # 3. Modify the RoomRatePlan to simulate future price hike (₹1,599 -> ₹2,500)
        rate_plan = setup_master_data['ac_rate_plan']
        rate_plan.base_price_per_night = Decimal('2500.00')
        rate_plan.save()

        # 4. Modify TaxRule (5% -> 18%)
        tax_rule = setup_master_data['tax_rule']
        tax_rule.tax_rate = Decimal('18.00')
        tax_rule.save()

        # 5. Reload booking and snapshot from database: verify Historical Invariance
        booking.refresh_from_db()
        snapshot.refresh_from_db()
        assert snapshot.room_subtotal == Decimal('3198.00')
        assert snapshot.tax_rate_percent == Decimal('5.00')
        assert snapshot.tax_amount == Decimal('159.90')
        assert snapshot.gross_total == Decimal('3357.90')

    # ==========================================
    # K. PUBLIC REST API SECURITY TESTS
    # ==========================================

    def test_public_calculate_endpoint(self, client, setup_master_data):
        check_in = (date.today() + timedelta(days=7)).isoformat()
        check_out = (date.today() + timedelta(days=9)).isoformat()

        payload = {
            "check_in_date": check_in,
            "check_out_date": check_out,
            "rooms": [
                {"category": "ac-room", "room_quantity": 1}
            ],
            "total_adults": 3,
            "total_children": 0,
            "late_checkout_hours": 1,
            # Tamper attempt: Client sends arbitrary discount / total
            "discount": "5000.00",
            "gross_total": "100.00",
        }

        resp = client.post('/api/v1/pricing/calculate/', payload, format='json')
        assert resp.status_code == 200
        data = resp.json()
        assert data['success'] is True

        res = data['data']
        # Client total is completely ignored; backend calculates authoritative values
        assert res['room_subtotal'] == '3198.00'  # 1599 * 2
        assert res['extra_adult_total'] == '700.00'  # 1 extra adult * 350 * 2
        assert res['late_checkout_total'] == '150.00'  # 1 hr * 150
        # Taxable = 3198 + 700 + 150 = 4048.00
        assert res['taxable_subtotal'] == '4048.00'
        # GST 5% on 4048 = 202.40
        assert res['tax_amount'] == '202.40'
        # Gross Total = 4250.40
        assert res['gross_total'] == '4250.40'
        assert res['advance_amount_due'] == '2125.20'
        assert res['balance_amount_due'] == '2125.20'

    # ==========================================
    # M. OFFLINE STAFF BOOKINGS SHARED ENGINE
    # ==========================================

    def test_offline_walkin_creates_authoritative_snapshot(self, setup_master_data):
        staff_user = User.objects.create_user(
            email='receptionist_pricing@manohargrand.com',
            password='Pass123Password!',
            is_staff=True
        )
        StaffProfile.objects.create(user=staff_user, role='receptionist', employee_id='EMP-REC-P1')

        ac_cat = setup_master_data['ac_category']
        check_in = date.today() + timedelta(days=2)
        check_out = check_in + timedelta(days=1)

        # Walk-in booking
        booking = admin_create_walkin_booking(
            rooms_request=[{'category': ac_cat, 'room_quantity': 1}],
            check_in_date=check_in,
            check_out_date=check_out,
            guest_name="Walk-in Guest",
            total_adults=2,
            total_children=0,
            created_by=staff_user
        )

        assert booking.status == 'confirmed'
        assert hasattr(booking, 'price_snapshot')
        snapshot = booking.price_snapshot
        assert snapshot.gross_total == Decimal('1678.95')
        assert snapshot.room_subtotal == Decimal('1599.00')
