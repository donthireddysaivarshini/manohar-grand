import { IAvailabilityService } from '../contracts/IAvailabilityService';
import { CategoryAvailabilityResult, BookingSearchParams } from '../../types/booking';
import { CONFIRMED_ROOM_CATEGORIES } from '../../data/confirmedInventory';
import { calculateNights } from '../../utils/dateUtils';

export class MockAvailabilityService implements IAvailabilityService {
  async checkAvailability(params: BookingSearchParams): Promise<CategoryAvailabilityResult[]> {
    const nights = calculateNights(params.checkIn, params.checkOut);

    return Promise.resolve(
      CONFIRMED_ROOM_CATEGORIES.map((category) => {
        const simulatedBooked = nights % 3 === 0 ? Math.min(3, category.totalInventory - 2) : 1;
        const availableQuantity = Math.max(1, category.totalInventory - simulatedBooked);
        const rate = category.id === 'ac-room' ? 2499 : 1799;

        return {
          categoryId: category.id,
          categoryName: category.name,
          slug: category.slug,
          totalInventory: category.totalInventory,
          availableQuantity,
          isAvailable: availableQuantity > 0,
          ratePerNight: rate,
          maxAdultsPerRoom: 2,
        };
      })
    );
  }
}
