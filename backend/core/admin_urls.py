"""
Master Admin API URL router for staff administration endpoints (/api/v1/admin/).
"""
from django.urls import path, include
from core.views import AuditLogAdminListView
from apps.authentication.views import staff_login

urlpatterns = [
    # Staff authentication alias matching 12.API_SPECIFICATION.md
    path('auth/login/', staff_login, name='admin-auth-login'),

    # Domain Admin Sub-Routers
    path('rooms/', include('apps.rooms.admin_urls')),
    path('pricing/', include('apps.pricing.admin_urls')),
    path('content/', include('apps.cms.admin_urls')),
    path('bookings/', include('apps.bookings.admin_urls')),
    path('audit-logs/', AuditLogAdminListView.as_view(), name='admin-audit-logs'),
]
