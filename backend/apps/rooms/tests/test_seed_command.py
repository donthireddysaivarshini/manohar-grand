from io import StringIO
import pytest
from django.core.management import call_command
from apps.rooms.models import RoomCategory, PhysicalRoom, Amenity, RoomCategoryAmenity, RoomImage
from apps.cms.models import GalleryMedia


@pytest.mark.django_db
class TestSeedPhase2MasterDataCommand:
    """Tests for the seed_phase2_master_data management command."""

    def test_seed_creates_expected_categories_amenities_and_zero_fake_media_or_rooms(self):
        # Clear out existing records
        RoomCategory.objects.all().delete()
        PhysicalRoom.objects.all().delete()
        Amenity.objects.all().delete()
        RoomCategoryAmenity.objects.all().delete()
        RoomImage.objects.all().delete()
        GalleryMedia.objects.all().delete()

        out = StringIO()
        call_command('seed_phase2_master_data', stdout=out)
        output = out.getvalue()

        # Check output messages
        assert 'Seeding Phase 2 Master Data' in output
        assert 'Category: AC Room' in output
        assert 'Category: Non-AC Room' in output

        # Assert exactly 2 categories created
        assert RoomCategory.objects.count() == 2
        ac = RoomCategory.objects.get(slug='ac-room')
        assert ac.name == 'AC Room'
        assert ac.max_total_occupancy == 4

        nac = RoomCategory.objects.get(slug='non-ac-room')
        assert nac.name == 'Non-AC Room'
        assert nac.max_total_occupancy == 2

        # Assert exactly 10 master amenities created and linked
        assert Amenity.objects.count() == 10
        assert Amenity.objects.filter(name='WAKEFIT Memory Foam Mattresses').exists()
        assert Amenity.objects.filter(name='Individual Air Conditioning').exists()
        assert ac.amenities.count() >= 5
        assert nac.amenities.count() >= 4

        # STRICT BOUNDARY CHECKS:
        assert PhysicalRoom.objects.count() == 0, "Seed must create ZERO physical rooms"
        assert RoomImage.objects.count() == 0, "Seed must create ZERO fake room images"
        assert GalleryMedia.objects.count() == 0, "Seed must create ZERO fake gallery media"

    def test_seed_command_is_idempotent(self):
        out1 = StringIO()
        call_command('seed_phase2_master_data', stdout=out1)

        out2 = StringIO()
        call_command('seed_phase2_master_data', stdout=out2)

        # Assert exact counts remain unchanged
        assert RoomCategory.objects.count() == 2
        assert Amenity.objects.count() == 10
        assert PhysicalRoom.objects.count() == 0
        assert RoomImage.objects.count() == 0
        assert GalleryMedia.objects.count() == 0

    def test_seed_preserves_admin_updated_data(self):
        # 1. Initial seed
        call_command('seed_phase2_master_data', stdout=StringIO())

        # 2. Simulate hotel administrator updating Non-AC room occupancy to 3 PAX and custom tagline
        nac = RoomCategory.objects.get(slug='non-ac-room')
        nac.max_total_occupancy = 3
        nac.tagline = 'Custom Admin Updated Tagline'
        nac.save()

        # 3. Simulate admin updating an amenity description
        wifi_amenity = Amenity.objects.get(name='High-Speed Wi-Fi')
        wifi_amenity.description = 'Custom 500 Mbps Fiber Wi-Fi'
        wifi_amenity.save()

        # 4. Run seed command again
        out = StringIO()
        call_command('seed_phase2_master_data', stdout=out)
        output = out.getvalue()
        assert 'Preserved Existing' in output

        # 5. Verify admin's customized data was NOT overwritten
        nac.refresh_from_db()
        assert nac.max_total_occupancy == 3
        assert nac.tagline == 'Custom Admin Updated Tagline'

        wifi_amenity.refresh_from_db()
        assert wifi_amenity.description == 'Custom 500 Mbps Fiber Wi-Fi'
