"""
URL patterns for authentication and customer profile management.
"""
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    get_csrf_token,
    get_current_user,
    staff_login,
    user_logout,
    update_profile,
    RegisterView,
    CustomTokenObtainPairView,
    UserProfileView,
    GoogleLoginView,
)

urlpatterns = [
    # Modern JWT & Customer Auth Endpoints
    path('signup/', RegisterView.as_view(), name='auth-signup'),
    path('login/', CustomTokenObtainPairView.as_view(), name='auth-login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='auth-token-refresh'),
    path('user/', UserProfileView.as_view(), name='auth-user'),
    path('google/', GoogleLoginView.as_view(), name='auth-google'),

    # Session & Legacy Endpoints
    path('csrf/', get_csrf_token, name='auth-csrf'),
    path('me/', get_current_user, name='auth-me'),
    path('staff-login/', staff_login, name='auth-staff-login'),
    path('logout/', user_logout, name='auth-logout'),
    path('profile/', update_profile, name='auth-profile-update'),
]
