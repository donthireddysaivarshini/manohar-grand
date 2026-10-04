"""
Comprehensive automated tests for Phase 5 Step 2:
Razorpay Payment Verification, Webhook Processing & Booking Confirmation.
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
    # Physical rooms
    PhysicalRoom.objects.create(room_number="101", category=ac_cat, floor=1, operational_status="operational")
    PhysicalRoom.objects.create(room_number="102", category=ac_cat, floor=1, operational_status="operational")

    # Rate plans
    RoomRatePlan.objects.create(
        category=ac_cat,
        name="Standard Tariff",
        base_price_per_night=Decimal("1599.00"),
        extra_adult_charge=Decimal("350.00"),
        extra_child_charge=Decimal("300.00"),
        is_active=True,
    )

    # Tax rule (5% GST)
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
            "id": "order_test_12345",
            "amount": 167895,
            "currency": "INR",
            "status": "created",
        }
        payment_order = create_advance_payment_order(booking=booking, actor=customer_user)

    return booking, payment_order


def generate_valid_signature(order_id: str, payment_id: str) -> str:
    """Generates valid HMAC-SHA256 signature for test verification."""
    secret = getattr(settings, 'RAZORPAY_KEY_SECRET', 'test_secret')
    payload = f"{order_id}|{payment_id}".encode('utf-8')
    return hmac.new(secret.encode('utf-8'), payload, hashlib.sha256).hexdigest()


def generate_valid_webhook_signature(raw_body: bytes) -> str:
    """Generates valid HMAC-SHA256 webhook signature for test verification."""
    secret = getattr(settings, 'RAZORPAY_WEBHOOK_SECRET', 'test_webhook_secret')
    return hmac.new(secret.encode('utf-8'), raw_body, hashlib.sha256).hexdigest()


@pytest.mark.django_db
class TestDirectPaymentVerificationAPI:
    """Tests for POST /api/v1/payments/verify/ direct verification endpoint."""

    def test_payment_verification_success_confirms_booking(self, api_client, customer_user, held_booking_with_order):
        """Valid cryptographic signature verification transitions Booking to CONFIRMED atomically."""
        booking, payment_order = held_booking_with_order
        api_client.force_authenticate(user=customer_user)

        order_id = payment_order.razorpay_order_id
        payment_id = "pay_test_998877"
        valid_sig = generate_valid_signature(order_id, payment_id)

        url = reverse('payments:payment-verify')
        response = api_client.post(url, {
            "razorpay_order_id": order_id,
            "razorpay_payment_id": payment_id,
            "razorpay_signature": valid_sig,
        }, format='json')

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["success"] is True

        res = data["data"]
        assert res["booking_reference"] == booking.booking_reference
        assert res["booking_status"] == "confirmed"
        assert res["payment_status"] == "captured"
        assert res["razorpay_order_id"] == order_id
        assert res["razorpay_payment_id"] == payment_id
        assert Decimal(str(res["advance_amount"])) == Decimal("3357.90")
        assert Decimal(str(res["balance_amount"])) == Decimal("0.00")

        # Verify DB state
        booking.refresh_from_db()
        assert booking.status == "confirmed"
        assert booking.hold_expires_at is None

        payment_order.refresh_from_db()
        assert payment_order.status == "captured"
        assert payment_order.razorpay_payment_id == payment_id
        assert payment_order.razorpay_signature == valid_sig

        # AuditLog presence
        audit = AuditLog.objects.filter(resource_type="Booking", resource_id=str(booking.id), action="status_change").first()
        assert audit is not None
        assert audit.new_values["status"] == "confirmed"

    def test_payment_verification_invalid_signature_rejected(self, api_client, customer_user, held_booking_with_order):
        """Invalid cryptographic signature is rejected and booking remains HELD."""
        booking, payment_order = held_booking_with_order
        api_client.force_authenticate(user=customer_user)

        order_id = payment_order.razorpay_order_id
        payment_id = "pay_test_998877"
        invalid_sig = "tampered_signature_hex_12345"

        url = reverse('payments:payment-verify')
        response = api_client.post(url, {
            "razorpay_order_id": order_id,
            "razorpay_payment_id": payment_id,
            "razorpay_signature": invalid_sig,
        }, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        data = response.json()
        assert data["error"]["code"] == "PAYMENT_SIGNATURE_INVALID"

        booking.refresh_from_db()
        assert booking.status == "held"

    def test_customer_cannot_verify_another_customers_payment(self, api_client, customer_user_2, held_booking_with_order):
        """Customer B cannot verify payment for Customer A's booking (403 Forbidden)."""
        booking, payment_order = held_booking_with_order
        api_client.force_authenticate(user=customer_user_2)

        order_id = payment_order.razorpay_order_id
        payment_id = "pay_test_998877"
        valid_sig = generate_valid_signature(order_id, payment_id)

        url = reverse('payments:payment-verify')
        response = api_client.post(url, {
            "razorpay_order_id": order_id,
            "razorpay_payment_id": payment_id,
            "razorpay_signature": valid_sig,
        }, format='json')

        assert response.status_code == status.HTTP_403_FORBIDDEN
        data = response.json()
        assert data["error"]["code"] == "PERMISSION_DENIED"

    def test_unauthenticated_user_with_token_can_verify_payment(self, api_client, room_setup, hotel_config):
        """Unauthenticated guest with valid booking access token can verify payment."""
        ac_cat = room_setup
        check_in = (timezone.now() + timedelta(days=5)).date()
        check_out = (timezone.now() + timedelta(days=7)).date()

        booking = create_booking_hold(
            rooms_request=[{"category": ac_cat, "room_quantity": 1}],
            check_in_date=check_in,
            check_out_date=check_out,
            guest_name="Guest User",
        )

        with patch.object(RazorpayPaymentProvider, 'create_order') as mock_create:
            mock_create.return_value = {"id": "order_anon_123", "amount": 167895, "currency": "INR", "status": "created"}
            payment_order = create_advance_payment_order(booking=booking)

        order_id = payment_order.razorpay_order_id
        payment_id = "pay_anon_998877"
        valid_sig = generate_valid_signature(order_id, payment_id)

        url = reverse('payments:payment-verify')

        # With header token
        resp = api_client.post(
            url,
            {
                "razorpay_order_id": order_id,
                "razorpay_payment_id": payment_id,
                "razorpay_signature": valid_sig,
            },
            format='json',
            HTTP_X_BOOKING_TOKEN=str(booking.access_token)
        )
        assert resp.status_code == status.HTTP_200_OK
        booking.refresh_from_db()
        assert booking.status == "confirmed"

    def test_expired_hold_cannot_be_verified(self, api_client, customer_user, held_booking_with_order):
        """Expired hold returns HOLD_EXPIRED and transitions booking to expired."""
        booking, payment_order = held_booking_with_order
        api_client.force_authenticate(user=customer_user)

        # Backdate expiry
        booking.hold_expires_at = timezone.now() - timedelta(seconds=10)
        booking.save(update_fields=['hold_expires_at'])

        order_id = payment_order.razorpay_order_id
        payment_id = "pay_test_998877"
        valid_sig = generate_valid_signature(order_id, payment_id)

        url = reverse('payments:payment-verify')
        response = api_client.post(url, {
            "razorpay_order_id": order_id,
            "razorpay_payment_id": payment_id,
            "razorpay_signature": valid_sig,
        }, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        data = response.json()
        assert data["error"]["code"] == "HOLD_EXPIRED"

        booking.refresh_from_db()
        assert booking.status == "expired"

    def test_idempotent_duplicate_verification(self, api_client, customer_user, held_booking_with_order):
        """Calling verify multiple times for an already-confirmed payment returns 200 OK safely."""
        booking, payment_order = held_booking_with_order
        api_client.force_authenticate(user=customer_user)

        order_id = payment_order.razorpay_order_id
        payment_id = "pay_test_998877"
        valid_sig = generate_valid_signature(order_id, payment_id)
        url = reverse('payments:payment-verify')

        # 1. First verification
        resp1 = api_client.post(url, {
            "razorpay_order_id": order_id,
            "razorpay_payment_id": payment_id,
            "razorpay_signature": valid_sig,
        }, format='json')
        assert resp1.status_code == status.HTTP_200_OK
        assert resp1.json()["meta"]["already_confirmed"] is False

        # 2. Second verification (retry/refresh)
        resp2 = api_client.post(url, {
            "razorpay_order_id": order_id,
            "razorpay_payment_id": payment_id,
            "razorpay_signature": valid_sig,
        }, format='json')
        assert resp2.status_code == status.HTTP_200_OK
        assert resp2.json()["meta"]["already_confirmed"] is True


@pytest.mark.django_db
class TestRazorpayWebhookAPI:
    """Tests for POST /api/v1/payments/webhook/razorpay/ asynchronous webhook listener."""

    def test_webhook_payment_captured_confirms_booking(self, api_client, held_booking_with_order):
        """Asynchronous payment.captured webhook confirms the booking idempotently."""
        booking, payment_order = held_booking_with_order
        order_id = payment_order.razorpay_order_id
        payment_id = "pay_webhook_112233"
        amount_paise = payment_order.amount_paise

        payload_dict = {
            "id": f"evt_{uuid.uuid4().hex[:12]}",
            "event": "payment.captured",
            "payload": {
                "payment": {
                    "entity": {
                        "id": payment_id,
                        "order_id": order_id,
                        "amount": amount_paise,
                        "currency": "INR",
                        "status": "captured",
                    }
                }
            }
        }
        raw_body = json.dumps(payload_dict).encode('utf-8')
        signature = generate_valid_webhook_signature(raw_body)

        url = reverse('payments:payment-webhook-razorpay')
        response = api_client.post(
            url,
            data=raw_body,
            content_type="application/json",
            HTTP_X_RAZORPAY_SIGNATURE=signature
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.json()["success"] is True

        booking.refresh_from_db()
        assert booking.status == "confirmed"

        payment_order.refresh_from_db()
        assert payment_order.status == "captured"
        assert payment_order.razorpay_payment_id == payment_id

        # Verify WebhookEventLog
        event_log = WebhookEventLog.objects.get(event_id=payload_dict["id"])
        assert event_log.status == "processed"

    def test_webhook_deduplication_does_not_process_twice(self, api_client, held_booking_with_order):
        """Duplicate webhook event delivery is recognized and acknowledged without re-processing."""
        booking, payment_order = held_booking_with_order
        order_id = payment_order.razorpay_order_id
        event_id = f"evt_dup_{uuid.uuid4().hex[:8]}"

        payload_dict = {
            "id": event_id,
            "event": "payment.captured",
            "payload": {
                "payment": {
                    "entity": {
                        "id": "pay_dup_123",
                        "order_id": order_id,
                        "amount": payment_order.amount_paise,
                        "currency": "INR",
                        "status": "captured",
                    }
                }
            }
        }
        raw_body = json.dumps(payload_dict).encode('utf-8')
        signature = generate_valid_webhook_signature(raw_body)
        url = reverse('payments:payment-webhook-razorpay')

        # 1. First webhook delivery
        resp1 = api_client.post(url, data=raw_body, content_type="application/json", HTTP_X_RAZORPAY_SIGNATURE=signature)
        assert resp1.status_code == status.HTTP_200_OK

        # 2. Duplicate webhook retry
        resp2 = api_client.post(url, data=raw_body, content_type="application/json", HTTP_X_RAZORPAY_SIGNATURE=signature)
        assert resp2.status_code == status.HTTP_200_OK
        assert resp2.json()["data"]["status"] == "already_processed"

    def test_webhook_payment_failed_records_failure_leaves_hold_active(self, api_client, held_booking_with_order):
        """payment.failed webhook marks PaymentOrder as failed, but preserves booking hold if not expired."""
        booking, payment_order = held_booking_with_order
        order_id = payment_order.razorpay_order_id

        payload_dict = {
            "id": f"evt_fail_{uuid.uuid4().hex[:8]}",
            "event": "payment.failed",
            "payload": {
                "payment": {
                    "entity": {
                        "id": "pay_fail_123",
                        "order_id": order_id,
                        "error_code": "BAD_REQUEST_ERROR",
                        "error_description": "Payment was declined by bank",
                    }
                }
            }
        }
        raw_body = json.dumps(payload_dict).encode('utf-8')
        signature = generate_valid_webhook_signature(raw_body)
        url = reverse('payments:payment-webhook-razorpay')

        response = api_client.post(url, data=raw_body, content_type="application/json", HTTP_X_RAZORPAY_SIGNATURE=signature)
        assert response.status_code == status.HTTP_200_OK

        payment_order.refresh_from_db()
        assert payment_order.status == "failed"

        # Booking must still be 'held'
        booking.refresh_from_db()
        assert booking.status == "held"

    def test_webhook_invalid_signature_rejected(self, api_client, held_booking_with_order):
        """Invalid webhook signature returns 400 Bad Request."""
        payload_dict = {"id": "evt_bad_123", "event": "payment.captured"}
        raw_body = json.dumps(payload_dict).encode('utf-8')

        url = reverse('payments:payment-webhook-razorpay')
        response = api_client.post(url, data=raw_body, content_type="application/json", HTTP_X_RAZORPAY_SIGNATURE="tampered_sig")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.json()["error"]["code"] == "WEBHOOK_SIGNATURE_INVALID"
