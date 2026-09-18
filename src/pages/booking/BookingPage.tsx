import React, { useEffect, useState, useCallback } from 'react';
import { Calendar, ShieldAlert, Sparkles, CheckCircle2, BedDouble } from 'lucide-react';
import { Container } from '../../components/common/Container';
import { Section } from '../../components/common/Section';
import { Badge } from '../../components/common/Badge';
import { BookingSearchModifier } from '../../components/booking/BookingSearchModifier';
import { RoomSelectionCard } from '../../components/booking/RoomSelectionCard';
import { BookingSummaryCard } from '../../components/booking/BookingSummaryCard';
import { useBooking } from '../../store/BookingContext';
import { availabilityService } from '../../services';
import { CategoryAvailabilityResult } from '../../types/booking';

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

  // Fetch mock availability based on search parameters
  const loadAvailability = useCallback(async () => {
    setIsLoading(true);
    try {
      const results = await availabilityService.checkAvailability(searchParams);
      setAvailabilityResults(results);
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
              Customize your stay by selecting AC or Non-AC room combinations. Instant demo voucher confirmation.
            </p>
          </div>
        </Container>
      </Section>

      {/* Main Booking Body */}
      <Section variant="default" padding="lg">
        <Container size="xl">
          {/* 1. Modify Search Bar */}
          <BookingSearchModifier onSearchUpdate={loadAvailability} />

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
                      Available Room Categories
                    </h2>
                    <p className="text-xs text-neutral-secondary">
                      Confirmed hotel categories with date-based simulated availability
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
                      const selected = selectedRooms.find((r) => r.categoryId === avail.categoryId);
                      const qty = selected ? selected.quantity : 0;

                      return (
                        <RoomSelectionCard
                          key={avail.categoryId}
                          availability={avail}
                          currentQuantity={qty}
                          onQuantityChange={(newQty) => setRoomQuantity(avail.categoryId, newQty)}
                          nightsCount={nightsCount}
                        />
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Transparency Notice */}
              <div className="p-4 rounded-lg bg-white border border-neutral-border shadow-xs flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-feedback-warning shrink-0 mt-0.5" />
                <div className="text-xs text-neutral-secondary leading-relaxed">
                  <span className="font-bold text-neutral-dark">Demo Availability Notice: </span>
                  Total inventory counts (20 AC Rooms / 8 Non-AC Rooms) are confirmed. The dynamic night availability numbers and rates displayed are simulated for prototype verification.
                </div>
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
                    <span>Instant room confirmation voucher</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-feedback-success" />
                    <span>Flexible room adjustments before check-in</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-feedback-success" />
                    <span>Direct customer service support</span>
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
