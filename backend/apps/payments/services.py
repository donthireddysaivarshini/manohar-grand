"""
Payment services and Razorpay provider abstraction.
Handles Razorpay order generation, cryptographic signature verifications,
and idempotent advance payment order management.
"""
import hmac
import hashlib
import logging
from typing import Dict, Any, Optional, Union
from decimal import Decimal

import razorpay
from django.conf import settings
from django.db import transaction
from django.utils import timezone
from django.core.exceptions import ValidationError

from core.services import record_audit_log
from apps.bookings.services import validate_booking_for_checkout
from .models import PaymentOrder

logger = logging.getLogger(__name__)


class PaymentProviderException(Exception):
    """Exception raised when payment gateway operations fail."""
    def __init__(self, message: str, code: str = "PAYMENT_PROVIDER_ERROR", original_exception: Optional[Exception] = None):
        self.message = message
        self.code = code
        self.original_exception = original_exception
        super().__init__(self.message)


class RazorpayPaymentProvider:
    """
    Isolated Razorpay provider service abstraction.
    The rest of the platform never calls the Razorpay SDK directly.
    """

    @classmethod
    def get_client(cls) -> razorpay.Client:
        """Initializes and returns the authenticated Razorpay SDK Client."""
        key_id = getattr(settings, 'RAZORPAY_KEY_ID', '')
        key_secret = getattr(settings, 'RAZORPAY_KEY_SECRET', '')
        return razorpay.Client(auth=(key_id, key_secret))

    @classmethod
    def create_order(
        cls,
        amount_paise: int,
        currency: str = "INR",
        receipt: str = "",
        notes: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Creates an authoritative order in Razorpay gateway.
        :param amount_paise: Integer amount in paise (e.g., 10000 = ₹100.00)
        :param currency: 3-letter currency code (e.g., 'INR')
        :param receipt: Internal reference string (up to 40 chars)
        :param notes: Key-value metadata dictionary
        :return: Normalized Razorpay order dictionary
        """
        if amount_paise <= 0:
            raise PaymentProviderException("Payment amount must be greater than zero.", code="INVALID_PAYMENT_AMOUNT")

        payload = {
            "amount": amount_paise,
            "currency": currency,
            "receipt": receipt[:40] if receipt else None,
            "notes": notes or {},
            "payment_capture": 1,  # Auto-capture on authorization
        }

        try:
            client = cls.get_client()
            order_data = client.order.create(data=payload)
            logger.info(f"Successfully created Razorpay order: {order_data.get('id')} for receipt: {receipt}")
            return order_data
        except Exception as exc:
            logger.error(f"Razorpay order creation failed: {exc}", exc_info=True)
            raise PaymentProviderException(
                "Unable to initialize payment gateway order. Please try again or contact support.",
                code="PAYMENT_PROVIDER_ERROR",
                original_exception=exc
            )

    @classmethod
    def verify_payment_signature(
        cls,
        razorpay_order_id: str,
        razorpay_payment_id: str,
        razorpay_signature: str
    ) -> bool:
        """
        Cryptographically verifies the HMAC-SHA256 signature returned by Razorpay Checkout.
        Formula: HMAC_SHA256(order_id + "|" + payment_id, secret) == signature
        """
        if not razorpay_order_id or not razorpay_payment_id or not razorpay_signature:
            return False

        secret = getattr(settings, 'RAZORPAY_KEY_SECRET', '')
        if not secret:
            logger.error("RAZORPAY_KEY_SECRET is not configured on the server.")
            return False

        payload = f"{razorpay_order_id}|{razorpay_payment_id}".encode('utf-8')
        expected_sig = hmac.new(
            secret.encode('utf-8'),
            payload,
            hashlib.sha256
        ).hexdigest()

        return hmac.compare_digest(expected_sig, str(razorpay_signature).strip())

    @classmethod
    def verify_webhook_signature(
        cls,
        raw_body: Union[str, bytes],
        signature: str
    ) -> bool:
        """
        Cryptographically verifies the HMAC-SHA256 signature of incoming Razorpay Webhook events.
        Formula: HMAC_SHA256(raw_body, webhook_secret) == signature
        """
        if not raw_body or not signature:
            return False

        webhook_secret = getattr(settings, 'RAZORPAY_WEBHOOK_SECRET', '')
        if not webhook_secret:
            logger.error("RAZORPAY_WEBHOOK_SECRET is not configured on the server.")
            return False

        body_bytes = raw_body.encode('utf-8') if isinstance(raw_body, str) else raw_body
        expected_sig = hmac.new(
            webhook_secret.encode('utf-8'),
            body_bytes,
            hashlib.sha256
        ).hexdigest()

        return hmac.compare_digest(expected_sig, str(signature).strip())


@transaction.atomic
def create_advance_payment_order(
    booking,
    actor=None,
    ip_address: Optional[str] = None,
    idempotency_key: Optional[str] = None,
) -> PaymentOrder:
    """
    Creates an authoritative Razorpay payment order for a HELD booking's 50% advance deposit.

    Guarantees:
    1. Runs full checkout readiness validation (verifies status is 'held', hold not expired, capacity valid, etc.).
    2. Uses authoritative advance amount strictly from DB BookingPriceSnapshot.
    3. Idempotent: If an active created PaymentOrder already exists for this booking/purpose, reuses it safely.
    4. Records immutable AuditLog.
    5. Leaves booking in 'held' status (Payment order creation NEVER confirms a booking).
    """
    # 1. Authoritative domain checkout validation
    validation_res = validate_booking_for_checkout(booking)
    snapshot = validation_res['snapshot']

    # 2. Check for existing active PaymentOrder (Idempotency protection)
    existing_order = PaymentOrder.objects.filter(
        booking=booking,
        purpose='advance',
        status='created'
    ).first()

    if existing_order:
        logger.info(f"Reusing existing active PaymentOrder {existing_order.id} for booking {booking.booking_reference}")
        return existing_order

    # 3. Derive authoritative monetary amounts
    advance_amount_due: Decimal = snapshot.advance_amount_due
    if advance_amount_due <= Decimal('0.00'):
        raise ValidationError({
            "code": "INVALID_PAYMENT_AMOUNT",
            "payment": "Advance payment amount must be greater than zero."
        })

    amount_paise = int(round(float(advance_amount_due) * 100))
    currency = snapshot.currency or getattr(settings, 'RAZORPAY_CURRENCY', 'INR')
    receipt = f"rcpt_{booking.booking_reference}"[:40]

    notes = {
        "booking_reference": booking.booking_reference,
        "booking_id": str(booking.id),
        "purpose": "advance",
    }

    # 4. Generate order with Razorpay Gateway
    order_data = RazorpayPaymentProvider.create_order(
        amount_paise=amount_paise,
        currency=currency,
        receipt=receipt,
        notes=notes
    )

    razorpay_order_id = order_data['id']

    # 5. Persist PaymentOrder record
    payment_order = PaymentOrder.objects.create(
        booking=booking,
        purpose='advance',
        currency=currency,
        amount=advance_amount_due,
        amount_paise=amount_paise,
        razorpay_order_id=razorpay_order_id,
        status='created',
        provider='razorpay',
        idempotency_key=idempotency_key or "",
        metadata={
            "receipt": receipt,
            "razorpay_order_response": {
                "id": order_data.get('id'),
                "amount": order_data.get('amount'),
                "currency": order_data.get('currency'),
                "created_at": order_data.get('created_at'),
            }
        }
    )

    # 6. Record AuditLog
    record_audit_log(
        action='create',
        resource_type='PaymentOrder',
        resource_id=str(payment_order.id),
        actor=actor,
        old_values=None,
        new_values={
            'booking_reference': booking.booking_reference,
            'razorpay_order_id': razorpay_order_id,
            'amount': str(advance_amount_due),
            'amount_paise': amount_paise,
            'currency': currency,
            'purpose': 'advance',
            'status': 'created',
        },
        reason=f"Generated Razorpay advance payment order for {booking.booking_reference}",
        ip_address=ip_address,
    )

    return payment_order
