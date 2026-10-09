import { fetchApi } from '../apiClient';

export interface ApiStopSell {
  id: string;
  start_date: string;
  end_date: string;
  nights_count: number;
  is_hotel_wide: boolean;
  category_id: string | null;
  category_name: string | null;
  reason: string;
  notes?: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
}

export interface ApiCreateStopSellPayload {
  start_date: string;
  end_date: string;
  is_hotel_wide?: boolean;
  category_id?: string;
  reason?: string;
  notes?: string;
}

export const stopSellApiService = {
  /**
   * Fetches all stop-sell / hotel full booked blackout records.
   * Endpoint: GET /api/v1/admin/inventory/stop-sells/
   */
  async getStopSells(isActive?: boolean): Promise<ApiStopSell[]> {
    const query = isActive !== undefined ? `?is_active=${isActive}` : '';
    const res = await fetchApi<ApiStopSell[]>(`/api/v1/admin/inventory/stop-sells/${query}`);
    if (res.success && res.data) {
      return res.data;
    }
    return [];
  },

  /**
   * Creates a new stop-sell blackout period.
   * Endpoint: POST /api/v1/admin/inventory/stop-sells/
   */
  async createStopSell(payload: ApiCreateStopSellPayload): Promise<ApiStopSell> {
    const res = await fetchApi<ApiStopSell>('/api/v1/admin/inventory/stop-sells/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.success && res.data) {
      return res.data;
    }
    const errMsg = res.error?.message || 'Failed to create stop-sell';
    throw new Error(errMsg);
  },

  /**
   * Toggles active/inactive state of a stop-sell.
   * Endpoint: POST /api/v1/admin/inventory/stop-sells/{id}/toggle/
   */
  async toggleStopSell(id: string): Promise<boolean> {
    const res = await fetchApi<{ id: string; is_active: boolean }>(
      `/api/v1/admin/inventory/stop-sells/${id}/toggle/`,
      { method: 'POST' }
    );
    return res.success;
  },

  /**
   * Deletes a stop-sell record completely.
   * Endpoint: DELETE /api/v1/admin/inventory/stop-sells/{id}/
   */
  async deleteStopSell(id: string): Promise<boolean> {
    const res = await fetchApi(`/api/v1/admin/inventory/stop-sells/${id}/`, {
      method: 'DELETE',
    });
    return res.success;
  },
};
