import uuid
from django.db import models
from django.core.validators import MinValueValidator
from django.core.exceptions import ValidationError
from core.validators import validate_image_file


class Amenity(models.Model):
    """
    Amenity domain model representing property-wide and room-specific features.
    """
    CATEGORY_CHOICES = [
        ('comfort', 'Comfort'),
        ('convenience', 'Convenience'),
        ('safety', 'Safety & Security'),
        ('service', 'Hotel Service'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(
        max_length=100,
        unique=True,
        db_index=True,
        help_text="Name of the amenity (e.g. 'WAKEFIT Memory Foam Mattresses', '32\" Smart TV')"
    )
    category = models.CharField(
        max_length=20,
        choices=CATEGORY_CHOICES,
        default='comfort',
        db_index=True,
        help_text="Amenity classification"
    )
    description = models.TextField(
        blank=True,
        help_text="Detailed explanation of the amenity or service"
    )
    icon_name = models.CharField(
        max_length=50,
        default='check',
        help_text="Icon identifier for frontend rendering (e.g. 'wifi', 'tv', 'parking')"
    )
    is_property_wide = models.BooleanField(
        default=False,
        help_text="Flag indicating whether this amenity applies property-wide vs. specific room categories"
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        help_text="Active status toggle"
    )
    display_order = models.PositiveIntegerField(
        default=0,
        help_text="Display ordering priority"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['display_order', 'name']
        verbose_name = 'Amenity'
        verbose_name_plural = 'Amenities'

    def __str__(self):
        return self.name

    def clean(self):
        super().clean()
        if self.name:
            self.name = self.name.strip()
            if not self.name:
                raise ValidationError({'name': 'Amenity name cannot be blank.'})


class RoomCategory(models.Model):
    """
    Room Category model defining accommodation specifications, marketing details,
    and base occupancy limits.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    slug = models.SlugField(
        max_length=50,
        unique=True,
        db_index=True,
        help_text="URL-friendly identifier (e.g., 'ac-room', 'non-ac-room')"
    )
    name = models.CharField(
        max_length=100,
        help_text="Display title of the room category (e.g., 'AC Room', 'Non-AC Room')"
    )
    tagline = models.CharField(
        max_length=255,
        blank=True,
        help_text="Short marketing summary tagline"
    )
    description = models.TextField(
        blank=True,
        help_text="Comprehensive description of room features, fixtures, and layout"
    )

    # Configurable Occupancy Baseline
    included_adults = models.PositiveIntegerField(
        default=2,
        validators=[MinValueValidator(1)],
        help_text="Number of adults included in base rate (typically 2)"
    )
    included_children = models.PositiveIntegerField(
        default=0,
        help_text="Number of children included in base rate (typically 0)"
    )
    max_adults = models.PositiveIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1)],
        help_text="Maximum adult capacity (optional ceiling; if null, capped by max_total_occupancy)"
    )
    max_children = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Maximum children capacity (optional ceiling)"
    )
    max_total_occupancy = models.PositiveIntegerField(
        default=4,
        validators=[MinValueValidator(1)],
        help_text="Authoritative total PAX ceiling per room (AC: 4 PAX; Non-AC: 2 PAX baseline, 3 PAX pending confirmation)"
    )

    amenities = models.ManyToManyField(
        Amenity,
        through='RoomCategoryAmenity',
        related_name='room_categories',
        blank=True,
        help_text="Amenities associated with this room category"
    )

    display_order = models.PositiveIntegerField(
        default=0,
        help_text="Visual ordering sequence for frontend presentation"
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        help_text="Whether this room category is active and visible for booking"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['display_order', 'name']
        verbose_name = 'Room Category'
        verbose_name_plural = 'Room Categories'

    def __str__(self):
        return self.name

    def clean(self):
        super().clean()
        if self.max_total_occupancy and self.included_adults:
            if self.max_total_occupancy < self.included_adults:
                raise ValidationError({
                    'max_total_occupancy': 'Maximum total occupancy cannot be less than included adults.'
                })
        if self.max_adults and self.max_total_occupancy:
            if self.max_adults > self.max_total_occupancy:
                raise ValidationError({
                    'max_adults': 'Maximum adults cannot exceed maximum total occupancy.'
                })

    @property
    def active_physical_room_count(self) -> int:
        """
        Returns the count of active, operational physical rooms configured for this category.
        NOTE: This is master-data physical capacity, not date-specific booking availability.
        """
        return self.physical_rooms.filter(operational_status='operational').count()

    @property
    def total_physical_room_count(self) -> int:
        """
        Returns the total count of all configured physical rooms in this category regardless of status.
        """
        return self.physical_rooms.count()


class RoomCategoryAmenity(models.Model):
    """
    Explicit through model linking RoomCategory to Amenity with custom highlighting and ordering.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    category = models.ForeignKey(
        RoomCategory,
        on_delete=models.CASCADE,
        related_name='category_amenity_links'
    )
    amenity = models.ForeignKey(
        Amenity,
        on_delete=models.CASCADE,
        related_name='category_links'
    )
    is_highlight = models.BooleanField(
        default=False,
        help_text="Highlight this amenity prominently on category summary cards"
    )
    display_order = models.PositiveIntegerField(
        default=0,
        help_text="Display priority for ordering within the category"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['display_order', 'amenity__name']
        constraints = [
            models.UniqueConstraint(
                fields=['category', 'amenity'],
                name='unique_category_amenity'
            )
        ]
        verbose_name = 'Room Category Amenity Link'
        verbose_name_plural = 'Room Category Amenity Links'

    def __str__(self):
        return f"{self.category.name} - {self.amenity.name}"


class RoomImage(models.Model):
    """
    Room Image media model supporting file uploads via Django storage abstraction
    and optional external fallback URLs.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    category = models.ForeignKey(
        RoomCategory,
        on_delete=models.CASCADE,
        related_name='images',
        help_text="Associated room category"
    )
    image = models.ImageField(
        upload_to='rooms/%Y/%m/',
        validators=[validate_image_file],
        blank=True,
        null=True,
        help_text="Uploaded image file (JPEG, PNG, WebP up to 5MB)"
    )
    image_url = models.URLField(
        max_length=500,
        blank=True,
        help_text="Optional external or CDN image URL"
    )
    caption = models.CharField(
        max_length=200,
        blank=True,
        help_text="Optional human-readable image caption"
    )
    alt_text = models.CharField(
        max_length=200,
        blank=True,
        help_text="Accessible alternative text description"
    )
    is_primary = models.BooleanField(
        default=False,
        help_text="Designates the primary hero image for the room category"
    )
    display_order = models.PositiveIntegerField(
        default=0,
        help_text="Sorting position in room gallery"
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        help_text="Visibility toggle"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['display_order', '-is_primary', 'created_at']
        indexes = [
            models.Index(fields=['category', 'is_active', 'is_primary']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['category'],
                condition=models.Q(is_primary=True, is_active=True),
                name='unique_primary_active_image_per_category'
            )
        ]
        verbose_name = 'Room Image'
        verbose_name_plural = 'Room Images'

    def __str__(self):
        primary_badge = " [PRIMARY]" if self.is_primary else ""
        return f"{self.category.name} Image ({self.caption or self.alt_text or str(self.id)[:8]}){primary_badge}"

    def clean(self):
        super().clean()
        if not self.image and not self.image_url:
            raise ValidationError("Either an uploaded image file or an image URL must be provided.")
        if self.is_primary and not self.is_active:
            raise ValidationError({'is_primary': "An inactive image cannot be designated as the primary image."})

    def save(self, *args, **kwargs):
        if self.is_primary and self.is_active and self.category_id:
            # Automatically demote any other existing primary image for this category before cleaning/saving
            RoomImage.objects.filter(
                category_id=self.category_id,
                is_primary=True,
                is_active=True
            ).exclude(pk=self.pk).update(is_primary=False)
        self.full_clean()
        super().save(*args, **kwargs)



class PhysicalRoom(models.Model):
    """
    Authoritative Physical Room entity representing a specific hotel room unit.
    All booking availability is derived from these records and their active reservations.
    """
    OPERATIONAL_STATUS_CHOICES = [
        ('operational', 'Operational / Ready'),
        ('maintenance', 'Under Maintenance'),
        ('blocked', 'Admin Blocked'),
        ('inactive', 'Inactive / Decommissioned'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    category = models.ForeignKey(
        RoomCategory,
        on_delete=models.PROTECT,
        related_name='physical_rooms',
        help_text="Associated room category"
    )
    room_number = models.CharField(
        max_length=20,
        unique=True,
        db_index=True,
        help_text="Unique room door/unit number (e.g. '101', '102', '201')"
    )
    floor = models.IntegerField(
        default=1,
        help_text="Floor number where the room is located"
    )
    operational_status = models.CharField(
        max_length=20,
        choices=OPERATIONAL_STATUS_CHOICES,
        default='operational',
        db_index=True,
        help_text="Current housekeeping / operational readiness status"
    )
    notes = models.TextField(
        blank=True,
        help_text="Internal staff notes (maintenance history, physical quirks, amenities)"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['floor', 'room_number']
        indexes = [
            models.Index(fields=['category', 'operational_status']),
            models.Index(fields=['operational_status']),
        ]
        verbose_name = 'Physical Room'
        verbose_name_plural = 'Physical Rooms'

    def __str__(self):
        return f"Room {self.room_number} ({self.category.name})"

    def clean(self):
        super().clean()
        if self.room_number:
            self.room_number = self.room_number.strip()
            if not self.room_number:
                raise ValidationError({'room_number': 'Room number cannot be empty or whitespace.'})
