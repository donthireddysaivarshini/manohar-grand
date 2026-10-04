"""
Serializers for Admin Reports query parameters and response formats.
"""
from rest_framework import serializers


class DateRangeFilterSerializer(serializers.Serializer):
    """Base query parameter validator for date-filtered reports."""
    from_date = serializers.DateField(required=False, help_text="Start date (YYYY-MM-DD)")
    to_date = serializers.DateField(required=False, help_text="End date (YYYY-MM-DD)")
    category_slug = serializers.CharField(required=False, max_length=50, help_text="Filter by RoomCategory slug")


class BookingReportFilterSerializer(DateRangeFilterSerializer):
    """Filter parameters for Booking Report."""
    status = serializers.CharField(required=False, max_length=30)
    source = serializers.CharField(required=False, max_length=30)
    date_dimension = serializers.ChoiceField(
        choices=['created_at', 'check_in', 'check_out'],
        default='created_at',
        required=False
    )
    page = serializers.IntegerField(default=1, min_value=1, required=False)
    page_size = serializers.IntegerField(default=20, min_value=1, max_value=100, required=False)


class PaymentReportFilterSerializer(DateRangeFilterSerializer):
    """Filter parameters for Payment Report."""
    status = serializers.CharField(required=False, max_length=30)
    purpose = serializers.CharField(required=False, max_length=30)
    page = serializers.IntegerField(default=1, min_value=1, required=False)
    page_size = serializers.IntegerField(default=20, min_value=1, max_value=100, required=False)


class FrontDeskReportFilterSerializer(serializers.Serializer):
    """Filter parameters for Front Desk Manifest."""
    target_date = serializers.DateField(required=False, help_text="Operational manifest date (YYYY-MM-DD)")


class OverbookingReportFilterSerializer(DateRangeFilterSerializer):
    """Filter parameters for Overbooking Audit Report."""
    page = serializers.IntegerField(default=1, min_value=1, required=False)
    page_size = serializers.IntegerField(default=20, min_value=1, max_value=100, required=False)


class ReconciliationReportFilterSerializer(serializers.Serializer):
    """Filter parameters for Reconciliation Report."""
    limit = serializers.IntegerField(default=50, min_value=1, max_value=200, required=False)
