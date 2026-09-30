import uuid
from decimal import Decimal
from datetime import date, timedelta
import pytest
from django.core.exceptions import ValidationError
from apps.pricing.models import TaxRule


@pytest.mark.django_db
class TestTaxRuleModel:
    """Tests for TaxRule model, percentage calculations, date bounds, and versioning."""

    def test_create_gst_tax_rule_success(self):
        rule = TaxRule.objects.create(
            name='GST (Accommodation)',
            tax_rate=Decimal('5.00'),
            tax_type='percentage',
            is_active=True
        )
        assert isinstance(rule.id, uuid.UUID)
        assert rule.name == 'GST (Accommodation)'
        assert rule.tax_rate == Decimal('5.00')
        assert rule.tax_type == 'percentage'
        assert rule.is_active is True
        assert 'GST (Accommodation) (5.00%) [Active]' in str(rule)

    def test_reject_negative_tax_rate(self):
        rule = TaxRule(
            name='Invalid Negative Tax',
            tax_rate=Decimal('-5.00'),
            tax_type='percentage'
        )
        with pytest.raises(ValidationError) as excinfo:
            rule.full_clean()
        assert 'tax_rate' in excinfo.value.message_dict

    def test_reject_percentage_exceeding_100_percent(self):
        rule = TaxRule(
            name='Exorbitant Tax',
            tax_rate=Decimal('105.00'),
            tax_type='percentage'
        )
        with pytest.raises(ValidationError) as excinfo:
            rule.full_clean()
        assert 'tax_rate' in excinfo.value.message_dict

    def test_effective_dates_validation(self):
        today = date.today()
        yesterday = today - timedelta(days=1)
        rule = TaxRule(
            name='Invalid Tax Dates',
            tax_rate=Decimal('5.00'),
            effective_from=today,
            effective_to=yesterday
        )
        with pytest.raises(ValidationError) as excinfo:
            rule.full_clean()
        assert 'effective_to' in excinfo.value.message_dict

    def test_historical_tax_rule_preservation(self):
        old_rule = TaxRule.objects.create(
            name='GST Old Regime',
            tax_rate=Decimal('12.00'),
            effective_from=date(2025, 1, 1),
            effective_to=date(2025, 12, 31),
            is_active=False
        )

        current_rule = TaxRule.objects.create(
            name='GST 5% Regime',
            tax_rate=Decimal('5.00'),
            effective_from=date(2026, 1, 1),
            is_active=True
        )

        old_rule.refresh_from_db()
        assert old_rule.tax_rate == Decimal('12.00')
        assert old_rule.is_active is False
        assert current_rule.tax_rate == Decimal('5.00')
        assert current_rule.is_active is True
        assert TaxRule.objects.count() == 2
