import uuid
import pytest
from django.core.exceptions import ValidationError
from django.db.utils import IntegrityError
from apps.cms.models import CMSSection


@pytest.mark.django_db
class TestCMSSectionModel:
    """Tests for CMSSection model, key uniqueness, metadata JSON, and active state ordering."""

    def test_create_valid_cms_section(self):
        section = CMSSection.objects.create(
            section_key='hero',
            title='Welcome to Manohar Grand',
            subtitle='Luxury Air-conditioned and Non A/c Rooms',
            body='Main narrative text',
            metadata={
                'connectivity_badge': 'Walkable distance from JNTU Metro Station',
                'cta_primary_text': 'Book Your Stay'
            },
            display_order=1,
            is_active=True
        )
        assert isinstance(section.id, uuid.UUID)
        assert section.section_key == 'hero'
        assert section.title == 'Welcome to Manohar Grand'
        assert section.metadata['connectivity_badge'] == 'Walkable distance from JNTU Metro Station'
        assert section.is_active is True
        assert 'Welcome to Manohar Grand [hero] (Active)' in str(section)

    def test_section_key_must_be_unique(self):
        CMSSection.objects.create(
            section_key='about',
            title='About Manohar Grand'
        )
        with pytest.raises(IntegrityError):
            CMSSection.objects.create(
                section_key='about',
                title='Duplicate About Section'
            )

    def test_section_key_whitespace_cleaning_and_blank_validation(self):
        section = CMSSection(
            section_key='   ',
            title='Valid Title'
        )
        with pytest.raises(ValidationError) as excinfo:
            section.full_clean()
        assert 'section_key' in excinfo.value.message_dict

    def test_title_blank_validation(self):
        section = CMSSection(
            section_key='valid-key',
            title='   '
        )
        with pytest.raises(ValidationError) as excinfo:
            section.full_clean()
        assert 'title' in excinfo.value.message_dict

    def test_cms_section_ordering_and_active_filtering(self):
        CMSSection.objects.create(section_key='sec3', title='Section 3', display_order=3, is_active=True)
        CMSSection.objects.create(section_key='sec1', title='Section 1', display_order=1, is_active=True)
        CMSSection.objects.create(section_key='sec2', title='Section 2', display_order=2, is_active=False)

        active_ordered_keys = list(CMSSection.objects.filter(is_active=True).values_list('section_key', flat=True))
        assert active_ordered_keys == ['sec1', 'sec3']
