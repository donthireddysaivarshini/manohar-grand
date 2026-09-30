import uuid
from decimal import Decimal
from datetime import date, timedelta
import pytest
from django.core.exceptions import ValidationError
from django.db.models.deletion import ProtectedError
from apps.rooms.models import RoomCategory
from apps.pricing.models import RoomRatePlan


@pytest.mark.django_db
class TestRoomRatePlanModel:
    """Tests for RoomRatePlan model, validations, category relations, and historical integrity."""

    @pytest.fixture
    def ac_category(self):
        return RoomCategory.objects.create(
            slug='ac-room',
            name='AC Room',
            max_total_occupancy=4
        )

    def test_create_valid_rate_plan(self, ac_category):
        plan = RoomRatePlan.objects.create(
            category=ac_category,
            name='Standard Tariff',
            currency='INR',
            base_price_per_night=Decimal('1599.00'),
            extra_adult_charge=Decimal('350.00'),
            extra_child_charge=Decimal('300.00'),
            late_checkout_hourly_rate=Decimal('150.00'),
            is_active=True
        )
        assert isinstance(plan.id, uuid.UUID)
        assert plan.category == ac_category
        assert plan.base_price_per_night == Decimal('1599.00')
        assert plan.currency == 'INR'
        assert plan.is_active is True
        assert 'AC Room - Standard Tariff (₹1599.00/night) [Active]' in str(plan)

    def test_reject_negative_base_price(self, ac_category):
        plan = RoomRatePlan(
            category=ac_category,
            name='Invalid Negative Base',
            base_price_per_night=Decimal('-100.00')
        )
        with pytest.raises(ValidationError) as excinfo:
            plan.full_clean()
        assert 'base_price_per_night' in excinfo.value.message_dict

    def test_reject_negative_extra_guest_charges(self, ac_category):
        plan_adult = RoomRatePlan(
            category=ac_category,
            name='Invalid Adult Charge',
            base_price_per_night=Decimal('1599.00'),
            extra_adult_charge=Decimal('-50.00')
        )
        with pytest.raises(ValidationError) as excinfo:
            plan_adult.full_clean()
        assert 'extra_adult_charge' in excinfo.value.message_dict

        plan_child = RoomRatePlan(
            category=ac_category,
            name='Invalid Child Charge',
            base_price_per_night=Decimal('1599.00'),
            extra_child_charge=Decimal('-30.00')
        )
        with pytest.raises(ValidationError) as excinfo:
            plan_child.full_clean()
        assert 'extra_child_charge' in excinfo.value.message_dict

        plan_late = RoomRatePlan(
            category=ac_category,
            name='Invalid Late Checkout Charge',
            base_price_per_night=Decimal('1599.00'),
            late_checkout_hourly_rate=Decimal('-20.00')
        )
        with pytest.raises(ValidationError) as excinfo:
            plan_late.full_clean()
        assert 'late_checkout_hourly_rate' in excinfo.value.message_dict

    def test_effective_dates_validation(self, ac_category):
        today = date.today()
        yesterday = today - timedelta(days=1)
        plan = RoomRatePlan(
            category=ac_category,
            name='Invalid Dates',
            base_price_per_night=Decimal('1599.00'),
            effective_from=today,
            effective_to=yesterday
        )
        with pytest.raises(ValidationError) as excinfo:
            plan.full_clean()
        assert 'effective_to' in excinfo.value.message_dict

    def test_category_protection_against_deletion_when_rate_plans_exist(self, ac_category):
        RoomRatePlan.objects.create(
            category=ac_category,
            name='Standard Tariff',
            base_price_per_night=Decimal('1599.00')
        )
        with pytest.raises(ProtectedError):
            ac_category.delete()

    def test_historical_pricing_integrity_on_rate_versioning(self, ac_category):
        """
        Verify that creating a new rate plan does NOT overwrite, mutate, or destroy
        the historical rate plan row.
        """
        initial_rate = RoomRatePlan.objects.create(
            category=ac_category,
            name='Standard Tariff 2026-Q1',
            base_price_per_night=Decimal('1599.00'),
            effective_from=date(2026, 1, 1),
            effective_to=date(2026, 3, 31),
            is_active=False
        )

        new_rate = RoomRatePlan.objects.create(
            category=ac_category,
            name='Standard Tariff 2026-Q2',
            base_price_per_night=Decimal('1799.00'),
            effective_from=date(2026, 4, 1),
            effective_to=None,
            is_active=True
        )

        initial_rate.refresh_from_db()
        assert initial_rate.base_price_per_night == Decimal('1599.00')
        assert initial_rate.is_active is False
        assert new_rate.base_price_per_night == Decimal('1799.00')
        assert new_rate.is_active is True

        # Verify all rate versions for this category remain queryable
        all_rates = RoomRatePlan.objects.filter(category=ac_category)
        assert all_rates.count() == 2
