import { SelectedRoomItem } from './booking';
import { GuestDetails } from './guest';
import { PriceBreakdown } from './pricing';

export type PaymentSimulationStatus = 'idle' | 'pending' | 'processing' | 'success' | 'failed' | 'cancelled';
export type PaymentSimulationMethod = 'card' | 'upi' | 'pay_at_hotel';

export interface BookingSnapshot {
  bookingReference: string; // e.g. "MG-DEMO-982134"
  createdAt: string;
  stay: {
    checkIn: string;
    checkOut: string;
    nights: number;
  };
  occupancy: {
    adults: number;
    children: number;
    rooms: number;
  };
  selectedRooms: SelectedRoomItem[];
  pricing: PriceBreakdown;
  guest: GuestDetails;
  payment: {
    method: PaymentSimulationMethod;
    status: PaymentSimulationStatus;
    transactionId: string;
    paidAt?: string;
    isSimulation: boolean;
  };
  isDemoRecord: boolean;
}

export interface PaymentIntent {
  intentId: string;
  bookingReference: string;
  amount: number;
  currency: string;
  isDemo: boolean;
}
