import { IPaymentService } from '../contracts/IPaymentService';
import { BookingSnapshot, PaymentIntent, PaymentSimulationMethod, PaymentSimulationStatus } from '../../types/checkout';

// In-memory demo snapshots registry
const demoSnapshotsStore = new Map<string, BookingSnapshot>();

export class MockPaymentService implements IPaymentService {
  async createPaymentIntent(bookingSnapshot: BookingSnapshot): Promise<PaymentIntent> {
    const intent: PaymentIntent = {
      intentId: `pi_demo_${Date.now()}`,
      bookingReference: bookingSnapshot.bookingReference,
      amount: bookingSnapshot.pricing.totalPayable,
      currency: 'INR',
      isDemo: true,
    };
    return Promise.resolve(intent);
  }

  async processDemoPayment(
    _intentId: string,
    _method: PaymentSimulationMethod,
    simulateOutcome: 'success' | 'failed' | 'cancelled'
  ): Promise<{
    status: PaymentSimulationStatus;
    transactionId: string;
    message: string;
  }> {
    const transactionId = `txn_demo_${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    if (simulateOutcome === 'success') {
      return Promise.resolve({
        status: 'success',
        transactionId,
        message: 'Demo payment simulated successfully. No actual funds transferred.',
      });
    } else if (simulateOutcome === 'failed') {
      return Promise.resolve({
        status: 'failed',
        transactionId,
        message: 'Demo payment simulation failed (Simulated card/bank decline). Please retry with another method.',
      });
    } else {
      return Promise.resolve({
        status: 'cancelled',
        transactionId,
        message: 'Demo payment simulation was cancelled by user.',
      });
    }
  }

  async getBookingSnapshot(bookingReference: string): Promise<BookingSnapshot | null> {
    const snapshot = demoSnapshotsStore.get(bookingReference);
    return Promise.resolve(snapshot ? { ...snapshot } : null);
  }

  async saveBookingSnapshot(snapshot: BookingSnapshot): Promise<void> {
    demoSnapshotsStore.set(snapshot.bookingReference, { ...snapshot });
    return Promise.resolve();
  }
}
