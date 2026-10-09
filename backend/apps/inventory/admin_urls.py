"""
Admin URL routing for inventory stop-sells and blackout dates.
"""
from django.urls import path
from .admin_views import (
    AdminStopSellListCreateView,
    AdminStopSellToggleView,
    AdminStopSellDeleteView,
)

urlpatterns = [
    path('stop-sells/', AdminStopSellListCreateView.as_view(), name='admin-stopsell-list-create'),
    path('stop-sells/<uuid:pk>/toggle/', AdminStopSellToggleView.as_view(), name='admin-stopsell-toggle'),
    path('stop-sells/<uuid:pk>/', AdminStopSellDeleteView.as_view(), name='admin-stopsell-delete'),
]
