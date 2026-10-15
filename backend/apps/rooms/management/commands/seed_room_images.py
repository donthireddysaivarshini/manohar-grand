from django.core.management.base import BaseCommand
from django.db import transaction
from apps.rooms.models import RoomCategory, RoomImage
from apps.cms.models import GalleryMedia


class Command(BaseCommand):
    help = 'Seeds high-quality initial showcase images for AC/Non-AC rooms and homepage welcome gallery.'

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Seeding initial room & homepage gallery images..."))

        try:
            ac_category = RoomCategory.objects.get(slug='ac-room')
            nac_category = RoomCategory.objects.get(slug='non-ac-room')
        except RoomCategory.DoesNotExist:
            self.stdout.write(self.style.ERROR("Room categories not found. Please run seed_phase2_master_data first."))
            return

        # 1. AC Room Image (Luxury King/Queen Bed with AC)
        ac_img, ac_created = RoomImage.objects.get_or_create(
            category=ac_category,
            caption="Manohar Grand Deluxe AC Room with Wakefit Mattress",
            defaults={
                'image_url': 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
                'alt_text': 'Deluxe AC Room at Manohar Grand with Wakefit mattress and Smart TV',
                'is_primary': True,
                'display_order': 1,
                'is_active': True,
            }
        )
        if not ac_created and not ac_img.is_primary:
            ac_img.is_primary = True
            ac_img.save()

        # 2. Non-AC Room Image (Comfortable Budget Room)
        nac_img, nac_created = RoomImage.objects.get_or_create(
            category=nac_category,
            caption="Manohar Grand Non-AC Budget Room",
            defaults={
                'image_url': 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80',
                'alt_text': 'Comfortable Non-AC Room at Manohar Grand with attached bathroom',
                'is_primary': True,
                'display_order': 1,
                'is_active': True,
            }
        )
        if not nac_created and not nac_img.is_primary:
            nac_img.is_primary = True
            nac_img.save()

        # 3. Homepage Welcome Primary Image (Hotel Property / Ambience)
        prop_media, p_created = GalleryMedia.objects.get_or_create(
            title="Manohar Grand Hotel Ambience",
            defaults={
                'category': 'property',
                'image_url': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
                'caption': 'Warm hospitality and premium ambience at Manohar Grand, Kukatpally',
                'alt_text': 'Manohar Grand Hotel lobby and exterior entrance',
                'is_featured': True,
                'display_order': 1,
                'is_active': True,
            }
        )
        if not p_created:
            prop_media.is_featured = True
            prop_media.category = 'property'
            prop_media.save()

        # 4. Homepage Welcome Secondary Overlap Image (Executive Room Showcase)
        room_media, r_created = GalleryMedia.objects.get_or_create(
            title="Executive Room Comfort",
            defaults={
                'category': 'rooms',
                'image_url': 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
                'caption': 'Comfortable guest accommodations with plush bedding',
                'alt_text': 'Executive hotel bedroom interior at Manohar Grand',
                'is_featured': True,
                'display_order': 2,
                'is_active': True,
            }
        )
        if not r_created:
            room_media.is_featured = True
            room_media.save()

        self.stdout.write(self.style.SUCCESS(
            f"Successfully seeded room and homepage images:\n"
            f"  - AC Room primary photo set: {ac_img.caption}\n"
            f"  - Non-AC Room primary photo set: {nac_img.caption}\n"
            f"  - Homepage Welcome Primary Image: {prop_media.title}\n"
            f"  - Homepage Welcome Secondary Image: {room_media.title}\n"
            f"Note: Hotel staff can upload real photos at any time in the Admin Panel to replace these."
        ))
