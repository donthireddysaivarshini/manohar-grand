import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../../components/common/Badge';
import { Card, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import {
  LayoutDashboard,
  Calendar,
  BedDouble,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Phone,
  Receipt,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { bookingApiService } from '../../services/api/bookingApiService';
import { ApiBookingDetail } from '../../types/booking';
import { formatDateDisplay } from '../../utils/dateUtils';
import { formatCurrencyINR } from '../../utils/formatters';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<ApiBookingDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    document.title = 'Account Dashboard | Manohar Grand Hotel';

    bookingApiService
      .getMyBookings()
      .then((data) => setBookings(data || []))
      .catch((err) => {
        console.error('Failed to fetch user bookings on dashboard:', err);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const confirmedBookings = bookings.filter(
    (b) => b.status === 'confirmed' || b.status === 'checked_in'
  );
  const activeHolds = bookings.filter((b) => b.status === 'held');
  const recentBookings = bookings.slice(0, 3);

  const displayName = user?.full_name || user?.first_name || user?.email.split('@')[0];

  return (
    <div className="flex flex-col gap-8">
      {/* Welcome Banner */}
      <div className="flex flex-col gap-1.5">
        <Badge variant="brand" size="md" className="w-fit gap-1.5">
          <LayoutDashboard className="w-3.5 h-3.5" />
          Customer Activity Hub
        </Badge>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-dark">
          Welcome back, {displayName}
        </h1>
        <p className="text-xs sm:text-sm text-neutral-secondary">
          Track your active bookings, view check-in vouchers, and manage your Manohar Grand reservations.
        </p>
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card variant="bordered" className="bg-white p-5 rounded-2xl border-neutral-border shadow-xs">
          <CardContent className="p-0 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-neutral-secondary font-medium">Total Reservations</span>
              <p className="text-2xl font-black text-neutral-dark">{bookings.length}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card variant="bordered" className="bg-white p-5 rounded-2xl border-neutral-border shadow-xs">
          <CardContent className="p-0 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-neutral-secondary font-medium">Confirmed Stays</span>
              <p className="text-2xl font-black text-emerald-600">{confirmedBookings.length}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card variant="bordered" className="bg-white p-5 rounded-2xl border-neutral-border shadow-xs">
          <CardContent className="p-0 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-neutral-secondary font-medium">Active Holds</span>
              <p className="text-2xl font-black text-amber-600">{activeHolds.length}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Reservations Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-neutral-dark">Recent Activity & Stays</h2>
            <p className="text-xs text-neutral-secondary">Your latest reservations and status updates</p>
          </div>
          {bookings.length > 0 && (
            <Link
              to="/account/bookings"
              className="text-xs font-bold text-brand hover:underline inline-flex items-center gap-1"
            >
              <span>View All ({bookings.length})</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 bg-white rounded-2xl border border-neutral-border">
            <Loader2 className="w-6 h-6 text-brand animate-spin" />
            <span className="text-xs text-neutral-secondary">Loading recent activity...</span>
          </div>
        ) : recentBookings.length === 0 ? (
          <Card variant="bordered" className="bg-white p-8 text-center flex flex-col items-center gap-3 rounded-2xl border-neutral-border shadow-xs">
            <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400">
              <BedDouble className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-neutral-dark">No Recent Bookings</h3>
            <p className="text-xs text-neutral-secondary max-w-sm">
              Ready to plan your next visit to Kukatpally, Hyderabad? Check our real-time availability.
            </p>
            <Link to="/booking">
              <Button variant="primary" size="sm" className="font-bold gap-2 mt-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Book a Room Now</span>
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {recentBookings.map((b) => {
              const isConfirmed = b.status === 'confirmed' || b.status === 'checked_in';
              const gross = b.pricing ? parseFloat(String(b.pricing.gross_total)) : 0;
              const advance = b.pricing ? parseFloat(String(b.pricing.advance_amount_due)) : 0;

              return (
                <Card
                  key={b.id || b.booking_reference}
                  variant="bordered"
                  className="bg-white p-4 sm:p-5 rounded-2xl border-neutral-border shadow-xs hover:border-brand/40 transition-all"
                >
                  <CardContent className="p-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-black text-brand text-sm">
                          {b.booking_reference}
                        </span>
                        <Badge
                          variant={isConfirmed ? 'success' : b.status === 'held' ? 'brand' : 'default'}
                          size="sm"
                          className="text-[10px] font-bold"
                        >
                          {b.status_display || b.status}
                        </Badge>
                      </div>

                      <p className="text-xs text-neutral-secondary">
                        {formatDateDisplay(b.check_in_date)} → {formatDateDisplay(b.check_out_date)} ({b.nights_count}N) • {b.total_rooms_count} Room(s)
                      </p>

                      <p className="text-xs font-semibold text-neutral-dark">
                        Total: {formatCurrencyINR(gross)} • Advance Paid:{' '}
                        <span className="text-emerald-700 font-bold">{formatCurrencyINR(advance)}</span>
                      </p>
                    </div>

                    <Link to={`/booking/confirmation/${b.booking_reference}`}>
                      <Button variant="outline" size="sm" className="font-bold gap-1.5 w-full sm:w-auto text-xs">
                        <span>View Voucher</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Guest Assistance & Support Box */}
      <Card variant="bordered" className="bg-neutral-900 text-white p-6 rounded-2xl border-neutral-800 shadow-sm">
        <CardContent className="p-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <ShieldCheck className="w-4 h-4 text-brand" />
              <span>Need Help with a Modification or Cancellation?</span>
            </div>
            <p className="text-xs text-neutral-400">
              Our 24/7 reception desk at Kukatpally is available for all guest inquiries, early check-in requests, or bill settlements.
            </p>
          </div>

          <a
            href="tel:7997044999"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand text-white font-bold text-xs hover:bg-brand-hover transition-colors shrink-0 shadow-sm"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Call 7997044999</span>
          </a>
        </CardContent>
      </Card>
    </div>
  );
};
