import uuid
from datetime import time
import pytest
from django.core.exceptions import ValidationError
from apps.cms.models import HotelConfiguration


@pytest.mark.django_db
class TestHotelConfigurationModel:
    """Tests for HotelConfiguration singleton model, operational timings, and baseline policies."""

    def test_singleton_initialization_via_get_solo(self):
        config = HotelConfiguration.get_solo()
        assert isinstance(config.id, uuid.UUID)
        assert config.hotel_name == 'Manohar Grand'
        assert config.standard_check_in_time == '11:00:00' or config.standard_check_in_time == time(11, 0)
        assert config.standard_check_out_time == '11:00:00' or config.standard_check_out_time == time(11, 0)
        assert config.max_late_checkout_hours == 3
        assert 'Once booking/payment is confirmed, booking cannot be cancelled/refunded.' in config.cancellation_policy_text
        assert 'Manohar Grand Configuration' in str(config)

    def test_singleton_only_allows_single_instance(self):
        config1 = HotelConfiguration.get_solo()
        config1.hotel_name = 'Manohar Grand Luxury Rooms'
        config1.save()

        # Calling get_solo again returns the same instance
        config2 = HotelConfiguration.get_solo()
        assert config2.id == config1.id
        assert config2.hotel_name == 'Manohar Grand Luxury Rooms'
        assert HotelConfiguration.objects.count() == 1

    def test_prevent_creating_multiple_distinct_configurations(self):
        HotelConfiguration.get_solo()
        duplicate_config = HotelConfiguration(
            id=uuid.uuid4(),
            hotel_name='Second Fake Hotel'
        )
        with pytest.raises(ValidationError) as excinfo:
            duplicate_config.clean()
        assert 'Only one HotelConfiguration singleton instance is permitted.' in str(excinfo.value)
