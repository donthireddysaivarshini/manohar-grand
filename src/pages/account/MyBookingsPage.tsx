import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../../components/common/Badge';
import { Card, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { BookOpen, Calendar, BedDouble, ArrowRight, Loader2, AlertCircle, XCircle, Clock } from 'lucide-react';
import { bookingApiService } from '../../services/api/bookingApiService';
import { ApiBookingDetail } from '../../types/booking';
import { formatDateDisplay } from '../../utils/dateUtils';
import { formatCurrencyINR } from '../../utils/formatters';
import { CancellationModal } from '../../components/booking/CancellationModal';

export const MyBookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<ApiBookingDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingRef, setCancellingRef] = useState<string | null>(null);

  const fetchBookings = () => {
    setIsLoading(true);
    bookingApiService
      .getMyBookings()
      .then((data) => {
        setBookings(data);
        setError(null);
      })
      .catch((err) => {
        console.error('Failed to load customer reservations:', err);
        setError(err?.message || 'Unable to load reservations.');
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    document.title = 'My Reservations | Manohar Grand Hotel';
    fetchBookings();
  }, []);

  const visibleBookings = bookings.filter(
    (b) => b.status !== 'held' && b.status !== 'expired'
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Badge variant="brand" size="md" className="w-fit gap-1.5">
          <BookOpen className="w-3.5 h-3.5" />
          Customer Reservation History
        </Badge>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-dark">My Bookings</h1>
        <p className="text-xs sm:text-sm text-neutral-secondary">
          View your confirmed reservations, vouchers, and stay details.
        </p>
      </div>

      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-brand animate-spin" />
          <span className="text-xs text-neutral-secondary">Loading your reservations...</span>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      ) : visibleBookings.length === 0 ? (
        <Card variant="bordered" className="bg-white p-8 text-center flex flex-col items-center gap-4 rounded-2xl border-neutral-border shadow-xs">
          <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400">
            <BedDouble className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-neutral-dark">No Reservations Found</h3>
          <p className="text-xs text-neutral-secondary max-w-sm">
            You don't have any bookings associated with your account yet. Explore our rooms to book a stay in Kukatpally.
          </p>
          <Link to="/booking">
            <Button variant="primary" size="md" className="font-bold gap-2">
              <Calendar className="w-4 h-4" />
              <span>Book a Stay</span>
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {visibleBookings.map((b) => {
            const isConfirmed = b.status === 'confirmed';
            const isRequested = b.status === 'cancellation_requested';
            const isCancelled = b.status === 'cancelled' || b.status === 'refunded';
            const gross = b.pricing ? parseFloat(String(b.pricing.gross_total)) : 0;
            const advance = b.pricing ? parseFloat(String(b.pricing.advance_amount_due)) : 0;

            let badgeVariant: 'success' | 'brand' | 'default' = 'default';
            if (isConfirmed || b.status === 'checked_in') badgeVariant = 'success';
            else if (b.status === 'held') badgeVariant = 'brand';

            return (
              <Card
                key={b.id || b.booking_reference}
                variant="bordered"
                className="bg-white p-5 rounded-2xl border-neutral-border shadow-xs hover:border-brand/40 transition-all flex flex-col gap-3"
              >
                <CardContent className="p-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-black text-brand text-sm">
                        {b.booking_reference}
                      </span>
                      <Badge
                        variant={badgeVariant}
                        size="sm"
                        className={`text-[10px] font-bold ${
                          isRequested 
                            ? 'bg-amber-100 text-amber-800 border-amber-300' 
                            : isCancelled 
                            ? 'bg-neutral-100 text-neutral-600 border-neutral-300' 
                            : ''
                        }`}
                      >
                        {b.status_display || b.status}
                      </Badge>
                    </div>

                    <div className="text-xs text-neutral-secondary flex flex-wrap items-center gap-3">
                      <span>
                        <strong>Dates:</strong> {formatDateDisplay(b.check_in_date)} → {formatDateDisplay(b.check_out_date)} ({b.nights_count}N)
                      </span>
                      <span>•</span>
                      <span>
                        <strong>Rooms:</strong> {b.total_rooms_count} ({b.total_adults} Adults)
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-neutral-dark">
                      Total: {formatCurrencyINR(gross)} • Amount Paid: <span className="text-emerald-700 font-bold">{formatCurrencyINR(advance)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {isConfirmed && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCancellingRef(b.booking_reference)}
                        className="font-bold text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Cancel Booking</span>
                      </Button>
                    )}
                    <Link to={`/booking/confirmation/${b.booking_reference}`} className="flex-1 sm:flex-initial">
                      <Button variant="outline" size="sm" className="font-bold gap-1.5 w-full text-xs">
                        <span>View Voucher</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>

                {isRequested && (
                  <div className="mt-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Cancellation request submitted. Management review & refund processing in progress.</span>
                    </div>
                    {b.refund_amount && parseFloat(b.refund_amount) > 0 && (
                      <span className="font-bold text-amber-900">
                        Eligible Refund: {formatCurrencyINR(parseFloat(b.refund_amount))}
                      </span>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Cancellation Modal */}
      {cancellingRef && (
        <CancellationModal
          bookingReference={cancellingRef}
          isOpen={Boolean(cancellingRef)}
          onClose={() => setCancellingRef(null)}
          onSuccess={() => {
            setCancellingRef(null);
            fetchBookings();
          }}
        />
      )}
    </div>
  );
};
