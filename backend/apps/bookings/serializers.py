"""
Serializers for Bookings domain.
Handles temporary checkout hold creation, booking retrieval, and state inspection.
"""
from datetime import date, timedelta
from rest_framework import serializers

from apps.rooms.models import RoomCategory, PhysicalRoom
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


class CustomerBookingListSerializer(serializers.ModelSerializer):
    """
    Serializer for authenticated customer booking list (GET /api/v1/bookings/).
    Exposes customer-relevant reservation data without internal staff notes.
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
            'source',
            'source_display',
            'rooms',
            'created_at',
        ]


class PhysicalRoomAssignmentSerializer(serializers.Serializer):
    """
    Validates payload for staff assigning physical rooms to a booking.
    Accepts physical_room_ids (list of UUIDs/room numbers) or physical_room_id (single).
    """
    physical_room_ids = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        default=list,
        help_text="List of physical room IDs or room numbers to assign (empty list clears assignments)"
    )
    physical_room_id = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text="Single physical room ID or room number to assign"
    )

    def validate(self, attrs):
        raw_list = list(attrs.get('physical_room_ids', []))
        single_val = attrs.get('physical_room_id')

        if single_val and str(single_val).strip():
            raw_list.append(str(single_val).strip())

        attrs['resolved_room_identifiers'] = raw_list
        return attrs


class PhysicalRoomBriefSerializer(serializers.ModelSerializer):
    """
    Staff-facing serializer for PhysicalRoom metadata on assignments.
    """
    class Meta:
        model = PhysicalRoom
        fields = [
            'id',
            'room_number',
            'floor',
            'operational_status',
        ]


class BookingRoomStaffSerializer(serializers.ModelSerializer):
    """
    Staff-facing serializer for Booked Room Items with physical room assignments.
    """
    category_id = serializers.UUIDField(source='category.id', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_slug = serializers.CharField(source='category.slug', read_only=True)
    physical_room = PhysicalRoomBriefSerializer(read_only=True)
    assigned_by_username = serializers.CharField(source='assigned_by.username', read_only=True)

    class Meta:
        model = BookingRoom
        fields = [
            'id',
            'category_id',
            'category_name',
            'category_slug',
            'room_quantity',
            'physical_room',
            'assigned_at',
            'assigned_by_username',
            'created_at',
        ]


class BookingAdminStaffListSerializer(serializers.ModelSerializer):
    """
    Staff-facing serializer for reservations data grid.
    """
    id = serializers.UUIDField(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    source_display = serializers.CharField(source='get_source_display', read_only=True)
    nights_count = serializers.IntegerField(read_only=True)
    total_rooms_count = serializers.IntegerField(read_only=True)
    assigned_rooms_count = serializers.IntegerField(read_only=True)
    is_fully_assigned = serializers.BooleanField(read_only=True)
    rooms = BookingRoomStaffSerializer(many=True, read_only=True)

    class Meta:
        model = Booking
        fields = [
            'id',
            'booking_reference',
            'status',
            'status_display',
            'check_in_date',
            'check_out_date',
            'nights_count',
            'guest_name',
            'guest_phone',
            'guest_email',
            'total_adults',
            'total_children',
            'total_rooms_count',
            'assigned_rooms_count',
            'is_fully_assigned',
            'source',
            'source_display',
            'is_overbooking',
            'rooms',
            'created_at',
            'updated_at',
        ]


class BookingAdminStaffDetailSerializer(serializers.ModelSerializer):
    """
    Staff-facing detailed serializer for a single reservation.
    Exposes full operational details, internal notes, audit fields, and assignment summary.
    """
    id = serializers.UUIDField(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    source_display = serializers.CharField(source='get_source_display', read_only=True)
    is_hold_valid = serializers.BooleanField(read_only=True)
    nights_count = serializers.IntegerField(read_only=True)
    total_rooms_count = serializers.IntegerField(read_only=True)
    assigned_rooms_count = serializers.IntegerField(read_only=True)
    is_fully_assigned = serializers.BooleanField(read_only=True)
    assignment_summary = serializers.DictField(read_only=True)
    rooms = BookingRoomStaffSerializer(many=True, read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = Booking
        fields = [
            'id',
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
            'assigned_rooms_count',
            'is_fully_assigned',
            'guest_name',
            'guest_phone',
            'guest_email',
            'special_requests',
            'internal_notes',
            'is_overbooking',
            'overbooking_reason',
            'source',
            'source_display',
            'created_by_username',
            'assignment_summary',
            'rooms',
            'created_at',
            'updated_at',
        ]


class AdminWalkInCreateSerializer(BookingHoldCreateSerializer):
    """
    Serializer for staff creating an offline booking (walk_in, phone, whatsapp, reception, corporate).
    """
    source = serializers.ChoiceField(
        choices=[
            ('walk_in', 'Front Desk Walk-In'),
            ('phone', 'Phone Reservation'),
            ('whatsapp', 'WhatsApp Direct'),
            ('reception', 'Front Desk Offline'),
            ('corporate', 'Corporate Bulk Deal'),
        ],
        default='walk_in'
    )
    internal_notes = serializers.CharField(required=False, allow_blank=True, default="")
    physical_room_ids = serializers.ListField(child=serializers.CharField(), required=False, default=list)


class AdminOverbookingCreateSerializer(AdminWalkInCreateSerializer):
    """
    Serializer for SuperAdmin overbooking override with mandatory justification.
    """
    overbooking_reason = serializers.CharField(
        required=True,
        allow_blank=False,
        help_text="Mandatory justification note for administrative capacity override"
    )
