import { fetchApi } from '../apiClient';
import { ApiRoomCategory } from '../../types/booking';

export const roomApiService = {
  /**
   * Fetches all active room categories with derived operational capacity, active imagery, amenities, and rate plan.
   * Endpoint: GET /api/v1/rooms/categories/
   */
  async getCategories(): Promise<ApiRoomCategory[]> {
    const res = await fetchApi<ApiRoomCategory[]>('/api/v1/rooms/categories/');
    if (res.success && Array.isArray(res.data)) {
      return res.data;
    }
    throw new Error(res.error?.message || 'Failed to load room categories');
  },

  /**
   * Fetches a single room category specification by unique slug.
   * Endpoint: GET /api/v1/rooms/categories/{slug}/
   */
  async getCategoryBySlug(slug: string): Promise<ApiRoomCategory> {
    const res = await fetchApi<ApiRoomCategory>(`/api/v1/rooms/categories/${slug}/`);
    if (res.success && res.data) {
      return res.data;
    }
    throw new Error(res.error?.message || `Failed to load category ${slug}`);
  },
};
