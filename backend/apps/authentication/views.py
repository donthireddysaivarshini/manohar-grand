"""
Authentication views for session lifecycle, staff login, and customer profile management.
"""
from django.contrib.auth import login as django_login, logout as django_logout
from django.middleware.csrf import get_token
from django.utils import timezone
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .serializers import (
    UserSerializer,
    StaffLoginSerializer,
    ProfileUpdateSerializer,
)

@api_view(['GET'])
@permission_classes([AllowAny])
@ensure_csrf_cookie
def get_csrf_token(request):
    """
    Safe endpoint to establish the Django CSRF cookie and return the active token.
    React frontend calls this once upon initial load.
    """
    csrf_token = get_token(request)
    return Response({
        "success": True,
        "data": {
            "csrfToken": csrf_token
        },
        "meta": {
            "timestamp": timezone.now().isoformat()
        }
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    """
    Returns the authenticated customer or staff user profile.
    Used by React frontend to hydrate authentication state.
    """
    serializer = UserSerializer(request.user)
    return Response({
        "success": True,
        "data": serializer.data,
        "meta": {
            "timestamp": timezone.now().isoformat()
        }
    })

@api_view(['POST'])
@permission_classes([AllowAny])
def staff_login(request):
    """
    Staff & Administrator email/password authentication endpoint.
    Establishes an authenticated Django session upon credential verification.
    """
    serializer = StaffLoginSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        user = serializer.validated_data['user']
        django_login(request, user)
        user_data = UserSerializer(user).data
        return Response({
            "success": True,
            "data": {
                "message": "Staff authentication successful.",
                "user": user_data
            },
            "meta": {
                "timestamp": timezone.now().isoformat()
            }
        }, status=status.HTTP_200_OK)
    
    return Response({
        "success": False,
        "error": {
            "code": "INVALID_CREDENTIALS",
            "message": "Invalid staff credentials or unauthorized account.",
            "details": serializer.errors
        },
        "meta": {
            "timestamp": timezone.now().isoformat()
        }
    }, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def user_logout(request):
    """
    Terminates the active Django session and flushes session cookies.
    """
    django_logout(request)
    return Response({
        "success": True,
        "data": {
            "message": "Successfully logged out."
        },
        "meta": {
            "timestamp": timezone.now().isoformat()
        }
    }, status=status.HTTP_200_OK)

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    """
    Updates customer profile details (first name, last name, phone, city, state).
    """
    serializer = ProfileUpdateSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.update(request.user, serializer.validated_data)
        return Response({
            "success": True,
            "data": UserSerializer(user).data,
            "meta": {
                "timestamp": timezone.now().isoformat()
            }
        })
    
    return Response({
        "success": False,
        "error": {
            "code": "VALIDATION_ERROR",
            "message": "Invalid profile update data.",
            "details": serializer.errors
        },
        "meta": {
            "timestamp": timezone.now().isoformat()
        }
    }, status=status.HTTP_400_BAD_REQUEST)
