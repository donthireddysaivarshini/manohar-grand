"""
ASGI config for manohar_grand project.
"""
import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'manohar_grand.settings.development')

application = get_asgi_application()
