import { IBookingService } from '../contracts/IBookingService';
import { ApiBookingDetail } from '../../types/booking';
import { PriceBreakdown, MultiRoomPriceCalculationParams } from '../../types/pricing';
import { calculateBookingPrice } from '../../utils/priceCalculators';

const mockBookingsStore: ApiBookingDetail[] = [];

export class MockBookingService implements IBookingService {
  async calculatePrice(params: MultiRoomPriceCalculationParams): Promise<PriceBreakdown> {
    const breakdown = calculateBookingPrice(params);
    return Promise.resolve(breakdown);
  }

  async createBooking(bookingData: Partial<ApiBookingDetail>): Promise<ApiBookingDetail> {
    const ref = `MG-2026-${String(Math.floor(1000 + Math.random() * 9000))}`;
    const newBooking: ApiBookingDetail = {
      id: ref,
      booking_reference: ref,
      status: 'confirmed',
      status_display: 'Confirmed',
      is_hold_valid: false,
      hold_expires_at: null,
      check_in_date: bookingData.check_in_date || '',
      check_out_date: bookingData.check_out_date || '',
      nights_count: bookingData.nights_count || 1,
      total_adults: bookingData.total_adults || 1,
      total_children: bookingData.total_children || 0,
      total_rooms_count: bookingData.total_rooms_count || 1,
      guest_name: bookingData.guest_name || 'Guest',
      guest_phone: bookingData.guest_phone || '',
      guest_email: bookingData.guest_email || '',
      special_requests: bookingData.special_requests || '',
      source: 'website',
      source_display: 'Website Direct',
      rooms: bookingData.rooms || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...bookingData,
    };
    mockBookingsStore.push(newBooking);
    return Promise.resolve({ ...newBooking });
  }

  async getBookingById(id: string): Promise<ApiBookingDetail | null> {
    const booking = mockBookingsStore.find((b) => b.id === id || b.booking_reference === id);
    return Promise.resolve(booking ? { ...booking } : null);
  }
}
