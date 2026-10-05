"""
Serializers for Headless CMS Sections, FAQs, Gallery Media, and Hotel Configuration.
"""
from rest_framework import serializers
from .models import GalleryMedia, HotelConfiguration, CMSSection, FAQ


class GalleryMediaSerializer(serializers.ModelSerializer):
    """Public representation of active gallery media."""
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = GalleryMedia
        fields = [
            'id',
            'title',
            'category',
            'image_url',
            'caption',
            'alt_text',
            'is_featured',
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


class GalleryMediaAdminSerializer(serializers.ModelSerializer):
    """Admin representation of gallery media with upload support."""
    image_url_computed = serializers.SerializerMethodField()

    class Meta:
        model = GalleryMedia
        fields = [
            'id',
            'title',
            'category',
            'image',
            'image_url',
            'image_url_computed',
            'caption',
            'alt_text',
            'is_featured',
            'display_order',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'image_url_computed', 'created_at', 'updated_at']

    def get_image_url_computed(self, obj) -> str:
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return obj.image_url

    def validate(self, attrs):
        image = attrs.get('image', getattr(self.instance, 'image', None))
        image_url = attrs.get('image_url', getattr(self.instance, 'image_url', ''))
        if not image and not image_url:
            raise serializers.ValidationError("Either an uploaded image file or an image URL must be provided.")
        return attrs


class CMSSectionSerializer(serializers.ModelSerializer):
    """Public representation of active CMS sections."""
    class Meta:
        model = CMSSection
        fields = [
            'id',
            'section_key',
            'title',
            'subtitle',
            'body',
            'metadata',
            'display_order',
        ]
        read_only_fields = fields


class CMSSectionAdminSerializer(serializers.ModelSerializer):
    """Admin CRUD serializer for CMS sections."""
    class Meta:
        model = CMSSection
        fields = [
            'id',
            'section_key',
            'title',
            'subtitle',
            'body',
            'metadata',
            'display_order',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_section_key(self, value):
        cleaned = value.strip().lower()
        if not cleaned:
            raise serializers.ValidationError("Section key cannot be blank.")
        query = CMSSection.objects.filter(section_key=cleaned)
        if self.instance:
            query = query.exclude(pk=self.instance.pk)
        if query.exists():
            raise serializers.ValidationError(f"CMS section with key '{cleaned}' already exists.")
        return cleaned

    def validate_title(self, value):
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError("Section title cannot be blank.")
        return cleaned


class FAQSerializer(serializers.ModelSerializer):
    """Public representation of active FAQs."""
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = FAQ
        fields = [
            'id',
            'question',
            'answer',
            'category',
            'category_display',
            'display_order',
        ]
        read_only_fields = fields


class FAQAdminSerializer(serializers.ModelSerializer):
    """Admin CRUD serializer for FAQs."""
    class Meta:
        model = FAQ
        fields = [
            'id',
            'question',
            'answer',
            'category',
            'display_order',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_question(self, value):
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError("Question cannot be blank.")
        return cleaned

    def validate_answer(self, value):
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError("Answer cannot be blank.")
        return cleaned


class HotelConfigurationPublicSerializer(serializers.ModelSerializer):
    """Public safe representation of singleton hotel operational configuration."""
    class Meta:
        model = HotelConfiguration
        fields = [
            'hotel_name',
            'primary_phone',
            'secondary_phone',
            'email',
            'address',
            'near_landmark',
            'google_maps_url',
            'google_maps_embed_url',
            'standard_check_in_time',
            'standard_check_out_time',
            'max_late_checkout_hours',
            'cancellation_policy_text',
            'guest_id_policy_text',
            'age_policy_text',
        ]
        read_only_fields = fields


class HotelConfigurationAdminSerializer(serializers.ModelSerializer):
    """Admin serializer for singleton hotel configuration."""
    class Meta:
        model = HotelConfiguration
        fields = [
            'id',
            'hotel_name',
            'primary_phone',
            'secondary_phone',
            'email',
            'address',
            'near_landmark',
            'google_maps_url',
            'google_maps_embed_url',
            'standard_check_in_time',
            'standard_check_out_time',
            'max_late_checkout_hours',
            'cancellation_policy_text',
            'guest_id_policy_text',
            'age_policy_text',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
