from django.core.management.base import BaseCommand
from django.db import transaction
from apps.rooms.models import RoomCategory, RoomImage


class Command(BaseCommand):
    help = 'Seeds high-quality initial showcase images for AC and Non-AC room categories.'

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Seeding initial room images..."))

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

        self.stdout.write(self.style.SUCCESS(
            f"Successfully seeded room images:\n"
            f"  - AC Room primary photo set: {ac_img.caption}\n"
            f"  - Non-AC Room primary photo set: {nac_img.caption}\n"
            f"Note: Hotel staff can upload real photos at any time in the Admin Panel to replace these."
        ))
