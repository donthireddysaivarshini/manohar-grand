import { MultiRoomPriceCalculationParams, PriceBreakdown } from '../types/pricing';
import { calculateNights } from './dateUtils';

export const STANDARD_TAX_RATE_PERCENT = 5;
export const STANDARD_TAX_DISCLAIMER = 'GST (5%) applicable as per government regulations';

export function calculateBookingPrice(params: MultiRoomPriceCalculationParams): PriceBreakdown {
  const nights = calculateNights(params.checkIn, params.checkOut) || 1;
  
  const roomLines = params.selectedRooms
    .filter((room) => room.quantity > 0)
    .map((room) => {
      const lineSubtotal = room.ratePerNight * room.quantity * nights;
      return {
        categoryId: room.categoryId,
        categoryName: room.categoryName,
        quantity: room.quantity,
        ratePerNight: room.ratePerNight,
        nights,
        lineSubtotal,
      };
    });

  const totalRooms = roomLines.reduce((acc, curr) => acc + curr.quantity, 0);
  const subtotal = roomLines.reduce((acc, curr) => acc + curr.lineSubtotal, 0);
  const taxRatePercent = STANDARD_TAX_RATE_PERCENT;
  const taxAmount = Math.round((subtotal * taxRatePercent) / 100);
  const totalPayable = subtotal + taxAmount;

  return {
    nights,
    totalRooms,
    roomLines,
    subtotal,
    taxRatePercent,
    taxAmount,
    totalPayable,
    isDemoPricing: false,
    taxDisclaimer: STANDARD_TAX_DISCLAIMER,
  };
}
