"""
API test suite for Public and Admin Pricing (Rate Plans and Tax Rules).
"""
from decimal import Decimal
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from apps.authentication.models import StaffProfile
from apps.rooms.models import RoomCategory
from apps.pricing.models import RoomRatePlan, TaxRule
from core.models import AuditLog

User = get_user_model()


@pytest.mark.django_db
class TestPricingAPI:
    """Comprehensive test suite for pricing and tax REST APIs."""

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
    def setup_pricing_data(self):
        category = RoomCategory.objects.create(
            slug='ac-room',
            name='AC Room',
            is_active=True
        )
        rate1 = RoomRatePlan.objects.create(
            category=category,
            name='Standard Tariff',
            base_price_per_night=Decimal('1599.00'),
            extra_adult_charge=Decimal('350.00'),
            extra_child_charge=Decimal('300.00'),
            late_checkout_hourly_rate=Decimal('150.00'),
            is_active=True
        )
        rate_inactive = RoomRatePlan.objects.create(
            category=category,
            name='Expired Tariff',
            base_price_per_night=Decimal('1399.00'),
            is_active=False
        )

        tax = TaxRule.objects.create(
            name='GST (Accommodation)',
            tax_rate=Decimal('5.00'),
            tax_type='percentage',
            is_active=True
        )
        tax_inactive = TaxRule.objects.create(
            name='Old Luxury Tax',
            tax_rate=Decimal('12.00'),
            tax_type='percentage',
            is_active=False
        )

        return {
            'category': category,
            'rate1': rate1,
            'rate_inactive': rate_inactive,
            'tax': tax,
            'tax_inactive': tax_inactive
        }

    def test_public_pricing_and_taxes_endpoints(self, client, setup_pricing_data):
        # Public rates
        resp_rates = client.get('/api/v1/pricing/rates/')
        assert resp_rates.status_code == 200
        data_rates = resp_rates.json()
        assert data_rates['success'] is True
        assert len(data_rates['data']) == 1  # Inactive excluded
        assert data_rates['data'][0]['base_price_per_night'] == '1599.00'

        # Public taxes
        resp_taxes = client.get('/api/v1/pricing/taxes/')
        assert resp_taxes.status_code == 200
        data_taxes = resp_taxes.json()
        assert data_taxes['success'] is True
        assert len(data_taxes['data']) == 1  # Inactive excluded
        assert data_taxes['data'][0]['tax_rate'] == '5.00'

    def test_pricing_admin_rbac_and_auditing(self, client, superadmin_user, manager_user, receptionist_user, setup_pricing_data):
        # 1. Unauthenticated -> 401
        assert client.get('/api/v1/admin/pricing/rates/').status_code == 401
        assert client.get('/api/v1/admin/pricing/taxes/').status_code == 401

        # 2. Receptionist & Manager have read-only access (200), but cannot mutate (403)
        client.force_login(receptionist_user)
        assert client.get('/api/v1/admin/pricing/rates/').status_code == 200
        assert client.post('/api/v1/admin/pricing/rates/', {'category': str(setup_pricing_data['category'].id)}).status_code == 403

        client.force_login(manager_user)
        assert client.get('/api/v1/admin/pricing/rates/').status_code == 200
        assert client.post('/api/v1/admin/pricing/rates/', {'category': str(setup_pricing_data['category'].id)}).status_code == 403
        assert client.post('/api/v1/admin/pricing/taxes/', {'name': 'VAT'}).status_code == 403

        # 3. SuperAdmin can create rate plan -> 201 and emits AuditLog
        client.force_login(superadmin_user)
        resp_sup_post = client.post('/api/v1/admin/pricing/rates/', {
            'category': str(setup_pricing_data['category'].id),
            'name': 'Festive Special',
            'currency': 'INR',
            'base_price_per_night': '1899.00',
            'extra_adult_charge': '400.00',
            'extra_child_charge': '300.00',
            'late_checkout_hourly_rate': '200.00',
            'is_active': True
        })
        assert resp_sup_post.status_code == 201
        rate_id = resp_sup_post.json()['data']['id']

        audit_rate = AuditLog.objects.filter(resource_type='RoomRatePlan', resource_id=rate_id, action='price_change').first()
        assert audit_rate is not None
        assert audit_rate.actor == superadmin_user

        # 4. SuperAdmin can create tax rule -> 201 and emits AuditLog
        resp_sup_tax = client.post('/api/v1/admin/pricing/taxes/', {
            'name': 'Swachh Bharat Cess',
            'tax_rate': '0.50',
            'tax_type': 'percentage',
            'is_active': True
        })
        assert resp_sup_tax.status_code == 201
        tax_id = resp_sup_tax.json()['data']['id']

        audit_tax = AuditLog.objects.filter(resource_type='TaxRule', resource_id=tax_id, action='price_change').first()
        assert audit_tax is not None
        assert audit_tax.actor == superadmin_user

        # 5. Validation error: negative rate
        resp_invalid = client.post('/api/v1/admin/pricing/rates/', {
            'category': str(setup_pricing_data['category'].id),
            'name': 'Negative Rate',
            'base_price_per_night': '-500.00'
        })
        assert resp_invalid.status_code == 400
        assert resp_invalid.json()['error']['code'] == 'VALIDATION_ERROR'
