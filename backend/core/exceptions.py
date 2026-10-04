"""
Custom DRF exception handler to enforce consistent error envelopes and accurate HTTP status codes.
"""
import logging
from django.conf import settings
from django.utils import timezone
from rest_framework.views import exception_handler
from rest_framework import exceptions, status
from rest_framework.response import Response

logger = logging.getLogger('django.request')

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

    # If unhandled by standard DRF and DEBUG is False, produce a clean 500 envelope without exposing tracebacks
    if not getattr(settings, 'DEBUG', True):
        logger.exception("Unhandled API error: %s", exc)
        return Response(
            {
                "success": False,
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "An unexpected server error occurred. Please contact hotel administration if the issue persists.",
                    "details": None
                },
                "meta": {
                    "timestamp": timezone.now().isoformat()
                }
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    return None
