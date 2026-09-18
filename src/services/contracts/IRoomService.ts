import { RoomCategory } from '../../types/roomCategory';

export interface IRoomService {
  getCategories(): Promise<RoomCategory[]>;
  getCategoryBySlug(slug: string): Promise<RoomCategory | null>;
}
