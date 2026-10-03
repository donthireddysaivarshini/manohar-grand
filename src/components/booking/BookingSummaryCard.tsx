import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  CheckCircle2,
  Trash2,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  Loader2,
  LogIn,
} from 'lucide-react';
import { Card, CardContent } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { useBooking } from '../../store/BookingContext';
import { useAuth } from '../../store/AuthContext';
import { formatDateDisplay } from '../../utils/dateUtils';
import { formatCurrencyINR } from '../../utils/formatters';

export const BookingSummaryCard: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const {
    searchParams,
    selectedRooms,
    setRoomQuantity,
    clearSelectedRooms,
    totalSelectedRoomsCount,
    nightsCount,
    createHold,
  } = useBooking();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const totalGuests = searchParams.adults + searchParams.children;
  const isRoomSelected = totalSelectedRoomsCount > 0;

  // Compute estimated room subtotal for summary preview (authoritative totals will be rendered from server snapshot at checkout)
  const estimatedRoomSubtotal = selectedRooms.reduce(
    (acc, curr) => acc + curr.ratePerNight * curr.quantity * nightsCount,
    0
  );
  const estimatedTax = Math.round(estimatedRoomSubtotal * 0.05);
  const estimatedGross = estimatedRoomSubtotal + estimatedTax;

  const handleContinue = async () => {
    if (!isRoomSelected) return;
    setErrorMessage(null);

    // Authentication Gate
    if (!isAuthenticated) {
      // Save intention and navigate to login
      navigate('/account/login?redirect=/booking');
      return;
    }

    setIsLoading(true);
    try {
      const hold = await createHold();
      if (hold && hold.booking_reference) {
        navigate('/checkout');
      }
    } catch (err: any) {
      console.error('Failed to create hold:', err);
      setErrorMessage(
        err?.message ||
          'Unable to reserve rooms. Another guest may have just reserved this category. Please refresh and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card variant="elevated" className="bg-white border-neutral-border p-6 shadow-elevated sticky top-24">
      <CardContent className="p-0 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-border">
          <div>
            <h3 className="text-lg font-bold text-neutral-dark">Reservation Summary</h3>
            <span className="text-xs text-neutral-secondary">Manohar Grand Direct Booking</span>
          </div>
          <Badge variant="brand" size="sm" className="font-bold">
            Live Rates
          </Badge>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
            <div className="leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {/* Stay Dates Overview */}
        <div className="flex flex-col gap-2 p-3.5 rounded-lg bg-neutral-light border border-neutral-border text-xs">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase font-bold text-neutral-secondary tracking-wider">
                Check-In
              </span>
              <span className="font-bold text-neutral-dark">
                {formatDateDisplay(searchParams.checkIn)}
              </span>
              <span className="text-[10px] text-neutral-500">From 12:00 PM</span>
            </div>

            <div className="text-center px-2 py-1 rounded bg-white border border-neutral-border font-bold text-brand">
              {nightsCount} {nightsCount === 1 ? 'Night' : 'Nights'}
            </div>

            <div className="flex flex-col gap-0.5 text-right">
              <span className="text-[10px] uppercase font-bold text-neutral-secondary tracking-wider">
                Check-Out
              </span>
              <span className="font-bold text-neutral-dark">
                {formatDateDisplay(searchParams.checkOut)}
              </span>
              <span className="text-[10px] text-neutral-500">Until 11:00 AM</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-neutral-border/60 text-neutral-secondary font-medium">
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-brand" />
              {totalGuests} {totalGuests === 1 ? 'Guest' : 'Guests'} ({searchParams.adults}A, {searchParams.children}C)
            </span>
            <span className="flex items-center gap-1.5 font-bold text-neutral-dark">
              {totalSelectedRoomsCount} of {searchParams.rooms} {searchParams.rooms === 1 ? 'Room' : 'Rooms'} Selected
            </span>
          </div>
        </div>

        {/* Itemized Selected Rooms List */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-dark">
              Selected Rooms
            </span>
            {isRoomSelected && (
              <button
                type="button"
                onClick={clearSelectedRooms}
                className="text-[11px] text-neutral-secondary hover:text-feedback-error transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                Clear
              </button>
            )}
          </div>

          {!isRoomSelected ? (
            <div className="p-4 rounded-lg bg-neutral-50 border border-dashed border-neutral-300 text-center flex flex-col items-center gap-2">
              <AlertCircle className="w-5 h-5 text-neutral-400" />
              <p className="text-xs text-neutral-secondary">
                Please select at least 1 room category from the available options to proceed.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {selectedRooms.map((room) => {
                const lineTotal = room.ratePerNight * room.quantity * nightsCount;
                return (
                  <div
                    key={room.categoryId}
                    className="p-3 rounded-lg bg-neutral-light/70 border border-neutral-border/80 flex items-center justify-between text-xs"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-neutral-dark">
                        {room.quantity} × {room.categoryName}
                      </span>
                      <span className="text-[11px] text-neutral-secondary">
                        {formatCurrencyINR(room.ratePerNight)} × {nightsCount} {nightsCount === 1 ? 'night' : 'nights'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-neutral-dark">
                        {formatCurrencyINR(lineTotal)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setRoomQuantity(room.categoryId, 0)}
                        title="Remove category"
                        aria-label={`Remove ${room.categoryName}`}
                        className="text-neutral-400 hover:text-feedback-error p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Estimated Pricing Calculation Breakdown */}
        {isRoomSelected && (
          <div className="flex flex-col gap-2 pt-3 border-t border-neutral-border text-xs">
            <div className="flex items-center justify-between text-neutral-secondary">
              <span>Room Subtotal</span>
              <span className="font-semibold text-neutral-dark">
                {formatCurrencyINR(estimatedRoomSubtotal)}
              </span>
            </div>

            <div className="flex items-center justify-between text-neutral-secondary">
              <span className="flex items-center gap-1">
                <span>Estimated Taxes (GST 5%)</span>
              </span>
              <span className="font-semibold text-neutral-dark">
                {formatCurrencyINR(estimatedTax)}
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-2 border-t border-neutral-border/80">
              <div>
                <span className="text-sm font-extrabold text-neutral-dark block">
                  Estimated Total
                </span>
                <span className="text-[10px] text-neutral-500">50% Advance payable at checkout</span>
              </div>
              <span className="text-2xl font-black text-brand">
                {formatCurrencyINR(estimatedGross)}
              </span>
            </div>
          </div>
        )}

        {/* Reservation Inclusions & Policies */}
        <div className="flex flex-col gap-1.5 text-[11px] text-neutral-secondary pt-1">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-feedback-success shrink-0" />
            <span>Best rate guarantee with direct booking</span>
          </div>
          <div className="flex items-start gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-feedback-success shrink-0 mt-0.5" />
            <span>Instant 15-minute hold upon reservation lock</span>
          </div>
          <div className="flex items-start gap-1.5 text-brand font-medium">
            <ShieldAlert className="w-3.5 h-3.5 text-brand shrink-0 mt-0.5" />
            <span>Original Aadhar Card is mandatory for every guest (18+)</span>
          </div>
        </div>

        {/* Continue Button */}
        <div className="pt-2 flex flex-col gap-2">
          {!isAuthenticated ? (
            <Button
              type="button"
              variant="primary"
              size="lg"
              disabled={!isRoomSelected || isLoading}
              onClick={handleContinue}
              className="w-full font-bold shadow-md h-12 gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In to Reserve</span>
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              size="lg"
              disabled={!isRoomSelected || isLoading}
              onClick={handleContinue}
              className="w-full font-bold shadow-md h-12 gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating 15-Min Hold...</span>
                </>
              ) : (
                <>
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          )}

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-neutral-400 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-feedback-success" />
            <span>Secure 15-Minute Reservation Hold</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
