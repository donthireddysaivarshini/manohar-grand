import uuid
import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.exceptions import ValidationError
from apps.cms.models import GalleryMedia


@pytest.mark.django_db
class TestGalleryMediaModel:
    """Tests for GalleryMedia model, category classification, and file validation."""

    def test_create_gallery_media_with_url_success(self):
        item = GalleryMedia.objects.create(
            title='Grand Hotel Reception Lobby',
            category='exterior',
            image_url='https://example.com/gallery/reception.webp',
            caption='24/7 Front Desk and Reception Area',
            alt_text='Reception desk with modern lighting and lobby seating',
            is_featured=True,
            display_order=1,
            is_active=True
        )
        assert isinstance(item.id, uuid.UUID)
        assert item.title == 'Grand Hotel Reception Lobby'
        assert item.category == 'exterior'
        assert str(item) == 'Grand Hotel Reception Lobby (Building & Reception)'

    def test_create_gallery_media_with_uploaded_file_success(self):
        png_content = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82'
        uploaded_file = SimpleUploadedFile(
            name='gallery_exterior.png',
            content=png_content,
            content_type='image/png'
        )

        item = GalleryMedia.objects.create(
            title='Night Exterior View',
            category='property',
            image=uploaded_file,
            is_featured=False,
            is_active=True
        )
        assert item.image is not None
        assert 'gallery_exterior' in item.image.name

    def test_validation_fails_if_neither_file_nor_url_provided(self):
        item = GalleryMedia(
            title='No image media',
            category='property'
        )
        with pytest.raises(ValidationError) as excinfo:
            item.full_clean()
        assert 'Either an uploaded image file or an image URL must be provided.' in str(excinfo.value)

    def test_reject_oversized_gallery_image(self):
        oversized_content = b'0' * (6 * 1024 * 1024) # 6 MB
        uploaded_file = SimpleUploadedFile(
            name='oversized_lobby.jpg',
            content=oversized_content,
            content_type='image/jpeg'
        )

        item = GalleryMedia(
            title='Oversized Lobby Photo',
            category='property',
            image=uploaded_file
        )
        with pytest.raises(ValidationError) as excinfo:
            item.full_clean()
        assert 'exceeds the maximum allowed limit of 5 MB' in str(excinfo.value)

    def test_reject_unsupported_file_extension(self):
        uploaded_file = SimpleUploadedFile(
            name='document.pdf',
            content=b'fake pdf content',
            content_type='image/jpeg'
        )

        item = GalleryMedia(
            title='Invalid PDF format',
            category='property',
            image=uploaded_file
        )
        with pytest.raises(ValidationError) as excinfo:
            item.full_clean()
        assert 'Unsupported image extension' in str(excinfo.value)

    def test_featured_and_category_filtering(self):
        g1 = GalleryMedia.objects.create(title='G1', category='rooms', is_featured=True, image_url='https://x.com/1.jpg')
        g2 = GalleryMedia.objects.create(title='G2', category='exterior', is_featured=False, image_url='https://x.com/2.jpg')
        g3 = GalleryMedia.objects.create(title='G3', category='rooms', is_featured=False, image_url='https://x.com/3.jpg')

        featured_items = list(GalleryMedia.objects.filter(is_featured=True).values_list('title', flat=True))
        assert featured_items == ['G1']

        room_items = list(GalleryMedia.objects.filter(category='rooms').values_list('title', flat=True))
        assert set(room_items) == {'G1', 'G3'}
