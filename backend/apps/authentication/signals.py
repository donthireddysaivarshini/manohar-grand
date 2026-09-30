"""
Authentication signals for profile lifecycle and social account hooks.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from allauth.account.signals import user_signed_up
from .models import User, CustomerProfile

@receiver(post_save, sender=User)
def create_customer_profile_on_user_create(sender, instance, created, **kwargs):
    """
    Ensure non-staff users automatically have a CustomerProfile.
    """
    if created and not instance.is_staff and not instance.is_superuser:
        CustomerProfile.objects.get_or_create(user=instance)

@receiver(user_signed_up)
def handle_social_signup(request, user, **kwargs):
    """
    Hook executed after a customer signs up via Google OAuth.
    Guarantees user is not staff, sets auth_provider='google', and provisions CustomerProfile.
    """
    user.is_staff = False
    user.is_superuser = False
    user.auth_provider = 'google'
    user.save(update_fields=['is_staff', 'is_superuser', 'auth_provider'])
    CustomerProfile.objects.get_or_create(user=user)
