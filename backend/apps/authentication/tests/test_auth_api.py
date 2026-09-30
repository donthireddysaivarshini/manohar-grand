import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from apps.authentication.models import User, StaffProfile, CustomerProfile
from apps.authentication.permissions import IsSuperAdmin, IsManagerOrAbove, IsReceptionistOrAbove, IsCustomer

@pytest.mark.django_db
class TestAuthenticationAPI:
    def setup_method(self):
        self.client = APIClient()

        # Customer User
        self.customer = User.objects.create_user(
            email='guest@example.com',
            password='CustomerPassword123!',
            first_name='Ananya',
            last_name='Reddy',
            phone='+919876543210'
        )

        # Receptionist Staff
        self.receptionist = User.objects.create_user(
            email='reception@manohargrand.com',
            password='StaffPassword123!',
            first_name='Kiran',
            last_name='Kumar',
            is_staff=True
        )
        self.rec_profile = StaffProfile.objects.create(
            user=self.receptionist,
            role='receptionist',
            employee_id='EMP-MG-101'
        )

        # Manager Staff
        self.manager = User.objects.create_user(
            email='manager@manohargrand.com',
            password='ManagerPassword123!',
            first_name='Suresh',
            last_name='Verma',
            is_staff=True
        )
        self.mgr_profile = StaffProfile.objects.create(
            user=self.manager,
            role='manager',
            employee_id='EMP-MG-002'
        )

    def test_csrf_initialization_endpoint(self):
        url = reverse('auth-csrf')
        response = self.client.get(url)
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
        assert 'csrfToken' in data['data']
        assert len(data['data']['csrfToken']) > 0
        assert 'csrftoken' in response.cookies

    def test_me_endpoint_unauthenticated_returns_401(self):
        url = reverse('auth-me')
        response = self.client.get(url)
        assert response.status_code == 401

    def test_me_endpoint_authenticated_customer(self):
        self.client.force_authenticate(user=self.customer)
        url = reverse('auth-me')
        response = self.client.get(url)
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
        assert data['data']['email'] == 'guest@example.com'
        assert data['data']['role'] == 'customer'
        assert data['data']['is_staff'] is False

    def test_me_endpoint_authenticated_staff(self):
        self.client.force_authenticate(user=self.receptionist)
        url = reverse('auth-me')
        response = self.client.get(url)
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
        assert data['data']['email'] == 'reception@manohargrand.com'
        assert data['data']['role'] == 'receptionist'
        assert data['data']['is_staff'] is True

    def test_staff_login_success(self):
        url = reverse('auth-staff-login')
        payload = {
            'email': 'reception@manohargrand.com',
            'password': 'StaffPassword123!'
        }
        response = self.client.post(url, payload, format='json')
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
        assert data['data']['user']['email'] == 'reception@manohargrand.com'
        assert 'sessionid' in response.cookies

    def test_staff_login_invalid_password_returns_401(self):
        url = reverse('auth-staff-login')
        payload = {
            'email': 'reception@manohargrand.com',
            'password': 'WrongPassword999!'
        }
        response = self.client.post(url, payload, format='json')
        assert response.status_code == 401
        data = response.json()
        assert data['success'] is False
        assert data['error']['code'] == 'INVALID_CREDENTIALS'

    def test_staff_login_inactive_user_returns_401(self):
        self.receptionist.is_active = False
        self.receptionist.save()

        url = reverse('auth-staff-login')
        payload = {
            'email': 'reception@manohargrand.com',
            'password': 'StaffPassword123!'
        }
        response = self.client.post(url, payload, format='json')
        assert response.status_code == 401
        data = response.json()
        assert data['success'] is False

    def test_customer_cannot_login_via_staff_endpoint(self):
        url = reverse('auth-staff-login')
        payload = {
            'email': 'guest@example.com',
            'password': 'CustomerPassword123!'
        }
        response = self.client.post(url, payload, format='json')
        assert response.status_code == 401
        data = response.json()
        assert data['success'] is False

    def test_logout_invalidates_session(self):
        # 1. Login
        login_url = reverse('auth-staff-login')
        login_res = self.client.post(login_url, {
            'email': 'reception@manohargrand.com',
            'password': 'StaffPassword123!'
        }, format='json')
        assert login_res.status_code == 200

        # 2. Check /me works
        me_url = reverse('auth-me')
        me_res = self.client.get(me_url)
        assert me_res.status_code == 200

        # 3. Logout
        logout_url = reverse('auth-logout')
        logout_res = self.client.post(logout_url)
        assert logout_res.status_code == 200

        # 4. Subsequent /me is unauthenticated
        me_after = self.client.get(me_url)
        assert me_after.status_code == 401

    def test_profile_update_successful(self):
        self.client.force_authenticate(user=self.customer)
        url = reverse('auth-profile-update')
        payload = {
            'first_name': 'Ananya Devi',
            'last_name': 'Reddy',
            'phone': '+919999888877',
            'city': 'Hyderabad',
            'state': 'Telangana'
        }
        response = self.client.patch(url, payload, format='json')
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
        assert data['data']['first_name'] == 'Ananya Devi'
        assert data['data']['phone'] == '+919999888877'
        assert data['data']['customer_profile']['city'] == 'Hyderabad'
        assert data['data']['customer_profile']['state'] == 'Telangana'

    def test_rbac_permission_classes(self):
        perm_customer = IsCustomer()
        perm_staff = IsReceptionistOrAbove()
        perm_manager = IsManagerOrAbove()
        perm_super = IsSuperAdmin()

        class MockRequest:
            def __init__(self, user):
                self.user = user

        # Customer checks
        req_cust = MockRequest(self.customer)
        assert perm_customer.has_permission(req_cust, None) is True
        assert perm_staff.has_permission(req_cust, None) is False
        assert perm_manager.has_permission(req_cust, None) is False
        assert perm_super.has_permission(req_cust, None) is False

        # Receptionist checks
        req_rec = MockRequest(self.receptionist)
        assert perm_customer.has_permission(req_rec, None) is False
        assert perm_staff.has_permission(req_rec, None) is True
        assert perm_manager.has_permission(req_rec, None) is False
        assert perm_super.has_permission(req_rec, None) is False

        # Manager checks
        req_mgr = MockRequest(self.manager)
        assert perm_customer.has_permission(req_mgr, None) is False
        assert perm_staff.has_permission(req_mgr, None) is True
        assert perm_manager.has_permission(req_mgr, None) is True
        assert perm_super.has_permission(req_mgr, None) is False
