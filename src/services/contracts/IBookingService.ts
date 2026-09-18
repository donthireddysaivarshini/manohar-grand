import { Booking } from '../../types/booking';
import { PriceBreakdown, MultiRoomPriceCalculationParams } from '../../types/pricing';

export interface IBookingService {
  calculatePrice(params: MultiRoomPriceCalculationParams): Promise<PriceBreakdown>;
  createBooking(bookingData: Omit<Booking, 'id' | 'createdAt' | 'status'>): Promise<Booking>;
  getBookingById(id: string): Promise<Booking | null>;
}
