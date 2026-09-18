import { IRoomService } from './contracts/IRoomService';
import { IAvailabilityService } from './contracts/IAvailabilityService';
import { IBookingService } from './contracts/IBookingService';
import { IAuthService } from './contracts/IAuthService';
import { IPaymentService } from './contracts/IPaymentService';

import { MockRoomService } from './mock/MockRoomService';
import { MockAvailabilityService } from './mock/MockAvailabilityService';
import { MockBookingService } from './mock/MockBookingService';
import { MockAuthService } from './mock/MockAuthService';
import { MockPaymentService } from './mock/MockPaymentService';

// Export instances that can later be swapped for real Django API services
export const roomService: IRoomService = new MockRoomService();
export const availabilityService: IAvailabilityService = new MockAvailabilityService();
export const bookingService: IBookingService = new MockBookingService();
export const authService: IAuthService = new MockAuthService();
export const paymentService: IPaymentService = new MockPaymentService();

export * from './contracts/IRoomService';
export * from './contracts/IAvailabilityService';
export * from './contracts/IBookingService';
export * from './contracts/IAuthService';
export * from './contracts/IPaymentService';
