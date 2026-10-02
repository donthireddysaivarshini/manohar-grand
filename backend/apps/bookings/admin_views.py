"""
Admin Views for Bookings management (/api/v1/admin/bookings/).
Provides staff console endpoints for booking grids, room assignments, check-in, check-out,
walk-in booking creation, and SuperAdmin overbooking overrides.
"""
import uuid
from django.utils import timezone
from django.db.models import Q
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response

from apps.authentication.permissions import IsReceptionistOrAbove, IsSuperAdmin
from .models import Booking
from .serializers import (
    BookingAdminStaffListSerializer,
    BookingAdminStaffDetailSerializer,
    PhysicalRoomAssignmentSerializer,
    AdminWalkInCreateSerializer,
    AdminOverbookingCreateSerializer,
)
from .services import (
    assign_physical_rooms,
    admin_check_in_booking,
    admin_check_out_booking,
    admin_create_walkin_booking,
    admin_create_overbooking,
    InsufficientInventoryException,
)


def _get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


def _get_booking_or_404(identifier: str) -> Booking:
    identifier = identifier.strip()
    try:
        val = uuid.UUID(identifier)
        return Booking.objects.prefetch_related('rooms__category', 'rooms__physical_room').get(id=val)
    except (ValueError, AttributeError):
        pass
    return Booking.objects.prefetch_related('rooms__category', 'rooms__physical_room').get(booking_reference__iexact=identifier)


class AdminBookingListView(APIView):
    """
    GET /api/v1/admin/bookings/
    Staff reservations data grid with comprehensive search and filtering.
    """
    permission_classes = [IsReceptionistOrAbove]

    def get(self, request):
        queryset = Booking.objects.prefetch_related('rooms__category', 'rooms__physical_room').select_related('customer', 'created_by')

        status_param = request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param.strip().lower())

        source_param = request.query_params.get('source')
        if source_param:
            queryset = queryset.filter(source=source_param.strip().lower())

        check_in_date = request.query_params.get('check_in_date')
        if check_in_date:
            queryset = queryset.filter(check_in_date=check_in_date)

        check_out_date = request.query_params.get('check_out_date')
        if check_out_date:
            queryset = queryset.filter(check_out_date=check_out_date)

        category_id = request.query_params.get('category_id')
        if category_id:
            queryset = queryset.filter(rooms__category_id=category_id).distinct()

        search_query = request.query_params.get('search')
        if search_query:
            q = search_query.strip()
            queryset = queryset.filter(
                Q(booking_reference__icontains=q) |
                Q(guest_name__icontains=q) |
                Q(guest_phone__icontains=q) |
                Q(guest_email__icontains=q)
            ).distinct()

        serializer = BookingAdminStaffListSerializer(queryset, many=True)
        return Response({
            "success": True,
            "count": len(serializer.data),
            "data": serializer.data,
            "meta": {
                "timestamp": timezone.now().isoformat()
            }
        })


class AdminBookingDetailView(APIView):
    """
    GET /api/v1/admin/bookings/{identifier}/
    Staff detailed view of a single reservation by UUID or booking reference.
    """
    permission_classes = [IsReceptionistOrAbove]

    def get(self, request, identifier):
        try:
            booking = _get_booking_or_404(identifier)
        except Booking.DoesNotExist:
            return Response({
                "success": False,
                "error": {
                    "code": "NOT_FOUND",
                    "message": f"Booking '{identifier}' was not found."
                }
            }, status=status.HTTP_404_NOT_FOUND)

        serializer = BookingAdminStaffDetailSerializer(booking)
        return Response({
            "success": True,
            "data": serializer.data,
            "meta": {
                "timestamp": timezone.now().isoformat()
            }
        })


class AdminAssignRoomsView(APIView):
    """
    POST /api/v1/admin/bookings/{identifier}/assign-rooms/
    Assigns physical room door units to a reservation.
    """
    permission_classes = [IsReceptionistOrAbove]

    def post(self, request, identifier):
        try:
            booking = _get_booking_or_404(identifier)
        except Booking.DoesNotExist:
            return Response({
                "success": False,
                "error": {
                    "code": "NOT_FOUND",
                    "message": f"Booking '{identifier}' was not found."
                }
            }, status=status.HTTP_404_NOT_FOUND)

        serializer = PhysicalRoomAssignmentSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                "success": False,
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Invalid physical room assignment payload.",
                    "details": serializer.errors
                }
            }, status=status.HTTP_400_BAD_REQUEST)

        ip_address = _get_client_ip(request)
        room_identifiers = serializer.validated_data['resolved_room_identifiers']

        try:
            updated_booking = assign_physical_rooms(
                booking=booking,
                physical_room_identifiers=room_identifiers,
                staff_user=request.user,
                ip_address=ip_address,
            )
        except DjangoValidationError as exc:
            return Response({
                "success": False,
                "error": {
                    "code": "ASSIGNMENT_VALIDATION_ERROR",
                    "message": "Failed to assign physical rooms.",
                    "details": exc.message_dict if hasattr(exc, 'message_dict') else str(exc)
                }
            }, status=status.HTTP_400_BAD_REQUEST)

        detail_serializer = BookingAdminStaffDetailSerializer(updated_booking)
        return Response({
            "success": True,
            "data": detail_serializer.data,
            "meta": {
                "timestamp": timezone.now().isoformat()
            }
        })


class AdminCheckInView(APIView):
    """
    POST /api/v1/admin/bookings/{identifier}/check-in/
    Validates room assignment completeness and transitions booking status to 'checked_in'.
    """
    permission_classes = [IsReceptionistOrAbove]

    def post(self, request, identifier):
        try:
            booking = _get_booking_or_404(identifier)
        except Booking.DoesNotExist:
            return Response({
                "success": False,
                "error": {
                    "code": "NOT_FOUND",
                    "message": f"Booking '{identifier}' was not found."
                }
            }, status=status.HTTP_404_NOT_FOUND)

        ip_address = _get_client_ip(request)

        try:
            updated_booking = admin_check_in_booking(
                booking=booking,
                staff_user=request.user,
                ip_address=ip_address,
            )
        except DjangoValidationError as exc:
            return Response({
                "success": False,
                "error": {
                    "code": "CHECKIN_VALIDATION_ERROR",
                    "message": "Check-in validation failed.",
                    "details": exc.message_dict if hasattr(exc, 'message_dict') else str(exc)
                }
            }, status=status.HTTP_400_BAD_REQUEST)

        detail_serializer = BookingAdminStaffDetailSerializer(updated_booking)
        return Response({
            "success": True,
            "data": detail_serializer.data,
            "meta": {
                "timestamp": timezone.now().isoformat()
            }
        })


class AdminCheckOutView(APIView):
    """
    POST /api/v1/admin/bookings/{identifier}/check-out/
    Transitions booking status from 'checked_in' to 'checked_out'.
    """
    permission_classes = [IsReceptionistOrAbove]

    def post(self, request, identifier):
        try:
            booking = _get_booking_or_404(identifier)
        except Booking.DoesNotExist:
            return Response({
                "success": False,
                "error": {
                    "code": "NOT_FOUND",
                    "message": f"Booking '{identifier}' was not found."
                }
            }, status=status.HTTP_404_NOT_FOUND)

        ip_address = _get_client_ip(request)

        try:
            updated_booking = admin_check_out_booking(
                booking=booking,
                staff_user=request.user,
                ip_address=ip_address,
            )
        except DjangoValidationError as exc:
            return Response({
                "success": False,
                "error": {
                    "code": "CHECKOUT_VALIDATION_ERROR",
                    "message": "Check-out validation failed.",
                    "details": exc.message_dict if hasattr(exc, 'message_dict') else str(exc)
                }
            }, status=status.HTTP_400_BAD_REQUEST)

        detail_serializer = BookingAdminStaffDetailSerializer(updated_booking)
        return Response({
            "success": True,
            "data": detail_serializer.data,
            "meta": {
                "timestamp": timezone.now().isoformat()
            }
        })


class AdminWalkInBookingCreateView(APIView):
    """
    POST /api/v1/admin/bookings/walk-in/
    Staff offline reservation entry (walk_in, phone, whatsapp, reception, corporate).
    """
    permission_classes = [IsReceptionistOrAbove]

    def post(self, request):
        serializer = AdminWalkInCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                "success": False,
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Invalid walk-in booking parameters.",
                    "details": serializer.errors
                }
            }, status=status.HTTP_400_BAD_REQUEST)

        validated = serializer.validated_data
        ip_address = _get_client_ip(request)

        try:
            booking = admin_create_walkin_booking(
                rooms_request=validated['resolved_rooms'],
                check_in_date=validated['resolved_check_in'],
                check_out_date=validated['resolved_check_out'],
                guest_name=validated['guest_name'],
                guest_phone=validated.get('guest_phone', ''),
                guest_email=validated.get('guest_email', ''),
                total_adults=validated.get('total_adults', 1),
                total_children=validated.get('total_children', 0),
                special_requests=validated.get('special_requests', ''),
                internal_notes=validated.get('internal_notes', ''),
                source=validated.get('source', 'walk_in'),
                status='confirmed',
                physical_room_ids=validated.get('physical_room_ids', []),
                created_by=request.user,
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
                    }
                }
            }, status=status.HTTP_409_CONFLICT)
        except DjangoValidationError as exc:
            return Response({
                "success": False,
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Validation failed during walk-in booking creation.",
                    "details": exc.message_dict if hasattr(exc, 'message_dict') else str(exc)
                }
            }, status=status.HTTP_400_BAD_REQUEST)

        detail_serializer = BookingAdminStaffDetailSerializer(booking)
        return Response({
            "success": True,
            "data": detail_serializer.data,
            "meta": {
                "timestamp": timezone.now().isoformat()
            }
        }, status=status.HTTP_201_CREATED)


class AdminOverbookingCreateView(APIView):
    """
    POST /api/v1/admin/bookings/overbooking/
    SuperAdmin administrative capacity override.
    """
    permission_classes = [IsSuperAdmin]

    def post(self, request):
        serializer = AdminOverbookingCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                "success": False,
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Invalid overbooking parameters.",
                    "details": serializer.errors
                }
            }, status=status.HTTP_400_BAD_REQUEST)

        validated = serializer.validated_data
        ip_address = _get_client_ip(request)

        try:
            booking = admin_create_overbooking(
                rooms_request=validated['resolved_rooms'],
                check_in_date=validated['resolved_check_in'],
                check_out_date=validated['resolved_check_out'],
                guest_name=validated['guest_name'],
                guest_phone=validated.get('guest_phone', ''),
                guest_email=validated.get('guest_email', ''),
                total_adults=validated.get('total_adults', 1),
                total_children=validated.get('total_children', 0),
                special_requests=validated.get('special_requests', ''),
                internal_notes=validated.get('internal_notes', ''),
                source=validated.get('source', 'reception'),
                overbooking_reason=validated['overbooking_reason'],
                created_by=request.user,
                ip_address=ip_address,
            )
        except DjangoValidationError as exc:
            return Response({
                "success": False,
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Validation failed during overbooking creation.",
                    "details": exc.message_dict if hasattr(exc, 'message_dict') else str(exc)
                }
            }, status=status.HTTP_400_BAD_REQUEST)

        detail_serializer = BookingAdminStaffDetailSerializer(booking)
        return Response({
            "success": True,
            "data": detail_serializer.data,
            "meta": {
                "timestamp": timezone.now().isoformat()
            }
        }, status=status.HTTP_201_CREATED)
