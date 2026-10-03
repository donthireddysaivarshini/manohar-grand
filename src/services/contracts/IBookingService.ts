import { ApiBookingDetail } from '../../types/booking';
import { PriceBreakdown, MultiRoomPriceCalculationParams } from '../../types/pricing';

export interface IBookingService {
  calculatePrice(params: MultiRoomPriceCalculationParams): Promise<PriceBreakdown>;
  createBooking(bookingData: Partial<ApiBookingDetail>): Promise<ApiBookingDetail>;
  getBookingById(id: string): Promise<ApiBookingDetail | null>;
}
