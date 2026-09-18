import { IBookingService } from '../contracts/IBookingService';
import { Booking } from '../../types/booking';
import { PriceBreakdown, MultiRoomPriceCalculationParams } from '../../types/pricing';
import { calculateBookingPrice } from '../../utils/priceCalculators';

const mockBookingsStore: Booking[] = [];

export class MockBookingService implements IBookingService {
  async calculatePrice(params: MultiRoomPriceCalculationParams): Promise<PriceBreakdown> {
    const breakdown = calculateBookingPrice(params);
    return Promise.resolve(breakdown);
  }

  async createBooking(bookingData: Omit<Booking, 'id' | 'createdAt' | 'status'>): Promise<Booking> {
    const newBooking: Booking = {
      ...bookingData,
      id: `MG-2026-${String(Math.floor(1000 + Math.random() * 9000))}`,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };
    mockBookingsStore.push(newBooking);
    return Promise.resolve({ ...newBooking });
  }

  async getBookingById(id: string): Promise<Booking | null> {
    const booking = mockBookingsStore.find((b) => b.id === id);
    return Promise.resolve(booking ? { ...booking } : null);
  }
}
