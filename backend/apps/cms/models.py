import uuid
from django.db import models
from django.core.exceptions import ValidationError
from core.validators import validate_image_file


class GalleryMedia(models.Model):
    """
    Gallery Media model representing broader property photography, public spaces,
    and amenity highlights.
    """
    CATEGORY_CHOICES = [
        ('rooms', 'Guest Rooms'),
        ('property', 'Hotel Property'),
        ('amenities', 'Amenities'),
        ('exterior', 'Building & Reception'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(
        max_length=150,
        help_text="Title or label for the photo/media item"
    )
    category = models.CharField(
        max_length=30,
        choices=CATEGORY_CHOICES,
        default='property',
        db_index=True,
        help_text="Gallery category classification"
    )
    image = models.ImageField(
        upload_to='gallery/%Y/%m/',
        validators=[validate_image_file],
        blank=True,
        null=True,
        help_text="Uploaded media file (JPEG, PNG, WebP up to 5MB)"
    )
    image_url = models.URLField(
        max_length=500,
        blank=True,
        help_text="Optional external or CDN image URL"
    )
    caption = models.CharField(
        max_length=255,
        blank=True,
        help_text="Optional descriptive caption"
    )
    alt_text = models.CharField(
        max_length=200,
        blank=True,
        help_text="Accessible alternative text description"
    )
    is_featured = models.BooleanField(
        default=False,
        help_text="Flag indicating whether to showcase this item on the home page gallery preview"
    )
    display_order = models.PositiveIntegerField(
        default=0,
        help_text="Visual ordering sequence"
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        help_text="Publication status toggle"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['display_order', '-is_featured', '-created_at']
        indexes = [
            models.Index(fields=['category', 'is_active', 'display_order']),
        ]
        verbose_name = 'Gallery Media'
        verbose_name_plural = 'Gallery Media Items'

    def __str__(self):
        return f"{self.title} ({self.get_category_display()})"

    def clean(self):
        super().clean()
        if not self.image and not self.image_url:
            raise ValidationError("Either an uploaded image file or an image URL must be provided.")


class HotelConfiguration(models.Model):
    """
    Singleton Hotel Configuration model holding central operational settings,
    standard check-in/out timings, late checkout limits, and hotel policies.
    """
    SINGLETON_ID = uuid.UUID('00000000-0000-0000-0000-000000000001')

    id = models.UUIDField(primary_key=True, default=SINGLETON_ID, editable=False)
    hotel_name = models.CharField(
        max_length=150,
        default='Manohar Grand',
        help_text="Official business/property name"
    )
    primary_phone = models.CharField(
        max_length=20,
        blank=True,
        help_text="Primary reception / contact phone number"
    )
    secondary_phone = models.CharField(
        max_length=20,
        blank=True,
        help_text="Secondary reception / support phone number"
    )
    email = models.EmailField(
        blank=True,
        help_text="Official contact email address"
    )
    address = models.TextField(
        blank=True,
        help_text="Full physical hotel street address"
    )
    near_landmark = models.CharField(
        max_length=150,
        blank=True,
        help_text="Prominent nearby landmark"
    )
    google_maps_url = models.URLField(
        max_length=500,
        blank=True,
        help_text="Customer-facing Google Maps link"
    )
    google_maps_embed_url = models.URLField(
        max_length=1000,
        blank=True,
        help_text="Google Maps iframe embed URL for frontend rendering"
    )
    standard_check_in_time = models.TimeField(
        default='11:00:00',
        help_text="Standard guest check-in time (Confirmed baseline: 11:00 AM)"
    )
    standard_check_out_time = models.TimeField(
        default='11:00:00',
        help_text="Standard guest check-out time (Confirmed baseline: 11:00 AM next day)"
    )
    max_late_checkout_hours = models.PositiveIntegerField(
        default=3,
        help_text="Maximum permissible late check-out window in hours (Confirmed baseline: 3 hours)"
    )
    cancellation_policy_text = models.TextField(
        default='Once booking/payment is confirmed, booking cannot be cancelled/refunded.',
        help_text="Official guest cancellation policy statement"
    )
    guest_id_policy_text = models.TextField(
        blank=True,
        help_text="Mandatory guest photo identification and Aadhaar requirements"
    )
    age_policy_text = models.TextField(
        blank=True,
        help_text="Primary guest minimum age requirements"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Active configuration status"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Hotel Configuration'
        verbose_name_plural = 'Hotel Configuration'

    def __str__(self):
        return f"{self.hotel_name} Configuration"

    @classmethod
    def get_solo(cls):
        """
        Retrieves or initializes the singular HotelConfiguration record.
        """
        obj, _ = cls.objects.get_or_create(
            id=cls.SINGLETON_ID,
            defaults={'hotel_name': 'Manohar Grand'}
        )
        return obj

    def clean(self):
        super().clean()
        if HotelConfiguration.objects.exclude(pk=self.pk).exists():
            raise ValidationError("Only one HotelConfiguration singleton instance is permitted.")

    def save(self, *args, **kwargs):
        if not self.pk:
            existing = HotelConfiguration.objects.first()
            if existing:
                self.pk = existing.pk
            else:
                self.pk = self.SINGLETON_ID
        self.full_clean()
        super().save(*args, **kwargs)


