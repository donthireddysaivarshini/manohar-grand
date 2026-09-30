"""
Role-Based Access Control (RBAC) permission classes for hotel staff and customer views.
"""
from rest_framework.permissions import BasePermission

class IsCustomer(BasePermission):
    """
    Allows access only to authenticated non-staff customers.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and not request.user.is_staff)

class IsStaffUser(BasePermission):
    """
    Allows access to authenticated staff members on active duty.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated and request.user.is_staff and request.user.is_active):
            return False
        if request.user.is_superuser:
            return True
        return hasattr(request.user, 'staff_profile') and request.user.staff_profile.is_active_duty

class IsSuperAdmin(BasePermission):
    """
    Allows access only to Super Administrator roles or superusers.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated and request.user.is_active):
            return False
        if request.user.is_superuser:
            return True
        return hasattr(request.user, 'staff_profile') and request.user.staff_profile.role == 'superadmin'

class IsManagerOrAbove(BasePermission):
    """
    Allows access to Hotel Managers and Super Administrators.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated and request.user.is_active):
            return False
        if request.user.is_superuser:
            return True
        if hasattr(request.user, 'staff_profile') and request.user.staff_profile.is_active_duty:
            return request.user.staff_profile.role in ('manager', 'superadmin')
        return False

class IsReceptionistOrAbove(BasePermission):
    """
    Allows access to Front Desk Receptionists, Hotel Managers, and Super Administrators.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated and request.user.is_active):
            return False
        if request.user.is_superuser:
            return True
        if hasattr(request.user, 'staff_profile') and request.user.staff_profile.is_active_duty:
            return request.user.staff_profile.role in ('receptionist', 'manager', 'superadmin')
        return False
