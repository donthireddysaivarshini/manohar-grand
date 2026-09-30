"""
Custom SessionAuthentication for standard REST API behavior.
"""
from rest_framework.authentication import SessionAuthentication

class CustomSessionAuthentication(SessionAuthentication):
    """
    SessionAuthentication that returns an authentication header name,
    ensuring unauthenticated requests receive HTTP 401 Unauthorized instead of 403 Forbidden.
    """
    def authenticate_header(self, request):
        return 'Session'
