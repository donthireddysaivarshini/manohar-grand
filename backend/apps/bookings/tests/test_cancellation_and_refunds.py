"""
Unit and integration tests for the Room Cancellation & Refund Request Lifecycle.
Verifies policy calculation (>= 2 days: 50% refund, < 2 days: 0% refund),
customer preview and request submission, staff admin decision handling, and state transitions.
"""
from datetime import date, timedelta
from decimal import Decimal
import pytest
from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient

from apps.authentication.models import StaffProfile
from apps.rooms.models import RoomCategory, PhysicalRoom
from apps.pricing.models import RoomRatePlan, TaxRule, BookingPriceSnapshot
from apps.pricing.services import create_booking_price_snapshot
from apps.bookings.models import Booking, BookingRoom
from apps.bookings.services import (
    calculate_cancellation_refund,
    request_booking_cancellation,
    process_booking_cancellation_decision,
)
from apps.payments.models import PaymentOrder

User = get_user_model()


@pytest.fixture
def cancellation_fixture(db):
    # Customer
    customer = User.objects.create_user(
        email='guest@example.com',
        phone='9876543210',
        first_name='Sai',
        last_name='Varshini',
        password='Password@123'
    )

    # Manager
    manager = User.objects.create_user(
        email='manager@manohargrand.com',
        phone='9998887771',
        first_name='Manager',
        is_staff=True,
        password='Password@123'
    )
    StaffProfile.objects.create(user=manager, role='manager', employee_id='MGR01', is_active_duty=True)

    # Room Category
    category = RoomCategory.objects.create(
        name='Executive King Suite',
        slug='executive-king-suite',
        included_adults=2,
        included_children=0,
        max_adults=2,
        max_children=1,
        max_total_occupancy=3,
        is_active=True
    )
    RoomRatePlan.objects.create(
        category=category,
        name='Standard Tariff',
        base_price_per_night=Decimal('3000.00'),
        extra_adult_charge=Decimal('500.00'),
        extra_child_charge=Decimal('300.00'),
        is_active=True
    )
    TaxRule.objects.get_or_create(
        name='GST Slab',
        defaults={'tax_rate': Decimal('12.00'), 'tax_type': 'percentage', 'is_active': True}
    )

    return {
        'customer': customer,
        'manager': manager,
        'category': category,
    }


@pytest.mark.django_db
class TestCancellationAndRefundPolicy:

    def test_cancellation_eligible_for_50_percent_refund_when_two_or_more_days_prior(self, cancellation_fixture):
        today = timezone.now().date()
        check_in = today + timedelta(days=3)  # 3 days ahead >= 2 days
        check_out = today + timedelta(days=5)

        booking = Booking.objects.create(
            booking_reference='MG-2026-TEST1',
            customer=cancellation_fixture['customer'],
            guest_name='Sai Varshini',
            check_in_date=check_in,
            check_out_date=check_out,
            status='confirmed',
            total_adults=2,
        )
        br = BookingRoom.objects.create(booking=booking, category=cancellation_fixture['category'], room_quantity=1)
        create_booking_price_snapshot(booking)

        # Mock captured full payment of Rs. 6,720
        PaymentOrder.objects.create(
            booking=booking,
            purpose='full',
            amount=Decimal('6720.00'),
            amount_paise=672000,
            razorpay_order_id='order_mock_001',
            razorpay_payment_id='pay_mock_001',
            status='captured'
        )

        preview = calculate_cancellation_refund(booking, as_of_date=today)
        assert preview['is_eligible_for_refund'] is True
        assert preview['refund_percentage'] == 50.0
        assert Decimal(preview['refund_amount']) == Decimal('3360.00')
        assert Decimal(preview['cancellation_fee']) == Decimal('3360.00')

    def test_cancellation_non_refundable_when_less_than_two_days_prior(self, cancellation_fixture):
        today = timezone.now().date()
        check_in = today + timedelta(days=1)  # 1 day ahead < 2 days
        check_out = today + timedelta(days=2)

        booking = Booking.objects.create(
            booking_reference='MG-2026-TEST2',
            customer=cancellation_fixture['customer'],
            guest_name='Sai Varshini',
            check_in_date=check_in,
            check_out_date=check_out,
            status='confirmed',
            total_adults=2,
        )
        BookingRoom.objects.create(booking=booking, category=cancellation_fixture['category'], room_quantity=1)
        create_booking_price_snapshot(booking)

        PaymentOrder.objects.create(
            booking=booking,
            purpose='full',
            amount=Decimal('3360.00'),
            amount_paise=336000,
            razorpay_order_id='order_mock_002',
            razorpay_payment_id='pay_mock_002',
            status='captured'
        )

        preview = calculate_cancellation_refund(booking, as_of_date=today)
        assert preview['is_eligible_for_refund'] is False
        assert preview['refund_percentage'] == 0.0
        assert Decimal(preview['refund_amount']) == Decimal('0.00')
        assert Decimal(preview['cancellation_fee']) == Decimal('3360.00')

    def test_customer_cancellation_request_workflow_and_api(self, cancellation_fixture):
        client = APIClient()
        customer = cancellation_fixture['customer']
        client.force_authenticate(user=customer)

        today = timezone.now().date()
        booking = Booking.objects.create(
            booking_reference='MG-2026-TEST3',
            customer=customer,
            guest_name='Sai Varshini',
            check_in_date=today + timedelta(days=4),
            check_out_date=today + timedelta(days=6),
            status='confirmed',
            total_adults=2,
        )
        BookingRoom.objects.create(booking=booking, category=cancellation_fixture['category'], room_quantity=1)
        create_booking_price_snapshot(booking)
        PaymentOrder.objects.create(
            booking=booking,
            purpose='full',
            amount=Decimal('6720.00'),
            amount_paise=672000,
            razorpay_order_id='order_mock_003',
            razorpay_payment_id='pay_mock_003',
            status='captured'
        )

        # 1. Preview API
        preview_res = client.get(f'/api/v1/bookings/{booking.booking_reference}/cancellation-preview/')
        assert preview_res.status_code == status.HTTP_200_OK
        assert preview_res.data['data']['is_eligible_for_refund'] is True
        assert preview_res.data['data']['refund_amount'] == '3360.00'

        # 2. Submit cancellation request
        req_res = client.post(
            f'/api/v1/bookings/{booking.booking_reference}/request-cancellation/',
            {'reason': 'Change of travel plans', 'notes': 'Flight cancelled'}
        )
        assert req_res.status_code == status.HTTP_200_OK
        booking.refresh_from_db()
        assert booking.status == 'cancellation_requested'
        assert booking.refund_status == 'pending'
        assert booking.refund_amount == Decimal('3360.00')
        assert booking.cancellation_reason == 'Change of travel plans'

    def test_staff_admin_approval_and_refund_decision_api(self, cancellation_fixture):
        manager = cancellation_fixture['manager']
        client = APIClient()
        client.force_authenticate(user=manager)

        today = timezone.now().date()
        booking = Booking.objects.create(
            booking_reference='MG-2026-TEST4',
            customer=cancellation_fixture['customer'],
            guest_name='Sai Varshini',
            check_in_date=today + timedelta(days=5),
            check_out_date=today + timedelta(days=7),
            status='cancellation_requested',
            cancellation_reason='Emergency',
            refund_amount=Decimal('3360.00'),
            cancellation_fee=Decimal('3360.00'),
            refund_status='pending',
            total_adults=2,
        )

        res = client.post(
            f'/api/v1/admin/bookings/{booking.booking_reference}/process-cancellation/',
            {
                'action': 'approve_and_refund',
                'refund_mode': 'manual',
                'manual_reference': 'BANK-NEFT-998877',
                'internal_notes': 'Refunded to guest bank account via NEFT'
            }
        )
        assert res.status_code == status.HTTP_200_OK
        booking.refresh_from_db()
        assert booking.status == 'refunded'
        assert booking.refund_status == 'processed'
        assert booking.refund_reference == 'BANK-NEFT-998877'
        assert booking.cancelled_by == manager
