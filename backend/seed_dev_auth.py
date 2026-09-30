"""
Seed development authentication accounts for manual testing.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'manohar_grand.settings.development')
django.setup()

from apps.authentication.models import User, StaffProfile, CustomerProfile

def seed():
    # 1. Super Admin
    if not User.objects.filter(email='admin@manohargrand.com').exists():
        admin = User.objects.create_superuser(
            email='admin@manohargrand.com',
            password='AdminPassword123!',
            first_name='Admin',
            last_name='User'
        )
        StaffProfile.objects.create(
            user=admin,
            role='superadmin',
            employee_id='EMP-ADMIN-001'
        )
        print("Created SuperAdmin: admin@manohargrand.com / AdminPassword123!")

    # 2. Receptionist Staff
    if not User.objects.filter(email='reception@manohargrand.com').exists():
        rec = User.objects.create_user(
            email='reception@manohargrand.com',
            password='StaffPassword123!',
            first_name='FrontDesk',
            last_name='Reception',
            is_staff=True
        )
        StaffProfile.objects.create(
            user=rec,
            role='receptionist',
            employee_id='EMP-REC-001'
        )
        print("Created Receptionist: reception@manohargrand.com / StaffPassword123!")

    # 3. Manager Staff
    if not User.objects.filter(email='manager@manohargrand.com').exists():
        mgr = User.objects.create_user(
            email='manager@manohargrand.com',
            password='ManagerPassword123!',
            first_name='Hotel',
            last_name='Manager',
            is_staff=True
        )
        StaffProfile.objects.create(
            user=mgr,
            role='manager',
            employee_id='EMP-MGR-001'
        )
        print("Created Manager: manager@manohargrand.com / ManagerPassword123!")

    # 4. Sample Customer
    if not User.objects.filter(email='guest@example.com').exists():
        cust = User.objects.create_user(
            email='guest@example.com',
            password='CustomerPassword123!',
            first_name='Rahul',
            last_name='Sharma',
            phone='+919876543210'
        )
        CustomerProfile.objects.get_or_create(
            user=cust,
            defaults={'city': 'Hyderabad', 'state': 'Telangana'}
        )
        print("Created Customer: guest@example.com / CustomerPassword123!")

if __name__ == '__main__':
    seed()
