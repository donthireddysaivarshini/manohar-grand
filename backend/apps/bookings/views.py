"""
Views for Booking domain (/api/v1/bookings/).
Handles temporary checkout hold creation, secure reservation lookup, and hold release.
"""
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import Booking
from .serializers import (
    BookingHoldCreateSerializer,
    BookingDetailSerializer,
    CustomerBookingListSerializer,
)
from .services import (
    create_booking_hold,
    release_booking_hold,
    InsufficientInventoryException,
)


def _get_client_ip(request):
    """Utility to extract client IP address for audit records."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


def _check_booking_authorization(booking: Booking, request) -> bool:
    """
    Evaluates whether the request is authorized to view or modify this booking.
    Authorized if:
    1. Authenticated user is Staff (Receptionist, Manager, SuperAdmin).
    2. Authenticated user is the Booking customer.
    3. Unguessable access_token matches ?token= query param or X-Booking-Token header.
    """
    if request.user.is_authenticated:
        if request.user.is_staff or getattr(request.user, 'is_superuser', False):
            return True
        if booking.customer_id and booking.customer_id == request.user.id:
            return True

    token_param = request.query_params.get('token') or request.headers.get('X-Booking-Token')
    if token_param and str(booking.access_token) == str(token_param).strip():
        return True

    return False


@api_view(['POST'])
@permission_classes([AllowAny])
def booking_create_hold(request):
    """
    POST /api/v1/bookings/hold/
    Atomically creates a temporary 15-minute checkout hold with double-booking prevention.
    Re-checks availability inside an atomic PostgreSQL transaction.
    """
    serializer = BookingHoldCreateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Invalid booking hold parameters.",
                "details": serializer.errors
            }
        }, status=status.HTTP_400_BAD_REQUEST)

    validated = serializer.validated_data
    customer = request.user if request.user.is_authenticated else None
    ip_address = _get_client_ip(request)

    try:
        booking = create_booking_hold(
            rooms_request=validated['resolved_rooms'],
            check_in_date=validated['resolved_check_in'],
            check_out_date=validated['resolved_check_out'],
            guest_name=validated['guest_name'],
            guest_phone=validated.get('guest_phone', ''),
            guest_email=validated.get('guest_email', ''),
            total_adults=validated.get('total_adults', 1),
            total_children=validated.get('total_children', 0),
            special_requests=validated.get('special_requests', ''),
            source=validated.get('source', 'website'),
            customer=customer,
            ip_address=ip_address,
        )
    except InsufficientInventoryException as exc:
        return Response({
            "success": False,
            "error": {
                "code": "INVENTORY_EXHAUSTED",
                "message": exc.message,
                "details": {
                    "category_id": exc.category_id,
                    "category_name": exc.category_name,
                    "requested_quantity": exc.requested,
                    "available_quantity": exc.available,
                    "check_in": exc.check_in.isoformat(),
                    "check_out": exc.check_out.isoformat(),
                }
            }
        }, status=status.HTTP_409_CONFLICT)
    except DjangoValidationError as exc:
        return Response({
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Validation failed during hold creation.",
                "details": exc.message_dict if hasattr(exc, 'message_dict') else str(exc)
            }
        }, status=status.HTTP_400_BAD_REQUEST)

    detail_serializer = BookingDetailSerializer(booking)
    return Response({
        "success": True,
        "data": detail_serializer.data,
        "meta": {
            "timestamp": timezone.now().isoformat()
        }
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([AllowAny])
def booking_detail_lookup(request, booking_reference):
    """
    GET /api/v1/bookings/{booking_reference}/
    Secure retrieval of reservation details.
    Requires ?token=<access_token> or authenticated customer ownership / staff role.
    """
    try:
        booking = Booking.objects.prefetch_related('rooms__category').get(
            booking_reference__iexact=booking_reference.strip()
        )
    except Booking.DoesNotExist:
        return Response({
            "success": False,
            "error": {
                "code": "NOT_FOUND",
                "message": f"Booking '{booking_reference}' was not found."
            }
        }, status=status.HTTP_404_NOT_FOUND)

    if not _check_booking_authorization(booking, request):
        return Response({
            "success": False,
            "error": {
                "code": "PERMISSION_DENIED",
                "message": "Valid access token or authenticated customer ownership is required to view this booking."
            }
        }, status=status.HTTP_403_FORBIDDEN)

    serializer = BookingDetailSerializer(booking)
    return Response({
        "success": True,
        "data": serializer.data,
        "meta": {
            "timestamp": timezone.now().isoformat()
        }
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def booking_hold_release(request, booking_reference):
    """
    POST /api/v1/bookings/{booking_reference}/release/ or /cancel/
    Explicitly releases an active temporary hold, making room capacity immediately available.
    Requires ?token=<access_token> or authenticated ownership.
    """
    try:
        booking = Booking.objects.get(booking_reference__iexact=booking_reference.strip())
    except Booking.DoesNotExist:
        return Response({
            "success": False,
            "error": {
                "code": "NOT_FOUND",
                "message": f"Booking '{booking_reference}' was not found."
            }
        }, status=status.HTTP_404_NOT_FOUND)

    if not _check_booking_authorization(booking, request):
        return Response({
            "success": False,
            "error": {
                "code": "PERMISSION_DENIED",
                "message": "Valid access token or authenticated customer ownership is required to release this hold."
            }
        }, status=status.HTTP_403_FORBIDDEN)

    if booking.status != 'held':
        return Response({
            "success": False,
            "error": {
                "code": "INVALID_STATE",
                "message": f"Cannot release booking {booking.booking_reference} because it is in '{booking.status}' status (must be 'held')."
            }
        }, status=status.HTTP_400_BAD_REQUEST)

    ip_address = _get_client_ip(request)
    actor = request.user if request.user.is_authenticated else None

    booking = release_booking_hold(booking, actor=actor, ip_address=ip_address)
    serializer = BookingDetailSerializer(booking)

    return Response({
        "success": True,
        "data": serializer.data,
        "meta": {
            "timestamp": timezone.now().isoformat()
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def customer_booking_list(request):
    """
    GET /api/v1/bookings/
    Authenticated customer views ONLY their own reservations.
    Derives customer ownership strictly from request.user.
    """
    user = request.user
    bookings = Booking.objects.filter(customer=user).prefetch_related('rooms__category').order_by('-created_at')

    serializer = CustomerBookingListSerializer(bookings, many=True)
    return Response({
        "success": True,
        "count": len(serializer.data),
        "data": serializer.data,
        "meta": {
            "timestamp": timezone.now().isoformat()
        }
    })
