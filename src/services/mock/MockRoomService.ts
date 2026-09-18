import { IRoomService } from '../contracts/IRoomService';
import { RoomCategory } from '../../types/roomCategory';
import { INITIAL_ROOM_CATEGORIES } from '../../data/roomCategories';

export class MockRoomService implements IRoomService {
  async getCategories(): Promise<RoomCategory[]> {
    return Promise.resolve([...INITIAL_ROOM_CATEGORIES]);
  }

  async getCategoryBySlug(slug: string): Promise<RoomCategory | null> {
    const category = INITIAL_ROOM_CATEGORIES.find((c) => c.slug === slug);
    return Promise.resolve(category ? { ...category } : null);
  }
}
