"""
WSGI config for manohar_grand project.
"""
import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'manohar_grand.settings.development')

application = get_wsgi_application()
