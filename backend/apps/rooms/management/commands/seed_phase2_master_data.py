from decimal import Decimal
from django.core.management.base import BaseCommand
from django.db import transaction
from apps.rooms.models import RoomCategory, PhysicalRoom, Amenity, RoomCategoryAmenity, RoomImage
from apps.pricing.models import RoomRatePlan, TaxRule
from apps.cms.models import GalleryMedia, HotelConfiguration, CMSSection, FAQ


class Command(BaseCommand):
    help = 'Seeds initial hotel room categories, verified master amenities, rate plans, tax rules, hotel configuration, and structural CMS sections.'

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Seeding Phase 2 Master Data (Categories, Amenities, Rates, Tax, Configuration & CMS)..."))

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

        # 3. Baseline Room Rate Plans (Idempotent seed, preserve admin modifications)
        ac_rate_plan, ac_rate_created = RoomRatePlan.objects.get_or_create(
            category=ac_category,
            name='Standard Tariff',
            defaults={
                'currency': 'INR',
                'base_price_per_night': Decimal('1599.00'),
                'extra_adult_charge': Decimal('350.00'),
                'extra_child_charge': Decimal('300.00'),
                'late_checkout_hourly_rate': Decimal('150.00'),
                'is_active': True,
            }
        )
        rate_status = "Created" if ac_rate_created else "Preserved Existing"
        self.stdout.write(self.style.SUCCESS(
            f"  - [{rate_status}] Rate Plan: AC Room Standard Tariff (INR {ac_rate_plan.base_price_per_night}/night)"
        ))

        nac_rate_plan, nac_rate_created = RoomRatePlan.objects.get_or_create(
            category=nac_category,
            name='Standard Tariff',
            defaults={
                'currency': 'INR',
                'base_price_per_night': Decimal('1299.00'),
                'extra_adult_charge': Decimal('350.00'),
                'extra_child_charge': Decimal('300.00'),
                'late_checkout_hourly_rate': Decimal('100.00'),
                'is_active': True,
            }
        )
        rate_status = "Created" if nac_rate_created else "Preserved Existing"
        self.stdout.write(self.style.SUCCESS(
            f"  - [{rate_status}] Rate Plan: Non-AC Room Standard Tariff (INR {nac_rate_plan.base_price_per_night}/night)"
        ))

        # 4. Tax Rules (GST 5% Baseline)
        gst_rule, gst_created = TaxRule.objects.get_or_create(
            name='GST (Accommodation)',
            defaults={
                'tax_rate': Decimal('5.00'),
                'tax_type': 'percentage',
                'is_active': True,
            }
        )
        tax_status = "Created" if gst_created else "Preserved Existing"
        self.stdout.write(self.style.SUCCESS(
            f"  - [{tax_status}] Tax Rule: {gst_rule.name} ({gst_rule.tax_rate}%)"
        ))

        # 5. Hotel Configuration (Singleton)
        hotel_config = HotelConfiguration.get_solo()
        self.stdout.write(self.style.SUCCESS(
            f"  - [Initialized Singleton] Hotel Configuration: {hotel_config.hotel_name} "
            f"(Check-in: {hotel_config.standard_check_in_time}, Check-out: {hotel_config.standard_check_out_time}, Max Late: {hotel_config.max_late_checkout_hours}h)"
        ))

        # 6. Structural CMS Sections (Idempotent, preserves admin modifications)
        cms_sections = [
            {
                'section_key': 'hero',
                'title': 'Welcome to Manohar Grand',
                'subtitle': 'Luxury Air-conditioned and Non A/c Rooms',
                'body': '',
                'metadata': {
                    'connectivity_badge': 'Walkable distance from JNTU Metro Station',
                    'cta_primary_text': 'Book Your Stay',
                    'cta_secondary_text': 'Explore Rooms'
                },
                'display_order': 1,
            },
            {
                'section_key': 'welcome',
                'title': 'Redefines Luxury with Affordable Prices',
                'subtitle': 'Located in the heart of Hyderabad',
                'body': (
                    'Located in the heart of Hyderabad, Manohar Grand blends comfort, luxury, '
                    'and convenience for every traveler. Our elegantly designed rooms feature modern '
                    'amenities like high-speed Wi-Fi, plush bedding, and close proximity to JNTU Metro Station.'
                ),
                'metadata': {},
                'display_order': 2,
            },
            {
                'section_key': 'why-choose-us',
                'title': 'Why Choose Manohar Grand',
                'subtitle': 'Unmatched Comfort & Premium Hospitality',
                'body': '',
                'metadata': {
                    'highlights': [
                        'WAKEFIT Memory Foam Mattresses in all bedrooms',
                        '32" Smart TV with OTT apps',
                        'Walkable distance from JNTU Metro Station',
                        '24/7 Front desk & security',
                        'On-site vehicle parking',
                        '24/7 Hot & cold water'
                    ]
                },
                'display_order': 3,
            },
            {
                'section_key': 'about',
                'title': 'Redefines Luxury with Affordable Prices',
                'subtitle': 'Dedicated to a Relaxing & Convenient Hotel Experience',
                'body': (
                    'Welcome to Manohar Grand. Located conveniently near JNTU Metro Station in Kukatpally, '
                    'our hotel is configured to serve business professionals, transit travelers, and visiting '
                    'families with dependable amenities, clean attached bathrooms, and warm hospitality.'
                ),
                'metadata': {},
                'display_order': 4,
            },
            {
                'section_key': 'cta',
                'title': 'Plan Your Stay at Manohar Grand',
                'subtitle': 'Direct Booking Benefits',
                'body': (
                    'Enjoy comfortable AC & Non-AC rooms with transparent rates and attentive hospitality. '
                    'Reserve directly for instant booking confirmation.'
                ),
                'metadata': {},
                'display_order': 5,
            },
        ]

        for sec in cms_sections:
            section, s_created = CMSSection.objects.get_or_create(
                section_key=sec['section_key'],
                defaults={
                    'title': sec['title'],
                    'subtitle': sec['subtitle'],
                    'body': sec['body'],
                    'metadata': sec['metadata'],
                    'display_order': sec['display_order'],
                    'is_active': True,
                }
            )
            s_status = "Created" if s_created else "Preserved Existing"
            self.stdout.write(self.style.SUCCESS(f"  - [{s_status}] CMS Section: {section.section_key} ({section.title})"))

        # 7. Verification of Strict Boundaries
        physical_room_count = PhysicalRoom.objects.count()
        room_image_count = RoomImage.objects.count()
        gallery_count = GalleryMedia.objects.count()
        faq_count = FAQ.objects.count()

        self.stdout.write(self.style.NOTICE(
            f"\nMaster Data Summary:\n"
            f"  - Total Room Categories: {RoomCategory.objects.count()}\n"
            f"  - Total Master Amenities: {Amenity.objects.count()}\n"
            f"  - Total Room Rate Plans: {RoomRatePlan.objects.count()}\n"
            f"  - Total Tax Rules: {TaxRule.objects.count()}\n"
            f"  - Total Hotel Configurations: {HotelConfiguration.objects.count()} (Singleton)\n"
            f"  - Total CMS Sections: {CMSSection.objects.count()}\n"
            f"  - Total FAQ Items: {faq_count} (ZERO unconfirmed FAQs seeded)\n"
            f"  - Total Physical Rooms: {physical_room_count} (ZERO seeded as required)\n"
            f"  - Total Room Images: {room_image_count} (ZERO fake media seeded)\n"
            f"  - Total Gallery Media: {gallery_count} (ZERO fake media seeded)"
        ))
        self.stdout.write(self.style.SUCCESS("Phase 2 Step 4 Master Data seeding complete."))


