"""
Custom DRF exception handler to enforce consistent error envelopes and accurate HTTP status codes.
"""
from django.utils import timezone
from rest_framework.views import exception_handler
from rest_framework import exceptions, status

def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        # Handle unauthenticated requests returning 401 instead of 403 for SessionAuth
        if isinstance(exc, exceptions.NotAuthenticated):
            response.status_code = status.HTTP_401_UNAUTHORIZED

        custom_data = {
            "success": False,
            "error": {
                "code": getattr(exc, 'default_code', 'API_ERROR').upper(),
                "message": str(exc.detail) if hasattr(exc, 'detail') and isinstance(exc.detail, (str, list)) else "An error occurred while processing your request.",
                "details": response.data
            },
            "meta": {
                "timestamp": timezone.now().isoformat()
            }
        }
        response.data = custom_data
    return response
