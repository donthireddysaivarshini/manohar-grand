"""
Custom User, CustomerProfile, and StaffProfile models.
"""
import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.utils.translation import gettext_lazy as _
from .managers import CustomUserManager

class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom user model with UUID primary key and email-based authentication.
    """
    AUTH_PROVIDER_CHOICES = (
        ('email', 'Email / Password'),
        ('google', 'Google OAuth'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(_('email address'), unique=True, db_index=True)
    first_name = models.CharField(_('first name'), max_length=150, blank=True)
    last_name = models.CharField(_('last name'), max_length=150, blank=True)
    phone = models.CharField(max_length=15, blank=True, null=True, db_index=True)

    is_staff = models.BooleanField(
        _('staff status'),
        default=False,
        help_text=_('Designates whether the user can log into the staff admin panel.'),
    )
    is_active = models.BooleanField(
        _('active'),
        default=True,
        help_text=_('Designates whether this user should be treated as active.'),
    )
    auth_provider = models.CharField(
        max_length=20,
        choices=AUTH_PROVIDER_CHOICES,
        default='email',
        help_text=_('Primary authentication provider used to create the account.')
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        verbose_name = _('user')
        verbose_name_plural = _('users')
        ordering = ['-created_at']

    def __str__(self):
        return self.email

    @property
    def full_name(self):
        name = f"{self.first_name} {self.last_name}".strip()
        return name if name else self.email

    @property
    def role(self):
        if hasattr(self, 'staff_profile') and self.staff_profile:
            return self.staff_profile.role
        if self.is_superuser:
            return 'superadmin'
        if self.is_staff:
            return 'staff'
        return 'customer'

class CustomerProfile(models.Model):
    """
    Customer guest profile associated with a standard guest user account.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='customer_profile')
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('customer profile')
        verbose_name_plural = _('customer profiles')

    def __str__(self):
        return f"CustomerProfile({self.user.email})"

class StaffProfile(models.Model):
    """
    Hotel staff profile containing administrative role and access permissions.
    """
    ROLE_CHOICES = (
        ('receptionist', 'Front Desk Receptionist'),
        ('manager', 'Hotel Manager'),
        ('superadmin', 'Super Administrator'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='staff_profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='receptionist')
    employee_id = models.CharField(max_length=30, unique=True, db_index=True)
    is_active_duty = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('staff profile')
        verbose_name_plural = _('staff profiles')

    def __str__(self):
        return f"StaffProfile({self.user.email} - {self.role})"
