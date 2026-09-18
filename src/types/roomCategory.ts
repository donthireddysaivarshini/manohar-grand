export interface RoomCategory {
  id: string; // 'ac-room' | 'non-ac-room'
  slug: string;
  name: string; // 'AC Room' | 'Non-AC Room'
  totalInventory: number; // CONFIRMED: 20 for AC, 8 for Non-AC
  
  // Demo / Placeholder fields
  demoBasePricePerNight: number;
  demoCapacity: {
    maxAdults: number;
    maxChildren: number;
  };
  demoBedType: string;
  demoSizeSqFt: string;
  demoAmenities: string[];
  demoImages: {
    hero: string;
    gallery: string[];
  };
  isPlaceholderData: boolean;
}

export interface CategoryAvailability {
  categoryId: string;
  categoryName: string;
  totalInventory: number;
  availableRooms: number;
  isAvailable: boolean;
  pricePerNight: number;
}
