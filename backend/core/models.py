import uuid
from django.db import models
from django.conf import settings


class AuditLog(models.Model):
    """
    Append-only immutable system audit log capturing administrative actions,
    status transitions, rate modifications, and system configuration updates.
    """
    ACTION_CHOICES = [
        ('create', 'Created'),
        ('update', 'Updated'),
        ('delete', 'Deleted'),
        ('status_change', 'Status Changed'),
        ('price_change', 'Price Modified'),
        ('config_change', 'Config Modified'),
        ('override', 'Admin Override'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs',
        help_text="User who performed the action (null for system automated tasks)"
    )
    actor_email = models.EmailField(
        blank=True,
        help_text="Snapshot of actor email at the time of action"
    )
    actor_role = models.CharField(
        max_length=50,
        blank=True,
        help_text="Snapshot of actor staff role at the time of action"
    )
    action = models.CharField(max_length=50, choices=ACTION_CHOICES, db_index=True)
    resource_type = models.CharField(
        max_length=100,
        db_index=True,
        help_text="Model/Entity class name (e.g., 'RoomCategory', 'PhysicalRoom')"
    )
    resource_id = models.CharField(
        max_length=100,
        db_index=True,
        help_text="Primary key identifier of the modified resource"
    )
    old_values = models.JSONField(
        default=dict,
        blank=True,
        help_text="JSON snapshot of field values prior to modification"
    )
    new_values = models.JSONField(
        default=dict,
        blank=True,
        help_text="JSON snapshot of field values after modification"
    )
    reason = models.TextField(
        blank=True,
        help_text="Optional human-readable justification for the change"
    )
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        help_text="Client IP address initiating the request"
    )
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['resource_type', 'resource_id']),
            models.Index(fields=['actor', 'timestamp']),
        ]
        verbose_name = 'Audit Log Entry'
        verbose_name_plural = 'Audit Log Entries'

    def __str__(self):
        actor_display = self.actor_email or (self.actor.email if self.actor else 'System')
        return f"[{self.timestamp.strftime('%Y-%m-%d %H:%M:%S')}] {actor_display} {self.action} {self.resource_type}:{self.resource_id}"
