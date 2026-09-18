import { BookingSnapshot, PaymentIntent, PaymentSimulationMethod, PaymentSimulationStatus } from '../../types/checkout';

export interface IPaymentService {
  createPaymentIntent(bookingSnapshot: BookingSnapshot): Promise<PaymentIntent>;
  processDemoPayment(
    intentId: string,
    method: PaymentSimulationMethod,
    simulateOutcome: 'success' | 'failed' | 'cancelled'
  ): Promise<{
    status: PaymentSimulationStatus;
    transactionId: string;
    message: string;
  }>;
  getBookingSnapshot(bookingReference: string): Promise<BookingSnapshot | null>;
  saveBookingSnapshot(snapshot: BookingSnapshot): Promise<void>;
}
