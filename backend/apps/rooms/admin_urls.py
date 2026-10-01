"""
Admin URL patterns for Physical Room inventory.
"""
from django.urls import path
from .views import (
    PhysicalRoomAdminListCreateView,
    PhysicalRoomAdminDetailView,
)

urlpatterns = [
    path('physical-rooms/', PhysicalRoomAdminListCreateView.as_view(), name='admin-physical-rooms-list-create'),
    path('physical-rooms/<uuid:pk>/', PhysicalRoomAdminDetailView.as_view(), name='admin-physical-rooms-detail'),
]
