"""
Views for Payment domain (/api/v1/payments/).
Handles Razorpay order creation, payment verification, asynchronous webhooks,
and administrative state reconciliation.
"""
import json
import logging
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response

from apps.bookings.models import Booking
from apps.bookings.views import _check_booking_authorization, _get_client_ip
from apps.bookings.services import transition_booking_status
from .models import PaymentOrder
from .serializers import (
    PaymentOrderCreateSerializer,
    PaymentOrderResponseSerializer,
    PaymentVerificationSerializer,
    PaymentVerificationResponseSerializer,
    PaymentReconciliationRequestSerializer,
)
from .services import (
    RazorpayPaymentProvider,
    create_advance_payment_order,
    confirm_booking_after_verified_payment,
    process_razorpay_webhook_event,
    PaymentReconciliationService,
    PaymentProviderException,
)

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([AllowAny])
def payment_order_create(request):
    """
    POST /api/v1/payments/orders/
    Generates an authoritative Razorpay payment order for a HELD reservation.
    Requires booking ownership (authenticated user or valid unguessable access token).
    Monetary amounts are NEVER accepted from the client.
    """
    serializer = PaymentOrderCreateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Invalid payment order request parameters.",
                "details": serializer.errors
            }
        }, status=status.HTTP_400_BAD_REQUEST)

    booking_reference = serializer.validated_data['booking_reference']
    idempotency_key = serializer.validated_data.get('idempotency_key', '')

    # 1. Lookup target booking
    booking = get_object_or_404(
        Booking.objects.select_related('customer', 'price_snapshot')
        .prefetch_related('rooms__category', 'guest_roster'),
        booking_reference=booking_reference
    )

    # 2. Authorization check
    if not _check_booking_authorization(booking, request):
        return Response({
            "success": False,
            "error": {
                "code": "PERMISSION_DENIED",
                "message": "Valid access token or authenticated customer ownership is required to initialize payment."
            }
        }, status=status.HTTP_403_FORBIDDEN)

    actor = request.user if request.user.is_authenticated else None
    ip_address = _get_client_ip(request)

    # 3. Create or retrieve active PaymentOrder
    try:
        payment_order = create_advance_payment_order(
            booking=booking,
            actor=actor,
            ip_address=ip_address,
            idempotency_key=idempotency_key,
        )
    except DjangoValidationError as exc:
        details = exc.message_dict if hasattr(exc, 'message_dict') else (exc.messages if hasattr(exc, 'messages') else str(exc))
        code = "VALIDATION_ERROR"
        msg = str(exc)
        if isinstance(details, dict):
            code = details.get("code", ["VALIDATION_ERROR"])[0] if "code" in details else "VALIDATION_ERROR"
            msg = details.get("booking", details.get("payment", [str(exc)]))[0] if ("booking" in details or "payment" in details) else str(exc)
        return Response({
            "success": False,
            "error": {
                "code": code,
                "message": msg,
                "details": details
            }
        }, status=status.HTTP_400_BAD_REQUEST)
    except PaymentProviderException as exc:
        return Response({
            "success": False,
            "error": {
                "code": exc.code,
                "message": exc.message,
            }
        }, status=status.HTTP_502_BAD_GATEWAY)

    resp_serializer = PaymentOrderResponseSerializer(payment_order)
    return Response({
        "success": True,
        "data": resp_serializer.data,
        "meta": {
            "timestamp": timezone.now().isoformat()
        }
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def payment_verify(request):
    """
    POST /api/v1/payments/verify/
    Verifies cryptographic payment signature from Razorpay Checkout,
    validates financial consistency, and atomically confirms the reservation.
    """
    serializer = PaymentVerificationSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Invalid payment verification parameters.",
                "details": serializer.errors
            }
        }, status=status.HTTP_400_BAD_REQUEST)

    order_id = serializer.validated_data['razorpay_order_id']
    payment_id = serializer.validated_data['razorpay_payment_id']
    signature = serializer.validated_data['razorpay_signature']

    # 1. Cryptographic HMAC-SHA256 Signature Verification
    if not RazorpayPaymentProvider.verify_payment_signature(
        razorpay_order_id=order_id,
        razorpay_payment_id=payment_id,
        razorpay_signature=signature
    ):
        return Response({
            "success": False,
            "error": {
                "code": "PAYMENT_SIGNATURE_INVALID",
                "message": "Cryptographic payment signature verification failed."
            }
        }, status=status.HTTP_400_BAD_REQUEST)

    # 2. Locate PaymentOrder
    payment_order = PaymentOrder.objects.select_related('booking', 'booking__customer', 'booking__price_snapshot').filter(razorpay_order_id=order_id).first()
    if not payment_order:
        return Response({
            "success": False,
            "error": {
                "code": "PAYMENT_NOT_FOUND",
                "message": f"No payment order found for gateway order ID '{order_id}'."
            }
        }, status=status.HTTP_404_NOT_FOUND)

    # 3. Ownership / Authorization verification
    if not _check_booking_authorization(payment_order.booking, request):
        return Response({
            "success": False,
            "error": {
                "code": "PERMISSION_DENIED",
                "message": "You are not authorized to verify payment for this reservation."
            }
        }, status=status.HTTP_403_FORBIDDEN)

    actor = request.user if request.user.is_authenticated else None
    ip_address = _get_client_ip(request)

    # 4. Atomic Booking Confirmation
    try:
        result = confirm_booking_after_verified_payment(
            razorpay_order_id=order_id,
            razorpay_payment_id=payment_id,
            razorpay_signature=signature,
            actor=actor,
            ip_address=ip_address,
            source='verification_api'
        )
    except DjangoValidationError as exc:
        details = exc.message_dict if hasattr(exc, 'message_dict') else (exc.messages if hasattr(exc, 'messages') else str(exc))
        code = "VALIDATION_ERROR"
        msg = str(exc)
        if isinstance(details, dict):
            code = details.get("code", ["VALIDATION_ERROR"])[0] if "code" in details else "VALIDATION_ERROR"
            msg = details.get("booking", details.get("payment", [str(exc)]))[0] if ("booking" in details or "payment" in details) else str(exc)

        if code == "HOLD_EXPIRED" and payment_order and payment_order.booking:
            try:
                transition_booking_status(
                    booking=payment_order.booking,
                    target_status='expired',
                    reason="Hold expired before payment verification completed"
                )
            except Exception:
                pass

        return Response({
            "success": False,
            "error": {
                "code": code,
                "message": msg,
                "details": details
            }
        }, status=status.HTTP_400_BAD_REQUEST)

    resp_serializer = PaymentVerificationResponseSerializer(result['payment_order'])
    return Response({
        "success": True,
        "data": resp_serializer.data,
        "meta": {
            "already_confirmed": result.get('already_confirmed', False),
            "timestamp": timezone.now().isoformat()
        }
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def razorpay_webhook(request):
    """
    POST /api/v1/payments/webhook/razorpay/
    Asynchronous webhook listener for Razorpay gateway events.
    Verifies raw HMAC-SHA256 signature and processes events idempotently.
    """
    signature = request.headers.get('X-Razorpay-Signature') or request.META.get('HTTP_X_RAZORPAY_SIGNATURE', '')
    if not signature:
        return Response({
            "success": False,
            "error": {
                "code": "WEBHOOK_SIGNATURE_MISSING",
                "message": "Missing X-Razorpay-Signature header."
            }
        }, status=status.HTTP_400_BAD_REQUEST)

    raw_body = request.body
    try:
        payload = json.loads(raw_body.decode('utf-8'))
    except Exception as exc:
        return Response({
            "success": False,
            "error": {
                "code": "INVALID_JSON_PAYLOAD",
                "message": f"Malformed webhook JSON body: {exc}"
            }
        }, status=status.HTTP_400_BAD_REQUEST)

    ip_address = _get_client_ip(request)

    try:
        res = process_razorpay_webhook_event(
            payload=payload,
            raw_body=raw_body,
            signature=signature,
            actor=None,
            ip_address=ip_address,
        )
        return Response({
            "success": True,
            "data": res
        }, status=status.HTTP_200_OK)
    except DjangoValidationError as exc:
        details = exc.message_dict if hasattr(exc, 'message_dict') else str(exc)
        code = details.get("code", ["WEBHOOK_ERROR"])[0] if isinstance(details, dict) and "code" in details else "WEBHOOK_ERROR"
        return Response({
            "success": False,
            "error": {
                "code": code,
                "message": str(exc),
                "details": details
            }
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as exc:
        logger.error(f"Unhandled webhook error: {exc}", exc_info=True)
        return Response({
            "success": False,
            "error": {
                "code": "WEBHOOK_PROCESSING_ERROR",
                "message": "Internal error processing webhook event."
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def payment_reconcile(request):
    """
    POST /api/v1/payments/reconcile/
    Administrative endpoint for reconciling payment and booking state discrepancies.
    Restricted to authenticated staff / admin users.
    """
    serializer = PaymentReconciliationRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Invalid reconciliation parameters.",
                "details": serializer.errors
            }
        }, status=status.HTTP_400_BAD_REQUEST)

    booking_reference = serializer.validated_data.get('booking_reference', '').strip().upper()
    auto_resolve = serializer.validated_data.get('auto_resolve', True)
    limit = serializer.validated_data.get('limit', 50)
    actor = request.user
    ip_address = _get_client_ip(request)

    if booking_reference:
        booking = get_object_or_404(Booking, booking_reference=booking_reference)
        result = PaymentReconciliationService.reconcile_booking(
            booking=booking,
            auto_resolve=auto_resolve,
            actor=actor,
            ip_address=ip_address
        )
        return Response({
            "success": True,
            "data": result
        }, status=status.HTTP_200_OK)
    else:
        result = PaymentReconciliationService.reconcile_all(
            limit=limit,
            auto_resolve=auto_resolve,
            actor=actor,
            ip_address=ip_address
        )
        return Response({
            "success": True,
            "data": result
        }, status=status.HTTP_200_OK)
