"""
Public URL patterns for Headless CMS Content (Sections, Gallery, FAQs, Hotel Configuration).
"""
from django.urls import path
from .views import (
    public_cms_sections_list,
    public_cms_section_detail,
    public_gallery_media_list,
    public_faqs_list,
    public_hotel_configuration,
)

urlpatterns = [
    path('sections/', public_cms_sections_list, name='public-cms-sections-list'),
    path('sections/<slug:section_key>/', public_cms_section_detail, name='public-cms-section-detail'),
    path('gallery/', public_gallery_media_list, name='public-gallery-media-list'),
    path('faqs/', public_faqs_list, name='public-faqs-list'),
    path('hotel-config/', public_hotel_configuration, name='public-hotel-config'),
]
