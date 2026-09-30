from django.contrib import admin
from .models import GalleryMedia


@admin.register(GalleryMedia)
class GalleryMediaAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'is_featured', 'display_order', 'is_active', 'updated_at']
    list_filter = ['category', 'is_featured', 'is_active']
    search_fields = ['title', 'caption', 'alt_text']
    readonly_fields = ['id', 'created_at', 'updated_at']
