import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ApiRoomCategory } from '../types/booking';
import { roomApiService } from '../services/api/roomApiService';

interface InventoryContextType {
  categories: ApiRoomCategory[];
  getCategoryById: (id: string) => ApiRoomCategory | undefined;
  getCategoryBySlug: (slug: string) => ApiRoomCategory | undefined;
  isLoading: boolean;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<ApiRoomCategory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    roomApiService
      .getCategories()
      .then((data) => setCategories(data))
      .catch((err) => console.warn('Could not load categories in InventoryProvider:', err))
      .finally(() => setIsLoading(false));
  }, []);

  const getCategoryById = (id: string) => {
    return categories.find((c) => c.id === id);
  };

  const getCategoryBySlug = (slug: string) => {
    return categories.find((c) => c.slug === slug);
  };

  return (
    <InventoryContext.Provider value={{ categories, getCategoryById, getCategoryBySlug, isLoading }}>
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
