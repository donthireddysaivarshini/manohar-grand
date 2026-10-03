import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  User,
  Edit2,
  ShieldAlert,
  ArrowLeft,
  Clock,
  AlertCircle,
  Loader2,
  Lock,
} from 'lucide-react';
import { Card, CardContent } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { useBooking } from '../../store/BookingContext';
import { paymentApiService } from '../../services/api/paymentApiService';
import { razorpayService } from '../../services/api/razorpayService';
import { formatDateDisplay } from '../../utils/dateUtils';
import { formatCurrencyINR } from '../../utils/formatters';

export interface BookingReviewProps {
  onBackToDetails: () => void;
}

export const BookingReview: React.FC<BookingReviewProps> = ({ onBackToDetails }) => {
  const navigate = useNavigate();
  const {
    activeHold,
    checkoutSummary,
    guestDetails,
    nightsCount,
  } = useBooking();

  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentStatusText, setPaymentStatusText] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);

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

  const isHoldExpired = secondsRemaining !== null && secondsRemaining <= 0;

  const formatCountdown = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  // Authoritative financial values from BookingPriceSnapshot
  const pricing = checkoutSummary?.pricing || activeHold?.pricing;
  const advanceAmountDue = pricing ? parseFloat(String(pricing.advance_amount_due)) : 0;
  const balanceAmountDue = pricing ? parseFloat(String(pricing.balance_amount_due)) : 0;
  const grossTotal = pricing ? parseFloat(String(pricing.gross_total)) : 0;
  const roomSubtotal = pricing ? parseFloat(String(pricing.room_subtotal)) : 0;
  const taxAmount = pricing ? parseFloat(String(pricing.tax_amount)) : 0;
  const taxRate = pricing ? pricing.tax_rate_percent : 5;

  const handlePayAdvance = async () => {
    if (!bookingRef) {
      setPaymentError('No active reservation reference found. Please restart your booking.');
      return;
    }

    if (isHoldExpired) {
      setPaymentError('Your 15-minute reservation hold has expired. Please select rooms again.');
      return;
    }

    setIsProcessingPayment(true);
    setPaymentError(null);
    setPaymentStatusText('Initializing secure Razorpay payment...');

    try {
      // 1. Create authoritative Razorpay order on Django backend
      const paymentOrder = await paymentApiService.createPaymentOrder(bookingRef);

      setPaymentStatusText('Opening Razorpay Checkout...');

      // 2. Open standard Razorpay Checkout Modal
      const leadName =
        guestDetails.fullName ||
        checkoutSummary?.guest_name ||
        activeHold?.guest_name ||
        'Guest';
      const leadEmail =
        guestDetails.email ||
        checkoutSummary?.guest_email ||
        activeHold?.guest_email ||
        '';
      const leadPhone =
        guestDetails.phone ||
        checkoutSummary?.guest_phone ||
        activeHold?.guest_phone ||
        '';

      const checkoutResult = await razorpayService.openCheckout({
        key: paymentOrder.razorpay_key_id,
        amount: paymentOrder.amount, // in paise
        currency: paymentOrder.currency || 'INR',
        name: 'Hotel Manohar Grand',
        description: `50% Advance Deposit - ${bookingRef}`,
        order_id: paymentOrder.razorpay_order_id,
        prefill: {
          name: leadName,
          email: leadEmail,
          contact: leadPhone,
        },
        theme: {
          color: '#1E3A8A', // Manohar Grand brand navy/gold
        },
      });

      // 3. Cryptographic Signature Verification & Confirmation on Django backend
      setPaymentStatusText('Verifying payment signature & confirming reservation...');

      const verifyRes = await paymentApiService.verifyPayment({
        razorpay_order_id: checkoutResult.razorpay_order_id,
        razorpay_payment_id: checkoutResult.razorpay_payment_id,
        razorpay_signature: checkoutResult.razorpay_signature,
      });

      if (verifyRes && (verifyRes.booking_status === 'confirmed' || verifyRes.payment_status === 'captured')) {
        navigate(`/booking/confirmation/${bookingRef}`, { replace: true });
      } else {
        throw new Error('Verification completed but status was not confirmed.');
      }
    } catch (err: any) {
      console.error('Payment flow error:', err);
      if (err?.code === 'PAYMENT_DISMISSED') {
        setPaymentError(
          'Payment window was closed. Your 15-minute hold remains active. You can retry payment anytime before the hold expires.'
        );
      } else {
        setPaymentError(
          err?.message ||
            'Payment could not be completed. If money was debited, your reservation will be confirmed automatically via gateway webhook.'
        );
      }
    } finally {
      setIsProcessingPayment(false);
      setPaymentStatusText(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Hold Expiry Timer Banner */}
      {secondsRemaining !== null && (
        <div
          className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
            isHoldExpired
              ? 'bg-red-50 border-red-200 text-red-900'
              : secondsRemaining < 180
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Clock
              className={`w-5 h-5 shrink-0 ${
                isHoldExpired ? 'text-red-600' : 'text-emerald-700'
              }`}
            />
            <div>
              <span className="font-bold text-sm block">
                {isHoldExpired
                  ? 'Reservation Hold Expired'
                  : 'Temporary Hold Active'}
              </span>
              <span className="text-xs opacity-90">
                {isHoldExpired
                  ? 'The 15-minute hold for this reservation has elapsed and inventory was released.'
                  : 'Your selected rooms are held exclusively for you.'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isHoldExpired && (
              <span className="px-3 py-1 bg-white rounded-lg border font-mono font-bold text-sm text-neutral-dark shadow-xs">
                {formatCountdown(secondsRemaining)} remaining
              </span>
            )}
            {isHoldExpired && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => navigate('/booking')}
                className="font-bold text-xs"
              >
                Search Again
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Payment Error Alert */}
      {paymentError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs sm:text-sm text-red-700 flex items-start gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="leading-relaxed flex-1">{paymentError}</div>
        </div>
      )}

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
              disabled={isProcessingPayment}
              onClick={onBackToDetails}
              className="gap-1.5 text-xs text-brand hover:text-brand-hover font-semibold p-1 cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit Details
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-neutral-secondary font-medium block">Full Name:</span>
              <span className="font-bold text-neutral-dark text-sm mt-0.5 block">
                {guestDetails.fullName || checkoutSummary?.guest_name || activeHold?.guest_name || 'Not provided'}
              </span>
            </div>

            <div>
              <span className="text-neutral-secondary font-medium block">Email:</span>
              <span className="font-bold text-neutral-dark text-sm mt-0.5 block">
                {guestDetails.email || checkoutSummary?.guest_email || activeHold?.guest_email || 'Not provided'}
              </span>
            </div>

            <div>
              <span className="text-neutral-secondary font-medium block">Phone:</span>
              <span className="font-bold text-neutral-dark text-sm mt-0.5 block">
                {guestDetails.phone || checkoutSummary?.guest_phone || activeHold?.guest_phone || 'Not provided'}
              </span>
            </div>
          </div>

          {(guestDetails.specialRequests || checkoutSummary?.special_requests) && (
            <div className="pt-2 border-t border-neutral-border/60 text-xs text-neutral-secondary">
              <span className="font-semibold text-neutral-dark">Special Requests: </span>
              {guestDetails.specialRequests || checkoutSummary?.special_requests}
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
                {formatDateDisplay(checkoutSummary?.check_in_date || activeHold?.check_in_date || '')} →{' '}
                {formatDateDisplay(checkoutSummary?.check_out_date || activeHold?.check_out_date || '')}
              </span>
            </div>

            <div>
              <span className="text-neutral-secondary font-medium block">Total Rooms &amp; Guests:</span>
              <span className="font-bold text-neutral-dark mt-0.5 block">
                {checkoutSummary?.total_rooms_count || activeHold?.total_rooms_count || 1} Rooms •{' '}
                {checkoutSummary?.total_adults || activeHold?.total_adults || 1} Adults,{' '}
                {checkoutSummary?.total_children || activeHold?.total_children || 0} Children
              </span>
            </div>
          </div>

          {/* Itemized Categories List */}
          <div className="flex flex-col gap-2 pt-2">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-dark">
              Reserved Room Categories
            </span>
            <div className="flex flex-col gap-2">
              {(checkoutSummary?.rooms || activeHold?.rooms || []).map((room) => (
                <div
                  key={room.id || room.category_id}
                  className="p-3 rounded-lg bg-neutral-light/60 border border-neutral-border flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-neutral-dark block">
                      {room.room_quantity} × {room.category_name}
                    </span>
                    <span className="text-[11px] text-neutral-secondary">
                      {nightsCount} {nightsCount === 1 ? 'night stay' : 'nights stay'}
                    </span>
                  </div>
                  <span className="font-mono text-xs font-semibold text-neutral-dark">
                    Category Confirmed
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Authoritative Financial Breakdown Card */}
      <Card variant="bordered" className="bg-white p-6 shadow-xs">
        <CardContent className="p-0 flex flex-col gap-4 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-border">
            <h3 className="text-base font-bold text-neutral-dark">Authoritative Price Breakdown</h3>
            <span className="text-xs font-mono font-bold text-neutral-secondary">
              Ref: {bookingRef}
            </span>
          </div>

          <div className="flex flex-col gap-2">
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

            <div className="flex justify-between py-2 border-y border-neutral-border text-sm font-bold text-neutral-dark">
              <span>Gross Total Stay Cost</span>
              <span className="text-base font-black text-neutral-dark">
                {formatCurrencyINR(grossTotal)}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-between">
              <div>
                <span className="font-extrabold text-brand text-sm block">
                  50% Advance Payable Now
                </span>
                <span className="text-[11px] text-neutral-600">
                  Required to secure and confirm reservation
                </span>
              </div>
              <span className="text-2xl font-black text-brand">
                {formatCurrencyINR(advanceAmountDue)}
              </span>
            </div>

            <div className="flex justify-between text-neutral-secondary pt-1">
              <span>Remaining 50% Balance Due at Check-In</span>
              <span className="font-bold text-neutral-dark">
                {formatCurrencyINR(balanceAmountDue)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Policies & Requirements Review Card */}
      <Card variant="bordered" className="bg-white p-5 shadow-xs border-neutral-200">
        <CardContent className="p-0 flex flex-col gap-3 text-xs">
          <div className="flex items-center gap-2 text-neutral-dark font-bold">
            <ShieldAlert className="w-4 h-4 text-brand" />
            <span>Important Stay Policies &amp; Direct Booking Terms</span>
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
                🔄 Non-Refundable Direct Booking Policy
              </span>
              <p className="text-neutral-600 text-[11px] leading-relaxed">
                {checkoutSummary?.cancellation_policy ||
                  'Confirmed reservations are strictly non-refundable per hotel direct booking policy.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Processing Status */}
      {isProcessingPayment && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-900 flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-blue-700 animate-spin shrink-0" />
          <span className="font-medium">{paymentStatusText || 'Processing payment...'}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <Button
          type="button"
          variant="outline"
          size="md"
          disabled={isProcessingPayment}
          onClick={onBackToDetails}
          className="w-full sm:w-auto gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Guest Details</span>
        </Button>

        <Button
          type="button"
          variant="primary"
          size="lg"
          disabled={isProcessingPayment || isHoldExpired}
          onClick={handlePayAdvance}
          className="w-full sm:w-auto font-bold shadow-md gap-2 min-w-[240px] cursor-pointer"
        >
          {isProcessingPayment ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              <span>Pay {formatCurrencyINR(advanceAmountDue)} Advance</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
