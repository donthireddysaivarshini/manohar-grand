import uuid
import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.exceptions import ValidationError
from apps.rooms.models import RoomCategory, RoomImage


@pytest.mark.django_db
class TestRoomImageModelAndMediaValidation:
    """Tests for RoomImage model, primary-image rules, and upload media validation."""

    @pytest.fixture
    def sample_category(self):
        return RoomCategory.objects.create(
            name='AC Deluxe Room',
            slug='ac-deluxe-room',
            max_total_occupancy=4
        )

    def test_create_room_image_with_url_success(self, sample_category):
        img = RoomImage.objects.create(
            category=sample_category,
            image_url='https://example.com/images/ac-room-1.webp',
            caption='Spacious Master Bedroom View',
            alt_text='View of king bed with Wakefit mattress in AC Deluxe Room',
            is_primary=True,
            display_order=1,
            is_active=True
        )
        assert isinstance(img.id, uuid.UUID)
        assert img.category == sample_category
        assert img.is_primary is True
        assert '[PRIMARY]' in str(img)

    def test_create_room_image_with_uploaded_file_success(self, sample_category):
        # 1x1 valid PNG payload
        png_content = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82'
        uploaded_file = SimpleUploadedFile(
            name='room_photo.png',
            content=png_content,
            content_type='image/png'
        )

        img = RoomImage.objects.create(
            category=sample_category,
            image=uploaded_file,
            caption='Uploaded Real Room Photo',
            is_primary=False,
            is_active=True
        )
        assert img.image is not None
        assert 'room_photo' in img.image.name

    def test_validation_fails_if_neither_file_nor_url_provided(self, sample_category):
        img = RoomImage(
            category=sample_category,
            caption='No image provided'
        )
        with pytest.raises(ValidationError) as excinfo:
            img.full_clean()
        assert 'Either an uploaded image file or an image URL must be provided.' in str(excinfo.value)

    def test_inactive_image_cannot_be_primary(self, sample_category):
        img = RoomImage(
            category=sample_category,
            image_url='https://example.com/inactive.jpg',
            is_primary=True,
            is_active=False # Inactive cannot be primary
        )
        with pytest.raises(ValidationError) as excinfo:
            img.full_clean()
        assert 'is_primary' in excinfo.value.message_dict

    def test_primary_image_auto_demotes_previous_primary_image(self, sample_category):
        img1 = RoomImage.objects.create(
            category=sample_category,
            image_url='https://example.com/img1.webp',
            is_primary=True,
            is_active=True
        )
        assert img1.is_primary is True

        img2 = RoomImage.objects.create(
            category=sample_category,
            image_url='https://example.com/img2.webp',
            is_primary=True,
            is_active=True
        )
        assert img2.is_primary is True

        # Refresh img1 from DB: its primary status should now be False
        img1.refresh_from_db()
        assert img1.is_primary is False

    def test_reject_oversized_image_upload(self, sample_category):
        # 6 MB dummy payload
        oversized_content = b'0' * (6 * 1024 * 1024)
        uploaded_file = SimpleUploadedFile(
            name='oversized_photo.jpg',
            content=oversized_content,
            content_type='image/jpeg'
        )

        img = RoomImage(
            category=sample_category,
            image=uploaded_file
        )
        with pytest.raises(ValidationError) as excinfo:
            img.full_clean()
        assert 'exceeds the maximum allowed limit of 5 MB' in str(excinfo.value)

    def test_reject_unsupported_file_extension(self, sample_category):
        uploaded_file = SimpleUploadedFile(
            name='executable.exe',
            content=b'fake binary data',
            content_type='image/jpeg'
        )

        img = RoomImage(
            category=sample_category,
            image=uploaded_file
        )
        with pytest.raises(ValidationError) as excinfo:
            img.full_clean()
        assert 'Unsupported image extension' in str(excinfo.value)

    def test_reject_unsupported_mime_type(self, sample_category):
        uploaded_file = SimpleUploadedFile(
            name='malicious.jpg',
            content=b'fake text file masquerading as jpg',
            content_type='text/plain'
        )

        img = RoomImage(
            category=sample_category,
            image=uploaded_file
        )
        with pytest.raises(ValidationError) as excinfo:
            img.full_clean()
        assert 'Unsupported content type' in str(excinfo.value)
