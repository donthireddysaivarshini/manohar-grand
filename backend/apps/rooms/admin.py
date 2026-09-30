from django.contrib import admin
from .models import RoomCategory, PhysicalRoom, Amenity, RoomCategoryAmenity, RoomImage


class RoomCategoryAmenityInline(admin.TabularInline):
    model = RoomCategoryAmenity
    extra = 1
    autocomplete_fields = ['amenity']


class RoomImageInline(admin.TabularInline):
    model = RoomImage
    extra = 1
    fields = ['image', 'image_url', 'caption', 'alt_text', 'is_primary', 'display_order', 'is_active']


@admin.register(RoomCategory)
class RoomCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'max_total_occupancy', 'included_adults', 'display_order', 'is_active', 'active_rooms_display']
    list_filter = ['is_active']
    search_fields = ['name', 'slug', 'tagline', 'description']
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ['id', 'created_at', 'updated_at', 'active_rooms_display', 'total_rooms_display']
    inlines = [RoomCategoryAmenityInline, RoomImageInline]

    @admin.display(description='Active Operational Rooms')
    def active_rooms_display(self, obj):
        return obj.active_physical_room_count

    @admin.display(description='Total Configured Rooms')
    def total_rooms_display(self, obj):
        return obj.total_physical_room_count


@admin.register(Amenity)
class AmenityAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'icon_name', 'is_property_wide', 'display_order', 'is_active', 'updated_at']
    list_filter = ['category', 'is_property_wide', 'is_active']
    search_fields = ['name', 'description']
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(RoomCategoryAmenity)
class RoomCategoryAmenityAdmin(admin.ModelAdmin):
    list_display = ['category', 'amenity', 'is_highlight', 'display_order', 'created_at']
    list_filter = ['category', 'is_highlight']
    search_fields = ['category__name', 'amenity__name']
    readonly_fields = ['id', 'created_at']


@admin.register(RoomImage)
class RoomImageAdmin(admin.ModelAdmin):
    list_display = ['category', 'caption', 'is_primary', 'display_order', 'is_active', 'updated_at']
    list_filter = ['category', 'is_primary', 'is_active']
    search_fields = ['caption', 'alt_text', 'category__name']
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(PhysicalRoom)
class PhysicalRoomAdmin(admin.ModelAdmin):
    list_display = ['room_number', 'category', 'floor', 'operational_status', 'updated_at']
    list_filter = ['category', 'operational_status', 'floor']
    search_fields = ['room_number', 'notes']
    readonly_fields = ['id', 'created_at', 'updated_at']
