"""
Core endpoints for system health and status.
"""
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

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
