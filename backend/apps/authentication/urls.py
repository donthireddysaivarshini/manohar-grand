"""
URL patterns for authentication and customer profile management.
"""
from django.urls import path
from .views import (
    get_csrf_token,
    get_current_user,
    staff_login,
    user_logout,
    update_profile,
)

urlpatterns = [
    path('csrf/', get_csrf_token, name='auth-csrf'),
    path('me/', get_current_user, name='auth-me'),
    path('login/', staff_login, name='auth-staff-login'),
    path('logout/', user_logout, name='auth-logout'),
    path('profile/', update_profile, name='auth-profile-update'),
]
