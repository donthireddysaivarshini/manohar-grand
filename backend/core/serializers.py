"""
Serializers for core application domain including System Audit Logs.
"""
from rest_framework import serializers
from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    """Read-only serializer for system audit logs."""
    actor_display = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = [
            'id',
            'actor_display',
            'actor_email',
            'actor_role',
            'action',
            'resource_type',
            'resource_id',
            'old_values',
            'new_values',
            'reason',
            'ip_address',
            'timestamp',
        ]
        read_only_fields = fields

    def get_actor_display(self, obj) -> str:
        if obj.actor_email:
            return obj.actor_email
        if obj.actor:
            return getattr(obj.actor, 'email', str(obj.actor))
        return "System"
