"""
Serializers for Room Categories, Amenities, Room Images, and Physical Rooms.
"""
from decimal import Decimal
from rest_framework import serializers
from .models import RoomCategory, PhysicalRoom, Amenity, RoomCategoryAmenity, RoomImage
from apps.pricing.models import RoomRatePlan


class AmenitySerializer(serializers.ModelSerializer):
    """Public representation of an amenity."""
    class Meta:
        model = Amenity
        fields = [
            'id',
            'name',
            'category',
            'description',
            'icon_name',
            'is_property_wide',
            'display_order',
        ]
        read_only_fields = fields


class RoomImageSerializer(serializers.ModelSerializer):
    """Public representation of active room category imagery."""
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = RoomImage
        fields = [
            'id',
            'image_url',
            'caption',
            'alt_text',
            'is_primary',
            'display_order',
            'is_active',
        ]
        read_only_fields = fields

    def get_image_url(self, obj) -> str:
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return obj.image_url or ''


class RoomCategoryAmenitySerializer(serializers.ModelSerializer):
    """Representation of an amenity attached to a category with highlight flag."""
    id = serializers.UUIDField(source='amenity.id', read_only=True)
    name = serializers.CharField(source='amenity.name', read_only=True)
    category = serializers.CharField(source='amenity.category', read_only=True)
    icon_name = serializers.CharField(source='amenity.icon_name', read_only=True)
    description = serializers.CharField(source='amenity.description', read_only=True)
    is_property_wide = serializers.BooleanField(source='amenity.is_property_wide', read_only=True)

    class Meta:
        model = RoomCategoryAmenity
        fields = [
            'id',
            'name',
            'category',
            'icon_name',
            'description',
            'is_property_wide',
            'is_highlight',
            'display_order',
        ]
        read_only_fields = fields


class RoomCategoryListSerializer(serializers.ModelSerializer):
    """Public summary serializer for room category listings."""
    active_physical_room_count = serializers.ReadOnlyField()
    total_physical_room_count = serializers.ReadOnlyField()
    primary_image = serializers.SerializerMethodField()
    images = serializers.SerializerMethodField()
    amenities = serializers.SerializerMethodField()
    base_price_per_night = serializers.SerializerMethodField()
    currency = serializers.SerializerMethodField()

    class Meta:
        model = RoomCategory
        fields = [
            'id',
            'slug',
            'name',
            'tagline',
            'description',
            'included_adults',
            'included_children',
            'max_adults',
            'max_children',
            'max_total_occupancy',
            'active_physical_room_count',
            'total_physical_room_count',
            'primary_image',
            'images',
            'amenities',
            'base_price_per_night',
            'currency',
            'display_order',
        ]
        read_only_fields = fields

    def _get_active_rate_plan(self, obj):
        if not hasattr(obj, '_cached_rate_plan'):
            obj._cached_rate_plan = obj.rate_plans.filter(is_active=True).first()
        return obj._cached_rate_plan

    def get_base_price_per_night(self, obj) -> str:
        rate = self._get_active_rate_plan(obj)
        return str(rate.base_price_per_night) if rate else "0.00"

    def get_currency(self, obj) -> str:
        rate = self._get_active_rate_plan(obj)
        return rate.currency if rate else "INR"

    def get_primary_image(self, obj):
        primary = obj.images.filter(is_active=True, is_primary=True).first()
        if not primary:
            primary = obj.images.filter(is_active=True).order_by('display_order', 'created_at').first()
        if primary:
            return RoomImageSerializer(primary, context=self.context).data
        return None

    def get_images(self, obj):
        active_images = obj.images.filter(is_active=True).order_by('-is_primary', 'display_order', 'created_at')
        return RoomImageSerializer(active_images, many=True, context=self.context).data

    def get_amenities(self, obj):
        links = obj.category_amenity_links.filter(amenity__is_active=True).select_related('amenity')
        return RoomCategoryAmenitySerializer(links, many=True).data


class RoomCategoryDetailSerializer(RoomCategoryListSerializer):
    """Detailed public representation including complete tariff breakdown."""
    pricing_details = serializers.SerializerMethodField()

    class Meta(RoomCategoryListSerializer.Meta):
        fields = RoomCategoryListSerializer.Meta.fields + ['pricing_details']

    def get_pricing_details(self, obj):
        rate = self._get_active_rate_plan(obj)
        if rate:
            return {
                "rate_plan_name": rate.name,
                "currency": rate.currency,
                "base_price_per_night": str(rate.base_price_per_night),
                "extra_adult_charge": str(rate.extra_adult_charge),
                "extra_child_charge": str(rate.extra_child_charge),
                "late_checkout_hourly_rate": str(rate.late_checkout_hourly_rate),
                "effective_from": rate.effective_from.isoformat() if rate.effective_from else None,
                "effective_to": rate.effective_to.isoformat() if rate.effective_to else None,
            }
        return None


class PhysicalRoomAdminSerializer(serializers.ModelSerializer):
    """Admin CRUD serializer for physical room inventory."""
    category_slug = serializers.CharField(source='category.slug', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = PhysicalRoom
        fields = [
            'id',
            'category',
            'category_slug',
            'category_name',
            'room_number',
            'floor',
            'operational_status',
            'notes',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'category_slug', 'category_name']

    def validate_room_number(self, value):
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError("Room number cannot be blank.")
        
        # Check uniqueness excluding self on update
        query = PhysicalRoom.objects.filter(room_number=cleaned)
        if self.instance:
            query = query.exclude(pk=self.instance.pk)
        if query.exists():
            raise serializers.ValidationError(f"Physical room with number '{cleaned}' already exists.")
        return cleaned
