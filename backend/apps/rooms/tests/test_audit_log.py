import uuid
import pytest
from django.contrib.auth import get_user_model
from django.contrib.admin.sites import AdminSite
from core.models import AuditLog
from core.services import record_audit_log
from core.admin import AuditLogAdmin
from apps.authentication.models import StaffProfile

User = get_user_model()


class MockRequest:
    pass


@pytest.mark.django_db
class TestAuditLogModelAndService:
    """Tests for AuditLog model, service recording helper, and append-only constraints."""

    def test_create_audit_log_direct(self):
        log = AuditLog.objects.create(
            action='create',
            resource_type='RoomCategory',
            resource_id='c1f72e9a-7a89-4e02-8d76-e17f0a8d6e01',
            old_values={},
            new_values={'name': 'AC Room', 'max_total_occupancy': 4},
            reason='Initial setup',
            ip_address='127.0.0.1'
        )
        assert isinstance(log.id, uuid.UUID)
        assert log.actor is None
        assert log.action == 'create'
        assert log.resource_type == 'RoomCategory'
        assert log.new_values['name'] == 'AC Room'
        assert log.timestamp is not None
        assert 'System create RoomCategory' in str(log)

    def test_record_audit_log_with_authenticated_staff(self):
        staff_user = User.objects.create_user(
            email='manager@manohargrand.com',
            password='TestPassword123!',
            first_name='Hotel',
            last_name='Manager'
        )
        StaffProfile.objects.create(
            user=staff_user,
            role='manager',
            employee_id='EMP-MG-001'
        )

        log = record_audit_log(
            actor=staff_user,
            action='status_change',
            resource_type='PhysicalRoom',
            resource_id='101',
            old_values={'operational_status': 'operational'},
            new_values={'operational_status': 'maintenance'},
            reason='AC unit filter repair',
            ip_address='192.168.1.50'
        )

        assert log.actor == staff_user
        assert log.actor_email == 'manager@manohargrand.com'
        assert log.actor_role == 'manager'
        assert log.action == 'status_change'
        assert log.old_values['operational_status'] == 'operational'
        assert log.new_values['operational_status'] == 'maintenance'
        assert log.reason == 'AC unit filter repair'
        assert log.ip_address == '192.168.1.50'

    def test_audit_admin_is_read_only_no_mutations(self):
        site = AdminSite()
        admin_obj = AuditLogAdmin(AuditLog, site)
        request = MockRequest()

        assert admin_obj.has_add_permission(request) is False
        assert admin_obj.has_change_permission(request) is False
        assert admin_obj.has_delete_permission(request) is False
