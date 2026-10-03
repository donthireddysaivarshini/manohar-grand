export type BookingStatus =
  | 'held'
  | 'confirmed'
  | 'checked_in'
  | 'checked_out'
  | 'cancelled'
  | 'expired'
  | 'no_show';

export interface SelectedRoomItem {
  categoryId: string; // Category UUID or unique slug
  categoryName: string;
  slug: string;
  quantity: number;
  ratePerNight: number;
  heroImage?: string;
  maxAdultsPerRoom?: number;
  maxTotalOccupancy?: number;
}

export interface BookingSearchParams {
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  rooms: number;
  adults: number;
  children: number;
}

export interface CategoryAvailabilityResult {
  categoryId: string;
  categoryName: string;
  slug: string;
  totalInventory: number;
  availableQuantity: number;
  isAvailable: boolean;
  ratePerNight: number;
  maxAdultsPerRoom: number;
  maxTotalOccupancy?: number;
  primaryImage?: string;
  description?: string;
}

// =========================================================================
// Real Backend API Schema Types
// =========================================================================

export interface ApiRoomCategory {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  included_adults: number;
  included_children: number;
  max_adults: number;
  max_children: number;
  max_total_occupancy: number;
  active_physical_room_count: number;
  total_physical_room_count: number;
  primary_image: string | null;
  images: Array<{
    id: string;
    image_url: string;
    caption?: string;
    alt_text?: string;
    is_primary: boolean;
    display_order: number;
  }>;
  amenities: Array<{
    id: string;
    name: string;
    category: string;
    icon_name: string;
    description: string;
    is_highlight: boolean;
    display_order: number;
  }>;
  base_price_per_night: string;
  currency: string;
}

export interface ApiNightlyAvailability {
  date: string;
  total_operational: number;
  blocked_rooms: number;
  booked_rooms: number;
  available_rooms: number;
}

export interface ApiCategoryAvailability {
  category_id: string;
  category_slug: string;
  category_name: string;
  is_active: boolean;
  total_operational_capacity: number;
  minimum_available_rooms: number;
  requested_quantity: number;
  is_available: boolean;
  nightly_availability: ApiNightlyAvailability[];
}

export interface ApiAvailabilitySearchResponse {
  check_in: string;
  check_out: string;
  nights_count: number;
  stay_nights: string[];
  requested_quantity: number;
  categories: ApiCategoryAvailability[];
}

export interface ApiBookingGuest {
  id?: string;
  full_name: string;
  guest_type: 'adult' | 'child';
  age?: number | null;
  phone?: string;
  email?: string;
  is_primary: boolean;
}

export interface ApiBookingPriceSnapshot {
  id: string;
  booking_reference: string;
  currency: string;
  room_subtotal: string | number;
  extra_guest_total: string | number;
  late_checkout_total: string | number;
  miscellaneous_charges: string | number;
  discount_amount: string | number;
  taxable_subtotal: string | number;
  tax_rule_name: string;
  tax_rate_percent: string | number;
  tax_amount: string | number;
  gross_total: string | number;
  advance_amount_due: string | number;
  balance_amount_due: string | number;
  itemized_breakdown?: any;
  created_at: string;
  updated_at: string;
}

export interface ApiBookingRoom {
  id: string;
  category_id: string;
  category_name: string;
  category_slug: string;
  room_quantity: number;
  assigned_quantity?: number;
  physical_room_number?: string | null;
}

export interface ApiBookingDetail {
  id: string;
  booking_reference: string;
  access_token?: string;
  status: BookingStatus;
  status_display: string;
  is_hold_valid: boolean;
  hold_expires_at: string | null;
  check_in_date: string;
  check_out_date: string;
  nights_count: number;
  total_adults: number;
  total_children: number;
  total_rooms_count: number;
  guest_name: string;
  guest_phone: string;
  guest_email: string;
  special_requests: string;
  source: string;
  source_display: string;
  rooms: ApiBookingRoom[];
  guests?: ApiBookingGuest[];
  pricing?: ApiBookingPriceSnapshot;
  payment_orders?: Array<{
    id: string;
    razorpay_order_id: string;
    razorpay_payment_id?: string;
    amount: string;
    currency: string;
    purpose: string;
    status: string;
  }>;
  created_at: string;
  updated_at: string;
}

export type Booking = ApiBookingDetail;

export interface ApiCheckoutSummary {
  booking_reference: string;
  status: BookingStatus;
  status_display: string;
  is_hold_valid: boolean;
  hold_expires_at: string | null;
  check_in_date: string;
  check_out_date: string;
  nights_count: number;
  total_adults: number;
  total_children: number;
  total_rooms_count: number;
  guest_name: string;
  guest_phone: string;
  guest_email: string;
  special_requests: string;
  source: string;
  source_display: string;
  rooms: ApiBookingRoom[];
  guests: ApiBookingGuest[];
  pricing: ApiBookingPriceSnapshot;
  cancellation_policy: string;
  hotel_info: {
    hotel_name: string;
    check_in_time: string;
    check_out_time: string;
  };
  created_at: string;
}

export interface ApiCreateHoldPayload {
  check_in: string;
  check_out: string;
  rooms: Array<{
    category_id?: string;
    category_slug?: string;
    room_quantity: number;
  }>;
  guest_name: string;
  guest_phone?: string;
  guest_email?: string;
  total_adults: number;
  total_children: number;
  special_requests?: string;
  source?: string;
}

export interface ApiPaymentOrderResponse {
  booking_reference: string;
  payment_id: string;
  razorpay_order_id: string;
  razorpay_key_id: string;
  amount: number; // in paise
  amount_inr: string;
  currency: string;
  purpose: string;
  status: string;
  created_at: string;
}

export interface ApiPaymentVerifyPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface ApiPaymentVerifyResponse {
  booking_reference: string;
  booking_status: string;
  payment_status: string;
  payment_id: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  advance_amount: string;
  balance_amount: string;
  currency: string;
  confirmed_at: string;
}
