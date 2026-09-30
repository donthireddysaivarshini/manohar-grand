import os
from django.core.exceptions import ValidationError

# Maximum image upload size: 5 MB
MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024
ALLOWED_IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp'}
ALLOWED_CONTENT_TYPES = {'image/jpeg', 'image/png', 'image/webp', 'image/pjpeg', 'image/x-png'}


def validate_image_file(file):
    """
    Validates uploaded image file size and format.
    Accepts JPEG, PNG, WebP up to 5 MB.
    """
    if not file:
        return

    # 1. File size validation
    size = getattr(file, 'size', None)
    if size is None and hasattr(file, 'file') and hasattr(file.file, 'size'):
        size = file.file.size
    if size is not None and size > MAX_IMAGE_SIZE_BYTES:
        size_mb = size / (1024 * 1024)
        raise ValidationError(
            f"Image file size ({size_mb:.2f} MB) exceeds the maximum allowed limit of 5 MB."
        )

    # 2. Extension validation
    filename = getattr(file, 'name', '') or ''
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise ValidationError(
            f"Unsupported image extension '{ext}'. Allowed formats: JPEG, PNG, WebP."
        )

    # 3. MIME Content-Type validation (if available from uploaded file)
    content_type = getattr(file, 'content_type', None)
    if not content_type and hasattr(file, 'file'):
        content_type = getattr(file.file, 'content_type', None)

    if content_type and content_type.lower() not in ALLOWED_CONTENT_TYPES:
        raise ValidationError(
            f"Unsupported content type '{content_type}'. Allowed MIME types: image/jpeg, image/png, image/webp."
        )

