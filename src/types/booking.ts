import { GuestDetails, GuestOccupancy } from './guest';
import { PriceBreakdown } from './pricing';

export type BookingStatus = 'confirmed' | 'pending' | 'cancelled';

export interface SelectedRoomItem {
  categoryId: string; // 'ac-room' | 'non-ac-room'
  categoryName: string;
  slug: string;
  quantity: number;
  ratePerNight: number;
  heroImage: string;
  maxAdultsPerRoom: number;
}

export interface Booking {
  id: string; // e.g., 'MG-2026-0001'
  selectedRooms: SelectedRoomItem[];
  checkInDate: string;
  checkOutDate: string;
  numberOfNights: number;
  totalRooms: number;
  occupancy: GuestOccupancy;
  guest: GuestDetails;
  pricing: PriceBreakdown;
  status: BookingStatus;
  createdAt: string;
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
}
