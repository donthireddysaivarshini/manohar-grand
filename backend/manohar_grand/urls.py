"""
Master URL Configuration for Manohar Grand Hotel Platform.
"""
from django.conf import settings
from django.conf.urls.static import static
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
    path('api/v1/rooms/', include('apps.rooms.urls')),
    path('api/v1/content/', include('apps.cms.urls')),
    path('api/v1/pricing/', include('apps.pricing.urls')),
    path('api/v1/availability/', include('apps.availability.urls')),
    path('api/v1/bookings/', include('apps.bookings.urls')),
    path('api/v1/payments/', include('apps.payments.urls')),
    path('api/v1/admin/', include('core.admin_urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
