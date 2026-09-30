import uuid
import pytest
from django.db import IntegrityError
from django.core.exceptions import ValidationError
from apps.rooms.models import RoomCategory, Amenity, RoomCategoryAmenity


@pytest.mark.django_db
class TestAmenityModel:
    """Tests for Amenity model, categories, unique constraints, and ordering."""

    def test_create_amenity_success(self):
        amenity = Amenity.objects.create(
            name='High-Speed Wi-Fi Test',
            category='convenience',
            icon_name='wifi',
            description='Fast complimentary Wi-Fi across the property.',
            is_property_wide=True,
            display_order=1,
            is_active=True
        )
        assert isinstance(amenity.id, uuid.UUID)
        assert amenity.name == 'High-Speed Wi-Fi Test'
        assert amenity.category == 'convenience'
        assert str(amenity) == 'High-Speed Wi-Fi Test'

    def test_amenity_name_must_be_unique(self):
        Amenity.objects.create(
            name='Complimentary Breakfast',
            category='service'
        )
        with pytest.raises(IntegrityError):
            Amenity.objects.create(
                name='Complimentary Breakfast', # Duplicate name
                category='comfort'
            )

    def test_amenity_name_blank_validation(self):
        amenity = Amenity(
            name='   ',
            category='comfort'
        )
        with pytest.raises(ValidationError):
            amenity.full_clean()

    def test_amenity_ordering_by_display_order(self):
        a1 = Amenity.objects.create(name='Amenity B', category='comfort', display_order=20)
        a2 = Amenity.objects.create(name='Amenity A', category='comfort', display_order=10)
        a3 = Amenity.objects.create(name='Amenity C', category='comfort', display_order=10)

        amenities = list(Amenity.objects.filter(name__in=['Amenity A', 'Amenity B', 'Amenity C']))
        assert amenities == [a2, a3, a1]


@pytest.mark.django_db
class TestRoomCategoryAmenityRelationship:
    """Tests for RoomCategoryAmenity through model and M2M associations."""

    @pytest.fixture
    def sample_category(self):
        return RoomCategory.objects.create(
            name='AC Room Suite',
            slug='ac-room-suite',
            max_total_occupancy=4
        )

    @pytest.fixture
    def sample_amenity(self):
        return Amenity.objects.create(
            name='Smart TV 32 Inch',
            category='convenience',
            icon_name='tv'
        )

    def test_link_amenity_to_room_category(self, sample_category, sample_amenity):
        link = RoomCategoryAmenity.objects.create(
            category=sample_category,
            amenity=sample_amenity,
            is_highlight=True,
            display_order=1
        )
        assert isinstance(link.id, uuid.UUID)
        assert str(link) == 'AC Room Suite - Smart TV 32 Inch'
        assert link.is_highlight is True
        assert sample_amenity in sample_category.amenities.all()

    def test_prevent_duplicate_category_amenity_link(self, sample_category, sample_amenity):
        RoomCategoryAmenity.objects.create(
            category=sample_category,
            amenity=sample_amenity
        )
        with pytest.raises(IntegrityError):
            RoomCategoryAmenity.objects.create(
                category=sample_category,
                amenity=sample_amenity # Duplicate association
            )

    def test_cascade_deletion_of_link_when_category_deleted(self, sample_category, sample_amenity):
        link = RoomCategoryAmenity.objects.create(
            category=sample_category,
            amenity=sample_amenity
        )
        link_id = link.id
        sample_category.delete()
        assert not RoomCategoryAmenity.objects.filter(id=link_id).exists()
        # The master Amenity itself must NOT be deleted
        assert Amenity.objects.filter(id=sample_amenity.id).exists()

    def test_cascade_deletion_of_link_when_amenity_deleted(self, sample_category, sample_amenity):
        link = RoomCategoryAmenity.objects.create(
            category=sample_category,
            amenity=sample_amenity
        )
        link_id = link.id
        sample_amenity.delete()
        assert not RoomCategoryAmenity.objects.filter(id=link_id).exists()
        # The RoomCategory itself must NOT be deleted
        assert RoomCategory.objects.filter(id=sample_category.id).exists()
