"""
Public URL patterns for Room Rates and Taxes.
"""
from django.urls import path
from .views import (
    public_rate_plans_list,
    public_tax_rules_list,
)

urlpatterns = [
    path('rates/', public_rate_plans_list, name='public-pricing-rates-list'),
    path('taxes/', public_tax_rules_list, name='public-pricing-taxes-list'),
]
