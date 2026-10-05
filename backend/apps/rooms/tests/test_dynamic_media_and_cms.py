"""
Comprehensive Unit and Integration Test Suite for Phase 1:
Dynamic CMS, Room Media Serialization, and Public Content APIs.
"""
from decimal import Decimal
import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from apps.rooms.models import RoomCategory, RoomImage, Amenity, RoomCategoryAmenity
from apps.pricing.models import RoomRatePlan
from apps.cms.models import HotelConfiguration, CMSSection, FAQ, GalleryMedia


@pytest.mark.django_db
class TestDynamicMediaAndCMSFoundation:
    """Test suite verifying all Phase 1 backend contracts and media URLs."""

    @pytest.fixture
    def client(self):
        return APIClient()

    @pytest.fixture
    def setup_media_and_cms(self):
        # 1. Clean / update Room Categories
        ac_category, _ = RoomCategory.objects.update_or_create(
            slug='ac-room',
            defaults={
                'name': 'AC Room',
                'tagline': 'Luxury Air-Conditioned Comfort',
                'description': 'Premium air-conditioned room with Wakefit mattress and 32-inch Smart TV.',
                'included_adults': 2,
                'included_children': 0,
                'max_adults': 4,
                'max_children': 2,
                'max_total_occupancy': 4,
                'display_order': 1,
                'is_active': True,
            }
        )

        RoomRatePlan.objects.update_or_create(
            category=ac_category,
            name='Standard AC Rate',
            defaults={
                'base_price_per_night': Decimal('1599.00'),
                'currency': 'INR',
                'is_active': True,
            }
        )

        # Clear existing images for clean test isolation
        RoomImage.objects.filter(category=ac_category).delete()

        # 2. Upload dummy images to RoomImage
        small_gif = (
            b'\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\x80\x00\x00'
            b'\xff\xff\xff\x00\x00\x00\x21\xf9\x04\x01\x00\x00\x00'
            b'\x00\x2c\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02'
            b'\x44\x01\x00\x3b'
        )
        img_file1 = SimpleUploadedFile("room1.jpg", small_gif, content_type="image/jpeg")
        img_file2 = SimpleUploadedFile("room2.jpg", small_gif, content_type="image/jpeg")

        # Image 1 (Secondary, order 2)
        RoomImage.objects.create(
            category=ac_category,
            image=img_file1,
            caption="AC Room Side Angle",
            alt_text="Side view",
            is_primary=False,
            display_order=2,
            is_active=True
        )

        # Image 2 (Primary, order 1)
        RoomImage.objects.create(
            category=ac_category,
            image=img_file2,
            caption="AC Room Master Bed",
            alt_text="Primary bed view",
            is_primary=True,
            display_order=1,
            is_active=True
        )

        # Inactive Image (order 0, should be excluded from public response)
        RoomImage.objects.create(
            category=ac_category,
            image_url="https://example.com/draft-room.jpg",
            caption="Draft unapproved photo",
            is_active=False,
            display_order=0
        )

        # 3. Amenities
        amenity_wifi, _ = Amenity.objects.update_or_create(
            name='High-Speed Wi-Fi',
            defaults={
                'category': 'convenience',
                'icon_name': 'wifi',
                'description': 'Complimentary high-speed wireless internet.',
                'is_property_wide': True,
                'is_active': True,
                'display_order': 1,
            }
        )
        amenity_ac, _ = Amenity.objects.update_or_create(
            name='Individual Air Conditioning',
            defaults={
                'category': 'comfort',
                'icon_name': 'air-conditioning',
                'description': 'Remote-controlled AC unit in room.',
                'is_property_wide': False,
                'is_active': True,
                'display_order': 2,
            }
        )
        Amenity.objects.update_or_create(
            name='Draft Amenity',
            defaults={'is_active': False}
        )

        RoomCategoryAmenity.objects.get_or_create(
            category=ac_category,
            amenity=amenity_wifi,
            defaults={'is_highlight': True, 'display_order': 1}
        )
        RoomCategoryAmenity.objects.get_or_create(
            category=ac_category,
            amenity=amenity_ac,
            defaults={'is_highlight': True, 'display_order': 2}
        )

        # 4. Gallery Media
        GalleryMedia.objects.all().delete()
        GalleryMedia.objects.create(
            title="Hotel Exterior View",
            category="exterior",
            image_url="https://example.com/exterior.jpg",
            caption="Main entrance and facade",
            is_featured=True,
            display_order=1,
            is_active=True
        )
        GalleryMedia.objects.create(
            title="Reception Lobby",
            category="property",
            image_url="https://example.com/reception.jpg",
            caption="24/7 Front desk",
            is_featured=False,
            display_order=2,
            is_active=True
        )
        GalleryMedia.objects.create(
            title="Draft Gallery Item",
            category="property",
            image_url="https://example.com/draft.jpg",
            is_active=False,
            display_order=0
        )

        # 5. Hotel Configuration
        hotel_cfg = HotelConfiguration.get_solo()
        hotel_cfg.hotel_name = "Manohar Grand"
        hotel_cfg.primary_phone = "+91 7997044999"
        hotel_cfg.address = "Plot No: 11, Road No: 1, Vasantha Nagar Colony, Kukatpally, Hyderabad"
        hotel_cfg.save()

        # 6. CMS Sections
        CMSSection.objects.update_or_create(
            section_key='hero',
            defaults={
                'title': 'Welcome to Manohar Grand',
                'subtitle': 'Luxury Air-conditioned and Non A/c Rooms',
                'display_order': 1,
                'is_active': True,
            }
        )
        CMSSection.objects.update_or_create(
            section_key='draft-sec',
            defaults={
                'title': 'Draft Section',
                'is_active': False,
            }
        )

        # 7. FAQs
        FAQ.objects.all().delete()
        FAQ.objects.create(
            question='What is the check-in time?',
            answer='Standard check-in time is 11:00 AM.',
            category='checkin_checkout',
            display_order=1,
            is_active=True
        )
        FAQ.objects.create(
            question='Unapproved FAQ',
            answer='Pending',
            is_active=False
        )

        return {
            'ac_category': ac_category,
        }

    def test_1_room_category_api_returns_active_room_images(self, client, setup_media_and_cms):
        """Verify GET /api/v1/rooms/categories/ returns active RoomImage records."""
        resp = client.get('/api/v1/rooms/categories/')
        assert resp.status_code == 200
        data = resp.json()['data']
        assert len(data) >= 1
        ac_room = next(c for c in data if c['slug'] == 'ac-room')
        
        # Must return active images only
        images = ac_room['images']
        assert len(images) == 2
        for img in images:
            assert 'id' in img
            assert 'image_url' in img
            assert 'caption' in img
            assert 'is_primary' in img
            assert 'display_order' in img
            assert img['is_active'] is True

    def test_2_room_image_ordering_and_primary_flag(self, client, setup_media_and_cms):
        """Verify room images are ordered deterministically (display_order 1 then 2)."""
        resp = client.get('/api/v1/rooms/categories/ac-room/')
        assert resp.status_code == 200
        data = resp.json()['data']
        images = data['images']
        assert len(images) == 2
        assert images[0]['display_order'] == 1
        assert images[0]['is_primary'] is True
        assert images[1]['display_order'] == 2
        assert images[1]['is_primary'] is False

    def test_3_primary_image_resolution(self, client, setup_media_and_cms):
        """Verify primary_image resolves the explicit is_primary=True image."""
        resp = client.get('/api/v1/rooms/categories/ac-room/')
        assert resp.status_code == 200
        primary = resp.json()['data']['primary_image']
        assert primary is not None
        assert primary['is_primary'] is True
        assert primary['caption'] == "AC Room Master Bed"

    def test_4_absolute_media_url_formatting(self, client, setup_media_and_cms):
        """Verify image_url includes absolute URL with protocol and host."""
        resp = client.get('/api/v1/rooms/categories/ac-room/')
        assert resp.status_code == 200
        primary_url = resp.json()['data']['primary_image']['image_url']
        assert primary_url.startswith('http://') or primary_url.startswith('https://')
        assert '/media/' in primary_url

    def test_5_gallery_media_api_filtering_and_ordering(self, client, setup_media_and_cms):
        """Verify GET /api/v1/content/gallery/ filtering and deterministic sorting."""
        resp = client.get('/api/v1/content/gallery/')
        assert resp.status_code == 200
        items = resp.json()['data']
        assert len(items) == 2
        assert items[0]['title'] == "Hotel Exterior View"

        # Test category filter
        resp_filtered = client.get('/api/v1/content/gallery/?category=exterior')
        assert resp_filtered.status_code == 200
        assert len(resp_filtered.json()['data']) == 1
        assert resp_filtered.json()['data'][0]['category'] == 'exterior'

        # Test featured filter
        resp_featured = client.get('/api/v1/content/gallery/?featured=true')
        assert resp_featured.status_code == 200
        assert len(resp_featured.json()['data']) == 1
        assert resp_featured.json()['data'][0]['is_featured'] is True

    def test_6_hotel_configuration_api_contract(self, client, setup_media_and_cms):
        """Verify GET /api/v1/content/hotel-config/ returns public hotel details."""
        resp = client.get('/api/v1/content/hotel-config/')
        assert resp.status_code == 200
        data = resp.json()['data']
        assert data['hotel_name'] == "Manohar Grand"
        assert data['primary_phone'] == "+91 7997044999"
        assert 'Kukatpally' in data['address']
        assert 'standard_check_in_time' in data
        assert 'cancellation_policy_text' in data

    def test_7_cms_sections_public_api(self, client, setup_media_and_cms):
        """Verify GET /api/v1/content/sections/ returns active sections and excludes draft ones."""
        resp = client.get('/api/v1/content/sections/')
        assert resp.status_code == 200
        sections = resp.json()['data']
        section_keys = [s['section_key'] for s in sections]
        assert 'hero' in section_keys
        assert 'draft-sec' not in section_keys

        # Single detail endpoint
        resp_detail = client.get('/api/v1/content/sections/hero/')
        assert resp_detail.status_code == 200
        assert resp_detail.json()['data']['title'] == "Welcome to Manohar Grand"

    def test_8_amenities_public_api(self, client, setup_media_and_cms):
        """Verify GET /api/v1/rooms/amenities/ returns active amenities with icon identifier."""
        resp = client.get('/api/v1/rooms/amenities/')
        assert resp.status_code == 200
        amenities = resp.json()['data']
        names = [a['name'] for a in amenities]
        assert 'High-Speed Wi-Fi' in names
        assert 'Draft Amenity' not in names
        wifi = next(a for a in amenities if a['name'] == 'High-Speed Wi-Fi')
        assert wifi['icon_name'] == 'wifi'
        assert wifi['is_property_wide'] is True

    def test_9_faqs_public_api(self, client, setup_media_and_cms):
        """Verify GET /api/v1/content/faqs/ returns active FAQs and excludes inactive ones."""
        resp = client.get('/api/v1/content/faqs/')
        assert resp.status_code == 200
        faqs = resp.json()['data']
        assert len(faqs) == 1
        assert faqs[0]['question'] == "What is the check-in time?"
        assert faqs[0]['category'] == "checkin_checkout"

    def test_10_public_apis_security_and_isolation(self, client, setup_media_and_cms):
        """Verify public APIs never expose internal audit logs, user passwords, or private data."""
        resp = client.get('/api/v1/rooms/categories/ac-room/')
        data = resp.json()['data']
        assert 'password' not in data
        assert 'created_by' not in data
        assert 'audit_logs' not in data
