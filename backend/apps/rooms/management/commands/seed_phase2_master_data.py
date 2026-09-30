from django.core.management.base import BaseCommand
from django.db import transaction
from apps.rooms.models import RoomCategory, PhysicalRoom, Amenity, RoomCategoryAmenity, RoomImage
from apps.cms.models import GalleryMedia


class Command(BaseCommand):
    help = 'Seeds initial hotel room categories and verified master amenities (ZERO physical rooms, ZERO fake images).'

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Seeding Phase 2 Master Data (Categories & Amenities)..."))

        # 1. Categories (get_or_create to preserve existing admin edits)
        ac_category, ac_created = RoomCategory.objects.get_or_create(
            slug='ac-room',
            defaults={
                'name': 'AC Room',
                'tagline': 'Luxury Air-Conditioned Comfort',
                'description': (
                    'Spacious premium room featuring individual remote-controlled air-conditioning, '
                    'plush Wakefit memory foam mattress, wall-mounted 32" Smart TV with OTT app support, '
                    '24/7 hot and cold shower, complimentary high-speed Wi-Fi, and daily housekeeping.'
                ),
                'included_adults': 2,
                'included_children': 0,
                'max_total_occupancy': 4,
                'display_order': 1,
                'is_active': True,
            }
        )
        status_text = "Created" if ac_created else "Preserved Existing"
        self.stdout.write(self.style.SUCCESS(
            f"  - [{status_text}] Category: AC Room (Max Total Occupancy: {ac_category.max_total_occupancy} PAX)"
        ))

        nac_category, nac_created = RoomCategory.objects.get_or_create(
            slug='non-ac-room',
            defaults={
                'name': 'Non-AC Room',
                'tagline': 'Comfortable & Budget-Friendly Stay',
                'description': (
                    'Well-ventilated economy room equipped with high-speed ceiling fan, '
                    'premium Wakefit memory foam mattress, wall-mounted 32" Smart TV with OTT app support, '
                    '24/7 hot and cold shower, complimentary high-speed Wi-Fi, and daily housekeeping.'
                ),
                'included_adults': 2,
                'included_children': 0,
                'max_total_occupancy': 2,
                'display_order': 2,
                'is_active': True,
            }
        )
        status_text = "Created" if nac_created else "Preserved Existing"
        self.stdout.write(self.style.SUCCESS(
            f"  - [{status_text}] Category: Non-AC Room (Current DB Occupancy: {nac_category.max_total_occupancy} PAX [UNRESOLVED: 2 vs 3 PAX])"
        ))

        # 2. Master Amenities Definition (Generic & Confirmed Hotel Features)
        default_amenities = [
            {
                'name': 'WAKEFIT Memory Foam Mattresses',
                'category': 'comfort',
                'icon_name': 'bed',
                'description': 'Premium Wakefit memory foam mattress in all bedrooms for enhanced comfort and posture support.',
                'is_property_wide': False,
                'display_order': 1,
                'link_to': ['ac-room', 'non-ac-room'],
                'highlight': True
            },
            {
                'name': 'Individual Air Conditioning',
                'category': 'comfort',
                'icon_name': 'air-conditioning',
                'description': 'Remote-controlled individual AC cooling available in all AC rooms.',
                'is_property_wide': False,
                'display_order': 2,
                'link_to': ['ac-room'],
                'highlight': True
            },
            {
                'name': '32" Smart TV with OTT Support',
                'category': 'convenience',
                'icon_name': 'tv',
                'description': 'Wall-mounted 32-inch Smart TV with OTT app access.',
                'is_property_wide': False,
                'display_order': 3,
                'link_to': ['ac-room', 'non-ac-room'],
                'highlight': True
            },
            {
                'name': '24/7 Hot & Cold Water',
                'category': 'comfort',
                'icon_name': 'shower-head',
                'description': 'Continuous hot shower water in attached private bathrooms.',
                'is_property_wide': False,
                'display_order': 4,
                'link_to': ['ac-room', 'non-ac-room'],
                'highlight': False
            },
            {
                'name': 'High-Speed Wi-Fi',
                'category': 'convenience',
                'icon_name': 'wifi',
                'description': 'Fast complimentary wireless internet access across all rooms and common areas.',
                'is_property_wide': True,
                'display_order': 5,
                'link_to': ['ac-room', 'non-ac-room'],
                'highlight': True
            },
            {
                'name': 'On-Site Vehicle Parking',
                'category': 'convenience',
                'icon_name': 'car',
                'description': 'Dedicated on-premise parking spaces for four-wheelers and two-wheelers.',
                'is_property_wide': True,
                'display_order': 6,
                'link_to': [],
                'highlight': False
            },
            {
                'name': '24/7 Front Desk & Reception',
                'category': 'service',
                'icon_name': 'clock',
                'description': 'Round-the-clock front desk assistance for check-ins, queries, and support.',
                'is_property_wide': True,
                'display_order': 7,
                'link_to': [],
                'highlight': False
            },
            {
                'name': 'Daily Housekeeping',
                'category': 'service',
                'icon_name': 'sparkles',
                'description': 'Daily room tidying, sanitization, and fresh linen service.',
                'is_property_wide': False,
                'display_order': 8,
                'link_to': ['ac-room', 'non-ac-room'],
                'highlight': False
            },
            {
                'name': '100% Power Backup Support',
                'category': 'safety',
                'icon_name': 'zap',
                'description': 'Generator backup for uninterrupted lighting and essential fixtures.',
                'is_property_wide': True,
                'display_order': 9,
                'link_to': [],
                'highlight': False
            },
            {
                'name': 'CCTV & Security Surveillance',
                'category': 'safety',
                'icon_name': 'shield-check',
                'description': '24/7 common area CCTV monitoring for guest safety.',
                'is_property_wide': True,
                'display_order': 10,
                'link_to': [],
                'highlight': False
            },
        ]

        categories_map = {
            'ac-room': ac_category,
            'non-ac-room': nac_category
        }

        for item in default_amenities:
            amenity, a_created = Amenity.objects.get_or_create(
                name=item['name'],
                defaults={
                    'category': item['category'],
                    'icon_name': item['icon_name'],
                    'description': item['description'],
                    'is_property_wide': item['is_property_wide'],
                    'display_order': item['display_order'],
                    'is_active': True,
                }
            )
            # Link to room categories
            for cat_slug in item.get('link_to', []):
                cat_obj = categories_map.get(cat_slug)
                if cat_obj:
                    RoomCategoryAmenity.objects.get_or_create(
                        category=cat_obj,
                        amenity=amenity,
                        defaults={
                            'is_highlight': item['highlight'],
                            'display_order': item['display_order']
                        }
                    )

        # 3. Verification of Strict Boundaries
        physical_room_count = PhysicalRoom.objects.count()
        room_image_count = RoomImage.objects.count()
        gallery_count = GalleryMedia.objects.count()

        self.stdout.write(self.style.NOTICE(
            f"\nMaster Data Summary:\n"
            f"  - Total Room Categories: {RoomCategory.objects.count()}\n"
            f"  - Total Master Amenities: {Amenity.objects.count()}\n"
            f"  - Total Physical Rooms: {physical_room_count} (ZERO seeded as required)\n"
            f"  - Total Room Images: {room_image_count} (ZERO fake media seeded)\n"
            f"  - Total Gallery Media: {gallery_count} (ZERO fake media seeded)"
        ))
        self.stdout.write(self.style.SUCCESS("Phase 2 Step 2 Master Data seeding complete."))
