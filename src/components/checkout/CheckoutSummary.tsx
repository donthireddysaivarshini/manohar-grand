import React from 'react';
import { ShieldCheck, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Card, CardContent } from '../common/Card';
import { Badge } from '../common/Badge';
import { useBooking } from '../../store/BookingContext';
import { formatDateDisplay } from '../../utils/dateUtils';
import { formatCurrencyINR } from '../../utils/formatters';

export const CheckoutSummary: React.FC = () => {
  const {
    searchParams,
    selectedRooms,
    priceBreakdown,
    nightsCount,
    totalSelectedRoomsCount,
  } = useBooking();

  const totalGuests = searchParams.adults + searchParams.children;

  return (
    <Card variant="elevated" className="bg-white border-neutral-border p-6 shadow-elevated sticky top-24">
      <CardContent className="p-0 flex flex-col gap-5">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-border">
          <h3 className="text-base font-bold text-neutral-dark">Reservation Summary</h3>
          <Badge variant="brand" size="sm" className="font-bold">
            Demo Estimate
          </Badge>
        </div>

        {/* Stay Dates Info */}
        <div className="flex flex-col gap-2 p-3 rounded-lg bg-neutral-light border border-neutral-border text-xs">
          <div className="flex justify-between">
            <span className="text-neutral-secondary">Check-In:</span>
            <span className="font-bold text-neutral-dark">{formatDateDisplay(searchParams.checkIn)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-secondary">Check-Out:</span>
            <span className="font-bold text-neutral-dark">{formatDateDisplay(searchParams.checkOut)}</span>
          </div>
          <div className="flex justify-between border-t border-neutral-border/60 pt-1.5 font-medium">
            <span className="text-neutral-secondary">Duration:</span>
            <span className="font-bold text-brand">{nightsCount} {nightsCount === 1 ? 'Night' : 'Nights'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-secondary">Guests &amp; Rooms:</span>
            <span className="font-bold text-neutral-dark">{totalGuests} Guests • {totalSelectedRoomsCount} Rooms</span>
          </div>
        </div>

        {/* Selected Rooms List */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-dark">
            Accommodations
          </span>
          <div className="flex flex-col gap-1.5">
            {selectedRooms.map((room) => (
              <div key={room.categoryId} className="flex justify-between text-xs py-1 border-b border-neutral-border/50">
                <span className="text-neutral-dark font-medium">
                  {room.quantity} × {room.categoryName}
                </span>
                <span className="font-bold text-neutral-dark">
                  {formatCurrencyINR(room.ratePerNight * room.quantity * nightsCount)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="flex flex-col gap-2 pt-2 border-t border-neutral-border text-xs">
          <div className="flex justify-between text-neutral-secondary">
            <span>Room Subtotal</span>
            <span className="font-semibold text-neutral-dark">
              {formatCurrencyINR(priceBreakdown.subtotal)}
            </span>
          </div>

          <div className="flex justify-between text-neutral-secondary">
            <span>Demo Taxes ({priceBreakdown.taxRatePercent}%)</span>
            <span className="font-semibold text-neutral-dark">
              {formatCurrencyINR(priceBreakdown.taxAmount)}
            </span>
          </div>

          <div className="flex items-baseline justify-between pt-2 border-t border-neutral-border/80">
            <div>
              <span className="text-sm font-extrabold text-neutral-dark block">
                Total Demo Payable
              </span>
              <span className="text-[10px] text-neutral-400">Includes estimated demo taxes</span>
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

        {/* Inclusions & Policies */}
        <div className="flex flex-col gap-1.5 text-[11px] text-neutral-secondary pt-1">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-feedback-success shrink-0" />
            <span>Best rate guarantee for direct bookings</span>
          </div>
          <div className="flex items-start gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-feedback-success shrink-0 mt-0.5" />
            <span>Cancel 2+ days prior for 50% refund (Same-day: non-refundable)</span>
          </div>
          <div className="flex items-start gap-1.5 text-brand font-medium">
            <ShieldAlert className="w-3.5 h-3.5 text-brand shrink-0 mt-0.5" />
            <span>Mandatory original Aadhar Card for all guests (18+)</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-neutral-400 pt-1 border-t border-neutral-border/60">
          <ShieldCheck className="w-3.5 h-3.5 text-feedback-success" />
          <span>Secure Direct Reservation • Manohar Grand</span>
        </div>
      </CardContent>
    </Card>
  );
};
