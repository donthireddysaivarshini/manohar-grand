import { ApiRoomImage } from '../types/booking';

/**
 * Neutral SVG placeholder data-URI for room cards when no imagery is configured.
 */
export const NEUTRAL_ROOM_PLACEHOLDER = `data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20800%20500%22%20width%3D%22100%25%22%20height%3D%22100%25%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22bg%22%20x1%3D%220%25%22%20y1%3D%220%25%22%20x2%3D%22100%25%22%20y2%3D%22100%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%231E293B%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%230F172A%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22800%22%20height%3D%22500%22%20fill%3D%22url(%23bg)%22%2F%3E%3Cg%20fill%3D%22none%22%20stroke%3D%22%238A151B%22%20stroke-width%3D%222%22%20opacity%3D%220.35%22%3E%3Ccircle%20cx%3D%22400%22%20cy%3D%22250%22%20r%3D%22120%22%2F%3E%3Ccircle%20cx%3D%22400%22%20cy%3D%22250%22%20r%3D%2270%22%2F%3E%3C%2Fg%3E%3Ctext%20x%3D%22400%22%20y%3D%22240%22%20font-family%3D%22sans-serif%22%20font-size%3D%2222%22%20font-weight%3D%22bold%22%20fill%3D%22%23FFFFFF%22%20text-anchor%3D%22middle%22%20opacity%3D%220.9%22%3EManohar%20Grand%3C%2Ftext%3E%3Ctext%20x%3D%22400%22%20y%3D%22270%22%20font-family%3D%22sans-serif%22%20font-size%3D%2213%22%20fill%3D%22%2394A3B8%22%20text-anchor%3D%22middle%22%3EKukatpally%2C%20Hyderabad%3C%2Ftext%3E%3C%2Fsvg%3E`;

/**
 * Extracts a valid browser-accessible image URL from an ApiRoomImage object, string URL, or nullish input.
 */
export function getRoomImageUrl(image: ApiRoomImage | string | null | undefined): string {
  if (!image) return NEUTRAL_ROOM_PLACEHOLDER;
  if (typeof image === 'string') {
    const trimmed = image.trim();
    return trimmed.length > 0 ? trimmed : NEUTRAL_ROOM_PLACEHOLDER;
  }
  if (image.image_url && image.image_url.trim().length > 0) {
    return image.image_url.trim();
  }
  return NEUTRAL_ROOM_PLACEHOLDER;
}

/**
 * Extracts the primary image URL for a room category, falling back to first active image or placeholder.
 */
export function getCategoryPrimaryImageUrl(category: {
  primary_image?: ApiRoomImage | string | null;
  images?: ApiRoomImage[];
} | null | undefined): string {
  if (!category) return NEUTRAL_ROOM_PLACEHOLDER;
  if (category.primary_image) {
    const url = getRoomImageUrl(category.primary_image);
    if (url !== NEUTRAL_ROOM_PLACEHOLDER) return url;
  }
  if (category.images && category.images.length > 0) {
    const primaryInList = category.images.find((img) => img.is_primary && img.is_active !== false);
    if (primaryInList) {
      const url = getRoomImageUrl(primaryInList);
      if (url !== NEUTRAL_ROOM_PLACEHOLDER) return url;
    }
    const firstActive = category.images.find((img) => img.is_active !== false) || category.images[0];
    if (firstActive) {
      return getRoomImageUrl(firstActive);
    }
  }
  return NEUTRAL_ROOM_PLACEHOLDER;
}
