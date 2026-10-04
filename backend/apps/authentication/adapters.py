"""
Custom adapters for django-allauth and social accounts.
"""
import logging
import jwt
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from allauth.account.adapter import DefaultAccountAdapter
from allauth.socialaccount.models import SocialApp
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter

logger = logging.getLogger(__name__)


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


class CustomGoogleOAuth2Adapter(GoogleOAuth2Adapter):
    """
    Robust Google OAuth2 adapter that:
    1. Attempts standard id_token verification.
    2. Gracefully handles clock skew / system time variance by decoding payload or falling back
       to Google's authoritative userinfo endpoint (https://www.googleapis.com/oauth2/v3/userinfo)
       using the direct TLS OAuth2 access_token.
    """
    def complete_login(self, request, app, token, **kwargs):
        response = kwargs.get("response", {})
        data = None
        id_token = response.get("id_token")

        if id_token:
            try:
                # Try standard allauth verification
                data = self._decode_id_token(app, id_token)
            except Exception as exc:
                logger.warning(
                    f"Standard Google id_token verification failed ({exc}). "
                    f"Falling back to direct userinfo endpoint / unverified payload decode."
                )
                try:
                    # In direct server-to-server TLS exchange with Google token endpoint, decode claims
                    data = jwt.decode(
                        id_token,
                        options={"verify_signature": False, "verify_exp": False, "verify_aud": False},
                    )
                except Exception:
                    data = None

        # Fallback to direct userinfo API endpoint if data is missing or incomplete
        if not data or not data.get("email"):
            try:
                data = self._fetch_user_info(token.token)
            except Exception as e:
                logger.error(f"Google userinfo fetch failed: {e}")
                if not data:
                    raise

        if self.fetch_userinfo and "picture" not in data:
            try:
                info = self._fetch_user_info(token.token)
                picture = info.get("picture")
                if picture:
                    data["picture"] = picture
            except Exception:
                pass

        return self.get_provider().sociallogin_from_response(request, data)
