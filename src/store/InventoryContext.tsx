import React, { createContext, useContext, useState, ReactNode } from 'react';
import { RoomCategory } from '../types/roomCategory';
import { INITIAL_ROOM_CATEGORIES } from '../data/roomCategories';

interface InventoryContextType {
  categories: RoomCategory[];
  getCategoryById: (id: string) => RoomCategory | undefined;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [categories] = useState<RoomCategory[]>(INITIAL_ROOM_CATEGORIES);

  const getCategoryById = (id: string) => {
    return categories.find((c) => c.id === id);
  };

  return (
    <InventoryContext.Provider value={{ categories, getCategoryById }}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = (): InventoryContextType => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
