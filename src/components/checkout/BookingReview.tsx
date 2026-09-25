import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  User,
  Edit2,
  CreditCard,
  ShieldAlert,
  ArrowLeft,
} from 'lucide-react';
import { Card, CardContent } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { useBooking } from '../../store/BookingContext';
import { formatDateDisplay } from '../../utils/dateUtils';
import { formatCurrencyINR } from '../../utils/formatters';

export interface BookingReviewProps {
  onBackToDetails: () => void;
}

export const BookingReview: React.FC<BookingReviewProps> = ({ onBackToDetails }) => {
  const navigate = useNavigate();
  const {
    searchParams,
    selectedRooms,
    guestDetails,
    nightsCount,
    totalSelectedRoomsCount,
    createBookingSnapshot,
  } = useBooking();

  const handleProceedToPayment = () => {
    // Generate snapshot and navigate to /payment-demo
    createBookingSnapshot('card');
    navigate('/payment-demo');
  };

  const totalGuests = searchParams.adults + searchParams.children;

  return (
    <div className="flex flex-col gap-6">
      {/* Simulation Notice */}
      <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-feedback-warning shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Review Your Demo Reservation: </span>
          Please review your stay dates, selected room categories, and guest details below. On the next screen, you can test the simulated payment flow.
        </div>
      </div>

      {/* Guest Details Card */}
      <Card variant="bordered" className="bg-white p-6 shadow-xs">
        <CardContent className="p-0 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-border">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-brand" />
              <h3 className="text-base font-bold text-neutral-dark">Guest Details</h3>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onBackToDetails}
              className="gap-1.5 text-xs text-brand hover:text-brand-hover font-semibold p-1"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit Details
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-neutral-secondary font-medium block">Full Name:</span>
              <span className="font-bold text-neutral-dark text-sm mt-0.5 block">
                {guestDetails.fullName || 'Not provided'}
              </span>
            </div>

            <div>
              <span className="text-neutral-secondary font-medium block">Email:</span>
              <span className="font-bold text-neutral-dark text-sm mt-0.5 block">
                {guestDetails.email || 'Not provided'}
              </span>
            </div>

            <div>
              <span className="text-neutral-secondary font-medium block">Phone:</span>
              <span className="font-bold text-neutral-dark text-sm mt-0.5 block">
                {guestDetails.phone || 'Not provided'}
              </span>
            </div>
          </div>

          {guestDetails.specialRequests && (
            <div className="pt-2 border-t border-neutral-border/60 text-xs text-neutral-secondary">
              <span className="font-semibold text-neutral-dark">Special Requests: </span>
              {guestDetails.specialRequests}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stay & Room Breakdown Card */}
      <Card variant="bordered" className="bg-white p-6 shadow-xs">
        <CardContent className="p-0 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-border">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand" />
              <h3 className="text-base font-bold text-neutral-dark">Stay &amp; Accommodations</h3>
            </div>
            <Badge variant="brand" size="sm">
              {nightsCount} {nightsCount === 1 ? 'Night' : 'Nights'}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs p-3 rounded-lg bg-neutral-light border border-neutral-border">
            <div>
              <span className="text-neutral-secondary font-medium block">Dates:</span>
              <span className="font-bold text-neutral-dark mt-0.5 block">
                {formatDateDisplay(searchParams.checkIn)} → {formatDateDisplay(searchParams.checkOut)}
              </span>
            </div>

            <div>
              <span className="text-neutral-secondary font-medium block">Guests &amp; Total Rooms:</span>
              <span className="font-bold text-neutral-dark mt-0.5 block">
                {totalGuests} Guests ({searchParams.adults} Adults, {searchParams.children} Children) • {totalSelectedRoomsCount} {totalSelectedRoomsCount === 1 ? 'Room' : 'Rooms'}
              </span>
            </div>
          </div>

          {/* Itemized Categories List */}
          <div className="flex flex-col gap-2 pt-2">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-dark">
              Itemized Rooms Breakdown
            </span>
            <div className="flex flex-col gap-2">
              {selectedRooms.map((room) => {
                const lineTotal = room.ratePerNight * room.quantity * nightsCount;
                return (
                  <div
                    key={room.categoryId}
                    className="p-3 rounded-lg bg-neutral-light/60 border border-neutral-border flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-neutral-dark block">
                        {room.quantity} × {room.categoryName}
                      </span>
                      <span className="text-[11px] text-neutral-secondary">
                        {formatCurrencyINR(room.ratePerNight)} / night × {nightsCount} nights
                      </span>
                    </div>
                    <span className="font-extrabold text-neutral-dark text-sm">
                      {formatCurrencyINR(lineTotal)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Policies & Requirements Review Card */}
      <Card variant="bordered" className="bg-white p-5 shadow-xs border-neutral-200">
        <CardContent className="p-0 flex flex-col gap-3 text-xs">
          <div className="flex items-center gap-2 text-neutral-dark font-bold">
            <ShieldAlert className="w-4 h-4 text-brand" />
            <span>Important Stay Policies &amp; Guidelines</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-lg bg-[#F7F7F7] border border-neutral-200">
              <span className="font-bold text-neutral-dark block mb-1">
                🪪 Mandatory Government ID (18+)
              </span>
              <p className="text-neutral-600 text-[11px] leading-relaxed">
                Original Aadhar Card is mandatory for every staying guest upon check-in. Primary guest must be 18+ years of age.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[#F7F7F7] border border-neutral-200">
              <span className="font-bold text-neutral-dark block mb-1">
                🔄 Cancellation Policy
              </span>
              <p className="text-neutral-600 text-[11px] leading-relaxed">
                Cancel 2+ days before check-in to get 50% refund. Cancellations made on the day of stay or within 48 hours are non-refundable (0% refund).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <Button
          type="button"
          variant="outline"
          size="md"
          onClick={onBackToDetails}
          className="w-full sm:w-auto gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Guest Details</span>
        </Button>

        <Button
          type="button"
          variant="primary"
          size="lg"
          onClick={handleProceedToPayment}
          className="w-full sm:w-auto font-bold shadow-md gap-2"
        >
          <CreditCard className="w-5 h-5" />
          <span>Proceed to Demo Payment</span>
        </Button>
      </div>
    </div>
  );
};
