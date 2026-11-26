from django.contrib import admin
from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['timestamp', 'action', 'resource_type', 'resource_id', 'actor_email', 'actor_role', 'ip_address']
    list_filter = ['action', 'resource_type', 'actor_role', 'timestamp']
    search_fields = ['resource_id', 'actor_email', 'reason']
    readonly_fields = [
        'id', 'actor', 'actor_email', 'actor_role', 'action',
        'resource_type', 'resource_id', 'old_values', 'new_values',
        'reason', 'ip_address', 'timestamp'
    ]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        if not request.user.is_authenticated:
            return False
        return bool(request.user.is_superuser or getattr(request.user, 'is_staff', False))
