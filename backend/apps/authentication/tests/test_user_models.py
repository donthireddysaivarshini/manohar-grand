import pytest
from django.db import IntegrityError
from apps.authentication.models import User, CustomerProfile, StaffProfile

@pytest.mark.django_db
class TestUserModel:
    def test_create_customer_user_successful(self):
        user = User.objects.create_user(
            email='guest@example.com',
            password='SecurePassword123!',
            first_name='Rahul',
            last_name='Sharma',
            phone='+919876543210'
        )
        assert user.email == 'guest@example.com'
        assert user.check_password('SecurePassword123!')
        assert user.is_active is True
        assert user.is_staff is False
        assert user.is_superuser is False
        assert user.full_name == 'Rahul Sharma'
        assert user.role == 'customer'
        # Automatic customer profile signal creation
        assert hasattr(user, 'customer_profile')
        assert user.customer_profile is not None

    def test_email_must_be_unique(self):
        User.objects.create_user(email='unique@example.com', password='Password123!')
        with pytest.raises(IntegrityError):
            User.objects.create_user(email='unique@example.com', password='Password456!')

    def test_create_user_without_email_raises_error(self):
        with pytest.raises(ValueError, match="The Email field must be set"):
            User.objects.create_user(email='', password='Password123!')

    def test_create_superuser_successful(self):
        admin = User.objects.create_superuser(
            email='admin@manohargrand.com',
            password='AdminPassword123!'
        )
        assert admin.is_staff is True
        assert admin.is_superuser is True
        assert admin.is_active is True

    def test_staff_profile_creation_and_roles(self):
        staff_user = User.objects.create_user(
            email='reception@manohargrand.com',
            password='StaffPassword123!',
            first_name='FrontDesk',
            last_name='Staff',
            is_staff=True
        )
        staff_profile = StaffProfile.objects.create(
            user=staff_user,
            role='receptionist',
            employee_id='EMP-MG-001'
        )
        assert staff_user.role == 'receptionist'
        assert staff_profile.is_active_duty is True
        assert str(staff_profile) == "StaffProfile(reception@manohargrand.com - receptionist)"
