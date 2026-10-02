"""
Public URL patterns for Room Rates, Taxes, and Authoritative Pricing Calculations.
"""
from django.urls import path
from .views import (
    public_rate_plans_list,
    public_tax_rules_list,
    public_calculate_pricing_quote,
)

urlpatterns = [
    path('rates/', public_rate_plans_list, name='public-pricing-rates-list'),
    path('taxes/', public_tax_rules_list, name='public-pricing-taxes-list'),
    path('calculate/', public_calculate_pricing_quote, name='public-pricing-calculate'),
    path('quote/', public_calculate_pricing_quote, name='public-pricing-quote'),
]

