import { CategoryAvailabilityResult, BookingSearchParams } from '../../types/booking';

export interface IAvailabilityService {
  checkAvailability(params: BookingSearchParams): Promise<CategoryAvailabilityResult[]>;
}
