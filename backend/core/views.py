"""
Core endpoints for system health and status, plus system audit log administration.
"""
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import AuditLog
from .serializers import AuditLogSerializer
from apps.authentication.permissions import IsManagerOrAbove


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Health check endpoint for monitoring uptime and platform readiness.
    """
    return Response({
        "success": True,
        "data": {
            "status": "healthy",
            "service": "Manohar Grand Hotel Backend API",
            "version": "1.0.0",
            "environment": "development" if request.META.get('SERVER_NAME') in ('localhost', '127.0.0.1', 'testserver') else "production"
        },
        "meta": {
            "timestamp": timezone.now().isoformat()
        }
    })


class AuditLogAdminListView(APIView):
    """
    Staff read-only audit log inspection (Manager & SuperAdmin).
    Strictly immutable — write/mutation operations are denied.
    """
    permission_classes = [IsManagerOrAbove]

    def get(self, request):
        logs = AuditLog.objects.all()

        resource_type = request.query_params.get('resource_type')
        if resource_type:
            logs = logs.filter(resource_type=resource_type)

        action = request.query_params.get('action')
        if action:
            logs = logs.filter(action=action)

        actor_role = request.query_params.get('actor_role')
        if actor_role:
            logs = logs.filter(actor_role=actor_role)

        serializer = AuditLogSerializer(logs, many=True)
        return Response({
            "success": True,
            "data": serializer.data,
            "meta": {
                "timestamp": timezone.now().isoformat(),
                "total_count": logs.count()
            }
        })
