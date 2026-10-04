from django.core.management.base import BaseCommand
from django.db import transaction
from apps.rooms.models import RoomCategory, PhysicalRoom


class Command(BaseCommand):
    help = 'Seeds confirmed 28 physical rooms (20 AC, 8 Non-AC) for Manohar Grand Hotel.'

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Seeding 28 Physical Rooms for Manohar Grand..."))

        try:
            ac_category = RoomCategory.objects.get(slug='ac-room')
            nac_category = RoomCategory.objects.get(slug='non-ac-room')
        except RoomCategory.DoesNotExist:
            self.stdout.write(self.style.ERROR("Room categories not found. Please run seed_phase2_master_data first."))
            return

        # 1. 20 AC Rooms (Floor 1: 101-110, Floor 2: 201-210)
        ac_rooms = [
            (f"{100 + i}", 1) for i in range(1, 11)
        ] + [
            (f"{200 + i}", 2) for i in range(1, 11)
        ]

        ac_count = 0
        for room_no, floor in ac_rooms:
            room, created = PhysicalRoom.objects.get_or_create(
                room_number=room_no,
                defaults={
                    'category': ac_category,
                    'floor': floor,
                    'operational_status': 'operational',
                    'notes': 'Air Conditioned Deluxe Room with Wakefit Mattress & Smart TV'
                }
            )
            if created:
                ac_count += 1

        # 2. 8 Non-AC Rooms (Floor 3: 301-308)
        nac_rooms = [
            (f"{300 + i}", 3) for i in range(1, 9)
        ]

        nac_count = 0
        for room_no, floor in nac_rooms:
            room, created = PhysicalRoom.objects.get_or_create(
                room_number=room_no,
                defaults={
                    'category': nac_category,
                    'floor': floor,
                    'operational_status': 'operational',
                    'notes': 'Non-AC Budget Room with Wakefit Mattress & Smart TV'
                }
            )
            if created:
                nac_count += 1

        self.stdout.write(self.style.SUCCESS(
            f"Successfully seeded physical rooms:\n"
            f"  - AC Rooms: {ac_category.physical_rooms.count()} configured ({ac_count} newly created)\n"
            f"  - Non-AC Rooms: {nac_category.physical_rooms.count()} configured ({nac_count} newly created)\n"
            f"  - Total Physical Inventory: {PhysicalRoom.objects.count()} Rooms"
        ))
