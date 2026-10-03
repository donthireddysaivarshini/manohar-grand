import { fetchApi } from '../apiClient';
import { ApiAvailabilitySearchResponse } from '../../types/booking';

export interface AvailabilitySearchParams {
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  rooms?: number;
  adults?: number;
  children?: number;
  category?: string;
}

export const availabilityApiService = {
  /**
   * Search real-time availability across stay dates directly derived from physical rooms and existing reservations.
   * Endpoint: GET /api/v1/availability/search/?check_in=YYYY-MM-DD&check_out=YYYY-MM-DD&rooms=N&adults=N&children=N
   */
  async checkAvailability(params: AvailabilitySearchParams): Promise<ApiAvailabilitySearchResponse> {
    const query = new URLSearchParams({
      check_in: params.checkIn,
      check_out: params.checkOut,
      rooms: String(params.rooms || 1),
      adults: String(params.adults || 1),
      children: String(params.children || 0),
    });

    if (params.category) {
      query.set('category', params.category);
    }

    const res = await fetchApi<ApiAvailabilitySearchResponse>(`/api/v1/availability/search/?${query.toString()}`);
    if (res.success && res.data) {
      return res.data;
    }
    throw new Error(res.error?.message || 'Failed to check stay availability');
  },
};
