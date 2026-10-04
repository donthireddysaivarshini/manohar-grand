"""
Payment services and Razorpay provider abstraction.
Handles Razorpay order generation, cryptographic signature verifications,
idempotent payment verification, webhook event logging, atomic booking confirmation,
and payment state reconciliation.
"""
import hmac
import hashlib
import logging
from typing import Dict, Any, Optional, Union, List
from decimal import Decimal

import razorpay
from django.conf import settings
from django.db import transaction, IntegrityError
from django.utils import timezone
from django.core.exceptions import ValidationError

from core.services import record_audit_log
from apps.bookings.models import Booking
from apps.bookings.services import (
    validate_booking_for_checkout,
    transition_booking_status,
)
from apps.rooms.models import RoomCategory
from .models import PaymentOrder, WebhookEventLog

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
    def fetch_payment(cls, razorpay_payment_id: str) -> Dict[str, Any]:
        """
        Fetches live payment entity from Razorpay to verify server-side status, amount, and order ID.
        """
        if not razorpay_payment_id:
            raise PaymentProviderException("Payment ID is required.", code="INVALID_PAYMENT_ID")
        try:
            client = cls.get_client()
            payment_data = client.payment.fetch(razorpay_payment_id)
            return payment_data
        except Exception as exc:
            logger.error(f"Failed to fetch payment {razorpay_payment_id} from Razorpay: {exc}", exc_info=True)
            raise PaymentProviderException(
                f"Unable to fetch payment details from gateway: {exc}",
                code="PAYMENT_PROVIDER_ERROR",
                original_exception=exc
            )

    @classmethod
    def fetch_order(cls, razorpay_order_id: str) -> Dict[str, Any]:
        """
        Fetches live order entity from Razorpay to verify server-side status and payments.
        """
        if not razorpay_order_id:
            raise PaymentProviderException("Order ID is required.", code="INVALID_ORDER_ID")
        try:
            client = cls.get_client()
            order_data = client.order.fetch(razorpay_order_id)
            return order_data
        except Exception as exc:
            logger.error(f"Failed to fetch order {razorpay_order_id} from Razorpay: {exc}", exc_info=True)
            raise PaymentProviderException(
                f"Unable to fetch order details from gateway: {exc}",
                code="PAYMENT_PROVIDER_ERROR",
                original_exception=exc
            )

    @classmethod
    def create_refund(
        cls,
        razorpay_payment_id: str,
        amount_paise: int,
        notes: Optional[Dict[str, Any]] = None,
        receipt: str = ""
    ) -> Dict[str, Any]:
        """
        Creates an authoritative refund for a captured Razorpay payment.
        :param razorpay_payment_id: Gateway payment ID (pay_XXXX)
        :param amount_paise: Integer amount in paise (e.g. 50000 = ₹500.00)
        :param notes: Key-value metadata
        :param receipt: Internal receipt reference
        :return: Normalized Razorpay refund dictionary
        """
        if not razorpay_payment_id:
            raise PaymentProviderException("Payment ID is required for refund.", code="INVALID_PAYMENT_ID")
        if amount_paise <= 0:
            raise PaymentProviderException("Refund amount must be greater than zero.", code="INVALID_REFUND_AMOUNT")

        payload = {
            "amount": amount_paise,
            "notes": notes or {},
            "receipt": receipt[:40] if receipt else None,
        }
        try:
            client = cls.get_client()
            refund_data = client.payment.refund(razorpay_payment_id, payload)
            logger.info(f"Successfully processed Razorpay refund: {refund_data.get('id')} for payment: {razorpay_payment_id}")
            return refund_data
        except Exception as exc:
            logger.error(f"Razorpay refund failed: {exc}", exc_info=True)
            raise PaymentProviderException(
                f"Razorpay refund failed: {exc}",
                code="PAYMENT_REFUND_ERROR",
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


@transaction.atomic
def confirm_booking_after_verified_payment(
    razorpay_order_id: str,
    razorpay_payment_id: str,
    razorpay_signature: Optional[str] = "",
    verified_amount_paise: Optional[int] = None,
    verified_currency: Optional[str] = None,
    actor=None,
    ip_address: Optional[str] = None,
    source: str = "verification_api",
) -> Dict[str, Any]:
    """
    Central, authoritative, atomic service for confirming a reservation upon verified payment.
    Unified logic executed by both:
    1. Direct client verification endpoint (/api/v1/payments/verify/)
    2. Asynchronous Razorpay webhook handler (/api/v1/payments/webhook/razorpay/)
    3. Safe reconciliation service (PaymentReconciliationService)

    Strict Checkpoints:
    1. Locks target PaymentOrder row with select_for_update().
    2. Idempotency: If PaymentOrder is already 'captured' and Booking is 'confirmed', returns existing state cleanly.
    3. Locks target Booking row with select_for_update().
    4. Locks target RoomCategory rows with select_for_update().
    5. Re-validates hold state & expiration.
    6. Verifies monetary consistency (expected advance amount & currency match snapshot).
    7. Updates PaymentOrder status to 'captured' and stores payment_id.
    8. Atomically transitions Booking from 'held' -> 'confirmed' and clears hold expiration.
    9. Emits immutable AuditLog records.
    """
    if not razorpay_order_id:
        raise ValidationError({
            "code": "PAYMENT_NOT_FOUND",
            "payment": "Razorpay order ID is mandatory."
        })

    # 1. Lock PaymentOrder
    payment_order = PaymentOrder.objects.select_for_update().filter(razorpay_order_id=razorpay_order_id).first()
    if not payment_order:
        raise ValidationError({
            "code": "PAYMENT_NOT_FOUND",
            "payment": f"No payment order found matching gateway order ID '{razorpay_order_id}'."
        })

    booking = Booking.objects.select_for_update().select_related('customer', 'price_snapshot').get(id=payment_order.booking_id)

    # 2. Idempotency Check
    if payment_order.status == 'captured' and booking.status == 'confirmed':
        logger.info(f"PaymentOrder {payment_order.id} for {booking.booking_reference} is already confirmed (Idempotent response).")
        return {
            "success": True,
            "booking": booking,
            "payment_order": payment_order,
            "already_confirmed": True,
        }

    # 3. Lock target RoomCategory rows for concurrency safety
    category_ids = list(booking.rooms.values_list('category_id', flat=True))
    if category_ids:
        list(RoomCategory.objects.select_for_update().filter(id__in=category_ids).order_by('id'))

    # 4. State & Expiry Validation
    if booking.status == 'confirmed':
        # Booking was already confirmed (e.g. by concurrent webhook), mark payment captured if needed
        if payment_order.status != 'captured':
            payment_order.status = 'captured'
            payment_order.razorpay_payment_id = razorpay_payment_id
            if razorpay_signature:
                payment_order.razorpay_signature = razorpay_signature
            payment_order.save(update_fields=['status', 'razorpay_payment_id', 'razorpay_signature', 'updated_at'])
        return {
            "success": True,
            "booking": booking,
            "payment_order": payment_order,
            "already_confirmed": True,
        }

    if booking.status in ('cancelled', 'expired', 'checked_out', 'checked_in', 'no_show'):
        raise ValidationError({
            "code": "INVALID_BOOKING_STATE",
            "booking": f"Cannot confirm booking {booking.booking_reference} in '{booking.status}' status."
        })

    if booking.status != 'held':
        raise ValidationError({
            "code": "INVALID_BOOKING_STATE",
            "booking": f"Booking {booking.booking_reference} must be in 'held' status to confirm (current: '{booking.status}')."
        })

    # Hold Expiry Check
    now = timezone.now()
    if booking.hold_expires_at and booking.hold_expires_at <= now:
        transition_booking_status(
            booking=booking,
            target_status='expired',
            reason="Hold expired before payment verification completed"
        )
        raise ValidationError({
            "code": "HOLD_EXPIRED",
            "booking": f"The hold for booking {booking.booking_reference} expired at {booking.hold_expires_at.isoformat()}."
        })

    # 5. Financial & Price Snapshot Consistency
    if not hasattr(booking, 'price_snapshot') or booking.price_snapshot is None:
        raise ValidationError({
            "code": "MISSING_PRICE_SNAPSHOT",
            "booking": f"Authoritative price snapshot missing for booking {booking.booking_reference}."
        })

    snapshot = booking.price_snapshot
    expected_paise = int(round(float(snapshot.advance_amount_due) * 100))

    if verified_amount_paise is not None and verified_amount_paise != expected_paise:
        raise ValidationError({
            "code": "PAYMENT_AMOUNT_MISMATCH",
            "payment": f"Verified amount ({verified_amount_paise} paise) does not match expected advance deposit ({expected_paise} paise)."
        })

    expected_currency = snapshot.currency or getattr(settings, 'RAZORPAY_CURRENCY', 'INR')
    if verified_currency and verified_currency.upper() != expected_currency.upper():
        raise ValidationError({
            "code": "PAYMENT_CURRENCY_MISMATCH",
            "payment": f"Verified currency '{verified_currency}' does not match booking currency '{expected_currency}'."
        })

    # 6. Update PaymentOrder to 'captured' (supports retries from 'created' or 'failed')
    old_payment_status = payment_order.status
    payment_order.status = 'captured'
    payment_order.razorpay_payment_id = razorpay_payment_id
    if razorpay_signature:
        payment_order.razorpay_signature = razorpay_signature
    payment_order.save()

    # 7. Transition Booking: 'held' -> 'confirmed'
    booking = transition_booking_status(
        booking=booking,
        target_status='confirmed',
        actor=actor,
        reason=f"Verified advance payment received via {source} ({razorpay_payment_id})",
        ip_address=ip_address,
    )

    # 8. Record immutable AuditLog
    record_audit_log(
        action='status_change',
        resource_type='PaymentOrder',
        resource_id=str(payment_order.id),
        actor=actor,
        old_values={'status': old_payment_status},
        new_values={
            'status': 'captured',
            'razorpay_payment_id': razorpay_payment_id,
            'source': source,
            'booking_status': 'confirmed',
        },
        reason=f"Payment captured and reservation {booking.booking_reference} confirmed via {source}",
        ip_address=ip_address,
    )

    return {
        "success": True,
        "booking": booking,
        "payment_order": payment_order,
        "already_confirmed": False,
    }


@transaction.atomic
def handle_failed_payment(
    payment_order: PaymentOrder,
    razorpay_payment_id: str = "",
    error_code: str = "",
    error_description: str = "",
    actor=None,
    ip_address: Optional[str] = None,
) -> PaymentOrder:
    """
    Safely records a gateway payment failure.
    Guarantees:
    - Booking remains in 'held' status if hold duration has not elapsed (guest can retry).
    - Does NOT confirm booking.
    - Emits AuditLog.
    """
    old_status = payment_order.status
    payment_order.status = 'failed'
    if razorpay_payment_id:
        payment_order.razorpay_payment_id = razorpay_payment_id
    if not isinstance(payment_order.metadata, dict):
        payment_order.metadata = {}
    payment_order.metadata['failure_details'] = {
        'error_code': error_code,
        'error_description': error_description,
        'failed_at': timezone.now().isoformat(),
    }
    payment_order.save()

    record_audit_log(
        action='update',
        resource_type='PaymentOrder',
        resource_id=str(payment_order.id),
        actor=actor,
        old_values={'status': old_status},
        new_values={
            'status': 'failed',
            'error_code': error_code,
            'error_description': error_description,
        },
        reason=f"Payment failed for {payment_order.booking.booking_reference}: {error_description}",
        ip_address=ip_address,
    )

    return payment_order


def process_razorpay_webhook_event(
    payload: Dict[str, Any],
    raw_body: Union[str, bytes],
    signature: str,
    actor=None,
    ip_address: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Processes incoming asynchronous Razorpay Webhook events.
    1. Cryptographically verifies HMAC-SHA256 signature using RAZORPAY_WEBHOOK_SECRET.
    2. Deduplicates event via WebhookEventLog(provider='razorpay', event_id=...).
    3. Handles 'payment.captured', 'order.paid', 'payment.failed' idempotently.
    """
    # 1. Cryptographic Signature Verification
    if not RazorpayPaymentProvider.verify_webhook_signature(raw_body, signature):
        raise ValidationError({
            "code": "WEBHOOK_SIGNATURE_INVALID",
            "webhook": "Cryptographic webhook HMAC-SHA256 signature verification failed."
        })

    event_id = payload.get('id', '')
    event_type = payload.get('event', '')

    if not event_id or not event_type:
        raise ValidationError({
            "code": "INVALID_WEBHOOK_PAYLOAD",
            "webhook": "Missing required event 'id' or 'event' field."
        })

    # 2. Idempotency / Deduplication check with row locking
    with transaction.atomic():
        try:
            event_log, created = WebhookEventLog.objects.select_for_update().get_or_create(
                provider='razorpay',
                event_id=event_id,
                defaults={
                    'event_type': event_type,
                    'status': 'received',
                    'payload': payload,
                }
            )
        except IntegrityError:
            event_log = WebhookEventLog.objects.select_for_update().get(provider='razorpay', event_id=event_id)
            created = False

        if not created and event_log.status == 'processed':
            logger.info(f"Webhook event {event_id} ({event_type}) was already processed. Acknowledging HTTP 200.")
            return {"status": "already_processed", "event_id": event_id}

    # 3. Process Supported Events
    try:
        if event_type in ('payment.captured', 'order.paid'):
            payment_entity = payload.get('payload', {}).get('payment', {}).get('entity', {})
            order_entity = payload.get('payload', {}).get('order', {}).get('entity', {})

            order_id = payment_entity.get('order_id') or order_entity.get('id')
            payment_id = payment_entity.get('id')
            amount_paise = payment_entity.get('amount') or order_entity.get('amount_paid') or order_entity.get('amount')
            currency = payment_entity.get('currency') or order_entity.get('currency')

            if not payment_id and order_id:
                # If order.paid arrived without payment entity, lookup existing payment_id from payment order
                existing_po = PaymentOrder.objects.filter(razorpay_order_id=order_id).first()
                if existing_po and existing_po.razorpay_payment_id:
                    payment_id = existing_po.razorpay_payment_id
                else:
                    payment_id = f"pay_webhook_order_{order_id[-8:]}"

            if order_id and payment_id:
                confirm_booking_after_verified_payment(
                    razorpay_order_id=order_id,
                    razorpay_payment_id=payment_id,
                    verified_amount_paise=amount_paise,
                    verified_currency=currency,
                    actor=actor,
                    ip_address=ip_address,
                    source='webhook'
                )

            event_log.status = 'processed'
            event_log.processed_at = timezone.now()
            event_log.save(update_fields=['status', 'processed_at'])
            return {"status": "processed", "event_id": event_id}

        elif event_type == 'payment.failed':
            payment_entity = payload.get('payload', {}).get('payment', {}).get('entity', {})
            order_id = payment_entity.get('order_id')
            payment_id = payment_entity.get('id')
            error_code = payment_entity.get('error_code', '')
            error_description = payment_entity.get('error_description', '')

            if order_id:
                payment_order = PaymentOrder.objects.filter(razorpay_order_id=order_id).first()
                if payment_order:
                    handle_failed_payment(
                        payment_order=payment_order,
                        razorpay_payment_id=payment_id,
                        error_code=error_code,
                        error_description=error_description,
                        actor=actor,
                        ip_address=ip_address,
                    )

            event_log.status = 'processed'
            event_log.processed_at = timezone.now()
            event_log.save(update_fields=['status', 'processed_at'])
            return {"status": "processed", "event_id": event_id}

        else:
            # Unhandled / Ignored event types
            event_log.status = 'ignored'
            event_log.processed_at = timezone.now()
            event_log.save(update_fields=['status', 'processed_at'])
            return {"status": "ignored", "event_id": event_id}

    except Exception as exc:
        event_log.status = 'failed'
        event_log.error_message = str(exc)
        event_log.save(update_fields=['status', 'error_message'])
        logger.error(f"Webhook processing failed for event {event_id}: {exc}", exc_info=True)
        raise exc


class PaymentReconciliationService:
    """
    Authoritative backend reconciliation service for detecting and resolving financial/booking state discrepancies.
    Non-destructive by default: only auto-resolves unambiguous states and flags ambiguous cases for administrative review.
    """

    @classmethod
    @transaction.atomic
    def reconcile_booking(
        cls,
        booking: Booking,
        auto_resolve: bool = True,
        actor=None,
        ip_address: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Reconciles payment and booking state for a single reservation.
        """
        booking = Booking.objects.select_for_update().select_related('customer', 'price_snapshot').get(id=booking.id)
        payment_orders = list(PaymentOrder.objects.select_for_update().filter(booking=booking).order_by('-created_at'))

        captured_orders = [po for po in payment_orders if po.status == 'captured']
        created_orders = [po for po in payment_orders if po.status == 'created']
        failed_orders = [po for po in payment_orders if po.status == 'failed']

        result = {
            "booking_reference": booking.booking_reference,
            "booking_status": booking.status,
            "captured_count": len(captured_orders),
            "created_count": len(created_orders),
            "failed_count": len(failed_orders),
            "discrepancies": [],
            "action_taken": "none",
            "resolved": True,
        }

        # Case 1: Payment captured but Booking is still HELD
        if captured_orders and booking.status == 'held':
            target_order = captured_orders[0]
            now = timezone.now()
            if booking.hold_expires_at and booking.hold_expires_at <= now:
                # Hold expired but payment was captured -> Requires admin review (cannot auto-confirm without inventory re-validation)
                result["discrepancies"].append({
                    "code": "DISCREPANCY_EXPIRED_HOLD_CAPTURED",
                    "message": f"Payment {target_order.razorpay_payment_id} was captured for booking {booking.booking_reference}, but the hold expired at {booking.hold_expires_at.isoformat()}.",
                    "severity": "high",
                })
                result["resolved"] = False
                result["action_taken"] = "flagged_for_admin_review"

                record_audit_log(
                    action='discrepancy_detected',
                    resource_type='PaymentReconciliation',
                    resource_id=str(target_order.id),
                    actor=actor,
                    old_values={'booking_status': booking.status, 'payment_status': target_order.status},
                    new_values={'flag': 'DISCREPANCY_EXPIRED_HOLD_CAPTURED'},
                    reason=f"Payment captured on expired hold for {booking.booking_reference}. Flagged for review.",
                    ip_address=ip_address,
                )
            else:
                # Hold is still active -> Safe to auto-confirm
                if auto_resolve:
                    try:
                        confirm_booking_after_verified_payment(
                            razorpay_order_id=target_order.razorpay_order_id,
                            razorpay_payment_id=target_order.razorpay_payment_id or "pay_reconciled",
                            actor=actor,
                            ip_address=ip_address,
                            source='reconciliation_auto_confirm'
                        )
                        result["action_taken"] = "auto_confirmed_booking"
                        result["booking_status"] = "confirmed"
                    except Exception as exc:
                        result["discrepancies"].append({
                            "code": "RECONCILIATION_CONFIRM_FAILED",
                            "message": f"Auto-confirmation failed during reconciliation: {exc}",
                            "severity": "high",
                        })
                        result["resolved"] = False

        # Case 2: Booking CONFIRMED but active PaymentOrder is still 'created'
        elif booking.status == 'confirmed' and created_orders and not captured_orders:
            result["discrepancies"].append({
                "code": "DISCREPANCY_CONFIRMED_UNPAID",
                "message": f"Booking {booking.booking_reference} is confirmed but has no captured PaymentOrder.",
                "severity": "medium",
            })
            result["resolved"] = False
            result["action_taken"] = "flagged_for_admin_review"

        # Case 3: Stale 'created' PaymentOrder on expired or cancelled booking
        elif booking.status in ('expired', 'cancelled') and created_orders:
            if auto_resolve:
                cancelled_count = 0
                for po in created_orders:
                    po.status = 'cancelled'
                    po.metadata['cancellation_reason'] = f"Auto-cancelled during reconciliation because booking is {booking.status}"
                    po.save(update_fields=['status', 'metadata', 'updated_at'])
                    cancelled_count += 1
                result["action_taken"] = f"cancelled_{cancelled_count}_stale_payment_orders"

        # Case 4: Superseded created orders when a captured order exists
        elif captured_orders and created_orders:
            if auto_resolve:
                for po in created_orders:
                    po.status = 'cancelled'
                    po.metadata['cancellation_reason'] = "Superseded by captured payment order"
                    po.save(update_fields=['status', 'metadata', 'updated_at'])
                result["action_taken"] = "cancelled_superseded_payment_orders"

        return result

    @classmethod
    def reconcile_all(
        cls,
        limit: int = 100,
        auto_resolve: bool = True,
        actor=None,
        ip_address: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Runs batch reconciliation across reservations with pending or recently modified payment orders.
        """
        # Select candidate bookings: recently created/updated bookings with payment orders
        candidate_booking_ids = Booking.objects.filter(
            payment_orders__isnull=False
        ).distinct().order_by('-updated_at')[:limit].values_list('id', flat=True)

        total_checked = 0
        reconciled_count = 0
        flagged_count = 0
        details = []

        for booking_id in candidate_booking_ids:
            try:
                booking = Booking.objects.get(id=booking_id)
                rec_res = cls.reconcile_booking(
                    booking=booking,
                    auto_resolve=auto_resolve,
                    actor=actor,
                    ip_address=ip_address
                )
                total_checked += 1
                if rec_res.get('discrepancies'):
                    flagged_count += 1
                elif rec_res.get('action_taken') != 'none':
                    reconciled_count += 1
                details.append(rec_res)
            except Exception as exc:
                logger.error(f"Reconciliation error on booking {booking_id}: {exc}", exc_info=True)

        return {
            "total_checked": total_checked,
            "reconciled_count": reconciled_count,
            "flagged_count": flagged_count,
            "details": details,
            "timestamp": timezone.now().isoformat(),
        }
