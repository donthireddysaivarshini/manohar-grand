"""
Serializers for Availability domain.
Handles query parameter validation and response serialization.
"""
from datetime import date, timedelta
from rest_framework import serializers

from apps.rooms.models import RoomCategory


class AvailabilitySearchQuerySerializer(serializers.Serializer):
    """
    Validates query parameters for GET /api/v1/availability/search/
    """
    check_in = serializers.DateField(required=True)
    check_out = serializers.DateField(required=True)
    category = serializers.CharField(required=False, allow_blank=True)
    category_id = serializers.UUIDField(required=False)
    rooms = serializers.IntegerField(required=False, default=1, min_value=1, max_value=50)
    adults = serializers.IntegerField(required=False, default=1, min_value=1, max_value=100)
    children = serializers.IntegerField(required=False, default=0, min_value=0, max_value=100)

    def validate(self, attrs):
        check_in = attrs.get('check_in')
        check_out = attrs.get('check_out')

        if check_out <= check_in:
            raise serializers.ValidationError({
                "check_out": "Check-out date must be strictly after check-in date."
            })

        if check_out - check_in > timedelta(days=60):
            raise serializers.ValidationError({
                "check_out": "Maximum searchable stay duration is 60 nights."
            })

        # Validate category if provided
        category_param = attrs.get('category')
        category_id = attrs.get('category_id')

        category_obj = None
        if category_id:
            try:
                category_obj = RoomCategory.objects.get(id=category_id)
            except RoomCategory.DoesNotExist:
                raise serializers.ValidationError({
                    "category_id": "Specified room category does not exist."
                })
        elif category_param:
            # Check by slug first, then by UUID if applicable
            try:
                category_obj = RoomCategory.objects.get(slug=category_param)
            except RoomCategory.DoesNotExist:
                try:
                    category_obj = RoomCategory.objects.get(id=category_param)
                except Exception:
                    raise serializers.ValidationError({
                        "category": f"Room category '{category_param}' does not exist."
                    })

        if category_obj:
            attrs['resolved_category'] = category_obj

        return attrs


class AvailabilityCalendarQuerySerializer(serializers.Serializer):
    """
    Validates query parameters for GET /api/v1/availability/calendar/
    """
    start_date = serializers.DateField(required=False)
    end_date = serializers.DateField(required=False)
    month = serializers.CharField(required=False, max_length=7)  # YYYY-MM
    category = serializers.CharField(required=False, allow_blank=True)
    category_id = serializers.UUIDField(required=False)

    def validate(self, attrs):
        start_date = attrs.get('start_date')
        end_date = attrs.get('end_date')
        month_str = attrs.get('month')

        if month_str and not (start_date and end_date):
            try:
                year, month = map(int, month_str.split('-'))
                if not (1 <= month <= 12):
                    raise ValueError
                # Start of month to start of next month
                first_day = date(year, month, 1)
                if month == 12:
                    next_month = date(year + 1, 1, 1)
                else:
                    next_month = date(year, month + 1, 1)
                attrs['start_date'] = first_day
                attrs['end_date'] = next_month
            except Exception:
                raise serializers.ValidationError({
                    "month": "Invalid month format. Expected 'YYYY-MM' (e.g. '2026-10')."
                })
        elif not start_date or not end_date:
            # Default to current month window if neither provided
            today = date.today()
            attrs['start_date'] = today
            attrs['end_date'] = today + timedelta(days=30)
        else:
            if end_date <= start_date:
                raise serializers.ValidationError({
                    "end_date": "end_date must be strictly after start_date."
                })
            if end_date - start_date > timedelta(days=90):
                raise serializers.ValidationError({
                    "end_date": "Maximum calendar window is 90 days."
                })

        category_param = attrs.get('category')
        category_id = attrs.get('category_id')

        category_obj = None
        if category_id:
            try:
                category_obj = RoomCategory.objects.get(id=category_id)
            except RoomCategory.DoesNotExist:
                raise serializers.ValidationError({
                    "category_id": "Specified room category does not exist."
                })
        elif category_param:
            try:
                category_obj = RoomCategory.objects.get(slug=category_param)
            except RoomCategory.DoesNotExist:
                try:
                    category_obj = RoomCategory.objects.get(id=category_param)
                except Exception:
                    raise serializers.ValidationError({
                        "category": f"Room category '{category_param}' does not exist."
                    })

        if category_obj:
            attrs['resolved_category'] = category_obj

        return attrs
