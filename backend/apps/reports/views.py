"""
DRF Views for Admin Reports & Operational Analytics (/api/v1/admin/reports/).
Enforces strict server-side RBAC and read-only execution.
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from apps.authentication.permissions import (
    IsStaffUser,
    IsManagerOrAbove,
    IsReceptionistOrAbove,
    IsSuperAdmin,
)
from .serializers import (
    DateRangeFilterSerializer,
    BookingReportFilterSerializer,
    PaymentReportFilterSerializer,
    FrontDeskReportFilterSerializer,
    OverbookingReportFilterSerializer,
    ReconciliationReportFilterSerializer,
)
from .services import ReportingService


@api_view(['GET'])
@permission_classes([IsReceptionistOrAbove])
def report_overview(request):
    """
    GET /api/v1/admin/reports/overview/
    High-level operational and financial KPI summary.
    """
    serializer = DateRangeFilterSerializer(data=request.query_params)
    if not serializer.is_valid():
        return Response({"success": False, "error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    from_d = serializer.validated_data.get('from_date')
    to_d = serializer.validated_data.get('to_date')

    data = ReportingService.get_overview_kpis(
        from_date_str=from_d.isoformat() if from_d else None,
        to_date_str=to_d.isoformat() if to_d else None
    )
    return Response({"success": True, "data": data}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsReceptionistOrAbove])
def report_bookings(request):
    """
    GET /api/v1/admin/reports/bookings/
    Comprehensive booking analysis with status, source, and category filters.
    """
    serializer = BookingReportFilterSerializer(data=request.query_params)
    if not serializer.is_valid():
        return Response({"success": False, "error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    validated = serializer.validated_data
    from_d = validated.get('from_date')
    to_d = validated.get('to_date')

    data = ReportingService.get_booking_report(
        from_date_str=from_d.isoformat() if from_d else None,
        to_date_str=to_d.isoformat() if to_d else None,
        status=validated.get('status'),
        source=validated.get('source'),
        category_slug=validated.get('category_slug'),
        date_dimension=validated.get('date_dimension', 'created_at'),
        page=validated.get('page', 1),
        page_size=validated.get('page_size', 20),
    )
    return Response({"success": True, "data": data}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsReceptionistOrAbove])
def report_occupancy(request):
    """
    GET /api/v1/admin/reports/occupancy/
    Room-night occupancy report across physical inventory.
    """
    serializer = DateRangeFilterSerializer(data=request.query_params)
    if not serializer.is_valid():
        return Response({"success": False, "error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    from_d = serializer.validated_data.get('from_date')
    to_d = serializer.validated_data.get('to_date')
    category_slug = serializer.validated_data.get('category_slug')

    data = ReportingService.get_occupancy_report(
        from_date_str=from_d.isoformat() if from_d else None,
        to_date_str=to_d.isoformat() if to_d else None,
        category_slug=category_slug
    )
    return Response({"success": True, "data": data}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsManagerOrAbove])
def report_category_performance(request):
    """
    GET /api/v1/admin/reports/categories/
    Performance analysis per active room category.
    """
    serializer = DateRangeFilterSerializer(data=request.query_params)
    if not serializer.is_valid():
        return Response({"success": False, "error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    from_d = serializer.validated_data.get('from_date')
    to_d = serializer.validated_data.get('to_date')

    data = ReportingService.get_category_performance_report(
        from_date_str=from_d.isoformat() if from_d else None,
        to_date_str=to_d.isoformat() if to_d else None
    )
    return Response({"success": True, "data": data}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsManagerOrAbove])
def report_revenue(request):
    """
    GET /api/v1/admin/reports/revenue/
    Authoritative financial and revenue breakdown from BookingPriceSnapshot.
    """
    serializer = BookingReportFilterSerializer(data=request.query_params)
    if not serializer.is_valid():
        return Response({"success": False, "error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    validated = serializer.validated_data
    from_d = validated.get('from_date')
    to_d = validated.get('to_date')

    data = ReportingService.get_revenue_report(
        from_date_str=from_d.isoformat() if from_d else None,
        to_date_str=to_d.isoformat() if to_d else None,
        date_dimension=validated.get('date_dimension', 'created_at')
    )
    return Response({"success": True, "data": data}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsManagerOrAbove])
def report_payments(request):
    """
    GET /api/v1/admin/reports/payments/
    Authoritative gateway payment audit and order reconciliation metrics.
    """
    serializer = PaymentReportFilterSerializer(data=request.query_params)
    if not serializer.is_valid():
        return Response({"success": False, "error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    validated = serializer.validated_data
    from_d = validated.get('from_date')
    to_d = validated.get('to_date')

    data = ReportingService.get_payment_report(
        from_date_str=from_d.isoformat() if from_d else None,
        to_date_str=to_d.isoformat() if to_d else None,
        status=validated.get('status'),
        purpose=validated.get('purpose'),
        page=validated.get('page', 1),
        page_size=validated.get('page_size', 20),
    )
    return Response({"success": True, "data": data}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsReceptionistOrAbove])
def report_frontdesk(request):
    """
    GET /api/v1/admin/reports/frontdesk/
    Front desk operational daily manifest (Arrivals, Departures, In-house, No-shows).
    """
    serializer = FrontDeskReportFilterSerializer(data=request.query_params)
    if not serializer.is_valid():
        return Response({"success": False, "error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    target_d = serializer.validated_data.get('target_date')

    data = ReportingService.get_frontdesk_report(
        target_date_str=target_d.isoformat() if target_d else None
    )
    return Response({"success": True, "data": data}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsManagerOrAbove])
def report_sources(request):
    """
    GET /api/v1/admin/reports/sources/
    Acquisition channel and source breakdown report.
    """
    serializer = DateRangeFilterSerializer(data=request.query_params)
    if not serializer.is_valid():
        return Response({"success": False, "error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    from_d = serializer.validated_data.get('from_date')
    to_d = serializer.validated_data.get('to_date')

    data = ReportingService.get_booking_source_report(
        from_date_str=from_d.isoformat() if from_d else None,
        to_date_str=to_d.isoformat() if to_d else None
    )
    return Response({"success": True, "data": data}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsReceptionistOrAbove])
def report_room_utilization(request):
    """
    GET /api/v1/admin/reports/rooms/utilization/
    Physical room unit utilization and maintenance metrics.
    """
    serializer = DateRangeFilterSerializer(data=request.query_params)
    if not serializer.is_valid():
        return Response({"success": False, "error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    from_d = serializer.validated_data.get('from_date')
    to_d = serializer.validated_data.get('to_date')
    category_slug = serializer.validated_data.get('category_slug')

    data = ReportingService.get_room_utilization_report(
        from_date_str=from_d.isoformat() if from_d else None,
        to_date_str=to_d.isoformat() if to_d else None,
        category_slug=category_slug
    )
    return Response({"success": True, "data": data}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsManagerOrAbove])
def report_overbookings(request):
    """
    GET /api/v1/admin/reports/overbookings/
    Audit report of administrative overbooking overrides.
    """
    serializer = OverbookingReportFilterSerializer(data=request.query_params)
    if not serializer.is_valid():
        return Response({"success": False, "error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    validated = serializer.validated_data
    from_d = validated.get('from_date')
    to_d = validated.get('to_date')

    data = ReportingService.get_overbooking_report(
        from_date_str=from_d.isoformat() if from_d else None,
        to_date_str=to_d.isoformat() if to_d else None,
        page=validated.get('page', 1),
        page_size=validated.get('page_size', 20),
    )
    return Response({"success": True, "data": data}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsManagerOrAbove])
def report_reconciliation(request):
    """
    GET /api/v1/admin/reports/reconciliation/
    Read-only inspection of detected payment state reconciliation discrepancies.
    """
    serializer = ReconciliationReportFilterSerializer(data=request.query_params)
    if not serializer.is_valid():
        return Response({"success": False, "error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    limit = serializer.validated_data.get('limit', 50)
    data = ReportingService.get_reconciliation_report(limit=limit)
    return Response({"success": True, "data": data}, status=status.HTTP_200_OK)
