export interface RoomCategoryPriceLine {
  categoryId: string;
  categoryName: string;
  quantity: number;
  ratePerNight: number;
  nights: number;
  lineSubtotal: number;
}

export interface PriceBreakdown {
  nights: number;
  totalRooms: number;
  roomLines: RoomCategoryPriceLine[];
  subtotal: number;
  taxRatePercent: number; // Configurable demo tax rate
  taxAmount: number;
  totalPayable: number;
  isDemoPricing: boolean;
  taxDisclaimer: string;
}

export interface MultiRoomPriceCalculationParams {
  selectedRooms: {
    categoryId: string;
    categoryName: string;
    quantity: number;
    ratePerNight: number;
  }[];
  checkIn: string;
  checkOut: string;
}
