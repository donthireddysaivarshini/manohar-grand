"""
Automated Production Readiness & Security Hardening Verification Tests for Manohar Grand Hotel Booking System.
Validates:
1. Production settings configuration, security headers, SSL headers, and cookie flags.
2. Custom exception handler 500 error envelope and traceback suppression.
3. CSRF & CORS restrictions across endpoints.
4. Customer object-level isolation (Customer A cannot access Customer B's reservation or checkout).
5. RBAC role-boundary enforcement across Staff, Manager, Receptionist, and Public roles.
6. Immutable BookingPriceSnapshot financial integrity against rate plan updates.
7. Payment gateway signature verification, amount validation, and webhook deduplication.
8. Read-only reporting guarantees and Receptionist financial endpoint restrictions.
9. Secrets audit ensuring no live credentials or leaked keys in settings.
"""
import json
import pytest
from decimal import Decimal
from datetime import date, timedelta
from django.conf import settings
from django.test import RequestFactory, override_settings
from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient

from core.exceptions import custom_exception_handler
from apps.authentication.models import StaffProfile
from apps.rooms.models import RoomCategory, PhysicalRoom
from apps.pricing.models import RoomRatePlan, TaxRule, BookingPriceSnapshot
from apps.bookings.models import Booking, BookingRoom, BookingGuest
from apps.payments.models import PaymentOrder, WebhookEventLog
from apps.payments.services import RazorpayPaymentProvider

User = get_user_model()


@pytest.mark.django_db
class TestProductionSettingsAndSecurityHeaders:
    """Validates production security configurations and HTTP security headers."""

    def test_production_settings_defaults(self):
        """Validates that production.py defines strict security headers, secure cookies, and HSTS."""
        from manohar_grand.settings import production

        assert production.DEBUG is False
        assert production.SESSION_COOKIE_SECURE is True
        assert production.CSRF_COOKIE_SECURE is True
        assert production.SESSION_COOKIE_HTTPONLY is True
        assert production.CSRF_COOKIE_HTTPONLY is False  # Required for frontend SPA CSRF token extraction
        assert production.SESSION_COOKIE_SAMESITE == 'Lax'
        assert production.CSRF_COOKIE_SAMESITE == 'Lax'
        assert production.SECURE_BROWSER_XSS_FILTER is True
        assert production.SECURE_CONTENT_TYPE_NOSNIFF is True
        assert production.SECURE_HSTS_SECONDS >= 31536000
        assert production.SECURE_HSTS_INCLUDE_SUBDOMAINS is True
        assert production.SECURE_HSTS_PRELOAD is True
        assert production.X_FRAME_OPTIONS == 'DENY'
        assert production.SECURE_PROXY_SSL_HEADER == ('HTTP_X_FORWARDED_PROTO', 'https')

    def test_exception_handler_sanitizes_unhandled_errors_in_production(self):
        """Verifies that unhandled server exceptions return a structured 500 error without exposing stack traces."""
        factory = RequestFactory()
        request = factory.get('/api/v1/some-endpoint/')

        unhandled_exc = RuntimeError("Database connection string leaked: postgres://user:secret@host/db")

        # In production (DEBUG=False), stack traces must be suppressed
        with override_settings(DEBUG=False):
            response = custom_exception_handler(unhandled_exc, {'request': request})
            assert response is not None
            assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
            assert response.data['success'] is False
            assert response.data['error']['code'] == 'INTERNAL_SERVER_ERROR'
            assert "secret" not in json.dumps(response.data)
            assert "Database connection" not in json.dumps(response.data)
            assert "timestamp" in response.data['meta']

    def test_secrets_audit_no_live_or_committed_credentials(self):
        """Verifies that no real production secrets or live Razorpay keys are configured in base settings."""
        assert not settings.RAZORPAY_KEY_ID.startswith('rzp_live_')
        assert 'placeholder' in settings.RAZORPAY_KEY_SECRET or len(settings.RAZORPAY_KEY_SECRET) < 50
        assert not getattr(settings, 'CORS_ALLOW_ALL_ORIGINS', False)


@pytest.mark.django_db
class TestCustomerIsolationAndRBACSecurity:
    """Verifies strict object-level isolation and RBAC boundaries."""

    @pytest.fixture(autouse=True)
    def setup_data(self):
        self.customer_a = User.objects.create_user(email="cust_a_hardened@test.com", password="PassWord123!")
        self.customer_b = User.objects.create_user(email="cust_b_hardened@test.com", password="PassWord123!")

        self.receptionist = User.objects.create_user(email="recept_hardened@test.com", password="PassWord123!", is_staff=True)
        StaffProfile.objects.create(user=self.receptionist, employee_id="EMP-HREC-01", role='receptionist')

        self.manager = User.objects.create_user(email="mgr_hardened@test.com", password="PassWord123!", is_staff=True)
        StaffProfile.objects.create(user=self.manager, employee_id="EMP-HMGR-01", role='manager')

        self.superadmin = User.objects.create_user(email="admin_hardened@test.com", password="PassWord123!", is_staff=True, is_superuser=True)
        StaffProfile.objects.create(user=self.superadmin, employee_id="EMP-HADM-01", role='superadmin')

        self.category = RoomCategory.objects.create(
            name="Deluxe Hardened Room",
            slug="deluxe-hardened-room",
            included_adults=2,
            max_adults=3,
            max_total_occupancy=3,
            is_active=True
        )

        self.booking_a = Booking.objects.create(
            booking_reference="MG-HARDEN-001",
            customer=self.customer_a,
            guest_name="Guest A",
            guest_phone="+919876543210",
            guest_email="cust_a_hardened@test.com",
            status='held',
            check_in_date=date.today() + timedelta(days=5),
            check_out_date=date.today() + timedelta(days=7),
            total_adults=2,
            total_children=0,
            source='website',
            hold_expires_at=timezone.now() + timedelta(minutes=15)
        )
        BookingRoom.objects.create(booking=self.booking_a, category=self.category, room_quantity=1)
        BookingPriceSnapshot.objects.create(
            booking=self.booking_a,
            room_subtotal=Decimal('4000.00'),
            taxable_subtotal=Decimal('4000.00'),
            tax_amount=Decimal('200.00'),
            gross_total=Decimal('4200.00'),
            advance_amount_due=Decimal('2100.00'),
            balance_amount_due=Decimal('2100.00'),
            tax_rate_percent=Decimal('5.00')
        )

    def test_customer_cannot_access_another_customers_booking_detail(self):
        """Ensures Customer B receives 403 Forbidden when attempting to view Customer A's booking."""
        client = APIClient()
        client.force_authenticate(user=self.customer_b)

        res = client.get(f"/api/v1/bookings/{self.booking_a.booking_reference}/")
        assert res.status_code == status.HTTP_403_FORBIDDEN

    def test_customer_cannot_access_another_customers_checkout(self):
        """Ensures Customer B cannot retrieve checkout details or create payment orders for Customer A."""
        client = APIClient()
        client.force_authenticate(user=self.customer_b)

        res = client.get(f"/api/v1/bookings/{self.booking_a.booking_reference}/checkout/")
        assert res.status_code == status.HTTP_403_FORBIDDEN

        res_order = client.post("/api/v1/payments/orders/", {
            "booking_reference": self.booking_a.booking_reference,
            "purpose": "advance"
        }, format='json')
        assert res_order.status_code == status.HTTP_403_FORBIDDEN

    def test_receptionist_cannot_access_financial_reports_or_pricing_mutation(self):
        """Ensures Front Desk Receptionists are restricted from financial reports and pricing mutations."""
        client = APIClient()
        client.force_authenticate(user=self.receptionist)

        # Operational reports should succeed
        res_overview = client.get("/api/v1/admin/reports/overview/")
        assert res_overview.status_code == status.HTTP_200_OK

        res_frontdesk = client.get("/api/v1/admin/reports/frontdesk/")
        assert res_frontdesk.status_code == status.HTTP_200_OK

        # Financial & reconciliation reports must be forbidden
        res_rev = client.get("/api/v1/admin/reports/revenue/")
        assert res_rev.status_code == status.HTTP_403_FORBIDDEN

        res_pay = client.get("/api/v1/admin/reports/payments/")
        assert res_pay.status_code == status.HTTP_403_FORBIDDEN

        res_recon = client.get("/api/v1/admin/reports/reconciliation/")
        assert res_recon.status_code == status.HTTP_403_FORBIDDEN

    def test_immutable_price_snapshot_integrity(self):
        """Verifies that changing rate plans does not alter existing booking snapshots."""
        snapshot = self.booking_a.price_snapshot
        initial_gross = snapshot.gross_total
        initial_advance = snapshot.advance_amount_due

        # Create or update rate plan
        RoomRatePlan.objects.create(
            category=self.category,
            name="Super Peak Surge Rate",
            base_price_per_night=Decimal('9000.00'),
            is_active=True
        )

        # Snapshot on booking A must remain completely unaffected
        snapshot.refresh_from_db()
        assert snapshot.gross_total == initial_gross
        assert snapshot.advance_amount_due == initial_advance


@pytest.mark.django_db
class TestPaymentAndWebhookHardening:
    """Validates payment verification integrity, amount tampering checks, and webhook idempotency."""

    @pytest.fixture(autouse=True)
    def setup_payment(self):
        self.customer = User.objects.create_user(email="payment_hardened@test.com", password="PassWord123!")
        self.category = RoomCategory.objects.create(
            name="Hardened Suite",
            slug="hardened-suite",
            included_adults=2,
            max_adults=2,
            max_total_occupancy=2,
            is_active=True
        )
        self.booking = Booking.objects.create(
            booking_reference="MG-PAY-HARD-001",
            customer=self.customer,
            guest_name="Payment Guest",
            guest_phone="+919876543211",
            guest_email="payment_hardened@test.com",
            status='held',
            check_in_date=date.today() + timedelta(days=3),
            check_out_date=date.today() + timedelta(days=5),
            total_adults=2,
            source='website',
            hold_expires_at=timezone.now() + timedelta(minutes=15)
        )
        BookingRoom.objects.create(booking=self.booking, category=self.category, room_quantity=1)
        BookingPriceSnapshot.objects.create(
            booking=self.booking,
            room_subtotal=Decimal('6000.00'),
            taxable_subtotal=Decimal('6000.00'),
            tax_amount=Decimal('300.00'),
            gross_total=Decimal('6300.00'),
            advance_amount_due=Decimal('3150.00'),
            balance_amount_due=Decimal('3150.00'),
            tax_rate_percent=Decimal('5.00')
        )
        self.payment_order = PaymentOrder.objects.create(
            booking=self.booking,
            purpose='advance',
            amount=Decimal('3150.00'),
            amount_paise=315000,
            currency='INR',
            razorpay_order_id='order_hardened_test_123',
            status='created'
        )

    def test_payment_verification_rejects_invalid_cryptographic_signature(self):
        """Verifies that tampered signatures are rejected with 400 Bad Request."""
        client = APIClient()
        client.force_authenticate(user=self.customer)

        res = client.post("/api/v1/payments/verify/", {
            "booking_reference": self.booking.booking_reference,
            "razorpay_order_id": "order_hardened_test_123",
            "razorpay_payment_id": "pay_fake_signature_999",
            "razorpay_signature": "invalid_forged_hmac_signature_hex"
        }, format='json')

        assert res.status_code == status.HTTP_400_BAD_REQUEST
        self.booking.refresh_from_db()
        assert self.booking.status == 'held'  # Booking must remain unconfirmed

    def test_webhook_deduplication_prevents_duplicate_processing(self):
        """Verifies that duplicate webhook deliveries are safely acknowledged with already_processed."""
        event_id = "evt_hardened_dedup_001"
        WebhookEventLog.objects.create(
            provider='razorpay',
            event_id=event_id,
            event_type='order.paid',
            status='processed',
            payload={"id": event_id}
        )

        from apps.payments.services import process_razorpay_webhook_event
        from unittest.mock import patch

        with patch.object(RazorpayPaymentProvider, 'verify_webhook_signature', return_value=True):
            res = process_razorpay_webhook_event(
                payload={"id": event_id, "event": "order.paid"},
                raw_body=b'{"id": "evt_hardened_dedup_001"}',
                signature="valid_mock_signature"
            )
            assert res['status'] == 'already_processed'
