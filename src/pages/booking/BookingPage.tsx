import React, { useEffect, useState, useCallback } from 'react';
import { Calendar, Sparkles, CheckCircle2, BedDouble, AlertCircle } from 'lucide-react';
import { Container } from '../../components/common/Container';
import { Section } from '../../components/common/Section';
import { Badge } from '../../components/common/Badge';
import { BookingSearchModifier } from '../../components/booking/BookingSearchModifier';
import { RoomSelectionCard } from '../../components/booking/RoomSelectionCard';
import { BookingSummaryCard } from '../../components/booking/BookingSummaryCard';
import { useBooking } from '../../store/BookingContext';
import { availabilityApiService } from '../../services/api/availabilityApiService';
import { roomApiService } from '../../services/api/roomApiService';
import { CategoryAvailabilityResult, ApiRoomCategory } from '../../types/booking';

export const BookingPage: React.FC = () => {
  const {
    searchParams,
    selectedRooms,
    setRoomQuantity,
    totalSelectedRoomsCount,
    nightsCount,
  } = useBooking();

  const [availabilityResults, setAvailabilityResults] = useState<CategoryAvailabilityResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Fetch real backend availability and category metadata
  const loadAvailability = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const [availRes, roomCats] = await Promise.all([
        availabilityApiService.checkAvailability(searchParams),
        roomApiService.getCategories().catch(() => [] as ApiRoomCategory[]),
      ]);

      const catMap: Record<string, ApiRoomCategory> = {};
      roomCats.forEach((c) => {
        catMap[c.id] = c;
        catMap[c.slug] = c;
      });

      const transformed: CategoryAvailabilityResult[] = (availRes.categories || []).map((cat) => {
        const meta = catMap[cat.category_id] || catMap[cat.category_slug];
        const baseRate = meta ? parseFloat(meta.base_price_per_night) || 0 : 0;
        return {
          categoryId: cat.category_id,
          categoryName: cat.category_name,
          slug: cat.category_slug,
          totalInventory: cat.total_operational_capacity,
          availableQuantity: cat.minimum_available_rooms,
          isAvailable: cat.is_available,
          ratePerNight: baseRate,
          maxAdultsPerRoom: meta?.max_adults || meta?.max_total_occupancy || 2,
          maxTotalOccupancy: meta?.max_total_occupancy || 2,
          primaryImage: meta?.primary_image || (meta?.images && meta.images[0]?.image_url),
          description: meta?.description,
        };
      });

      setAvailabilityResults(transformed);
    } catch (err: any) {
      console.error('Availability fetch failed:', err);
      setApiError(err?.message || 'Failed to load live availability from server.');
    } finally {
      setIsLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    document.title = 'Book Your Stay | Manohar Grand Hotel';
    loadAvailability();
  }, [loadAvailability]);

  // Target rooms vs selected rooms comparison
  const requestedRooms = searchParams.rooms;
  const isTargetMatched = totalSelectedRoomsCount === requestedRooms;

  return (
    <div className="flex flex-col w-full">
      {/* Page Header */}
      <Section variant="dark" padding="md" className="border-b border-neutral-800">
        <Container size="xl">
          <div className="max-w-2xl flex flex-col items-start gap-3">
            <Badge variant="brand" size="md" className="gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Direct Reservation
            </Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
              Select Your Rooms
            </h1>
            <p className="text-sm sm:text-base text-neutral-300 leading-relaxed">
              Check real-time availability for AC and Non-AC rooms with guaranteed direct booking rates and instant confirmation.
            </p>
          </div>
        </Container>
      </Section>

      {/* Main Booking Body */}
      <Section variant="default" padding="lg">
        <Container size="xl">
          {/* 1. Modify Search Bar */}
          <BookingSearchModifier onSearchUpdate={loadAvailability} />

          {/* API Error Notice */}
          {apiError && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Unable to check live availability: </span>
                {apiError}
              </div>
            </div>
          )}

          {/* 2-Column Responsive Layout (Rooms Selection on Left, Sticky Summary on Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Room Categories & Quantity Selection (8 cols) */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              {/* Target Room Guidance Notice */}
              <div className="p-4 rounded-lg bg-white border border-neutral-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-neutral-light border border-neutral-border flex items-center justify-center shrink-0">
                    <BedDouble className="w-5 h-5 text-brand" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-neutral-dark block">
                      Requested: {requestedRooms} {requestedRooms === 1 ? 'Room' : 'Rooms'} • Currently Selected: {totalSelectedRoomsCount} {totalSelectedRoomsCount === 1 ? 'Room' : 'Rooms'}
                    </span>
                    <span className="text-[11px] text-neutral-secondary">
                      {isTargetMatched
                        ? 'Target room requirement satisfied.'
                        : totalSelectedRoomsCount < requestedRooms
                        ? `Please select ${requestedRooms - totalSelectedRoomsCount} more room(s) to match your search.`
                        : `You have selected ${totalSelectedRoomsCount} rooms.`}
                    </span>
                  </div>
                </div>

                {isTargetMatched && (
                  <Badge variant="success" size="sm" className="font-bold shrink-0">
                    Target Matched
                  </Badge>
                )}
              </div>

              {/* Room Categories List */}
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-neutral-dark">
                      Available Accommodations
                    </h2>
                    <p className="text-xs text-neutral-secondary">
                      Real-time inventory from Manohar Grand property management
                    </p>
                  </div>

                  <span className="text-xs font-semibold text-neutral-dark">
                    Stay Duration: <strong className="text-brand">{nightsCount} {nightsCount === 1 ? 'Night' : 'Nights'}</strong>
                  </span>
                </div>

                {isLoading ? (
                  <div className="flex flex-col gap-4">
                    <div className="h-48 rounded-card bg-neutral-200 animate-pulse" />
                    <div className="h-48 rounded-card bg-neutral-200 animate-pulse" />
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">
                    {availabilityResults.map((avail) => {
                      const selected = selectedRooms.find(
                        (r) => r.categoryId === avail.categoryId || r.slug === avail.slug
                      );
                      const qty = selected ? selected.quantity : 0;

                      return (
                        <RoomSelectionCard
                          key={avail.categoryId}
                          availability={avail}
                          currentQuantity={qty}
                          onQuantityChange={(newQty) =>
                            setRoomQuantity(avail.categoryId, newQty, {
                              categoryName: avail.categoryName,
                              slug: avail.slug,
                              ratePerNight: avail.ratePerNight,
                              heroImage: avail.primaryImage,
                              maxAdultsPerRoom: avail.maxAdultsPerRoom,
                              maxTotalOccupancy: avail.maxTotalOccupancy,
                            })
                          }
                          nightsCount={nightsCount}
                        />
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Direct Booking Inclusions Card */}
              <div className="p-5 rounded-lg bg-neutral-light border border-neutral-border flex flex-col gap-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-dark">
                  <Sparkles className="w-4 h-4 text-brand" />
                  <span>Direct Booking Advantages</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-neutral-secondary">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-feedback-success" />
                    <span>No hidden middleman booking fees</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-feedback-success" />
                    <span>Instant 15-minute reservation hold lock</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-feedback-success" />
                    <span>Premium Wakefit memory foam mattresses in all rooms</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-feedback-success" />
                    <span>Direct 24/7 reception desk support</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Sticky Booking Summary (4 cols) */}
            <div className="lg:col-span-4">
              <BookingSummaryCard />
            </div>
          </div>
        </Container>
      </Section>
    </div>
  );
};
