"""
Admin URL patterns for CMS Content (Sections, FAQs, Gallery Media, and Hotel Configuration).
"""
from django.urls import path
from .views import (
    CMSSectionAdminListCreateView,
    CMSSectionAdminDetailView,
    FAQAdminListCreateView,
    FAQAdminDetailView,
    GalleryMediaAdminListCreateView,
    GalleryMediaAdminDetailView,
    HotelConfigurationAdminView,
)

urlpatterns = [
    path('sections/', CMSSectionAdminListCreateView.as_view(), name='admin-cms-sections-list-create'),
    path('sections/<uuid:pk>/', CMSSectionAdminDetailView.as_view(), name='admin-cms-sections-detail'),
    path('faqs/', FAQAdminListCreateView.as_view(), name='admin-faqs-list-create'),
    path('faqs/<uuid:pk>/', FAQAdminDetailView.as_view(), name='admin-faqs-detail'),
    path('gallery/', GalleryMediaAdminListCreateView.as_view(), name='admin-gallery-list-create'),
    path('gallery/<uuid:pk>/', GalleryMediaAdminDetailView.as_view(), name='admin-gallery-detail'),
    path('hotel-config/', HotelConfigurationAdminView.as_view(), name='admin-hotel-config'),
]
