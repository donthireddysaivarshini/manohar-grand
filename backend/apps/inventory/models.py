"""
Inventory domain models: RoomBlock and MaintenanceBlock for physical room operational locks.
Authoritative physical inventory remains strictly in PhysicalRoom.
"""
import uuid
from typing import List
from datetime import date
from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from .services import get_stay_nights, calculate_nights_count


class RoomBlock(models.Model):
    """
    Operational Room Block model representing physical room temporary administrative locks.
    Consumes inventory for the physical room across nights in [start_date, end_date).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    physical_room = models.ForeignKey(
        'rooms.PhysicalRoom',
        on_delete=models.CASCADE,
        related_name='room_blocks',
        help_text="Target physical room unit being blocked"
    )
    start_date = models.DateField(
        db_index=True,
        help_text="Start date of the block (inclusive)"
    )
    end_date = models.DateField(
        db_index=True,
        help_text="End date of the block (exclusive checkout date)"
    )
    reason = models.CharField(
        max_length=255,
        default='Operational Block',
        help_text="Reason for administrative block"
    )
    notes = models.TextField(
        blank=True,
        help_text="Internal staff notes and justification"
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_room_blocks',
        help_text="Staff member who created the block"
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        help_text="Status toggle. Inactive blocks do not consume inventory"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-start_date', 'physical_room__room_number']
        indexes = [
            models.Index(fields=['physical_room', 'is_active', 'start_date', 'end_date']),
            models.Index(fields=['start_date', 'end_date', 'is_active']),
        ]
        verbose_name = 'Room Block'
        verbose_name_plural = 'Room Blocks'

    def __str__(self):
        status = "Active" if self.is_active else "Inactive"
        return f"Block Room {self.physical_room.room_number} [{self.start_date} -> {self.end_date}] ({status})"

    @property
    def category(self):
        return self.physical_room.category

    @property
    def nights_count(self) -> int:
        return calculate_nights_count(self.start_date, self.end_date)

    @property
    def consumed_nights(self) -> List[date]:
        return get_stay_nights(self.start_date, self.end_date)

    def clean(self):
        super().clean()
        if self.start_date and self.end_date:
            if self.end_date <= self.start_date:
                raise ValidationError({
                    'end_date': 'End date must be strictly after start date.'
                })


class MaintenanceBlock(models.Model):
    """
    Maintenance Block model representing physical room unavailability due to repairs/maintenance.
    Consumes inventory for the physical room across nights in [start_date, end_date).
    """
    MAINTENANCE_TYPE_CHOICES = [
        ('repair', 'Emergency Repair / Fixture Fix'),
        ('routine', 'Routine Maintenance / Inspection'),
        ('deep_clean', 'Deep Sanitization & Pest Control'),
        ('renovation', 'Upgrades & Physical Renovation'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    physical_room = models.ForeignKey(
        'rooms.PhysicalRoom',
        on_delete=models.CASCADE,
        related_name='maintenance_blocks',
        help_text="Target physical room undergoing maintenance"
    )
    start_date = models.DateField(
        db_index=True,
        help_text="Start date of maintenance window (inclusive)"
    )
    end_date = models.DateField(
        db_index=True,
        help_text="End date of maintenance window (exclusive completion date)"
    )
    maintenance_type = models.CharField(
        max_length=50,
        choices=MAINTENANCE_TYPE_CHOICES,
        default='repair',
        db_index=True,
        help_text="Classification of maintenance work"
    )
    reason = models.CharField(
        max_length=255,
        default='Maintenance Work',
        help_text="Short summary of the work required"
    )
    notes = models.TextField(
        blank=True,
        help_text="Work orders, vendor details, and physical damage notes"
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_maintenance_blocks',
        help_text="Staff member who scheduled the maintenance"
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        help_text="Status toggle. Inactive blocks do not consume inventory"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-start_date', 'physical_room__room_number']
        indexes = [
            models.Index(fields=['physical_room', 'is_active', 'start_date', 'end_date']),
            models.Index(fields=['start_date', 'end_date', 'is_active']),
        ]
        verbose_name = 'Maintenance Block'
        verbose_name_plural = 'Maintenance Blocks'

    def __str__(self):
        status = "Active" if self.is_active else "Inactive"
        return f"Maintenance Room {self.physical_room.room_number} ({self.get_maintenance_type_display()}) [{self.start_date} -> {self.end_date}] ({status})"

    @property
    def category(self):
        return self.physical_room.category

    @property
    def nights_count(self) -> int:
        return calculate_nights_count(self.start_date, self.end_date)

    @property
    def consumed_nights(self) -> List[date]:
        return get_stay_nights(self.start_date, self.end_date)

    def clean(self):
        super().clean()
        if self.start_date and self.end_date:
            if self.end_date <= self.start_date:
                raise ValidationError({
                    'end_date': 'End date must be strictly after start date.'
                })
