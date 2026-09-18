import { MultiRoomPriceCalculationParams, PriceBreakdown } from '../types/pricing';
import { DEMO_PRICING_CONFIG } from '../data/demoPricingConfig';
import { calculateNights } from './dateUtils';

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
  const taxRatePercent = DEMO_PRICING_CONFIG.taxRatePercent;
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
    isDemoPricing: DEMO_PRICING_CONFIG.isDemoPricing,
    taxDisclaimer: DEMO_PRICING_CONFIG.taxDisclaimer,
  };
}
