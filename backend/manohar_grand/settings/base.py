"""
Base Django settings for Manohar Grand Hotel Direct Booking Platform.
"""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Build paths inside the project
BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(BASE_DIR))

# Load .env file if present
env_path = BASE_DIR / '.env'
if env_path.exists():
    load_dotenv(env_path)

SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'django-insecure-dev-key-manohar-grand-lts')

DEBUG = os.environ.get('DEBUG', 'True').lower() in ('true', '1', 'yes')

# Dynamic Host and Origin Configuration
ALLOWED_HOSTS = [h.strip() for h in os.environ.get('ALLOWED_HOSTS', 'localhost,127.0.0.1,testserver').split(',') if h.strip()]

FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:5173')
BACKEND_URL = os.environ.get('BACKEND_URL', 'http://localhost:8000')

CORS_ALLOWED_ORIGINS = [o.strip() for o in os.environ.get('CORS_ALLOWED_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173').split(',') if o.strip()]
CORS_ALLOW_CREDENTIALS = True

CSRF_TRUSTED_ORIGINS = [o.strip() for o in os.environ.get('CSRF_TRUSTED_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:8000,http://127.0.0.1:8000').split(',') if o.strip()]

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.sites',

    # Third-party packages
    'rest_framework',
    'corsheaders',
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'allauth.socialaccount.providers.google',

    # Project apps
    'core',
    'apps.authentication.apps.AuthenticationConfig',
    'apps.rooms.apps.RoomsConfig',
    'apps.pricing.apps.PricingConfig',
    'apps.cms.apps.CmsConfig',
    'apps.inventory.apps.InventoryConfig',
    'apps.bookings.apps.BookingsConfig',
    'apps.availability.apps.AvailabilityConfig',
    'apps.payments.apps.PaymentsConfig',
    'apps.reports.apps.ReportsConfig',
]

# Razorpay Payment Gateway Configuration
RAZORPAY_KEY_ID = os.environ.get('RAZORPAY_KEY_ID', 'rzp_test_placeholder_key_id')
RAZORPAY_KEY_SECRET = os.environ.get('RAZORPAY_KEY_SECRET', 'placeholder_secret_never_commit')
RAZORPAY_WEBHOOK_SECRET = os.environ.get('RAZORPAY_WEBHOOK_SECRET', 'placeholder_webhook_secret')
RAZORPAY_CURRENCY = os.environ.get('RAZORPAY_CURRENCY', 'INR')

BOOKING_HOLD_DURATION_MINUTES = 15

SITE_ID = 1

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'allauth.account.middleware.AccountMiddleware',
]

ROOT_URLCONF = 'manohar_grand.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request', # Required by allauth
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'manohar_grand.wsgi.application'
ASGI_APPLICATION = 'manohar_grand.asgi.application'

# Custom User Model
AUTH_USER_MODEL = 'authentication.User'

# Authentication Backends
AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
    'allauth.account.auth_backends.AuthenticationBackend',
]

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', 'OPTIONS': {'min_length': 8}},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kolkata'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Django REST Framework Settings
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'core.authentication.CustomSessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
    'EXCEPTION_HANDLER': 'core.exceptions.custom_exception_handler',
}

# Session Configuration
SESSION_ENGINE = 'django.contrib.sessions.backends.db'
SESSION_COOKIE_NAME = 'sessionid'
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SECURE = False  # Overridden in production.py
SESSION_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_AGE = 1209600  # 14 days

# CSRF Configuration
CSRF_COOKIE_NAME = 'csrftoken'
CSRF_COOKIE_HTTPONLY = False  # Must be False so React frontend JS can read and attach header
CSRF_COOKIE_SECURE = False   # Overridden in production.py
CSRF_COOKIE_SAMESITE = 'Lax'

# django-allauth Settings
ACCOUNT_LOGIN_METHODS = {'email'}
ACCOUNT_SIGNUP_FIELDS = ['email*']
ACCOUNT_UNIQUE_EMAIL = True
ACCOUNT_USER_MODEL_USERNAME_FIELD = None
ACCOUNT_EMAIL_VERIFICATION = 'none'

SOCIALACCOUNT_AUTO_SIGNUP = True
SOCIALACCOUNT_EMAIL_AUTHENTICATION = True
SOCIALACCOUNT_EMAIL_AUTHENTICATION_AUTO_CONNECT = True
SOCIALACCOUNT_LOGIN_ON_GET = True

SOCIALACCOUNT_PROVIDERS = {
    'google': {
        'APP': {
            'client_id': os.environ.get('GOOGLE_CLIENT_ID', ''),
            'secret': os.environ.get('GOOGLE_CLIENT_SECRET', ''),
            'key': ''
        },
        'SCOPE': [
            'profile',
            'email',
        ],
        'AUTH_PARAMS': {
            'access_type': 'online',
        }
    }
}

LOGIN_REDIRECT_URL = f"{FRONTEND_URL}/auth/callback"
LOGOUT_REDIRECT_URL = FRONTEND_URL
