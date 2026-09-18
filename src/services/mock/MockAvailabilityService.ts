import { IAvailabilityService } from '../contracts/IAvailabilityService';
import { CategoryAvailabilityResult, BookingSearchParams } from '../../types/booking';
import { ROOM_CATEGORIES_DATA } from '../../data/roomCategories';
import { calculateNights } from '../../utils/dateUtils';

export class MockAvailabilityService implements IAvailabilityService {
  async checkAvailability(params: BookingSearchParams): Promise<CategoryAvailabilityResult[]> {
    const nights = calculateNights(params.checkIn, params.checkOut);

    // Simulate minor date-based availability variations for demo realism
    return Promise.resolve(
      ROOM_CATEGORIES_DATA.map((category) => {
        // Deterministic mock calculation based on stay length & confirmed capacity
        // AC base: 20, Non-AC base: 8
        const simulatedBooked = (nights % 3 === 0) ? Math.min(3, category.totalInventory - 2) : 1;
        const availableQuantity = Math.max(1, category.totalInventory - simulatedBooked);

        return {
          categoryId: category.id,
          categoryName: category.name,
          slug: category.slug,
          totalInventory: category.totalInventory,
          availableQuantity,
          isAvailable: availableQuantity > 0,
          ratePerNight: category.demoBasePricePerNight,
          maxAdultsPerRoom: category.demoCapacity.maxAdults,
        };
      })
    );
  }
}
