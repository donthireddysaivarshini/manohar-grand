"""
API test suite for Public Room Categories, Amenities, and Admin Physical Room Management.
"""
from decimal import Decimal
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from apps.authentication.models import StaffProfile
from apps.rooms.models import RoomCategory, PhysicalRoom, Amenity, RoomCategoryAmenity, RoomImage
from apps.pricing.models import RoomRatePlan
from core.models import AuditLog

User = get_user_model()


@pytest.mark.django_db
class TestRoomsAPI:
    """Comprehensive test suite for rooms public and administrative REST APIs."""

    @pytest.fixture
    def client(self):
        return APIClient()

    @pytest.fixture
    def superadmin_user(self):
        user = User.objects.create_superuser(
            email='superadmin@manohargrand.com',
            password='SuperAdminPass123!',
            first_name='Super',
            last_name='Admin'
        )
        StaffProfile.objects.create(user=user, role='superadmin', employee_id='EMP-SUP-01')
        return user

    @pytest.fixture
    def manager_user(self):
        user = User.objects.create_user(
            email='manager@manohargrand.com',
            password='ManagerPass123!',
            first_name='Hotel',
            last_name='Manager',
            is_staff=True
        )
        StaffProfile.objects.create(user=user, role='manager', employee_id='EMP-MGR-01')
        return user

    @pytest.fixture
    def receptionist_user(self):
        user = User.objects.create_user(
            email='receptionist@manohargrand.com',
            password='ReceptPass123!',
            first_name='Front',
            last_name='Desk',
            is_staff=True
        )
        StaffProfile.objects.create(user=user, role='receptionist', employee_id='EMP-REC-01')
        return user

    @pytest.fixture
    def setup_rooms_data(self):
        # Create categories
        ac = RoomCategory.objects.create(
            slug='ac-room',
            name='AC Room',
            tagline='Climate controlled comfort',
            description='Premium air-conditioned accommodations.',
            included_adults=2,
            max_total_occupancy=4,
            display_order=1,
            is_active=True
        )
        non_ac = RoomCategory.objects.create(
            slug='non-ac-room',
            name='Non-AC Room',
            tagline='Natural ventilation comfort',
            description='Budget friendly accommodations.',
            included_adults=2,
            max_total_occupancy=2,
            display_order=2,
            is_active=True
        )
        inactive_cat = RoomCategory.objects.create(
            slug='presidential-suite',
            name='Presidential Suite',
            is_active=False
        )

        # Rate plans
        RoomRatePlan.objects.create(
            category=ac,
            name='Standard AC Rate',
            base_price_per_night=Decimal('1599.00'),
            is_active=True
        )
        RoomRatePlan.objects.create(
            category=non_ac,
            name='Standard Non-AC Rate',
            base_price_per_night=Decimal('1299.00'),
            is_active=True
        )

        # Amenities
        wifi = Amenity.objects.create(name='High-Speed Wi-Fi', icon_name='wifi', is_active=True)
        geyser = Amenity.objects.create(name='24/7 Geyser Hot Water', icon_name='shower-head', is_active=True)
        inactive_amenity = Amenity.objects.create(name='Old Gym', is_active=False)

        RoomCategoryAmenity.objects.create(category=ac, amenity=wifi, is_highlight=True, display_order=1)
        RoomCategoryAmenity.objects.create(category=ac, amenity=geyser, is_highlight=False, display_order=2)
        RoomCategoryAmenity.objects.create(category=ac, amenity=inactive_amenity, is_highlight=False, display_order=3)

        # Images
        RoomImage.objects.create(
            category=ac,
            image_url='https://example.com/ac-hero.webp',
            caption='AC Hero View',
            is_primary=True,
            is_active=True
        )
        RoomImage.objects.create(
            category=ac,
            image_url='https://example.com/ac-bathroom.webp',
            caption='AC Bathroom',
            is_primary=False,
            is_active=True
        )
        RoomImage.objects.create(
            category=ac,
            image_url='https://example.com/inactive-draft.webp',
            caption='Draft Image',
            is_active=False
        )

        # Physical Rooms
        PhysicalRoom.objects.create(category=ac, room_number='101', floor=1, operational_status='operational')
        PhysicalRoom.objects.create(category=ac, room_number='102', floor=1, operational_status='maintenance')
        PhysicalRoom.objects.create(category=non_ac, room_number='201', floor=2, operational_status='operational')

        return {'ac': ac, 'non_ac': non_ac, 'inactive': inactive_cat}

    def test_public_room_categories_list(self, client, setup_rooms_data):
        response = client.get('/api/v1/rooms/categories/')
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
        assert 'timestamp' in data['meta']
        assert len(data['data']) == 2  # Inactive category excluded

        ac_data = next(c for c in data['data'] if c['slug'] == 'ac-room')
        assert ac_data['name'] == 'AC Room'
        assert ac_data['base_price_per_night'] == '1599.00'
        assert ac_data['currency'] == 'INR'
        assert ac_data['active_physical_room_count'] == 1  # 1 operational out of 2
        assert ac_data['total_physical_room_count'] == 2
        assert ac_data['primary_image']['caption'] == 'AC Hero View'
        assert len(ac_data['images']) == 2  # Inactive image excluded
        assert len(ac_data['amenities']) == 2  # Inactive amenity excluded

    def test_public_room_category_detail(self, client, setup_rooms_data):
        response = client.get('/api/v1/rooms/categories/ac-room/')
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
        assert data['data']['slug'] == 'ac-room'
        assert data['data']['pricing_details']['base_price_per_night'] == '1599.00'

        # Test 404 for inactive or missing category
        resp_inactive = client.get('/api/v1/rooms/categories/presidential-suite/')
        assert resp_inactive.status_code == 404
        resp_nonexistent = client.get('/api/v1/rooms/categories/penthouse/')
        assert resp_nonexistent.status_code == 404

    def test_public_amenities_list(self, client, setup_rooms_data):
        response = client.get('/api/v1/rooms/amenities/')
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
        assert len(data['data']) == 2  # Inactive excluded
        names = [a['name'] for a in data['data']]
        assert 'High-Speed Wi-Fi' in names
        assert 'Old Gym' not in names

    def test_physical_rooms_admin_rbac_and_crud(self, client, superadmin_user, manager_user, receptionist_user, setup_rooms_data):
        # 1. Unauthenticated -> 401
        resp_unauth = client.get('/api/v1/admin/rooms/physical-rooms/')
        assert resp_unauth.status_code == 401

        # 2. Receptionist -> GET allowed (200), POST denied (403)
        client.force_login(receptionist_user)
        resp_rec_get = client.get('/api/v1/admin/rooms/physical-rooms/')
        assert resp_rec_get.status_code == 200
        assert len(resp_rec_get.json()['data']) == 3

        resp_rec_post = client.post('/api/v1/admin/rooms/physical-rooms/', {
            'category': str(setup_rooms_data['ac'].id),
            'room_number': '103',
            'floor': 1,
            'operational_status': 'operational'
        })
        assert resp_rec_post.status_code == 403

        # 3. Manager -> GET allowed (200), POST denied (403 per SuperAdmin only setup)
        client.force_login(manager_user)
        resp_mgr_post = client.post('/api/v1/admin/rooms/physical-rooms/', {
            'category': str(setup_rooms_data['ac'].id),
            'room_number': '103',
            'floor': 1,
            'operational_status': 'operational'
        })
        assert resp_mgr_post.status_code == 403

        # 4. SuperAdmin -> POST creates room and emits AuditLog
        client.force_login(superadmin_user)
        resp_sup_post = client.post('/api/v1/admin/rooms/physical-rooms/', {
            'category': str(setup_rooms_data['ac'].id),
            'room_number': '103',
            'floor': 1,
            'operational_status': 'operational',
            'notes': 'Corner quiet room'
        })
        assert resp_sup_post.status_code == 201
        new_room_id = resp_sup_post.json()['data']['id']

        audit_create = AuditLog.objects.filter(resource_type='PhysicalRoom', resource_id=new_room_id, action='create').first()
        assert audit_create is not None
        assert audit_create.actor == superadmin_user
        assert audit_create.actor_role == 'superadmin'

        # 5. Manager updates operational status -> PATCH 200 and emits AuditLog
        client.force_login(manager_user)
        resp_mgr_patch = client.patch(f'/api/v1/admin/rooms/physical-rooms/{new_room_id}/', {
            'operational_status': 'maintenance'
        })
        assert resp_mgr_patch.status_code == 200
        assert resp_mgr_patch.json()['data']['operational_status'] == 'maintenance'

        audit_status = AuditLog.objects.filter(resource_type='PhysicalRoom', resource_id=new_room_id, action='status_change').first()
        assert audit_status is not None
        assert audit_status.actor == manager_user
        assert audit_status.actor_role == 'manager'

        # 6. Manager cannot DELETE -> 403
        resp_mgr_del = client.delete(f'/api/v1/admin/rooms/physical-rooms/{new_room_id}/')
        assert resp_mgr_del.status_code == 403

        # 7. SuperAdmin can DELETE -> 200 and emits AuditLog
        client.force_login(superadmin_user)
        resp_sup_del = client.delete(f'/api/v1/admin/rooms/physical-rooms/{new_room_id}/')
        assert resp_sup_del.status_code == 200

        audit_del = AuditLog.objects.filter(resource_type='PhysicalRoom', resource_id=new_room_id, action='delete').first()
        assert audit_del is not None
        assert audit_del.actor == superadmin_user
