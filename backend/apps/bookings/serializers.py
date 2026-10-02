"""
Serializers for Bookings domain.
Handles temporary checkout hold creation, booking retrieval, and state inspection.
"""
from datetime import date, timedelta
from rest_framework import serializers

from apps.rooms.models import RoomCategory
from .models import Booking, BookingRoom


class BookingRoomItemInputSerializer(serializers.Serializer):
    """
    Validates a single room category line item in a hold request.
    """
    category_id = serializers.UUIDField(required=False)
    category_slug = serializers.CharField(required=False, max_length=50)
    category = serializers.CharField(required=False, max_length=50)
    room_quantity = serializers.IntegerField(required=False, default=1, min_value=1, max_value=50)

    def validate(self, attrs):
        cat_id = attrs.get('category_id')
        cat_slug = attrs.get('category_slug') or attrs.get('category')

        category_obj = None

        if cat_id:
            try:
                category_obj = RoomCategory.objects.get(id=cat_id)
            except RoomCategory.DoesNotExist:
                raise serializers.ValidationError({"category_id": f"RoomCategory with ID '{cat_id}' does not exist."})
        elif cat_slug:
            try:
                category_obj = RoomCategory.objects.get(slug=cat_slug)
            except RoomCategory.DoesNotExist:
                try:
                    category_obj = RoomCategory.objects.get(id=cat_slug)
                except Exception:
                    raise serializers.ValidationError({"category": f"RoomCategory '{cat_slug}' does not exist."})
        else:
            raise serializers.ValidationError({"category": "Either category_id, category_slug, or category must be specified."})

        attrs['resolved_category'] = category_obj
        return attrs


class BookingHoldCreateSerializer(serializers.Serializer):
    """
    Validates payload for POST /api/v1/bookings/hold/
    Supports both multi-room format (rooms list) and single-room convenience fields.
    """
    check_in = serializers.DateField(required=False)
    check_in_date = serializers.DateField(required=False)
    check_out = serializers.DateField(required=False)
    check_out_date = serializers.DateField(required=False)

    # Multi-room list
    rooms = BookingRoomItemInputSerializer(many=True, required=False)

    # Convenience single-room shorthand
    category = serializers.CharField(required=False, allow_blank=True)
    category_id = serializers.UUIDField(required=False)
    category_slug = serializers.CharField(required=False, allow_blank=True)
    room_quantity = serializers.IntegerField(required=False, min_value=1, max_value=50)

    guest_name = serializers.CharField(required=True, max_length=150)
    guest_phone = serializers.CharField(required=False, allow_blank=True, max_length=20, default="")
    guest_email = serializers.EmailField(required=False, allow_blank=True, default="")
    total_adults = serializers.IntegerField(required=False, default=1, min_value=1, max_value=100)
    total_children = serializers.IntegerField(required=False, default=0, min_value=0, max_value=100)
    special_requests = serializers.CharField(required=False, allow_blank=True, default="")
    source = serializers.ChoiceField(choices=Booking.SOURCE_CHOICES, default='website', required=False)

    def validate(self, attrs):
        check_in = attrs.get('check_in') or attrs.get('check_in_date')
        check_out = attrs.get('check_out') or attrs.get('check_out_date')

        if not check_in:
            raise serializers.ValidationError({"check_in": "check_in (or check_in_date) is required."})
        if not check_out:
            raise serializers.ValidationError({"check_out": "check_out (or check_out_date) is required."})

        if check_out <= check_in:
            raise serializers.ValidationError({"check_out": "Check-out date must be strictly after check-in date."})

        if (check_out - check_in) > timedelta(days=60):
            raise serializers.ValidationError({"check_out": "Maximum stay duration is 60 nights."})

        attrs['resolved_check_in'] = check_in
        attrs['resolved_check_out'] = check_out

        # Parse rooms list
        rooms_list = attrs.get('rooms', [])
        parsed_rooms = []

        if rooms_list:
            for item in rooms_list:
                parsed_rooms.append({
                    'category': item['resolved_category'],
                    'room_quantity': item.get('room_quantity', 1)
                })
        else:
            # Single-category shorthand
            cat_id = attrs.get('category_id')
            cat_slug = attrs.get('category_slug') or attrs.get('category')
            single_qty = attrs.get('room_quantity', 1)

            category_obj = None
            if cat_id:
                try:
                    category_obj = RoomCategory.objects.get(id=cat_id)
                except RoomCategory.DoesNotExist:
                    raise serializers.ValidationError({"category_id": f"RoomCategory with ID '{cat_id}' does not exist."})
            elif cat_slug:
                try:
                    category_obj = RoomCategory.objects.get(slug=cat_slug)
                except RoomCategory.DoesNotExist:
                    try:
                        category_obj = RoomCategory.objects.get(id=cat_slug)
                    except Exception:
                        raise serializers.ValidationError({"category": f"RoomCategory '{cat_slug}' does not exist."})

            if not category_obj:
                raise serializers.ValidationError({"rooms": "At least one room category must be requested."})

            parsed_rooms.append({
                'category': category_obj,
                'room_quantity': single_qty
            })

        attrs['resolved_rooms'] = parsed_rooms
        return attrs


class BookingRoomDetailSerializer(serializers.ModelSerializer):
    """
    Serializes individual booked room lines.
    """
    category_id = serializers.UUIDField(source='category.id', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_slug = serializers.CharField(source='category.slug', read_only=True)

    class Meta:
        model = BookingRoom
        fields = [
            'id',
            'category_id',
            'category_name',
            'category_slug',
            'room_quantity',
            'created_at',
        ]


class BookingDetailSerializer(serializers.ModelSerializer):
    """
    Public and customer-facing serializer for Booking records.
    Never exposes internal operational room numbers or staff audit fields.
    """
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    source_display = serializers.CharField(source='get_source_display', read_only=True)
    is_hold_valid = serializers.BooleanField(read_only=True)
    nights_count = serializers.IntegerField(read_only=True)
    total_rooms_count = serializers.IntegerField(read_only=True)
    rooms = BookingRoomDetailSerializer(many=True, read_only=True)

    class Meta:
        model = Booking
        fields = [
            'booking_reference',
            'access_token',
            'status',
            'status_display',
            'is_hold_valid',
            'hold_expires_at',
            'check_in_date',
            'check_out_date',
            'nights_count',
            'total_adults',
            'total_children',
            'total_rooms_count',
            'guest_name',
            'guest_phone',
            'guest_email',
            'special_requests',
            'source',
            'source_display',
            'rooms',
            'created_at',
            'updated_at',
        ]
