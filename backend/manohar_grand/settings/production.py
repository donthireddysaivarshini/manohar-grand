"""
Production settings for Manohar Grand Backend (PostgreSQL + SSL + Security Hardening).
"""
import os
from urllib.parse import urlparse
from .base import *

DEBUG = False

# Reverse Proxy & SSL Configuration
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
USE_X_FORWARDED_HOST = True
SECURE_SSL_REDIRECT = os.environ.get('SECURE_SSL_REDIRECT', 'True').lower() in ('true', '1', 'yes')

# Strict Security & Cookie Configuration
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = False  # Required so frontend SPA can read csrftoken header

# HTTP Security Headers
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_HSTS_SECONDS = int(os.environ.get('SECURE_HSTS_SECONDS', '31536000'))
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
X_FRAME_OPTIONS = 'DENY'

# Production DRF: Enforce JSON-only renderer (disable browsable API)
REST_FRAMEWORK = {
    **REST_FRAMEWORK,
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
}

# Database Configuration (PostgreSQL 16+)
DATABASE_URL = os.environ.get('DATABASE_URL')
if DATABASE_URL:
    db_info = urlparse(DATABASE_URL)
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': db_info.path.lstrip('/'),
            'USER': db_info.username or '',
            'PASSWORD': db_info.password or '',
            'HOST': db_info.hostname or 'localhost',
            'PORT': str(db_info.port or 5432),
            'CONN_MAX_AGE': int(os.environ.get('DB_CONN_MAX_AGE', '600')),
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': os.environ.get('DB_ENGINE', 'django.db.backends.postgresql'),
            'NAME': os.environ.get('DB_NAME', 'manohar_grand_db'),
            'USER': os.environ.get('DB_USER', 'postgres'),
            'PASSWORD': os.environ.get('DB_PASSWORD', ''),
            'HOST': os.environ.get('DB_HOST', 'localhost'),
            'PORT': os.environ.get('DB_PORT', '5432'),
            'CONN_MAX_AGE': int(os.environ.get('DB_CONN_MAX_AGE', '600')),
        }
    }

# Production Logging Configuration (Redacting secrets from stdout)
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '[{asctime}] {levelname} [{name}:{lineno}] {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django.request': {
            'handlers': ['console'],
            'level': 'ERROR',
            'propagate': False,
        },
        'django.security': {
            'handlers': ['console'],
            'level': 'WARNING',
            'propagate': False,
        },
        'apps.payments': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'apps.bookings': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

# Production Frontend URL Configuration
raw_frontend_url = os.environ.get('FRONTEND_URL', '').strip()
if not raw_frontend_url or 'vercel.app' in raw_frontend_url or 'manohargrandfrontweb' in raw_frontend_url:
    FRONTEND_URL = 'https://www.manohargrand.com'
else:
    FRONTEND_URL = raw_frontend_url.rstrip('/')

# Ensure canonical frontend domains are always permitted for CORS & CSRF
for origin in ['https://www.manohargrand.com', 'https://manohargrand.com', 'https://admin.manohargrand.com']:
    if origin not in CORS_ALLOWED_ORIGINS:
        CORS_ALLOWED_ORIGINS.append(origin)
    if origin not in CSRF_TRUSTED_ORIGINS:
        CSRF_TRUSTED_ORIGINS.append(origin)

# Ensure Jazzmin links use SSO bridge and production Live Site URL
JAZZMIN_SETTINGS = {
    **JAZZMIN_SETTINGS,
    "topmenu_links": [
        {"name": "Home", "url": "admin:index", "permissions": ["auth.view_user"]},
        {"name": "📊 Daily Occupancy & Reports", "url": "/admin/occupancy-report/", "permissions": ["auth.view_user"]},
        {"name": "🌐 Analytics Dashboard", "url": "/admin/analytics-bridge/", "new_window": True},
        {"name": "🏨 Live Site", "url": FRONTEND_URL, "new_window": True},
    ],
    "custom_links": {
        **JAZZMIN_SETTINGS.get("custom_links", {}),
        "bookings": [
            {
                "name": "⚡ Pending Cancellations",
                "url": "/admin/bookings/cancellationrequest/?status__exact=cancellation_requested",
                "icon": "fas fa-exclamation-triangle",
                "permissions": ["auth.view_user"],
            },
            {
                "name": "📊 Daily Occupancy & Forecast",
                "url": "/admin/occupancy-report/",
                "icon": "fas fa-chart-pie",
                "permissions": ["auth.view_user"],
            },
            {
                "name": "🌐 Advanced Analytics Suite",
                "url": "/admin/analytics-bridge/",
                "icon": "fas fa-analytics",
                "permissions": ["auth.view_user"],
                "new_window": True,
            }
        ]
    }
}
