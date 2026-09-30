import uuid
import pytest
from django.db import IntegrityError
from django.db.models import ProtectedError
from django.core.exceptions import ValidationError
from apps.rooms.models import RoomCategory, PhysicalRoom


@pytest.mark.django_db
class TestRoomCategoryModel:
    """Tests for RoomCategory model, constraints, validation, and properties."""

    def test_create_room_category_success(self):
        category = RoomCategory.objects.create(
            name='Executive AC Suite',
            slug='executive-ac-suite',
            tagline='Premium Suite Experience',
            description='Spacious suite with king bed and balcony.',
            included_adults=2,
            included_children=1,
            max_adults=3,
            max_children=2,
            max_total_occupancy=4,
            display_order=10,
            is_active=True
        )
        assert isinstance(category.id, uuid.UUID)
        assert category.name == 'Executive AC Suite'
        assert category.slug == 'executive-ac-suite'
        assert str(category) == 'Executive AC Suite'
        assert category.active_physical_room_count == 0
        assert category.total_physical_room_count == 0

    def test_room_category_slug_must_be_unique(self):
        RoomCategory.objects.create(
            name='AC Standard',
            slug='ac-standard',
            max_total_occupancy=4
        )
        with pytest.raises(IntegrityError):
            RoomCategory.objects.create(
                name='AC Deluxe',
                slug='ac-standard', # Duplicate slug
                max_total_occupancy=4
            )

    def test_occupancy_validation_max_occupancy_less_than_included_adults(self):
        category = RoomCategory(
            name='Invalid Category',
            slug='invalid-category',
            included_adults=3,
            max_total_occupancy=2 # Invalid: total occupancy < included adults
        )
        with pytest.raises(ValidationError) as excinfo:
            category.full_clean()
        assert 'max_total_occupancy' in excinfo.value.message_dict

    def test_occupancy_validation_max_adults_exceeds_max_total_occupancy(self):
        category = RoomCategory(
            name='Invalid Adults Category',
            slug='invalid-adults-category',
            included_adults=2,
            max_adults=5,
            max_total_occupancy=4 # Invalid: max adults > max total occupancy
        )
        with pytest.raises(ValidationError) as excinfo:
            category.full_clean()
        assert 'max_adults' in excinfo.value.message_dict

    def test_category_active_inactive_behavior(self):
        cat_active = RoomCategory.objects.create(
            name='Active Cat',
            slug='active-cat',
            is_active=True
        )
        cat_inactive = RoomCategory.objects.create(
            name='Inactive Cat',
            slug='inactive-cat',
            is_active=False
        )
        active_slugs = list(RoomCategory.objects.filter(is_active=True).values_list('slug', flat=True))
        assert 'active-cat' in active_slugs
        assert 'inactive-cat' not in active_slugs


@pytest.mark.django_db
class TestPhysicalRoomModel:
    """Tests for PhysicalRoom model, operational statuses, unique room numbers, and PROTECT deletion."""

    @pytest.fixture
    def sample_category(self):
        return RoomCategory.objects.create(
            name='AC Room Test',
            slug='ac-room-test',
            max_total_occupancy=4
        )

    def test_create_physical_room_success(self, sample_category):
        room = PhysicalRoom.objects.create(
            category=sample_category,
            room_number='101',
            floor=1,
            operational_status='operational',
            notes='Corner room near elevator'
        )
        assert isinstance(room.id, uuid.UUID)
        assert room.room_number == '101'
        assert room.category == sample_category
        assert str(room) == 'Room 101 (AC Room Test)'

    def test_unique_room_number_constraint(self, sample_category):
        PhysicalRoom.objects.create(
            category=sample_category,
            room_number='102',
            floor=1
        )
        with pytest.raises(IntegrityError):
            PhysicalRoom.objects.create(
                category=sample_category,
                room_number='102', # Duplicate room number
                floor=1
            )

    def test_protect_deletion_behavior_on_category_with_physical_rooms(self, sample_category):
        PhysicalRoom.objects.create(
            category=sample_category,
            room_number='103',
            floor=1
        )
        # Deleting category must raise ProtectedError because PhysicalRoom is linked
        with pytest.raises(ProtectedError):
            sample_category.delete()

    def test_all_operational_statuses(self, sample_category):
        statuses = ['operational', 'maintenance', 'blocked', 'inactive']
        for idx, status in enumerate(statuses, start=201):
            room = PhysicalRoom.objects.create(
                category=sample_category,
                room_number=str(idx),
                floor=2,
                operational_status=status
            )
            assert room.operational_status == status

    def test_active_physical_room_count_derivation(self, sample_category):
        # 1. Initially 0 rooms
        assert sample_category.active_physical_room_count == 0
        assert sample_category.total_physical_room_count == 0

        # 2. Add 2 operational rooms
        PhysicalRoom.objects.create(category=sample_category, room_number='301', operational_status='operational')
        PhysicalRoom.objects.create(category=sample_category, room_number='302', operational_status='operational')

        # 3. Add 1 room under maintenance
        PhysicalRoom.objects.create(category=sample_category, room_number='303', operational_status='maintenance')

        # 4. Add 1 blocked room
        PhysicalRoom.objects.create(category=sample_category, room_number='304', operational_status='blocked')

        # 5. Add 1 inactive room
        PhysicalRoom.objects.create(category=sample_category, room_number='305', operational_status='inactive')

        # Active operational room count must be exactly 2
        assert sample_category.active_physical_room_count == 2
        # Total configured physical room count is 5
        assert sample_category.total_physical_room_count == 5

    def test_room_number_whitespace_cleaning(self, sample_category):
        room = PhysicalRoom(
            category=sample_category,
            room_number='   ',
            floor=1
        )
        with pytest.raises(ValidationError):
            room.full_clean()

