import uuid
import pytest
from django.core.exceptions import ValidationError
from apps.cms.models import FAQ


@pytest.mark.django_db
class TestFAQModel:
    """Tests for FAQ model, category groupings, ordering, and validation."""

    def test_create_valid_faq(self):
        faq = FAQ.objects.create(
            question='What are the standard check-in and check-out timings?',
            answer='Standard check-in is at 11:00 AM and check-out is at 11:00 AM the following morning.',
            category='checkin_checkout',
            display_order=1,
            is_active=True
        )
        assert isinstance(faq.id, uuid.UUID)
        assert faq.question.startswith('What are the standard')
        assert faq.category == 'checkin_checkout'
        assert faq.is_active is True
        assert 'Check-in & Check-out' in str(faq)

    def test_faq_blank_question_rejected(self):
        faq = FAQ(
            question='   ',
            answer='Valid answer text.',
            category='general'
        )
        with pytest.raises(ValidationError) as excinfo:
            faq.full_clean()
        assert 'question' in excinfo.value.message_dict

    def test_faq_blank_answer_rejected(self):
        faq = FAQ(
            question='Valid Question?',
            answer='   ',
            category='general'
        )
        with pytest.raises(ValidationError) as excinfo:
            faq.full_clean()
        assert 'answer' in excinfo.value.message_dict

    def test_faq_ordering_and_category_filtering(self):
        faq1 = FAQ.objects.create(question='Q1', answer='A1', category='booking', display_order=2, is_active=True)
        faq2 = FAQ.objects.create(question='Q2', answer='A2', category='booking', display_order=1, is_active=True)
        faq3 = FAQ.objects.create(question='Q3', answer='A3', category='amenities', display_order=1, is_active=False)

        booking_active_faqs = list(FAQ.objects.filter(category='booking', is_active=True).values_list('question', flat=True))
        assert booking_active_faqs == ['Q2', 'Q1']
