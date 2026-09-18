import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { BookingSearchParams, SelectedRoomItem } from '../types/booking';
import { GuestDetails } from '../types/guest';
import { PriceBreakdown } from '../types/pricing';
import { BookingSnapshot, PaymentSimulationMethod, PaymentSimulationStatus } from '../types/checkout';
import { ROOM_CATEGORIES_DATA } from '../data/roomCategories';
import { calculateBookingPrice } from '../utils/priceCalculators';
import { getTodayDateString, getFutureDateString, calculateNights } from '../utils/dateUtils';
import { paymentService } from '../services';

interface BookingContextType {
  searchParams: BookingSearchParams;
  setSearchParams: (params: Partial<BookingSearchParams>) => void;
  selectedRooms: SelectedRoomItem[];
  setRoomQuantity: (categoryId: string, quantity: number) => void;
  clearSelectedRooms: () => void;
  selectedCategorySlug: string | null;
  setSelectedCategorySlug: (slug: string | null) => void;
  guestDetails: GuestDetails;
  setGuestDetails: (details: Partial<GuestDetails>) => void;
  priceBreakdown: PriceBreakdown;
  totalSelectedRoomsCount: number;
  nightsCount: number;
  currentSnapshot: BookingSnapshot | null;
  createBookingSnapshot: (method?: PaymentSimulationMethod) => BookingSnapshot;
  updateSnapshotPayment: (
    status: PaymentSimulationStatus,
    transactionId: string,
    method: PaymentSimulationMethod
  ) => Promise<BookingSnapshot | null>;
  resetBookingFlow: () => void;
}

const defaultSearchParams: BookingSearchParams = {
  checkIn: getTodayDateString(),
  checkOut: getFutureDateString(1),
  rooms: 1,
  adults: 2,
  children: 0,
};

const defaultGuestDetails: GuestDetails = {
  fullName: '',
  email: '',
  phone: '',
  specialRequests: '',
};

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [searchParams, setSearchParamsState] = useState<BookingSearchParams>(defaultSearchParams);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(null);
  const [guestDetails, setGuestDetailsState] = useState<GuestDetails>(defaultGuestDetails);
  const [selectedRooms, setSelectedRooms] = useState<SelectedRoomItem[]>([]);
  const [currentSnapshot, setCurrentSnapshot] = useState<BookingSnapshot | null>(null);

  // If a category slug was selected from Room Details / Cards, auto-select 1 room of that category
  useEffect(() => {
    if (selectedCategorySlug) {
      const category = ROOM_CATEGORIES_DATA.find((c) => c.slug === selectedCategorySlug);
      if (category) {
        setSelectedRooms((prev) => {
          const exists = prev.find((r) => r.categoryId === category.id);
          if (exists) return prev;
          return [
            ...prev,
            {
              categoryId: category.id,
              categoryName: category.name,
              slug: category.slug,
              quantity: 1,
              ratePerNight: category.demoBasePricePerNight,
              heroImage: category.demoImages.hero,
              maxAdultsPerRoom: category.demoCapacity.maxAdults,
            },
          ];
        });
      }
    }
  }, [selectedCategorySlug]);

  const setSearchParams = (params: Partial<BookingSearchParams>) => {
    setSearchParamsState((prev) => ({ ...prev, ...params }));
  };

  const setGuestDetails = (details: Partial<GuestDetails>) => {
    setGuestDetailsState((prev) => ({ ...prev, ...details }));
  };

  const setRoomQuantity = (categoryId: string, quantity: number) => {
    const category = ROOM_CATEGORIES_DATA.find((c) => c.id === categoryId);
    if (!category) return;

    setSelectedRooms((prev) => {
      if (quantity <= 0) {
        return prev.filter((r) => r.categoryId !== categoryId);
      }

      const existingIndex = prev.findIndex((r) => r.categoryId === categoryId);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity,
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            categoryId: category.id,
            categoryName: category.name,
            slug: category.slug,
            quantity,
            ratePerNight: category.demoBasePricePerNight,
            heroImage: category.demoImages.hero,
            maxAdultsPerRoom: category.demoCapacity.maxAdults,
          },
        ];
      }
    });
  };

  const clearSelectedRooms = () => {
    setSelectedRooms([]);
    setSelectedCategorySlug(null);
  };

  const nightsCount = useMemo(() => {
    return calculateNights(searchParams.checkIn, searchParams.checkOut) || 1;
  }, [searchParams.checkIn, searchParams.checkOut]);

  const totalSelectedRoomsCount = useMemo(() => {
    return selectedRooms.reduce((acc, curr) => acc + curr.quantity, 0);
  }, [selectedRooms]);

  const priceBreakdown = useMemo(() => {
    return calculateBookingPrice({
      selectedRooms,
      checkIn: searchParams.checkIn,
      checkOut: searchParams.checkOut,
    });
  }, [selectedRooms, searchParams.checkIn, searchParams.checkOut]);

  const createBookingSnapshot = (method: PaymentSimulationMethod = 'card'): BookingSnapshot => {
    // Generate demo reference in format MG-DEMO-XXXXXX
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const bookingReference = `MG-DEMO-${randomSuffix}`;

    const snapshot: BookingSnapshot = {
      bookingReference,
      createdAt: new Date().toISOString(),
      stay: {
        checkIn: searchParams.checkIn,
        checkOut: searchParams.checkOut,
        nights: nightsCount,
      },
      occupancy: {
        adults: searchParams.adults,
        children: searchParams.children,
        rooms: totalSelectedRoomsCount || searchParams.rooms,
      },
      selectedRooms: [...selectedRooms],
      pricing: { ...priceBreakdown },
      guest: { ...guestDetails },
      payment: {
        method,
        status: 'pending',
        transactionId: `txn_init_${randomSuffix}`,
        isSimulation: true,
      },
      isDemoRecord: true,
    };

    setCurrentSnapshot(snapshot);
    paymentService.saveBookingSnapshot(snapshot);
    return snapshot;
  };

  const updateSnapshotPayment = async (
    status: PaymentSimulationStatus,
    transactionId: string,
    method: PaymentSimulationMethod
  ): Promise<BookingSnapshot | null> => {
    if (!currentSnapshot) return null;

    const updated: BookingSnapshot = {
      ...currentSnapshot,
      payment: {
        method,
        status,
        transactionId,
        paidAt: status === 'success' ? new Date().toISOString() : undefined,
        isSimulation: true,
      },
    };

    setCurrentSnapshot(updated);
    await paymentService.saveBookingSnapshot(updated);
    return updated;
  };

  const resetBookingFlow = () => {
    setSearchParamsState(defaultSearchParams);
    setSelectedCategorySlug(null);
    setGuestDetailsState(defaultGuestDetails);
    setSelectedRooms([]);
    setCurrentSnapshot(null);
  };

  return (
    <BookingContext.Provider
      value={{
        searchParams,
        setSearchParams,
        selectedRooms,
        setRoomQuantity,
        clearSelectedRooms,
        selectedCategorySlug,
        setSelectedCategorySlug,
        guestDetails,
        setGuestDetails,
        priceBreakdown,
        totalSelectedRoomsCount,
        nightsCount,
        currentSnapshot,
        createBookingSnapshot,
        updateSnapshotPayment,
        resetBookingFlow,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = (): BookingContextType => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};
