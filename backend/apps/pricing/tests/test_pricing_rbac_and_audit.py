from decimal import Decimal
import pytest
from django.contrib.auth import get_user_model
from django.test import RequestFactory
from django.contrib.admin.sites import AdminSite
from apps.authentication.models import StaffProfile
from apps.rooms.models import RoomCategory
from apps.pricing.models import RoomRatePlan, TaxRule
from apps.pricing.admin import RoomRatePlanAdmin, TaxRuleAdmin
from apps.cms.models import HotelConfiguration
from apps.cms.admin import HotelConfigurationAdmin
from core.models import AuditLog

User = get_user_model()


@pytest.mark.django_db
class TestPricingAndConfigRBACAndAudit:
    """Tests covering SuperAdmin/Manager/Receptionist RBAC and AuditLog emission on pricing/tax changes."""

    @pytest.fixture
    def superadmin_user(self):
        user = User.objects.create_superuser(
            email='owner@manohargrand.com',
            password='OwnerPassword123!',
            first_name='Owner',
            last_name='Admin'
        )
        StaffProfile.objects.create(
            user=user,
            role='superadmin',
            employee_id='EMP-OWNER'
        )
        return user

    @pytest.fixture
    def manager_user(self):
        user = User.objects.create_user(
            email='manager@manohargrand.com',
            password='ManagerPassword123!',
            first_name='Hotel',
            last_name='Manager',
            is_staff=True
        )
        StaffProfile.objects.create(
            user=user,
            role='manager',
            employee_id='EMP-MGR-01'
        )
        return user

    @pytest.fixture
    def receptionist_user(self):
        user = User.objects.create_user(
            email='receptionist@manohargrand.com',
            password='ReceptPassword123!',
            first_name='Front',
            last_name='Desk',
            is_staff=True
        )
        StaffProfile.objects.create(
            user=user,
            role='receptionist',
            employee_id='EMP-REC-01'
        )
        return user

    @pytest.fixture
    def ac_category(self):
        return RoomCategory.objects.create(
            slug='ac-room',
            name='AC Room',
            max_total_occupancy=4
        )

    def test_superadmin_has_full_pricing_change_permission(self, superadmin_user, ac_category):
        site = AdminSite()
        admin_obj = RoomRatePlanAdmin(RoomRatePlan, site)
        rf = RequestFactory()

        request = rf.get('/admin/')
        request.user = superadmin_user

        assert admin_obj.has_change_permission(request) is True
        assert admin_obj.has_add_permission(request) is True
        assert admin_obj.has_delete_permission(request) is True

    def test_manager_cannot_modify_pricing_under_current_baseline(self, manager_user, ac_category):
        site = AdminSite()
        admin_obj = RoomRatePlanAdmin(RoomRatePlan, site)
        rf = RequestFactory()

        request = rf.get('/admin/')
        request.user = manager_user

        assert admin_obj.has_change_permission(request) is False
        assert admin_obj.has_add_permission(request) is False
        assert admin_obj.has_delete_permission(request) is False

    def test_receptionist_cannot_modify_pricing(self, receptionist_user, ac_category):
        site = AdminSite()
        admin_obj = RoomRatePlanAdmin(RoomRatePlan, site)
        rf = RequestFactory()

        request = rf.get('/admin/')
        request.user = receptionist_user

        assert admin_obj.has_change_permission(request) is False
        assert admin_obj.has_add_permission(request) is False
        assert admin_obj.has_delete_permission(request) is False

    def test_rate_plan_mutation_produces_audit_log(self, superadmin_user, ac_category):
        site = AdminSite()
        admin_obj = RoomRatePlanAdmin(RoomRatePlan, site)
        rf = RequestFactory()

        request = rf.post('/admin/pricing/roomrateplan/add/')
        request.user = superadmin_user

        rate_plan = RoomRatePlan(
            category=ac_category,
            name='Standard Tariff',
            base_price_per_night=Decimal('1599.00'),
            extra_adult_charge=Decimal('350.00'),
            extra_child_charge=Decimal('300.00'),
            late_checkout_hourly_rate=Decimal('150.00'),
            is_active=True
        )

        admin_obj.save_model(request, rate_plan, form=None, change=False)

        audit_entry = AuditLog.objects.filter(resource_type='RoomRatePlan', resource_id=str(rate_plan.id)).first()
        assert audit_entry is not None
        assert audit_entry.actor == superadmin_user
        assert audit_entry.actor_role == 'superadmin'
        assert audit_entry.action == 'create'
        assert audit_entry.new_values['base_price_per_night'] == '1599.00'

        # Now test update audit log
        rate_plan.base_price_per_night = Decimal('1799.00')
        admin_obj.save_model(request, rate_plan, form=None, change=True)

        update_entry = AuditLog.objects.filter(
            resource_type='RoomRatePlan',
            resource_id=str(rate_plan.id),
            action='price_change'
        ).first()
        assert update_entry is not None
        assert update_entry.old_values['base_price_per_night'] == '1599.00'
        assert update_entry.new_values['base_price_per_night'] == '1799.00'

    def test_tax_rule_mutation_produces_audit_log(self, superadmin_user):
        site = AdminSite()
        admin_obj = TaxRuleAdmin(TaxRule, site)
        rf = RequestFactory()

        request = rf.post('/admin/pricing/taxrule/add/')
        request.user = superadmin_user

        tax_rule = TaxRule(
            name='GST (Accommodation)',
            tax_rate=Decimal('5.00'),
            tax_type='percentage',
            is_active=True
        )

        admin_obj.save_model(request, tax_rule, form=None, change=False)

        audit_entry = AuditLog.objects.filter(resource_type='TaxRule', resource_id=str(tax_rule.id)).first()
        assert audit_entry is not None
        assert audit_entry.actor == superadmin_user
        assert audit_entry.action == 'create'
        assert audit_entry.new_values['tax_rate'] == '5.00'

    def test_hotel_configuration_mutation_produces_audit_log(self, superadmin_user):
        site = AdminSite()
        admin_obj = HotelConfigurationAdmin(HotelConfiguration, site)
        rf = RequestFactory()

        request = rf.post('/admin/cms/hotelconfiguration/change/')
        request.user = superadmin_user

        config = HotelConfiguration.get_solo()
        config.hotel_name = 'Manohar Grand Hyderabad'

        admin_obj.save_model(request, config, form=None, change=True)

        audit_entry = AuditLog.objects.filter(resource_type='HotelConfiguration', resource_id=str(config.id)).first()
        assert audit_entry is not None
        assert audit_entry.actor == superadmin_user
        assert audit_entry.action == 'config_change'
        assert audit_entry.new_values['hotel_name'] == 'Manohar Grand Hyderabad'
