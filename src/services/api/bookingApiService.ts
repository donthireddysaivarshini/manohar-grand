import { fetchApi } from '../apiClient';
import {
  ApiCreateHoldPayload,
  ApiBookingDetail,
  ApiCheckoutSummary,
  ApiBookingGuest,
  ApiCancellationPreview,
} from '../../types/booking';

export const bookingApiService = {
  /**
   * Creates an atomic 15-minute temporary reservation hold in the backend.
   * Endpoint: POST /api/v1/bookings/hold/
   */
  async createHold(payload: ApiCreateHoldPayload): Promise<ApiBookingDetail> {
    const res = await fetchApi<ApiBookingDetail>('/api/v1/bookings/hold/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.success && res.data) {
      return res.data;
    }
    const errMsg =
      res.error?.message ||
      (typeof res.error === 'string' ? res.error : 'Failed to create booking hold');
    const err = new Error(errMsg);
    (err as any).code = res.error?.code;
    (err as any).details = res.error?.details;
    throw err;
  },

  /**
   * Retrieves authoritative pre-payment checkout summary for a HELD reservation.
   * Endpoint: GET /api/v1/bookings/{bookingReference}/checkout/?token={token}
   */
  async getCheckoutSummary(
    bookingReference: string,
    token?: string
  ): Promise<ApiCheckoutSummary> {
    const url = `/api/v1/bookings/${bookingReference}/checkout/${token ? `?token=${encodeURIComponent(token)}` : ''}`;
    const res = await fetchApi<ApiCheckoutSummary>(url);

    if (res.success && res.data) {
      return res.data;
    }
    const errMsg = res.error?.message || 'Failed to fetch checkout summary';
    const err = new Error(errMsg);
    (err as any).code = res.error?.code;
    (err as any).details = res.error?.details;
    throw err;
  },

  /**
   * Updates guest contact details and/or guest roster on a reservation.
   * Endpoint: PATCH /api/v1/bookings/{bookingReference}/guests/ or PATCH /api/v1/bookings/{bookingReference}/
   */
  async updateGuestDetails(
    bookingReference: string,
    guestData: {
      guest_name?: string;
      guest_phone?: string;
      guest_email?: string;
      special_requests?: string;
      guests?: ApiBookingGuest[];
    },
    token?: string
  ): Promise<ApiBookingDetail> {
    const url = `/api/v1/bookings/${bookingReference}/${token ? `?token=${encodeURIComponent(token)}` : ''}`;
    const res = await fetchApi<ApiBookingDetail>(url, {
      method: 'PATCH',
      body: JSON.stringify(guestData),
    });

    if (res.success && res.data) {
      return res.data;
    }
    const errMsg = res.error?.message || 'Failed to update guest details';
    const err = new Error(errMsg);
    (err as any).code = res.error?.code;
    (err as any).details = res.error?.details;
    throw err;
  },

  /**
   * Secure lookup of reservation details.
   * Endpoint: GET /api/v1/bookings/{bookingReference}/?token={token}
   */
  async getBookingDetail(
    bookingReference: string,
    token?: string
  ): Promise<ApiBookingDetail> {
    const url = `/api/v1/bookings/${bookingReference}/${token ? `?token=${encodeURIComponent(token)}` : ''}`;
    const res = await fetchApi<ApiBookingDetail>(url);

    if (res.success && res.data) {
      return res.data;
    }
    const errMsg = res.error?.message || 'Failed to load booking details';
    const err = new Error(errMsg);
    (err as any).code = res.error?.code;
    (err as any).details = res.error?.details;
    throw err;
  },

  /**
   * Explicitly releases a temporary hold, freeing category inventory immediately.
   * Endpoint: POST /api/v1/bookings/{bookingReference}/release/?token={token}
   */
  async releaseHold(bookingReference: string, token?: string): Promise<ApiBookingDetail> {
    const url = `/api/v1/bookings/${bookingReference}/release/${token ? `?token=${encodeURIComponent(token)}` : ''}`;
    const res = await fetchApi<ApiBookingDetail>(url, {
      method: 'POST',
    });

    if (res.success && res.data) {
      return res.data;
    }
    throw new Error(res.error?.message || 'Failed to release hold');
  },

  /**
   * Fetches customer's own reservations.
   * Endpoint: GET /api/v1/bookings/?status={status}&view={upcoming|past}
   */
  async getMyBookings(params?: { status?: string; view?: 'upcoming' | 'past' }): Promise<ApiBookingDetail[]> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.view) query.set('view', params.view);

    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await fetchApi<ApiBookingDetail[]>(`/api/v1/bookings/${qs}`);

    if (res.success && Array.isArray(res.data)) {
      return res.data;
    }
    throw new Error(res.error?.message || 'Failed to load bookings');
  },

  /**
   * Fetches real-time authoritative calculation of eligible refund and cancellation policy preview.
   * Endpoint: GET /api/v1/bookings/{bookingReference}/cancellation-preview/?token={token}
   */
  async getCancellationPreview(
    bookingReference: string,
    token?: string
  ): Promise<ApiCancellationPreview> {
    const url = `/api/v1/bookings/${bookingReference}/cancellation-preview/${token ? `?token=${encodeURIComponent(token)}` : ''}`;
    const res = await fetchApi<ApiCancellationPreview>(url);

    if (res.success && res.data) {
      return res.data;
    }
    throw new Error(res.error?.message || 'Failed to calculate cancellation refund');
  },

  /**
   * Submits a customer cancellation request with reason.
   * Endpoint: POST /api/v1/bookings/{bookingReference}/request-cancellation/?token={token}
   */
  async requestCancellation(
    bookingReference: string,
    payload: { reason: string; notes?: string },
    token?: string
  ): Promise<any> {
    const url = `/api/v1/bookings/${bookingReference}/request-cancellation/${token ? `?token=${encodeURIComponent(token)}` : ''}`;
    const res = await fetchApi<any>(url, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.success) {
      return res.data;
    }
    throw new Error(res.error?.message || 'Failed to submit cancellation request');
  },

  /**
   * Staff/Manager process cancellation decision with refund or rejection.
   * Endpoint: POST /api/v1/admin/bookings/{bookingReference}/process-cancellation/
   */
  async processCancellation(
    bookingReference: string,
    payload: { action: string; refund_mode?: string; manual_reference?: string; internal_notes?: string }
  ): Promise<any> {
    const res = await fetchApi<any>(`/api/v1/admin/bookings/${bookingReference}/process-cancellation/`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.success) {
      return res.data;
    }
    throw new Error(res.error?.message || 'Failed to process cancellation decision');
  },

  /**
   * Staff/Admin quick offline reservation entry (Walk-in, Phone, Reception).
   * Bypasses customer personal details requirement and immediately decreases available room inventory.
   * Endpoint: POST /api/v1/admin/bookings/walk-in/
   */
  async createQuickWalkInBooking(payload: {
    category_id?: string;
    category?: string;
    room_quantity: number;
    check_in: string;
    check_out: string;
    guest_name?: string;
    guest_phone?: string;
    guest_email?: string;
    source?: 'walk_in' | 'phone' | 'whatsapp' | 'reception' | 'corporate';
    internal_notes?: string;
    total_adults?: number;
    total_children?: number;
  }): Promise<any> {
    const res = await fetchApi<any>('/api/v1/admin/bookings/walk-in/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.success && res.data) {
      return res.data;
    }
    const errMsg =
      res.error?.message ||
      (typeof res.error === 'string' ? res.error : 'Failed to create offline walk-in booking');
    const err = new Error(errMsg);
    (err as any).code = res.error?.code;
    (err as any).details = res.error?.details;
    throw err;
  },
};
