"""
API test suite for System Audit Log Administration.
"""
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from apps.authentication.models import StaffProfile
from core.models import AuditLog

User = get_user_model()


@pytest.mark.django_db
class TestAuditAPI:
    """Test suite for /api/v1/admin/audit-logs/ endpoint."""

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
    def setup_audit_logs(self, superadmin_user, manager_user):
        log1 = AuditLog.objects.create(
            actor=superadmin_user,
            actor_email=superadmin_user.email,
            actor_role='superadmin',
            action='price_change',
            resource_type='RoomRatePlan',
            resource_id='c1f72e9a-7a89-4e02-8d76-e17f0a8d6e01',
            old_values={'base_price_per_night': '1499.00'},
            new_values={'base_price_per_night': '1599.00'},
            reason='Updated seasonal rate'
        )
        log2 = AuditLog.objects.create(
            actor=manager_user,
            actor_email=manager_user.email,
            actor_role='manager',
            action='status_change',
            resource_type='PhysicalRoom',
            resource_id='f2e81d7c-8b90-4f13-9e87-f28a1b9e7f02',
            old_values={'operational_status': 'operational'},
            new_values={'operational_status': 'maintenance'},
            reason='AC unit repair'
        )
        return [log1, log2]

    def test_audit_log_endpoint_rbac_and_filtering(self, client, superadmin_user, manager_user, receptionist_user, setup_audit_logs):
        # 1. Unauthenticated -> 401
        assert client.get('/api/v1/admin/audit-logs/').status_code == 401

        # 2. Receptionist -> 403
        client.force_login(receptionist_user)
        assert client.get('/api/v1/admin/audit-logs/').status_code == 403

        # 3. Manager -> 200 list
        client.force_login(manager_user)
        resp_mgr = client.get('/api/v1/admin/audit-logs/')
        assert resp_mgr.status_code == 200
        data = resp_mgr.json()
        assert data['success'] is True
        assert len(data['data']) == 2

        # 4. SuperAdmin -> 200 list
        client.force_login(superadmin_user)
        resp_sup = client.get('/api/v1/admin/audit-logs/')
        assert resp_sup.status_code == 200

        # 5. Filters
        resp_filter_res = client.get('/api/v1/admin/audit-logs/?resource_type=PhysicalRoom')
        assert resp_filter_res.status_code == 200
        assert len(resp_filter_res.json()['data']) == 1
        assert resp_filter_res.json()['data'][0]['resource_type'] == 'PhysicalRoom'

        resp_filter_action = client.get('/api/v1/admin/audit-logs/?action=price_change')
        assert resp_filter_action.status_code == 200
        assert len(resp_filter_action.json()['data']) == 1
        assert resp_filter_action.json()['data'][0]['action'] == 'price_change'

        # 6. Immutable: POST/PUT/DELETE return 405 Method Not Allowed
        assert client.post('/api/v1/admin/audit-logs/', {}).status_code == 405
        assert client.delete('/api/v1/admin/audit-logs/').status_code == 405
