"""
Comprehensive automated tests for Phase 5 Step 4:
Payment Lifecycle Hardening, Webhook Reliability, Concurrency & Reconciliation.
"""
import uuid
import json
import hmac
import hashlib
from datetime import date, timedelta
from decimal import Decimal
from unittest.mock import patch
import pytest
from django.urls import reverse
from django.utils import timezone
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from apps.authentication.models import CustomerProfile, StaffProfile
from apps.rooms.models import RoomCategory, PhysicalRoom
from apps.pricing.models import RoomRatePlan, TaxRule
from apps.cms.models import HotelConfiguration
from apps.bookings.models import Booking, BookingRoom
from apps.bookings.services import (
    create_booking_hold,
    transition_booking_status,
    release_booking_hold,
)
from apps.payments.models import PaymentOrder, WebhookEventLog
from apps.payments.services import (
    RazorpayPaymentProvider,
    create_advance_payment_order,
    confirm_booking_after_verified_payment,
    process_razorpay_webhook_event,
    PaymentReconciliationService,
    handle_failed_payment,
)
from core.models import AuditLog

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
    PhysicalRoom.objects.create(room_number="101", category=ac_cat, floor=1, operational_status="operational")
    PhysicalRoom.objects.create(room_number="102", category=ac_cat, floor=1, operational_status="operational")

    RoomRatePlan.objects.create(
        category=ac_cat,
        name="Standard Tariff",
        base_price_per_night=Decimal("1599.00"),
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
    return ac_cat


@pytest.fixture
def customer_user(db):
    user = User.objects.create_user(
        email="alice@example.com",
        phone="9876543210",
        first_name="Alice",
        last_name="Sharma",
        auth_provider="google",
    )
    return user


@pytest.fixture
def customer_user_2(db):
    user = User.objects.create_user(
        email="bob@example.com",
        phone="9876543211",
        first_name="Bob",
        last_name="Verma",
        auth_provider="google",
    )
    return user


@pytest.fixture
def staff_admin(db):
    user = User.objects.create_superuser(
        email="admin@manohargrand.com",
        phone="9876543219",
        first_name="Admin",
        last_name="Staff",
        is_staff=True,
    )
    return user


@pytest.fixture
def held_booking_with_order(db, room_setup, customer_user, hotel_config):
    """Creates a valid held booking with an active PaymentOrder."""
    ac_cat = room_setup
    check_in = (timezone.now() + timedelta(days=5)).date()
    check_out = (timezone.now() + timedelta(days=7)).date()

    booking = create_booking_hold(
        rooms_request=[{"category": ac_cat, "room_quantity": 1}],
        check_in_date=check_in,
        check_out_date=check_out,
        guest_name="Alice Sharma",
        customer=customer_user,
    )

    with patch.object(RazorpayPaymentProvider, 'create_order') as mock_create:
        mock_create.return_value = {
            "id": "order_test_99999",
            "amount": 167895,
            "currency": "INR",
            "status": "created",
        }
        payment_order = create_advance_payment_order(booking=booking, actor=customer_user)

    return booking, payment_order


def generate_valid_signature(order_id: str, payment_id: str) -> str:
    secret = getattr(settings, 'RAZORPAY_KEY_SECRET', 'test_secret')
    payload = f"{order_id}|{payment_id}".encode('utf-8')
    return hmac.new(secret.encode('utf-8'), payload, hashlib.sha256).hexdigest()


def generate_valid_webhook_signature(raw_body: bytes) -> str:
    secret = getattr(settings, 'RAZORPAY_WEBHOOK_SECRET', 'test_webhook_secret')
    return hmac.new(secret.encode('utf-8'), raw_body, hashlib.sha256).hexdigest()


@pytest.mark.django_db
class TestWebhookReliabilityAndIdempotency:
    """Tests webhook processing robustness against retries and ordering."""

    def test_duplicate_webhook_delivery_three_times(self, api_client, held_booking_with_order):
        """Proof: The exact same webhook delivered 3 times processes once and confirms booking once."""
        booking, payment_order = held_booking_with_order
        url = reverse('payments:payment-webhook-razorpay')

        payload = {
            "id": "evt_repeat_111",
            "event": "payment.captured",
            "payload": {
                "payment": {
                    "entity": {
                        "id": "pay_repeat_111",
                        "order_id": payment_order.razorpay_order_id,
                        "amount": payment_order.amount_paise,
                        "currency": "INR",
                        "status": "captured"
                    }
                }
            }
        }
        raw_body = json.dumps(payload).encode('utf-8')
        sig = generate_valid_webhook_signature(raw_body)

        # Delivery 1
        resp1 = api_client.post(url, data=raw_body, content_type='application/json', HTTP_X_RAZORPAY_SIGNATURE=sig)
        assert resp1.status_code == status.HTTP_200_OK
        assert resp1.data['data']['status'] == 'processed'

        booking.refresh_from_db()
        assert booking.status == 'confirmed'

        # Delivery 2 (Immediate retry)
        resp2 = api_client.post(url, data=raw_body, content_type='application/json', HTTP_X_RAZORPAY_SIGNATURE=sig)
        assert resp2.status_code == status.HTTP_200_OK
        assert resp2.data['data']['status'] == 'already_processed'

        # Delivery 3 (Delayed retry)
        resp3 = api_client.post(url, data=raw_body, content_type='application/json', HTTP_X_RAZORPAY_SIGNATURE=sig)
        assert resp3.status_code == status.HTTP_200_OK
        assert resp3.data['data']['status'] == 'already_processed'

        # AuditLog contains exactly one status_change for booking confirmation
        confirm_logs = AuditLog.objects.filter(
            resource_type='Booking',
            resource_id=str(booking.id),
            action='status_change',
            new_values__status='confirmed'
        )
        assert confirm_logs.count() == 1

    def test_order_paid_after_payment_captured_handled_idempotently(self, api_client, held_booking_with_order):
        """Proof: payment.captured followed by order.paid handles transitions without duplicate side effects."""
        booking, payment_order = held_booking_with_order
        url = reverse('payments:payment-webhook-razorpay')

        # Event 1: payment.captured
        payload1 = {
            "id": "evt_cap_222",
            "event": "payment.captured",
            "payload": {
                "payment": {
                    "entity": {
                        "id": "pay_222",
                        "order_id": payment_order.razorpay_order_id,
                        "amount": payment_order.amount_paise,
                        "currency": "INR",
                        "status": "captured"
                    }
                }
            }
        }
        raw1 = json.dumps(payload1).encode('utf-8')
        sig1 = generate_valid_webhook_signature(raw1)
        resp1 = api_client.post(url, data=raw1, content_type='application/json', HTTP_X_RAZORPAY_SIGNATURE=sig1)
        assert resp1.status_code == status.HTTP_200_OK

        # Event 2: order.paid with different event ID
        payload2 = {
            "id": "evt_order_333",
            "event": "order.paid",
            "payload": {
                "order": {
                    "entity": {
                        "id": payment_order.razorpay_order_id,
                        "amount": payment_order.amount_paise,
                        "amount_paid": payment_order.amount_paise,
                        "status": "paid",
                        "currency": "INR"
                    }
                },
                "payment": {
                    "entity": {
                        "id": "pay_222",
                        "order_id": payment_order.razorpay_order_id,
                        "amount": payment_order.amount_paise,
                        "status": "captured"
                    }
                }
            }
        }
        raw2 = json.dumps(payload2).encode('utf-8')
        sig2 = generate_valid_webhook_signature(raw2)
        resp2 = api_client.post(url, data=raw2, content_type='application/json', HTTP_X_RAZORPAY_SIGNATURE=sig2)
        assert resp2.status_code == status.HTTP_200_OK
        assert resp2.data['data']['status'] == 'processed'

        booking.refresh_from_db()
        assert booking.status == 'confirmed'


@pytest.mark.django_db
class TestDirectVerifyAndWebhookRace:
    """Tests race condition safety between frontend direct verify and webhook."""

    def test_direct_verify_then_webhook_arrives(self, api_client, customer_user, held_booking_with_order):
        """Proof: Frontend verifies first, then webhook arrives; both succeed safely."""
        booking, payment_order = held_booking_with_order
        api_client.force_login(customer_user)

        # 1. Direct verify
        verify_url = reverse('payments:payment-verify')
        payment_id = "pay_race_444"
        sig = generate_valid_signature(payment_order.razorpay_order_id, payment_id)

        v_resp = api_client.post(verify_url, data={
            "razorpay_order_id": payment_order.razorpay_order_id,
            "razorpay_payment_id": payment_id,
            "razorpay_signature": sig,
        })
        assert v_resp.status_code == status.HTTP_200_OK
        assert v_resp.data['data']['booking_status'] == 'confirmed'
        assert v_resp.data['meta']['already_confirmed'] is False

        # 2. Webhook arrives later
        wh_url = reverse('payments:payment-webhook-razorpay')
        wh_payload = {
            "id": "evt_race_webhook_555",
            "event": "payment.captured",
            "payload": {
                "payment": {
                    "entity": {
                        "id": payment_id,
                        "order_id": payment_order.razorpay_order_id,
                        "amount": payment_order.amount_paise,
                        "currency": "INR",
                        "status": "captured"
                    }
                }
            }
        }
        raw_wh = json.dumps(wh_payload).encode('utf-8')
        wh_sig = generate_valid_webhook_signature(raw_wh)

        wh_resp = api_client.post(wh_url, data=raw_wh, content_type='application/json', HTTP_X_RAZORPAY_SIGNATURE=wh_sig)
        assert wh_resp.status_code == status.HTTP_200_OK

        booking.refresh_from_db()
        assert booking.status == 'confirmed'

    def test_failed_payment_then_successful_retry(self, held_booking_with_order):
        """Proof: Failed payment transitions PaymentOrder to failed, then retry transitions to captured & confirms booking."""
        booking, payment_order = held_booking_with_order

        # 1. Payment failure
        handle_failed_payment(
            payment_order=payment_order,
            razorpay_payment_id="pay_failed_666",
            error_code="BAD_REQUEST_ERROR",
            error_description="Card declined by issuing bank"
        )
        payment_order.refresh_from_db()
        assert payment_order.status == 'failed'
        booking.refresh_from_db()
        assert booking.status == 'held'  # Hold still active!

        # 2. Customer retries with another payment method on same order
        res = confirm_booking_after_verified_payment(
            razorpay_order_id=payment_order.razorpay_order_id,
            razorpay_payment_id="pay_success_777",
            razorpay_signature="dummy_valid_sig",
            source="retry_verification"
        )
        assert res['success'] is True
        payment_order.refresh_from_db()
        assert payment_order.status == 'captured'
        assert payment_order.razorpay_payment_id == "pay_success_777"
        booking.refresh_from_db()
        assert booking.status == 'confirmed'


@pytest.mark.django_db
class TestPaymentReconciliation:
    """Tests backend reconciliation service."""

    def test_reconcile_auto_confirms_valid_held_booking_with_captured_order(self, held_booking_with_order):
        booking, payment_order = held_booking_with_order
        payment_order.status = 'captured'
        payment_order.razorpay_payment_id = 'pay_recon_888'
        payment_order.save()

        # Booking is currently held
        assert booking.status == 'held'

        report = PaymentReconciliationService.reconcile_booking(booking=booking, auto_resolve=True)
        assert report['action_taken'] == 'auto_confirmed_booking'
        assert report['booking_status'] == 'confirmed'

        booking.refresh_from_db()
        assert booking.status == 'confirmed'

    def test_reconcile_flags_captured_payment_on_expired_hold(self, held_booking_with_order):
        booking, payment_order = held_booking_with_order
        payment_order.status = 'captured'
        payment_order.razorpay_payment_id = 'pay_recon_999'
        payment_order.save()

        # Expire hold
        booking.hold_expires_at = timezone.now() - timedelta(minutes=5)
        booking.save()

        report = PaymentReconciliationService.reconcile_booking(booking=booking, auto_resolve=True)
        assert report['action_taken'] == 'flagged_for_admin_review'
        assert report['resolved'] is False
        assert any(d['code'] == 'DISCREPANCY_EXPIRED_HOLD_CAPTURED' for d in report['discrepancies'])

        # Booking remains unconfirmed for administrative safety
        booking.refresh_from_db()
        assert booking.status == 'held'

    def test_reconcile_cancels_stale_payment_orders_on_cancelled_booking(self, held_booking_with_order):
        booking, payment_order = held_booking_with_order
        booking.status = 'cancelled'
        booking.save()

        report = PaymentReconciliationService.reconcile_booking(booking=booking, auto_resolve=True)
        assert 'cancelled' in report['action_taken']

        payment_order.refresh_from_db()
        assert payment_order.status == 'cancelled'

    def test_admin_reconciliation_api_endpoint(self, api_client, staff_admin, held_booking_with_order):
        booking, payment_order = held_booking_with_order
        url = reverse('payments:payment-reconcile')

        # Customer forbidden
        resp_unauth = api_client.post(url, data={})
        assert resp_unauth.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)

        # Admin authorized
        api_client.force_login(staff_admin)
        resp_admin = api_client.post(url, data={"booking_reference": booking.booking_reference})
        assert resp_admin.status_code == status.HTTP_200_OK
        assert resp_admin.data['success'] is True
        assert resp_admin.data['data']['booking_reference'] == booking.booking_reference


@pytest.mark.django_db
class TestBookingPaymentStatusExposure:
    """Tests payment status field on booking endpoints."""

    def test_customer_booking_detail_exposes_payment_status(self, api_client, customer_user, held_booking_with_order):
        booking, payment_order = held_booking_with_order
        api_client.force_login(customer_user)
        url = reverse('bookings:booking-detail-lookup', kwargs={'booking_reference': booking.booking_reference})

        # When held and unpaid
        resp = api_client.get(url)
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data['data']['payment_status'] == 'unpaid'

        # After confirmation
        confirm_booking_after_verified_payment(
            razorpay_order_id=payment_order.razorpay_order_id,
            razorpay_payment_id="pay_status_100",
            source="test"
        )
        resp2 = api_client.get(url)
        assert resp2.status_code == status.HTTP_200_OK
        assert resp2.data['data']['payment_status'] == 'advance_paid'
        assert resp2.data['data']['status'] == 'confirmed'
