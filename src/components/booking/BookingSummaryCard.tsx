import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  CheckCircle2,
  Trash2,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { useBooking } from '../../store/BookingContext';
import { formatDateDisplay } from '../../utils/dateUtils';
import { formatCurrencyINR } from '../../utils/formatters';

export const BookingSummaryCard: React.FC = () => {
  const navigate = useNavigate();
  const {
    searchParams,
    selectedRooms,
    setRoomQuantity,
    clearSelectedRooms,
    priceBreakdown,
    totalSelectedRoomsCount,
    nightsCount,
  } = useBooking();

  const totalGuests = searchParams.adults + searchParams.children;
  const isRoomSelected = totalSelectedRoomsCount > 0;

  const handleContinue = () => {
    if (!isRoomSelected) return;
    navigate('/checkout');
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
            Live Estimate
          </Badge>
        </div>

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
              <span className="text-[10px] text-neutral-500">From 12:00 PM (Demo)</span>
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
              <span className="text-[10px] text-neutral-500">Until 11:00 AM (Demo)</span>
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
                className="text-[11px] text-neutral-secondary hover:text-feedback-error transition-colors flex items-center gap-1"
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
                Please select at least 1 room category from the options to proceed.
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
                        className="text-neutral-400 hover:text-feedback-error p-1"
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

        {/* Pricing Calculation Breakdown */}
        {isRoomSelected && (
          <div className="flex flex-col gap-2 pt-3 border-t border-neutral-border text-xs">
            <div className="flex items-center justify-between text-neutral-secondary">
              <span>Room Subtotal</span>
              <span className="font-semibold text-neutral-dark">
                {formatCurrencyINR(priceBreakdown.subtotal)}
              </span>
            </div>

            <div className="flex items-center justify-between text-neutral-secondary">
              <span className="flex items-center gap-1">
                <span>Demo Taxes ({priceBreakdown.taxRatePercent}%)</span>
                <span className="text-[10px] text-neutral-400">*</span>
              </span>
              <span className="font-semibold text-neutral-dark">
                {formatCurrencyINR(priceBreakdown.taxAmount)}
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-2 border-t border-neutral-border/80">
              <div>
                <span className="text-sm font-extrabold text-neutral-dark block">
                  Total Payable
                </span>
                <span className="text-[10px] text-neutral-500">Includes estimated demo taxes</span>
              </div>
              <span className="text-2xl font-black text-brand">
                {formatCurrencyINR(priceBreakdown.totalPayable)}
              </span>
            </div>

            <div className="flex items-center gap-1.5 p-2 rounded bg-amber-50 border border-amber-200 text-[10px] text-amber-800 mt-1">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-feedback-warning" />
              <span>{priceBreakdown.taxDisclaimer}</span>
            </div>
          </div>
        )}

        {/* Reservation Inclusions */}
        <div className="flex flex-col gap-1.5 text-[11px] text-neutral-secondary pt-1">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-feedback-success shrink-0" />
            <span>Best rate guarantee for direct bookings</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-feedback-success shrink-0" />
            <span>Free cancellation up to 24 hours prior (Demo policy)</span>
          </div>
        </div>

        {/* Continue Button */}
        <div className="pt-2 flex flex-col gap-2">
          <Button
            type="button"
            variant="primary"
            size="lg"
            disabled={!isRoomSelected}
            onClick={handleContinue}
            className="w-full font-bold shadow-md h-12 gap-2"
          >
            <span>Continue to Guest Details</span>
            <ArrowRight className="w-4 h-4" />
          </Button>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-neutral-400 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-feedback-success" />
            <span>No payment taken at this step</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
