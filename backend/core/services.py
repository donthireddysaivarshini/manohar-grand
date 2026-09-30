from typing import Optional, Any, Dict
from django.contrib.auth import get_user_model
from .models import AuditLog

User = get_user_model()


def record_audit_log(
    action: str,
    resource_type: str,
    resource_id: str,
    actor: Optional[Any] = None,
    old_values: Optional[Dict[str, Any]] = None,
    new_values: Optional[Dict[str, Any]] = None,
    reason: str = "",
    ip_address: Optional[str] = None,
) -> AuditLog:
    """
    Helper service to create an immutable AuditLog entry safely with actor snapshotting.
    """
    actor_email = ""
    actor_role = ""

    if actor and actor.is_authenticated:
        actor_email = getattr(actor, 'email', '')
        if hasattr(actor, 'staff_profile') and actor.staff_profile:
            actor_role = actor.staff_profile.role
        elif actor.is_superuser:
            actor_role = 'superuser'
        else:
            actor_role = 'customer'

    return AuditLog.objects.create(
        actor=actor if (actor and actor.is_authenticated) else None,
        actor_email=actor_email,
        actor_role=actor_role,
        action=action,
        resource_type=resource_type,
        resource_id=str(resource_id),
        old_values=old_values or {},
        new_values=new_values or {},
        reason=reason,
        ip_address=ip_address,
    )
