"""
Serializers for Room Rate Plans and Tax Rules.
"""
from decimal import Decimal
from rest_framework import serializers
from .models import RoomRatePlan, TaxRule


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
