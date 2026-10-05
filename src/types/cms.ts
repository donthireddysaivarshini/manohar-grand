/**
 * Authoritative TypeScript interfaces matching Django CMS & Media serializers.
 */

export interface ApiHotelConfiguration {
  hotel_name: string;
  primary_phone: string;
  secondary_phone: string;
  email: string;
  address: string;
  near_landmark: string;
  google_maps_url: string;
  google_maps_embed_url: string;
  standard_check_in_time: string;
  standard_check_out_time: string;
  max_late_checkout_hours: number;
  cancellation_policy_text: string;
  guest_id_policy_text: string;
  age_policy_text: string;
}

export interface ApiCMSSection {
  id: string;
  section_key: string;
  title: string;
  subtitle: string;
  body: string;
  metadata: Record<string, any>;
  display_order: number;
}

export interface ApiGalleryMedia {
  id: string;
  title: string;
  category: 'rooms' | 'property' | 'amenities' | 'exterior' | string;
  image_url: string;
  caption: string;
  alt_text: string;
  is_featured: boolean;
  display_order: number;
  is_active?: boolean;
}

export interface ApiFAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  category_display: string;
  display_order: number;
}

export interface ApiAmenityItem {
  id: string;
  name: string;
  category: 'room' | 'property' | 'service' | 'safety' | string;
  icon_name: string;
  description: string;
  is_property_wide: boolean;
  display_order: number;
  is_active?: boolean;
}
