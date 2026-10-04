"""
Custom adapters for django-allauth and social accounts.
"""
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from allauth.account.adapter import DefaultAccountAdapter
from allauth.socialaccount.models import SocialApp


class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    """
    Custom social account adapter preventing MultipleObjectsReturned
    when both database fixtures and settings.py configure the Google provider.
    """
    def get_app(self, request, provider, client_id=None):
        apps = self.list_apps(request, provider=provider, client_id=client_id)
        if not apps:
            raise SocialApp.DoesNotExist(f"No social app configured for provider '{provider}'")
        # Safely return the first configured app
        return apps[0]


class CustomAccountAdapter(DefaultAccountAdapter):
    """
    Custom account adapter for customer user creation and username normalization.
    """
    def is_open_for_signup(self, request):
        return True
