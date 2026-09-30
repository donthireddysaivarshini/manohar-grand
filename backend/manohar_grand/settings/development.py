"""
Development settings for Manohar Grand Backend (SQLite + WAL).
"""
from .base import *

DEBUG = True

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
        'OPTIONS': {
            'timeout': 20,
        }
    }
}

# In-memory email backend for development
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
