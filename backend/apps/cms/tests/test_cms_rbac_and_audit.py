import pytest
from django.contrib.auth import get_user_model
from django.test import RequestFactory
from django.contrib.admin.sites import AdminSite
from apps.authentication.models import StaffProfile
from apps.cms.models import CMSSection, FAQ
from apps.cms.admin import CMSSectionAdmin, FAQAdmin
from core.models import AuditLog

User = get_user_model()


@pytest.mark.django_db
class TestCMSRBACAndAudit:
    """Tests covering SuperAdmin/Manager/Receptionist permissions and AuditLog on CMS models."""

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

    def test_superadmin_has_full_cms_section_and_faq_permissions(self, superadmin_user):
        site = AdminSite()
        cms_admin = CMSSectionAdmin(CMSSection, site)
        faq_admin = FAQAdmin(FAQ, site)
        rf = RequestFactory()

        request = rf.get('/admin/')
        request.user = superadmin_user

        assert cms_admin.has_module_permission(request) is True
        assert cms_admin.has_view_permission(request) is True
        assert cms_admin.has_change_permission(request) is True
        assert cms_admin.has_add_permission(request) is True
        assert cms_admin.has_delete_permission(request) is True

        assert faq_admin.has_module_permission(request) is True
        assert faq_admin.has_view_permission(request) is True
        assert faq_admin.has_change_permission(request) is True
        assert faq_admin.has_add_permission(request) is True
        assert faq_admin.has_delete_permission(request) is True

    def test_manager_has_readonly_access_to_cms_sections_and_faqs(self, manager_user):
        site = AdminSite()
        cms_admin = CMSSectionAdmin(CMSSection, site)
        faq_admin = FAQAdmin(FAQ, site)
        rf = RequestFactory()

        request = rf.get('/admin/')
        request.user = manager_user

        # Manager has read/view permissions but denied mutation per 10.ADMIN_PANEL_REQUIREMENTS.md Table 3
        assert cms_admin.has_module_permission(request) is True
        assert cms_admin.has_view_permission(request) is True
        assert cms_admin.has_change_permission(request) is False
        assert cms_admin.has_add_permission(request) is False
        assert cms_admin.has_delete_permission(request) is False

        assert faq_admin.has_module_permission(request) is True
        assert faq_admin.has_view_permission(request) is True
        assert faq_admin.has_change_permission(request) is False
        assert faq_admin.has_add_permission(request) is False
        assert faq_admin.has_delete_permission(request) is False

    def test_receptionist_cannot_access_or_modify_cms(self, receptionist_user):
        site = AdminSite()
        cms_admin = CMSSectionAdmin(CMSSection, site)
        faq_admin = FAQAdmin(FAQ, site)
        rf = RequestFactory()

        request = rf.get('/admin/')
        request.user = receptionist_user

        assert cms_admin.has_module_permission(request) is False
        assert cms_admin.has_view_permission(request) is False
        assert cms_admin.has_change_permission(request) is False
        assert cms_admin.has_add_permission(request) is False
        assert cms_admin.has_delete_permission(request) is False

        assert faq_admin.has_module_permission(request) is False
        assert faq_admin.has_view_permission(request) is False
        assert faq_admin.has_change_permission(request) is False
        assert faq_admin.has_add_permission(request) is False
        assert faq_admin.has_delete_permission(request) is False

    def test_cms_section_mutation_produces_audit_log(self, superadmin_user):
        site = AdminSite()
        admin_obj = CMSSectionAdmin(CMSSection, site)
        rf = RequestFactory()

        request = rf.post('/admin/cms/cmssection/add/')
        request.user = superadmin_user

        section = CMSSection(
            section_key='experience',
            title='The Manohar Experience',
            subtitle='Unmatched Hospitality',
            display_order=4,
            is_active=True
        )

        admin_obj.save_model(request, section, form=None, change=False)

        audit_entry = AuditLog.objects.filter(resource_type='CMSSection', resource_id=str(section.id)).first()
        assert audit_entry is not None
        assert audit_entry.actor == superadmin_user
        assert audit_entry.actor_role == 'superadmin'
        assert audit_entry.action == 'create'
        assert audit_entry.new_values['section_key'] == 'experience'
        assert audit_entry.new_values['title'] == 'The Manohar Experience'

        # Test update audit log
        section.title = 'The Luxury Experience'
        admin_obj.save_model(request, section, form=None, change=True)

        update_entry = AuditLog.objects.filter(
            resource_type='CMSSection',
            resource_id=str(section.id),
            action='update'
        ).first()
        assert update_entry is not None
        assert update_entry.old_values['title'] == 'The Manohar Experience'
        assert update_entry.new_values['title'] == 'The Luxury Experience'

    def test_faq_mutation_produces_audit_log(self, superadmin_user):
        site = AdminSite()
        admin_obj = FAQAdmin(FAQ, site)
        rf = RequestFactory()

        request = rf.post('/admin/cms/faq/add/')
        request.user = superadmin_user

        faq = FAQ(
            question='Is parking available on site?',
            answer='Yes, complimentary on-site parking is available for guests.',
            category='amenities',
            display_order=1,
            is_active=True
        )

        admin_obj.save_model(request, faq, form=None, change=False)

        audit_entry = AuditLog.objects.filter(resource_type='FAQ', resource_id=str(faq.id)).first()
        assert audit_entry is not None
        assert audit_entry.actor == superadmin_user
        assert audit_entry.actor_role == 'superadmin'
        assert audit_entry.action == 'create'
        assert audit_entry.new_values['question'] == 'Is parking available on site?'
