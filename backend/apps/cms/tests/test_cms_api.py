"""
API test suite for Public and Admin Headless CMS Content (Sections, FAQs, Gallery Media, Hotel Config).
"""
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from apps.authentication.models import StaffProfile
from apps.cms.models import CMSSection, FAQ, GalleryMedia, HotelConfiguration
from core.models import AuditLog

User = get_user_model()


@pytest.mark.django_db
class TestCMSAPI:
    """Comprehensive test suite for CMS public and admin REST APIs."""

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
    def setup_cms_data(self):
        # CMS Sections
        hero = CMSSection.objects.create(
            section_key='hero',
            title='Welcome to Manohar Grand',
            subtitle='Luxury and Comfort',
            metadata={'connectivity_badge': 'Walkable distance from JNTU Metro Station'},
            display_order=1,
            is_active=True
        )
        welcome = CMSSection.objects.create(
            section_key='welcome',
            title='Experience Hospitality',
            display_order=2,
            is_active=True
        )
        draft = CMSSection.objects.create(
            section_key='summer-promo',
            title='Summer Special',
            is_active=False
        )

        # FAQs
        faq1 = FAQ.objects.create(
            question='What are check-in timings?',
            answer='Check-in is at 11:00 AM.',
            category='checkin_checkout',
            display_order=1,
            is_active=True
        )
        faq2 = FAQ.objects.create(
            question='Is parking available?',
            answer='Yes, on-site parking is available.',
            category='amenities',
            display_order=2,
            is_active=True
        )
        faq_inactive = FAQ.objects.create(
            question='Unapproved FAQ?',
            answer='Draft answer',
            category='general',
            is_active=False
        )

        # Gallery
        media1 = GalleryMedia.objects.create(
            title='Exterior Night View',
            category='exterior',
            image_url='https://example.com/exterior.webp',
            is_featured=True,
            is_active=True,
            display_order=1
        )
        media2 = GalleryMedia.objects.create(
            title='Lobby Lounge',
            category='property',
            image_url='https://example.com/lobby.webp',
            is_featured=False,
            is_active=True,
            display_order=2
        )
        media_inactive = GalleryMedia.objects.create(
            title='Construction Photo',
            category='property',
            image_url='https://example.com/const.webp',
            is_active=False
        )

        # Hotel Config
        config = HotelConfiguration.get_solo()
        config.hotel_name = 'Manohar Grand'
        config.save()

        return {
            'hero': hero,
            'welcome': welcome,
            'draft': draft,
            'faq1': faq1,
            'media1': media1,
            'config': config
        }

    def test_public_cms_sections(self, client, setup_cms_data):
        # List active sections
        resp = client.get('/api/v1/content/sections/')
        assert resp.status_code == 200
        data = resp.json()
        assert data['success'] is True
        assert len(data['data']) == 2  # Inactive excluded
        keys = [s['section_key'] for s in data['data']]
        assert 'hero' in keys
        assert 'summer-promo' not in keys

        # Detail active section
        resp_hero = client.get('/api/v1/content/sections/hero/')
        assert resp_hero.status_code == 200
        assert resp_hero.json()['data']['title'] == 'Welcome to Manohar Grand'
        assert resp_hero.json()['data']['metadata']['connectivity_badge'] == 'Walkable distance from JNTU Metro Station'

        # Detail inactive or missing section -> 404
        assert client.get('/api/v1/content/sections/summer-promo/').status_code == 404
        assert client.get('/api/v1/content/sections/non-existent/').status_code == 404

    def test_public_faqs(self, client, setup_cms_data):
        resp = client.get('/api/v1/content/faqs/')
        assert resp.status_code == 200
        data = resp.json()
        assert data['success'] is True
        assert len(data['data']) == 2  # Inactive excluded

        # Category filter
        resp_cat = client.get('/api/v1/content/faqs/?category=checkin_checkout')
        assert resp_cat.status_code == 200
        assert len(resp_cat.json()['data']) == 1
        assert resp_cat.json()['data'][0]['question'] == 'What are check-in timings?'

    def test_public_gallery_media(self, client, setup_cms_data):
        resp = client.get('/api/v1/content/gallery/')
        assert resp.status_code == 200
        data = resp.json()
        assert data['success'] is True
        assert len(data['data']) == 2  # Inactive excluded

        # Featured filter
        resp_feat = client.get('/api/v1/content/gallery/?featured=true')
        assert resp_feat.status_code == 200
        assert len(resp_feat.json()['data']) == 1
        assert resp_feat.json()['data'][0]['title'] == 'Exterior Night View'

    def test_public_hotel_configuration(self, client, setup_cms_data):
        resp = client.get('/api/v1/content/hotel-config/')
        assert resp.status_code == 200
        data = resp.json()
        assert data['success'] is True
        assert data['data']['hotel_name'] == 'Manohar Grand'
        assert data['data']['max_late_checkout_hours'] == 3

    def test_admin_cms_rbac_and_auditing(self, client, superadmin_user, manager_user, receptionist_user, setup_cms_data):
        # 1. Receptionist denied on all CMS admin endpoints
        client.force_login(receptionist_user)
        assert client.get('/api/v1/admin/content/sections/').status_code == 403
        assert client.get('/api/v1/admin/content/faqs/').status_code == 403
        assert client.get('/api/v1/admin/content/gallery/').status_code == 403
        assert client.get('/api/v1/admin/content/hotel-config/').status_code == 403

        # 2. Manager has read-only view on CMS sections & FAQs, but cannot mutate
        client.force_login(manager_user)
        resp_mgr_sec = client.get('/api/v1/admin/content/sections/')
        assert resp_mgr_sec.status_code == 200
        assert len(resp_mgr_sec.json()['data']) == 3  # Admin sees active and inactive

        # Manager POST section -> 403
        resp_mgr_post = client.post('/api/v1/admin/content/sections/', {
            'section_key': 'mgr-sec',
            'title': 'Manager Section'
        })
        assert resp_mgr_post.status_code == 403

        # Manager POST FAQ -> 403
        resp_mgr_faq_post = client.post('/api/v1/admin/content/faqs/', {
            'question': 'Manager Q?',
            'answer': 'Manager A'
        })
        assert resp_mgr_faq_post.status_code == 403

        # Manager PATCH hotel-config -> 403
        resp_mgr_config = client.patch('/api/v1/admin/content/hotel-config/', {
            'hotel_name': 'Manager Renamed'
        })
        assert resp_mgr_config.status_code == 403

        # 3. SuperAdmin full mutation on CMS sections -> 201/200 and emits AuditLog
        client.force_login(superadmin_user)
        resp_sup_post = client.post('/api/v1/admin/content/sections/', {
            'section_key': 'why-choose-us',
            'title': 'Why Choose Manohar Grand',
            'subtitle': 'Key highlights',
            'metadata': {'items': ['1-min JNTU Metro walk', 'Memory Foam Mattresses']},
            'display_order': 3,
            'is_active': True
        }, format='json')
        assert resp_sup_post.status_code == 201
        sec_id = resp_sup_post.json()['data']['id']

        audit_sec = AuditLog.objects.filter(resource_type='CMSSection', resource_id=sec_id, action='create').first()
        assert audit_sec is not None
        assert audit_sec.actor == superadmin_user

        # SuperAdmin updates hotel config -> 200 and emits AuditLog
        resp_sup_config = client.patch('/api/v1/admin/content/hotel-config/', {
            'primary_phone': '+91-7997044999'
        })
        assert resp_sup_config.status_code == 200
        assert resp_sup_config.json()['data']['primary_phone'] == '+91-7997044999'

        audit_cfg = AuditLog.objects.filter(resource_type='HotelConfiguration', action='config_change').first()
        assert audit_cfg is not None
        assert audit_cfg.actor == superadmin_user
