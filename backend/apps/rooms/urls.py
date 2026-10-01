"""
Public URL patterns for Room Categories and Amenities.
"""
from django.urls import path
from .views import (
    public_room_category_list,
    public_room_category_detail,
    public_amenity_list,
)

urlpatterns = [
    path('categories/', public_room_category_list, name='public-room-categories-list'),
    path('categories/<slug:slug>/', public_room_category_detail, name='public-room-category-detail'),
    path('amenities/', public_amenity_list, name='public-amenities-list'),
]
