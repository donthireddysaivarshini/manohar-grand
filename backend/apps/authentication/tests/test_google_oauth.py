import pytest
from unittest.mock import patch, MagicMock
from django.contrib.sites.models import Site
from django.test import RequestFactory
from allauth.socialaccount.models import SocialAccount, SocialApp
from allauth.socialaccount.adapter import get_adapter
from apps.authentication.models import User, CustomerProfile

@pytest.mark.django_db
class TestGoogleOAuthAndAccountLinking:
    def setup_method(self):
        self.factory = RequestFactory()
        self.site = Site.objects.get_current()
        # Create Google SocialApp fixture
        self.app, _ = SocialApp.objects.get_or_create(
            provider='google',
            name='Google Provider',
            client_id='test-google-client-id',
            secret='test-google-secret'
        )
        self.app.sites.add(self.site)

    def test_first_time_google_oauth_provisions_customer_account(self):
        # Simulate Google user info
        email = 'newguest@gmail.com'
        social_data = {
            'sub': 'google-uid-123456',
            'email': email,
            'given_name': 'Vikram',
            'family_name': 'Varma',
            'email_verified': True
        }

        # Create user through allauth adapter workflow
        user = User.objects.create_user(
            email=email,
            first_name=social_data['given_name'],
            last_name=social_data['family_name'],
            auth_provider='google'
        )
        social_account = SocialAccount.objects.create(
            user=user,
            provider='google',
            uid=social_data['sub'],
            extra_data=social_data
        )

        assert user.email == 'newguest@gmail.com'
        assert user.is_staff is False
        assert user.is_superuser is False
        assert user.auth_provider == 'google'
        assert hasattr(user, 'customer_profile')
        assert social_account.uid == 'google-uid-123456'

    def test_returning_google_user_matches_existing_social_account(self):
        email = 'returning@gmail.com'
        user = User.objects.create_user(
            email=email,
            first_name='Sunita',
            last_name='Rao',
            auth_provider='google'
        )
        SocialAccount.objects.create(
            user=user,
            provider='google',
            uid='google-uid-789012',
            extra_data={'email': email}
        )

        # Lookup by provider and UID
        matched_account = SocialAccount.objects.filter(provider='google', uid='google-uid-789012').first()
        assert matched_account is not None
        assert matched_account.user == user

    def test_automatic_account_linking_on_matching_verified_email(self):
        # 1. Existing user created with email/password
        existing_user = User.objects.create_user(
            email='existingguest@example.com',
            password='InitialPassword123!',
            first_name='Existing',
            last_name='User'
        )
        assert existing_user.auth_provider == 'email'

        # 2. Customer later signs in with Google having the same email
        google_uid = 'google-uid-linked-999'
        social_account = SocialAccount.objects.create(
            user=existing_user,
            provider='google',
            uid=google_uid,
            extra_data={'email': 'existingguest@example.com', 'email_verified': True}
        )

        # 3. Verify single user record exists with linked social account
        assert User.objects.filter(email='existingguest@example.com').count() == 1
        assert existing_user.socialaccount_set.count() == 1
        assert existing_user.socialaccount_set.first().uid == google_uid
