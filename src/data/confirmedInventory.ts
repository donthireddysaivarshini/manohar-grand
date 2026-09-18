/**
 * CONFIRMED HOTEL INVENTORY
 * Only verified facts from hotel management are placed here.
 * Do not add unconfirmed rooms or change counts without official verification.
 */
export const CONFIRMED_HOTEL_INFO = {
  hotelName: 'Manohar Grand',
  totalRooms: 28,
  acRooms: 20,
  nonAcRooms: 8,
} as const;

export const CONFIRMED_ROOM_CATEGORIES = [
  {
    id: 'ac-room',
    slug: 'ac-room',
    name: 'AC Room',
    totalInventory: 20, // Confirmed
  },
  {
    id: 'non-ac-room',
    slug: 'non-ac-room',
    name: 'Non-AC Room',
    totalInventory: 8, // Confirmed
  },
] as const;
