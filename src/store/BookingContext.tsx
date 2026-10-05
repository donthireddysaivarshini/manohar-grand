import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  BookingSearchParams,
  SelectedRoomItem,
  ApiBookingDetail,
  ApiCheckoutSummary,
  ApiRoomCategory,
} from '../types/booking';
import { GuestDetails } from '../types/guest';
import { getTodayDateString, getFutureDateString, calculateNights } from '../utils/dateUtils';
import { bookingApiService } from '../services/api/bookingApiService';
import { roomApiService } from '../services/api/roomApiService';
import { getCategoryPrimaryImageUrl } from '../utils/mediaUtils';
import { useAuth } from './AuthContext';

interface BookingContextType {
  searchParams: BookingSearchParams;
  setSearchParams: (params: Partial<BookingSearchParams>) => void;
  selectedRooms: SelectedRoomItem[];
  setRoomQuantity: (
    categoryId: string,
    quantity: number,
    categoryInfo?: {
      categoryName: string;
      slug: string;
      ratePerNight: number;
      heroImage?: string;
      maxAdultsPerRoom?: number;
      maxTotalOccupancy?: number;
    }
  ) => void;
  clearSelectedRooms: () => void;
  selectedCategorySlug: string | null;
  setSelectedCategorySlug: (slug: string | null) => void;
  guestDetails: GuestDetails;
  setGuestDetails: (details: Partial<GuestDetails>) => void;
  totalSelectedRoomsCount: number;
  nightsCount: number;
  activeHold: ApiBookingDetail | null;
  setActiveHold: (hold: ApiBookingDetail | null) => void;
  checkoutSummary: ApiCheckoutSummary | null;
  setCheckoutSummary: (summary: ApiCheckoutSummary | null) => void;
  createHold: () => Promise<ApiBookingDetail>;
  fetchCheckoutSummary: (reference?: string, token?: string) => Promise<ApiCheckoutSummary>;
  updateGuestInfo: (guestData: {
    guest_name?: string;
    guest_phone?: string;
    guest_email?: string;
    special_requests?: string;
    guests?: any[];
  }) => Promise<ApiBookingDetail>;
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
  const { user } = useAuth();
  const [searchParams, setSearchParamsState] = useState<BookingSearchParams>(defaultSearchParams);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(null);
  const [guestDetails, setGuestDetailsState] = useState<GuestDetails>(defaultGuestDetails);
  const [selectedRooms, setSelectedRooms] = useState<SelectedRoomItem[]>([]);
  const [activeHold, setActiveHold] = useState<ApiBookingDetail | null>(null);
  const [checkoutSummary, setCheckoutSummary] = useState<ApiCheckoutSummary | null>(null);

  // Auto-fill guest details from authenticated user when available
  useEffect(() => {
    if (user) {
      setGuestDetailsState((prev) => ({
        ...prev,
        fullName: prev.fullName || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.name || '',
        email: prev.email || user.email || '',
        phone: prev.phone || user.phone || '',
      }));
    }
  }, [user]);

  // If a category slug was selected from Room Details, fetch category info and select 1 room
  useEffect(() => {
    if (selectedCategorySlug) {
      roomApiService
        .getCategories()
        .then((categories: ApiRoomCategory[]) => {
          const category = categories.find((c) => c.slug === selectedCategorySlug);
          if (category) {
            setSelectedRooms((prev) => {
              const exists = prev.find((r) => r.categoryId === category.id || r.slug === category.slug);
              if (exists) return prev;
              const rate = parseFloat(category.base_price_per_night) || 0;
              return [
                ...prev,
                {
                  categoryId: category.id,
                  categoryName: category.name,
                  slug: category.slug,
                  quantity: 1,
                  ratePerNight: rate,
                  heroImage: getCategoryPrimaryImageUrl(category),
                  maxAdultsPerRoom: category.max_adults,
                  maxTotalOccupancy: category.max_total_occupancy,
                },
              ];
            });
          }
        })
        .catch((err) => console.warn('Could not auto-select category from slug:', err));
    }
  }, [selectedCategorySlug]);

  const setSearchParams = (params: Partial<BookingSearchParams>) => {
    setSearchParamsState((prev) => ({ ...prev, ...params }));
  };

  const setGuestDetails = (details: Partial<GuestDetails>) => {
    setGuestDetailsState((prev) => ({ ...prev, ...details }));
  };

  const setRoomQuantity = (
    categoryId: string,
    quantity: number,
    categoryInfo?: {
      categoryName: string;
      slug: string;
      ratePerNight: number;
      heroImage?: string;
      maxAdultsPerRoom?: number;
      maxTotalOccupancy?: number;
    }
  ) => {
    setSelectedRooms((prev) => {
      if (quantity <= 0) {
        return prev.filter((r) => r.categoryId !== categoryId && r.slug !== categoryId);
      }

      const existingIndex = prev.findIndex(
        (r) => r.categoryId === categoryId || r.slug === categoryId
      );

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity,
          ...(categoryInfo && {
            categoryName: categoryInfo.categoryName,
            slug: categoryInfo.slug,
            ratePerNight: categoryInfo.ratePerNight,
            heroImage: categoryInfo.heroImage,
            maxAdultsPerRoom: categoryInfo.maxAdultsPerRoom,
          }),
        };
        return updated;
      } else if (categoryInfo) {
        return [
          ...prev,
          {
            categoryId,
            categoryName: categoryInfo.categoryName,
            slug: categoryInfo.slug,
            quantity,
            ratePerNight: categoryInfo.ratePerNight,
            heroImage: categoryInfo.heroImage,
            maxAdultsPerRoom: categoryInfo.maxAdultsPerRoom,
          },
        ];
      }
      return prev;
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

  /**
   * Authoritatively creates a 15-minute temporary reservation hold in Django.
   */
  const createHold = async (): Promise<ApiBookingDetail> => {
    if (selectedRooms.length === 0) {
      throw new Error('Please select at least one room category to reserve.');
    }

    const leadName =
      guestDetails.fullName ||
      (user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email : '') ||
      'Guest';

    const payload = {
      check_in: searchParams.checkIn,
      check_out: searchParams.checkOut,
      rooms: selectedRooms.map((r) => ({
        category_id: r.categoryId,
        room_quantity: r.quantity,
      })),
      guest_name: leadName,
      guest_phone: guestDetails.phone || user?.phone || '',
      guest_email: guestDetails.email || user?.email || '',
      total_adults: searchParams.adults,
      total_children: searchParams.children,
      special_requests: guestDetails.specialRequests || '',
      source: 'website',
    };

    const holdBooking = await bookingApiService.createHold(payload);
    setActiveHold(holdBooking);
    return holdBooking;
  };

  /**
   * Fetches authoritative pre-payment summary from Django.
   */
  const fetchCheckoutSummary = async (
    reference?: string,
    token?: string
  ): Promise<ApiCheckoutSummary> => {
    const targetRef = reference || activeHold?.booking_reference;
    if (!targetRef) {
      throw new Error('No active booking reference found to load checkout.');
    }
    const summary = await bookingApiService.getCheckoutSummary(
      targetRef,
      token || activeHold?.access_token
    );
    setCheckoutSummary(summary);
    return summary;
  };

  /**
   * Updates guest details on the active reservation.
   */
  const updateGuestInfo = async (guestData: {
    guest_name?: string;
    guest_phone?: string;
    guest_email?: string;
    special_requests?: string;
    guests?: any[];
  }): Promise<ApiBookingDetail> => {
    const targetRef = activeHold?.booking_reference || checkoutSummary?.booking_reference;
    if (!targetRef) {
      throw new Error('No active reservation to update guest details.');
    }
    const updated = await bookingApiService.updateGuestDetails(
      targetRef,
      guestData,
      activeHold?.access_token
    );
    setActiveHold(updated);
    if (guestData.guest_name || guestData.guest_email || guestData.guest_phone) {
      setGuestDetailsState((prev) => ({
        ...prev,
        ...(guestData.guest_name && { fullName: guestData.guest_name }),
        ...(guestData.guest_email && { email: guestData.guest_email }),
        ...(guestData.guest_phone && { phone: guestData.guest_phone }),
        ...(guestData.special_requests !== undefined && {
          specialRequests: guestData.special_requests,
        }),
      }));
    }
    return updated;
  };

  const resetBookingFlow = () => {
    setSearchParamsState(defaultSearchParams);
    setSelectedCategorySlug(null);
    setGuestDetailsState(defaultGuestDetails);
    setSelectedRooms([]);
    setActiveHold(null);
    setCheckoutSummary(null);
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
        totalSelectedRoomsCount,
        nightsCount,
        activeHold,
        setActiveHold,
        checkoutSummary,
        setCheckoutSummary,
        createHold,
        fetchCheckoutSummary,
        updateGuestInfo,
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
