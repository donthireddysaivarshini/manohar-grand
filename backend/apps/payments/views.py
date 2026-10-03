"""
Views for Payment domain (/api/v1/payments/).
Handles Razorpay order creation and payment initialization for reservations.
"""
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.bookings.models import Booking
from apps.bookings.views import _check_booking_authorization, _get_client_ip
from .serializers import PaymentOrderCreateSerializer, PaymentOrderResponseSerializer
from .services import create_advance_payment_order, PaymentProviderException


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
