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
