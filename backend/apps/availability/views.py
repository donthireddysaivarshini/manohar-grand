"""
Views for Search and Availability domain (/api/v1/availability/).
Provides real-time room category availability derived from physical rooms and stay night consumption.
"""
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .serializers import (
    AvailabilitySearchQuerySerializer,
    AvailabilityCalendarQuerySerializer,
)
from .services import AvailabilityService


@api_view(['GET'])
@permission_classes([AllowAny])
def availability_search(request):
    """
    GET /api/v1/availability/search/
    Real-time multi-night room category availability search.
    Derived dynamically from PhysicalRoom baseline minus dated blocks and active bookings.
    """
    serializer = AvailabilitySearchQuerySerializer(data=request.query_params)
    if not serializer.is_valid():
        return Response({
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Invalid query parameters for availability search.",
                "details": serializer.errors
            }
        }, status=status.HTTP_400_BAD_REQUEST)

    validated = serializer.validated_data
    check_in = validated['check_in']
    check_out = validated['check_out']
    requested_rooms = validated.get('rooms', 1)
    resolved_category = validated.get('resolved_category')

    category_ids = [resolved_category.id] if resolved_category else None

    result = AvailabilityService.calculate_stay_availability(
        check_in=check_in,
        check_out=check_out,
        category_ids=category_ids,
        requested_quantity=requested_rooms,
    )

    return Response({
        "success": True,
        "data": result,
        "meta": {
            "timestamp": timezone.now().isoformat()
        }
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def availability_calendar(request):
    """
    GET /api/v1/availability/calendar/
    Grid-level daily room category availability overview for calendar view.
    """
    serializer = AvailabilityCalendarQuerySerializer(data=request.query_params)
    if not serializer.is_valid():
        return Response({
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Invalid query parameters for calendar availability.",
                "details": serializer.errors
            }
        }, status=status.HTTP_400_BAD_REQUEST)

    validated = serializer.validated_data
    start_date = validated['start_date']
    end_date = validated['end_date']
    resolved_category = validated.get('resolved_category')

    category_ids = [resolved_category.id] if resolved_category else None

    result = AvailabilityService.calculate_calendar_matrix(
        start_date=start_date,
        end_date=end_date,
        category_ids=category_ids,
    )

    return Response({
        "success": True,
        "data": result,
        "meta": {
            "timestamp": timezone.now().isoformat()
        }
    })
