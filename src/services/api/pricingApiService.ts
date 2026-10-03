import { fetchApi } from '../apiClient';
import { ApiBookingPriceSnapshot } from '../../types/booking';

export interface PricingQuoteRequest {
  check_in_date: string;
  check_out_date: string;
  rooms: Array<{
    category: string;
    room_quantity: number;
  }>;
  total_adults?: number;
  total_children?: number;
  late_checkout_hours?: number;
}

export const pricingApiService = {
  /**
   * Authoritative dynamic pricing quote calculation directly from Django pricing engine.
   * Endpoint: POST /api/v1/pricing/calculate/
   */
  async calculateQuote(payload: PricingQuoteRequest): Promise<ApiBookingPriceSnapshot> {
    const res = await fetchApi<ApiBookingPriceSnapshot>('/api/v1/pricing/calculate/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.success && res.data) {
      return res.data;
    }
    throw new Error(res.error?.message || 'Failed to calculate price quote');
  },
};
