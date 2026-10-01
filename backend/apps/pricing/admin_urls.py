"""
Admin URL patterns for Room Rates and Tax Rules.
"""
from django.urls import path
from .views import (
    RoomRatePlanAdminListCreateView,
    RoomRatePlanAdminDetailView,
    TaxRuleAdminListCreateView,
    TaxRuleAdminDetailView,
)

urlpatterns = [
    path('rates/', RoomRatePlanAdminListCreateView.as_view(), name='admin-pricing-rates-list-create'),
    path('rates/<uuid:pk>/', RoomRatePlanAdminDetailView.as_view(), name='admin-pricing-rates-detail'),
    path('taxes/', TaxRuleAdminListCreateView.as_view(), name='admin-pricing-taxes-list-create'),
    path('taxes/<uuid:pk>/', TaxRuleAdminDetailView.as_view(), name='admin-pricing-taxes-detail'),
]
