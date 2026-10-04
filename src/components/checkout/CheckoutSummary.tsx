import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, ShieldAlert, Clock } from 'lucide-react';
import { Card, CardContent } from '../common/Card';
import { Badge } from '../common/Badge';
import { useBooking } from '../../store/BookingContext';
import { formatDateDisplay } from '../../utils/dateUtils';
import { formatCurrencyINR } from '../../utils/formatters';

export const CheckoutSummary: React.FC = () => {
  const {
    activeHold,
    checkoutSummary,
    searchParams,
    selectedRooms,
    nightsCount,
    totalSelectedRoomsCount,
  } = useBooking();

  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);

  const pricing = checkoutSummary?.pricing || activeHold?.pricing;
  const bookingRef = checkoutSummary?.booking_reference || activeHold?.booking_reference;
  const holdExpiresAt = checkoutSummary?.hold_expires_at || activeHold?.hold_expires_at;

  // Live Hold Countdown calculation
  useEffect(() => {
    if (!holdExpiresAt) return;

    const updateTimer = () => {
      const expiry = new Date(holdExpiresAt).getTime();
      const now = new Date().getTime();
      const diffSecs = Math.max(0, Math.floor((expiry - now) / 1000));
      setSecondsRemaining(diffSecs);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [holdExpiresAt]);

  const grossTotal = pricing
    ? parseFloat(String(pricing.gross_total))
    : selectedRooms.reduce((acc, curr) => acc + curr.ratePerNight * curr.quantity * nightsCount, 0) * 1.05;

  const advanceDue = pricing
    ? parseFloat(String(pricing.advance_amount_due))
    : grossTotal;

  const roomSubtotal = pricing
    ? parseFloat(String(pricing.room_subtotal))
    : selectedRooms.reduce((acc, curr) => acc + curr.ratePerNight * curr.quantity * nightsCount, 0);

  const taxAmount = pricing
    ? parseFloat(String(pricing.tax_amount))
    : Math.round(roomSubtotal * 0.05);

  const taxRate = pricing ? pricing.tax_rate_percent : 5;

  const totalGuests =
    checkoutSummary
      ? (checkoutSummary.total_adults || 1) + (checkoutSummary.total_children || 0)
      : searchParams.adults + searchParams.children;

  const checkIn = checkoutSummary?.check_in_date || activeHold?.check_in_date || searchParams.checkIn;
  const checkOut = checkoutSummary?.check_out_date || activeHold?.check_out_date || searchParams.checkOut;
  const displayNights = checkoutSummary?.nights_count || activeHold?.nights_count || nightsCount;

  const isHoldExpired = secondsRemaining !== null && secondsRemaining <= 0;

  const formatCountdown = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  return (
    <Card variant="elevated" className="bg-white border-neutral-border p-6 shadow-elevated sticky top-24">
      <CardContent className="p-0 flex flex-col gap-5">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-border">
          <h3 className="text-base font-bold text-neutral-dark">Reservation Summary</h3>
          {bookingRef ? (
            <Badge variant="brand" size="sm" className="font-mono font-bold">
              {bookingRef}
            </Badge>
          ) : (
            <Badge variant="brand" size="sm" className="font-bold">
              Active Hold
            </Badge>
          )}
        </div>

        {/* Live Hold Timer Banner */}
        {secondsRemaining !== null && (
          <div
            className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
              isHoldExpired
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-amber-50/80 border-amber-200 text-amber-900'
            }`}
          >
            <div className="flex items-center gap-2 font-semibold">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{isHoldExpired ? 'Hold Expired' : 'Room Hold Active'}</span>
            </div>
            <span className="font-mono font-bold text-sm">
              {isHoldExpired ? '0:00' : formatCountdown(secondsRemaining)}
            </span>
          </div>
        )}

        {/* Stay Dates Info */}
        <div className="flex flex-col gap-2 p-3 rounded-lg bg-neutral-light border border-neutral-border text-xs">
          <div className="flex justify-between">
            <span className="text-neutral-secondary">Check-In:</span>
            <span className="font-bold text-neutral-dark">{formatDateDisplay(checkIn)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-secondary">Check-Out:</span>
            <span className="font-bold text-neutral-dark">{formatDateDisplay(checkOut)}</span>
          </div>
          <div className="flex justify-between border-t border-neutral-border/60 pt-1.5 font-medium">
            <span className="text-neutral-secondary">Duration:</span>
            <span className="font-bold text-brand">{displayNights} {displayNights === 1 ? 'Night' : 'Nights'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-secondary">Guests &amp; Rooms:</span>
            <span className="font-bold text-neutral-dark">
              {totalGuests} Guests • {checkoutSummary?.total_rooms_count || totalSelectedRoomsCount || 1} Rooms
            </span>
          </div>
        </div>

        {/* Selected Rooms List */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-dark">
            Accommodations
          </span>
          <div className="flex flex-col gap-1.5">
            {(checkoutSummary?.rooms || activeHold?.rooms || []).length > 0 ? (
              (checkoutSummary?.rooms || activeHold?.rooms || []).map((room) => (
                <div key={room.id || room.category_id} className="flex justify-between text-xs py-1 border-b border-neutral-border/50">
                  <span className="text-neutral-dark font-medium">
                    {room.room_quantity} × {room.category_name}
                  </span>
                  <span className="font-semibold text-neutral-dark">
                    Category Reserved
                  </span>
                </div>
              ))
            ) : (
              selectedRooms.map((room) => (
                <div key={room.categoryId} className="flex justify-between text-xs py-1 border-b border-neutral-border/50">
                  <span className="text-neutral-dark font-medium">
                    {room.quantity} × {room.categoryName}
                  </span>
                  <span className="font-bold text-neutral-dark">
                    {formatCurrencyINR(room.ratePerNight * room.quantity * nightsCount)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Price Breakdown from Server Snapshot */}
        <div className="flex flex-col gap-2 pt-2 border-t border-neutral-border text-xs">
          <div className="flex justify-between text-neutral-secondary">
            <span>Room Subtotal</span>
            <span className="font-semibold text-neutral-dark">
              {formatCurrencyINR(roomSubtotal)}
            </span>
          </div>

          <div className="flex justify-between text-neutral-secondary">
            <span>GST ({taxRate}%)</span>
            <span className="font-semibold text-neutral-dark">
              {formatCurrencyINR(taxAmount)}
            </span>
          </div>

          <div className="flex justify-between text-neutral-secondary pb-1">
            <span>Gross Total Stay</span>
            <span className="font-bold text-neutral-dark">
              {formatCurrencyINR(grossTotal)}
            </span>
          </div>

          <div className="flex items-baseline justify-between pt-2 border-t border-neutral-border/80">
            <div>
              <span className="text-sm font-extrabold text-neutral-dark block">
                Total Payable Now
              </span>
              <span className="text-[10px] text-emerald-700 font-bold">100% Full Payment</span>
            </div>
            <span className="text-2xl font-black text-brand">
              {formatCurrencyINR(advanceDue)}
            </span>
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
            <span>Non-refundable direct booking rate</span>
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
