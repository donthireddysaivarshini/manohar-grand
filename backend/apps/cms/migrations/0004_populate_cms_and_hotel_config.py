"""
Migration 0004 for CMS app.
"""
from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ('cms', '0003_cmssection_faq'),
    ]

    operations = [
        # Kept clean for database schema integrity. Master data is seeded via seed_phase2_master_data command.
    ]
