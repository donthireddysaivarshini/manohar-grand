"""
Serializers for Room Rate Plans and Tax Rules.
"""
from decimal import Decimal
from rest_framework import serializers
from .models import RoomRatePlan, TaxRule, BookingPriceSnapshot


class RoomRatePlanPublicSerializer(serializers.ModelSerializer):
    """Public safe representation of active room rate plans."""
    category_slug = serializers.CharField(source='category.slug', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = RoomRatePlan
        fields = [
            'id',
            'category_slug',
            'category_name',
            'name',
            'currency',
            'base_price_per_night',
            'extra_adult_charge',
            'extra_child_charge',
            'late_checkout_hourly_rate',
            'effective_from',
            'effective_to',
        ]
        read_only_fields = fields


class RoomRatePlanAdminSerializer(serializers.ModelSerializer):
    """Admin CRUD serializer for room rate plans."""
    category_slug = serializers.CharField(source='category.slug', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = RoomRatePlan
        fields = [
            'id',
            'category',
            'category_slug',
            'category_name',
            'name',
            'currency',
            'base_price_per_night',
            'extra_adult_charge',
            'extra_child_charge',
            'late_checkout_hourly_rate',
            'effective_from',
            'effective_to',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'category_slug', 'category_name', 'created_at', 'updated_at']

    def validate_base_price_per_night(self, value):
        if value < Decimal('0.00'):
            raise serializers.ValidationError("Base price per night cannot be negative.")
        return value

    def validate_extra_adult_charge(self, value):
        if value < Decimal('0.00'):
            raise serializers.ValidationError("Extra adult charge cannot be negative.")
        return value

    def validate_extra_child_charge(self, value):
        if value < Decimal('0.00'):
            raise serializers.ValidationError("Extra child charge cannot be negative.")
        return value

    def validate_late_checkout_hourly_rate(self, value):
        if value < Decimal('0.00'):
            raise serializers.ValidationError("Late checkout hourly rate cannot be negative.")
        return value

    def validate(self, attrs):
        effective_from = attrs.get('effective_from', getattr(self.instance, 'effective_from', None))
        effective_to = attrs.get('effective_to', getattr(self.instance, 'effective_to', None))
        if effective_from and effective_to and effective_to < effective_from:
            raise serializers.ValidationError({"effective_to": "Effective end date cannot be earlier than effective start date."})
        return attrs


class TaxRulePublicSerializer(serializers.ModelSerializer):
    """Public safe representation of active tax rules."""
    class Meta:
        model = TaxRule
        fields = [
            'id',
            'name',
            'tax_rate',
            'tax_type',
            'effective_from',
            'effective_to',
        ]
        read_only_fields = fields


class TaxRuleAdminSerializer(serializers.ModelSerializer):
    """Admin CRUD serializer for tax rules."""
    class Meta:
        model = TaxRule
        fields = [
            'id',
            'name',
            'tax_rate',
            'tax_type',
            'effective_from',
            'effective_to',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_tax_rate(self, value):
        if value < Decimal('0.00'):
            raise serializers.ValidationError("Tax rate cannot be negative.")
        return value

    def validate(self, attrs):
        tax_type = attrs.get('tax_type', getattr(self.instance, 'tax_type', 'percentage'))
        tax_rate = attrs.get('tax_rate', getattr(self.instance, 'tax_rate', Decimal('0.00')))
        if tax_type == 'percentage' and tax_rate > Decimal('100.00'):
            raise serializers.ValidationError({"tax_rate": "Percentage tax rate cannot exceed 100%."})

        effective_from = attrs.get('effective_from', getattr(self.instance, 'effective_from', None))
        effective_to = attrs.get('effective_to', getattr(self.instance, 'effective_to', None))
        if effective_from and effective_to and effective_to < effective_from:
            raise serializers.ValidationError({"effective_to": "Effective end date cannot be earlier than effective start date."})
        return attrs


class PricingRoomItemInputSerializer(serializers.Serializer):
    """Input serializer for a room category line item in pricing calculation."""
    category = serializers.CharField(
        help_text="RoomCategory UUID or unique slug (e.g. 'ac-room', 'non-ac-room')"
    )
    room_quantity = serializers.IntegerField(
        default=1,
        min_value=1,
        help_text="Number of rooms requested for this category (minimum 1)"
    )


class PricingQuoteRequestSerializer(serializers.Serializer):
    """Input serializer for public authoritative price calculation / quote."""
    check_in_date = serializers.DateField(
        help_text="Arrival date (YYYY-MM-DD)"
    )
    check_out_date = serializers.DateField(
        help_text="Departure date (YYYY-MM-DD)"
    )
    rooms = serializers.ListField(
        child=PricingRoomItemInputSerializer(),
        allow_empty=False,
        help_text="List of requested room categories and quantities"
    )
    total_adults = serializers.IntegerField(
        default=1,
        min_value=1,
        help_text="Total adult occupants across all booked rooms"
    )
    total_children = serializers.IntegerField(
        default=0,
        min_value=0,
        help_text="Total child occupants across all booked rooms"
    )
    late_checkout_hours = serializers.IntegerField(
        default=0,
        min_value=0,
        max_value=3,
        help_text="Optional late checkout hours (0 to 3 hours maximum)"
    )

    def validate(self, attrs):
        if attrs['check_out_date'] <= attrs['check_in_date']:
            raise serializers.ValidationError({"check_out_date": "Check-out date must be strictly after check-in date."})
        return attrs


class BookingPriceSnapshotSerializer(serializers.ModelSerializer):
    """Serializer for immutable BookingPriceSnapshot representation."""
    booking_reference = serializers.CharField(source='booking.booking_reference', read_only=True)
    extra_adult_total = serializers.SerializerMethodField()
    extra_child_total = serializers.SerializerMethodField()
    extra_adults = serializers.SerializerMethodField()
    extra_children = serializers.SerializerMethodField()
    extra_adult_rate = serializers.SerializerMethodField()
    extra_child_rate = serializers.SerializerMethodField()
    included_adults = serializers.SerializerMethodField()
    included_children = serializers.SerializerMethodField()

    def _get_itemized(self, obj, key, default):
        if obj.itemized_breakdown and isinstance(obj.itemized_breakdown, dict):
            return obj.itemized_breakdown.get(key, default)
        return default

    def get_extra_adult_total(self, obj):
        return self._get_itemized(obj, 'extra_adult_total', '0.00')

    def get_extra_child_total(self, obj):
        return self._get_itemized(obj, 'extra_child_total', '0.00')

    def get_extra_adults(self, obj):
        return self._get_itemized(obj, 'extra_adults', 0)

    def get_extra_children(self, obj):
        return self._get_itemized(obj, 'extra_children', 0)

    def get_extra_adult_rate(self, obj):
        return self._get_itemized(obj, 'extra_adult_rate', '350.00')

    def get_extra_child_rate(self, obj):
        return self._get_itemized(obj, 'extra_child_rate', '300.00')

    def get_included_adults(self, obj):
        return self._get_itemized(obj, 'included_adults', 2)

    def get_included_children(self, obj):
        return self._get_itemized(obj, 'included_children', 1)

    class Meta:
        model = BookingPriceSnapshot
        fields = [
            'id',
            'booking_reference',
            'currency',
            'room_subtotal',
            'extra_guest_total',
            'extra_adult_total',
            'extra_child_total',
            'extra_adults',
            'extra_children',
            'extra_adult_rate',
            'extra_child_rate',
            'included_adults',
            'included_children',
            'late_checkout_total',
            'miscellaneous_charges',
            'discount_amount',
            'taxable_subtotal',
            'tax_rule_name',
            'tax_rate_percent',
            'tax_amount',
            'gross_total',
            'advance_amount_due',
            'balance_amount_due',
            'itemized_breakdown',
            'created_at',
            'updated_at',
        ]
        read_only_fields = fields

