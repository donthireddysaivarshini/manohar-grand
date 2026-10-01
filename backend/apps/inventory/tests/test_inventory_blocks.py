"""
Tests for RoomBlock, MaintenanceBlock, and stay-night date calculations in apps/inventory.
"""
from datetime import date
import pytest
from django.core.exceptions import ValidationError
from apps.rooms.models import RoomCategory, PhysicalRoom
from apps.inventory.models import RoomBlock, MaintenanceBlock
from apps.inventory.services import get_stay_nights, calculate_nights_count


@pytest.mark.django_db
class TestInventoryBlocksAndDateSemantics:
    """Test suite covering RoomBlock, MaintenanceBlock, and hospitality date calculations."""

    @pytest.fixture
    def setup_rooms(self):
        category = RoomCategory.objects.create(
            slug='ac-room',
            name='AC Room',
            included_adults=2,
            max_total_occupancy=4,
            is_active=True
        )
        room_101 = PhysicalRoom.objects.create(
            category=category,
            room_number='101',
            floor=1,
            operational_status='operational'
        )
        room_102 = PhysicalRoom.objects.create(
            category=category,
            room_number='102',
            floor=1,
            operational_status='operational'
        )
        return {'category': category, 'room_101': room_101, 'room_102': room_102}

    def test_stay_nights_date_calculation_and_semantics(self):
        # 10 Oct to 13 Oct -> 3 nights: 10, 11, 12 Oct (13 Oct checkout is not consumed)
        check_in = date(2026, 10, 10)
        check_out = date(2026, 10, 13)

        nights = get_stay_nights(check_in, check_out)
        assert len(nights) == 3
        assert nights == [
            date(2026, 10, 10),
            date(2026, 10, 11),
            date(2026, 10, 12),
        ]
        assert calculate_nights_count(check_in, check_out) == 3

        # Single night stay: 10 Oct to 11 Oct -> 1 night: [10 Oct]
        single_night = get_stay_nights(date(2026, 10, 10), date(2026, 10, 11))
        assert single_night == [date(2026, 10, 10)]
        assert calculate_nights_count(date(2026, 10, 10), date(2026, 10, 11)) == 1

        # Invalid: check_out <= check_in raises ValidationError
        with pytest.raises(ValidationError):
            get_stay_nights(date(2026, 10, 10), date(2026, 10, 10))

        with pytest.raises(ValidationError):
            get_stay_nights(date(2026, 10, 15), date(2026, 10, 10))

    def test_create_valid_room_block(self, setup_rooms):
        room = setup_rooms['room_101']
        block = RoomBlock.objects.create(
            physical_room=room,
            start_date=date(2026, 10, 10),
            end_date=date(2026, 10, 13),
            reason='VIP Reserved Unit',
            is_active=True
        )

        assert block.nights_count == 3
        assert block.consumed_nights == [
            date(2026, 10, 10),
            date(2026, 10, 11),
            date(2026, 10, 12),
        ]
        assert block.category == setup_rooms['category']
        assert block.is_active is True

    def test_room_block_rejects_invalid_date_range(self, setup_rooms):
        room = setup_rooms['room_101']
        block = RoomBlock(
            physical_room=room,
            start_date=date(2026, 10, 15),
            end_date=date(2026, 10, 10),
            reason='Invalid Range'
        )
        with pytest.raises(ValidationError) as exc:
            block.clean()
        assert 'end_date' in exc.value.message_dict

    def test_create_valid_maintenance_block(self, setup_rooms):
        room = setup_rooms['room_102']
        m_block = MaintenanceBlock.objects.create(
            physical_room=room,
            start_date=date(2026, 11, 1),
            end_date=date(2026, 11, 4),
            maintenance_type='deep_clean',
            reason='Annual deep carpet sanitization',
            is_active=True
        )

        assert m_block.nights_count == 3
        assert m_block.consumed_nights == [
            date(2026, 11, 1),
            date(2026, 11, 2),
            date(2026, 11, 3),
        ]
        assert m_block.category == setup_rooms['category']
        assert m_block.is_active is True

    def test_maintenance_block_rejects_same_day_or_inverted_dates(self, setup_rooms):
        room = setup_rooms['room_102']
        # Same day check-in/out
        m_block = MaintenanceBlock(
            physical_room=room,
            start_date=date(2026, 11, 5),
            end_date=date(2026, 11, 5),
            maintenance_type='repair'
        )
        with pytest.raises(ValidationError) as exc:
            m_block.clean()
        assert 'end_date' in exc.value.message_dict
