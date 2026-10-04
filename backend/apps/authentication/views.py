"""
Authentication views for session lifecycle, staff login, and customer profile management.
"""
from django.contrib.auth import login as django_login, logout as django_logout
from django.middleware.csrf import get_token
from django.utils import timezone
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from dj_rest_auth.registration.views import SocialLoginView
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client

from .serializers import (
    UserSerializer,
    StaffLoginSerializer,
    ProfileUpdateSerializer,
    RegisterSerializer,
    CustomTokenObtainPairSerializer,
)

class RegisterView(generics.CreateAPIView):
    """
    Public customer registration endpoint.
    Accepts full name, email, password, and provisions a CustomerUser + CustomerProfile.
    """
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        headers = self.get_success_headers(serializer.data)
        return Response({
            "success": True,
            "data": {
                "message": "Account created successfully.",
                "user": UserSerializer(user).data
            },
            "meta": {
                "timestamp": timezone.now().isoformat()
            }
        }, status=status.HTTP_201_CREATED, headers=headers)

class CustomTokenObtainPairView(TokenObtainPairView):
    """
    JWT Login endpoint returning access, refresh tokens and the full user profile.
    """
    serializer_class = CustomTokenObtainPairSerializer

class UserProfileView(generics.RetrieveAPIView):
    """
    Returns the authenticated user's profile for session hydration.
    """
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

import logging

logger = logging.getLogger(__name__)

class GoogleLoginView(SocialLoginView):
    """
    Google OAuth 2.0 exchange endpoint.
    Accepts Google authorization code from popup flow and issues JWT tokens + CustomerUser session.
    """
    adapter_class = GoogleOAuth2Adapter
    client_class = OAuth2Client
    callback_url = "postmessage"

    def post(self, request, *args, **kwargs):
        try:
            return super().post(request, *args, **kwargs)
        except Exception as exc:
            logger.error(f"Google OAuth exchange failed: {exc}", exc_info=True)
            error_msg = str(exc)
            if "MultipleObjectsReturned" in error_msg:
                error_msg = "Multiple Google provider configurations detected."
            elif "invalid_grant" in error_msg or "code" in error_msg.lower():
                error_msg = "Google authorization code is expired or invalid. Please try signing in again."
            return Response(
                {
                    "success": False,
                    "error": {
                        "code": "GOOGLE_AUTH_FAILED",
                        "message": error_msg,
                    }
                },
                status=status.HTTP_400_BAD_REQUEST
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
