import { IRoomService } from '../contracts/IRoomService';
import { RoomCategory } from '../../types/roomCategory';
import { CONFIRMED_ROOM_CATEGORIES } from '../../data/confirmedInventory';

const MOCK_CATEGORIES: RoomCategory[] = CONFIRMED_ROOM_CATEGORIES.map((cat) => ({
  id: cat.id,
  slug: cat.slug,
  name: cat.name,
  totalInventory: cat.totalInventory,
  demoBasePricePerNight: cat.id === 'ac-room' ? 2499 : 1799,
  demoCapacity: {
    maxAdults: 2,
    maxChildren: 2,
  },
  demoBedType: 'WAKEFIT Memory Foam Double Bed',
  demoSizeSqFt: cat.id === 'ac-room' ? '240 sq ft' : '200 sq ft',
  demoAmenities: ['WAKEFIT Mattress', '32" Smart TV', 'Attached Bath', 'Car Parking'],
  demoImages: {
    hero: '',
    gallery: [],
  },
  isPlaceholderData: false,
}));

export class MockRoomService implements IRoomService {
  async getCategories(): Promise<RoomCategory[]> {
    return Promise.resolve([...MOCK_CATEGORIES]);
  }

  async getCategoryBySlug(slug: string): Promise<RoomCategory | null> {
    const category = MOCK_CATEGORIES.find((c) => c.slug === slug);
    return Promise.resolve(category ? { ...category } : null);
  }
}
