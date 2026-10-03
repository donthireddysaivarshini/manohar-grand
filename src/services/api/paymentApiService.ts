import { fetchApi } from '../apiClient';
import {
  ApiPaymentOrderResponse,
  ApiPaymentVerifyPayload,
  ApiPaymentVerifyResponse,
} from '../../types/booking';

export const paymentApiService = {
  /**
   * Creates an authoritative Razorpay advance payment order for a HELD booking.
   * Endpoint: POST /api/v1/payments/orders/
   */
  async createPaymentOrder(
    bookingReference: string,
    idempotencyKey?: string
  ): Promise<ApiPaymentOrderResponse> {
    const res = await fetchApi<ApiPaymentOrderResponse>('/api/v1/payments/orders/', {
      method: 'POST',
      body: JSON.stringify({
        booking_reference: bookingReference,
        idempotency_key: idempotencyKey || `fe_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      }),
    });

    if (res.success && res.data) {
      return res.data;
    }
    const errMsg = res.error?.message || 'Failed to create payment order';
    const err = new Error(errMsg);
    (err as any).code = res.error?.code;
    (err as any).details = res.error?.details;
    throw err;
  },

  /**
   * Cryptographically verifies Razorpay checkout signatures and confirms reservation.
   * Endpoint: POST /api/v1/payments/verify/
   */
  async verifyPayment(payload: ApiPaymentVerifyPayload): Promise<ApiPaymentVerifyResponse> {
    const res = await fetchApi<ApiPaymentVerifyResponse>('/api/v1/payments/verify/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.success && res.data) {
      return res.data;
    }
    const errMsg = res.error?.message || 'Payment verification failed';
    const err = new Error(errMsg);
    (err as any).code = res.error?.code;
    (err as any).details = res.error?.details;
    throw err;
  },
};
