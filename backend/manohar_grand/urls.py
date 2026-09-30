"""
Master URL Configuration for Manohar Grand Hotel Platform.
"""
from django.contrib import admin
from django.urls import path, include
from core.views import health_check

urlpatterns = [
    # Developer/Superadmin Django Admin (Private)
    path('admin/', admin.site.urls),

    # django-allauth OAuth Endpoints (Google OAuth2 Authorization Code flow)
    path('accounts/', include('allauth.urls')),

    # REST API Version 1 Namespace
    path('api/v1/health/', health_check, name='api-health'),
    path('api/v1/auth/', include('apps.authentication.urls')),
]
