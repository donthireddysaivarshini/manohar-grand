"""
API integration tests for /api/v1/availability/search/ and /api/v1/availability/calendar/.
Validates request parsing, boundary validation errors, and public response payloads.
"""
from datetime import date
import pytest
from rest_framework import status
from rest_framework.test import APIClient

from apps.rooms.models import RoomCategory, PhysicalRoom


@pytest.mark.django_db
class TestAvailabilityAPI:

    @pytest.fixture(autouse=True)
    def setup_data(self):
        self.client = APIClient()
        self.ac_category = RoomCategory.objects.create(
            name='Deluxe AC Room',
            slug='deluxe-ac-room',
            included_adults=2,
            max_total_occupancy=4,
            is_active=True
        )
        for i in range(5):
            PhysicalRoom.objects.create(
                category=self.ac_category,
                room_number=f"10{i}",
                operational_status='operational'
            )

    def test_availability_search_success_envelope(self):
        """Valid availability search returns standard success envelope and accurate data."""
        url = '/api/v1/availability/search/?check_in=2026-10-10&check_out=2026-10-13&rooms=2'
        response = self.client.get(url)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data['success'] is True
        assert 'data' in data
        assert 'meta' in data
        assert 'timestamp' in data['meta']

        search_data = data['data']
        assert search_data['check_in'] == '2026-10-10'
        assert search_data['check_out'] == '2026-10-13'
        assert search_data['nights_count'] == 3
        assert search_data['requested_quantity'] == 2

        cat_list = search_data['categories']
        assert len(cat_list) == 1
        cat = cat_list[0]
        assert cat['category_slug'] == 'deluxe-ac-room'
        assert cat['total_operational_capacity'] == 5
        assert cat['minimum_available_rooms'] == 5
        assert cat['is_available'] is True
        assert len(cat['nightly_availability']) == 3

    def test_availability_search_by_category_slug(self):
        """Filter availability search by specific category slug."""
        url = f'/api/v1/availability/search/?check_in=2026-10-10&check_out=2026-10-12&category={self.ac_category.slug}'
        response = self.client.get(url)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data['data']['categories']) == 1
        assert data['data']['categories'][0]['category_slug'] == 'deluxe-ac-room'

    def test_availability_search_missing_dates_fails_validation(self):
        """Missing check_in or check_out returns 400 with standard validation error envelope."""
        response = self.client.get('/api/v1/availability/search/?check_in=2026-10-10')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        data = response.json()
        assert data['success'] is False
        assert data['error']['code'] == 'VALIDATION_ERROR'
        assert 'check_out' in data['error']['details']

    def test_availability_search_inverted_dates_rejected(self):
        """check_out <= check_in returns 400 Bad Request."""
        response = self.client.get('/api/v1/availability/search/?check_in=2026-10-15&check_out=2026-10-10')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        data = response.json()
        assert data['success'] is False
        assert 'check_out' in data['error']['details']

    def test_availability_search_same_day_dates_rejected(self):
        """Same-day check_in == check_out returns 400 Bad Request (overnight stay required)."""
        response = self.client.get('/api/v1/availability/search/?check_in=2026-10-10&check_out=2026-10-10')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        data = response.json()
        assert data['success'] is False
        assert 'check_out' in data['error']['details']

    def test_availability_search_non_existent_category_rejected(self):
        """Non-existent category parameter returns 400 Bad Request."""
        response = self.client.get('/api/v1/availability/search/?check_in=2026-10-10&check_out=2026-10-12&category=non-existent-room')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        data = response.json()
        assert data['success'] is False
        assert 'category' in data['error']['details']

    def test_availability_calendar_endpoint(self):
        """Calendar availability returns day-by-day capacity breakdown for month."""
        url = '/api/v1/availability/calendar/?month=2026-10'
        response = self.client.get(url)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data['success'] is True
        cal_data = data['data']
        assert cal_data['check_in'] == '2026-10-01'
        assert cal_data['check_out'] == '2026-11-01'
        assert len(cal_data['stay_nights']) == 31
        assert len(cal_data['categories']) == 1

    def test_availability_endpoint_does_not_leak_pii(self):
        """Security: Endpoint must return strictly capacity statistics and no customer PII."""
        url = '/api/v1/availability/search/?check_in=2026-10-10&check_out=2026-10-12'
        response = self.client.get(url)
        content_str = response.content.decode('utf-8')

        forbidden_keys = ['guest_name', 'guest_phone', 'guest_email', 'aadhaar', 'access_token', 'password']
        for key in forbidden_keys:
            assert f'"{key}"' not in content_str
