import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CheckCircle2,
  Printer,
  Home,
  CalendarDays,
  ShieldAlert,
  User,
  Phone,
  Mail,
  Hotel,
  Loader2,
} from 'lucide-react';
import { Container } from '../../components/common/Container';
import { Section } from '../../components/common/Section';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card, CardContent } from '../../components/common/Card';
import { Logo } from '../../components/common/Logo';
import { CheckoutProgress } from '../../components/checkout/CheckoutProgress';
import { useBooking } from '../../store/BookingContext';
import { bookingApiService } from '../../services/api/bookingApiService';
import { ApiBookingDetail } from '../../types/booking';
import { formatDateDisplay } from '../../utils/dateUtils';
import { formatCurrencyINR } from '../../utils/formatters';

export const ConfirmationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { resetBookingFlow } = useBooking();

  const [booking, setBooking] = useState<ApiBookingDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Reservation Voucher | Manohar Grand Hotel';

    if (!id) {
      setError('No booking reference provided in URL.');
      setIsLoading(false);
      return;
    }

    bookingApiService
      .getBookingDetail(id)
      .then((data) => {
        setBooking(data);
        setError(null);
      })
      .catch((err) => {
        console.error('Failed to load booking voucher:', err);
        setError(err?.message || 'Unable to load reservation voucher from server.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [id]);

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-brand animate-spin" />
        <span className="text-sm font-semibold text-neutral-secondary">
          Loading reservation voucher from Manohar Grand...
        </span>
      </div>
    );
  }

  // Not Found / Error State
  if (error || !booking) {
    return (
      <div className="py-16 flex-1 flex items-center justify-center">
        <Container size="md">
          <div className="text-center flex flex-col items-center gap-5 max-w-md mx-auto bg-white p-8 rounded-card border border-neutral-border shadow-card">
            <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400">
              <Hotel className="w-7 h-7" />
            </div>

            <Badge variant="error" size="md">
              Voucher Not Found
            </Badge>

            <h1 className="text-2xl font-extrabold text-neutral-dark">
              Reservation Not Found
            </h1>

            <p className="text-xs sm:text-sm text-neutral-secondary leading-relaxed">
              {error || `No active reservation was found matching reference ${id}.`}
            </p>

            <Link to="/booking" onClick={resetBookingFlow}>
              <Button variant="primary" size="md" className="font-bold shadow-sm cursor-pointer">
                Start a New Reservation
              </Button>
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const pricing = booking.pricing;
  const grossTotal = pricing ? parseFloat(String(pricing.gross_total)) : 0;
  const advancePaid = pricing ? parseFloat(String(pricing.advance_amount_due)) : 0;
  const balanceDue = pricing ? parseFloat(String(pricing.balance_amount_due)) : 0;
  const roomSubtotal = pricing ? parseFloat(String(pricing.room_subtotal)) : 0;
  const taxAmount = pricing ? parseFloat(String(pricing.tax_amount)) : 0;
  const taxRate = pricing ? pricing.tax_rate_percent : 5;

  const isConfirmed = booking.status === 'confirmed' || booking.status === 'checked_in';

  return (
    <div className="flex flex-col w-full print:bg-white print:p-0">
      {/* 1. Progress Step Bar (Hidden during print) */}
      <div className="print:hidden">
        <CheckoutProgress currentStep="confirmation" />
      </div>

      <Section variant="default" padding="sm" className="py-6">
        <Container size="lg">
          <div className="max-w-3xl mx-auto flex flex-col gap-6">
            {/* Confirmation Banner */}
            <div className="bg-white rounded-card border border-neutral-border p-6 sm:p-8 text-center flex flex-col items-center gap-4 shadow-card">
              <div className="w-16 h-16 rounded-full bg-green-100 text-feedback-success flex items-center justify-center shadow-sm">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <Badge
                variant={isConfirmed ? 'success' : 'brand'}
                size="md"
                className="font-bold tracking-wider px-3 py-1"
              >
                {isConfirmed ? 'Booking Confirmed' : `Status: ${booking.status_display || booking.status}`}
              </Badge>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-dark">
                Thank you, {booking.guest_name}!
              </h1>

              <p className="text-xs sm:text-sm text-neutral-secondary max-w-lg leading-relaxed">
                Your reservation at Manohar Grand is confirmed. A summary voucher has been generated below for your records.
              </p>

              <div className="p-3 bg-neutral-light rounded-lg border border-neutral-border text-xs flex flex-col sm:flex-row items-center gap-2 sm:gap-6">
                <div>
                  <span className="text-neutral-secondary">Booking Reference: </span>
                  <span className="font-mono font-black text-brand text-sm">{booking.booking_reference}</span>
                </div>
                <div className="hidden sm:block text-neutral-300">|</div>
                <div>
                  <span className="text-neutral-secondary">Advance Paid: </span>
                  <span className="font-mono font-bold text-emerald-700">{formatCurrencyINR(advancePaid)}</span>
                </div>
              </div>
            </div>

            {/* Itemized Voucher Card */}
            <Card variant="bordered" className="bg-white p-6 sm:p-8 shadow-card">
              <CardContent className="p-0 flex flex-col gap-6">
                {/* Voucher Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-neutral-border">
                  <div className="flex items-center gap-3">
                    <Logo size="sm" />
                    <span className="hidden sm:inline-block h-6 w-px bg-neutral-border" />
                    <span className="text-[10px] uppercase tracking-widest text-neutral-secondary font-bold">
                      Official Reservation Voucher
                    </span>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-xs text-neutral-secondary block">Date Issued:</span>
                    <span className="text-xs font-bold text-neutral-dark">
                      {new Date(booking.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                {/* Lead Guest & Property Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 rounded-lg bg-neutral-light/70 border border-neutral-border text-xs">
                  <div className="flex flex-col gap-2">
                    <span className="font-bold text-neutral-dark uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-brand" />
                      Guest Information
                    </span>
                    <span className="font-bold text-neutral-dark text-sm">{booking.guest_name}</span>
                    {booking.guest_email && (
                      <span className="flex items-center gap-1.5 text-neutral-secondary">
                        <Mail className="w-3 h-3" /> {booking.guest_email}
                      </span>
                    )}
                    {booking.guest_phone && (
                      <span className="flex items-center gap-1.5 text-neutral-secondary">
                        <Phone className="w-3 h-3" /> {booking.guest_phone}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="font-bold text-neutral-dark uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <Hotel className="w-3.5 h-3.5 text-brand" />
                      Stay Details
                    </span>
                    <div className="flex justify-between">
                      <span className="text-neutral-secondary">Check-In:</span>
                      <span className="font-bold text-neutral-dark">{formatDateDisplay(booking.check_in_date)} (12:00 PM)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-secondary">Check-Out:</span>
                      <span className="font-bold text-neutral-dark">{formatDateDisplay(booking.check_out_date)} (11:00 AM)</span>
                    </div>
                    <div className="flex justify-between border-t border-neutral-border/60 pt-1 font-medium">
                      <span className="text-neutral-secondary">Total Stay:</span>
                      <span className="font-bold text-brand">
                        {booking.nights_count} Nights • {booking.total_rooms_count} Rooms ({booking.total_adults}A, {booking.total_children}C)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Accommodations Table */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-dark">
                    Reserved Accommodations
                  </span>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-neutral-light border-b border-neutral-border text-neutral-secondary font-semibold">
                        <tr>
                          <th className="py-2.5 px-3">Room Category</th>
                          <th className="py-2.5 px-3 text-center">Quantity</th>
                          <th className="py-2.5 px-3 text-right">Stay Nights</th>
                          <th className="py-2.5 px-3 text-right">Category Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-border/60">
                        {booking.rooms.map((room) => (
                          <tr key={room.id || room.category_id}>
                            <td className="py-3 px-3 font-bold text-neutral-dark">
                              {room.category_name}
                            </td>
                            <td className="py-3 px-3 text-center">{room.room_quantity}</td>
                            <td className="py-3 px-3 text-right">{booking.nights_count} Nights</td>
                            <td className="py-3 px-3 text-right font-semibold text-emerald-700">
                              Confirmed
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Authoritative Financial Breakdown */}
                <div className="flex flex-col gap-2 p-4 rounded-lg bg-neutral-light border border-neutral-border text-xs">
                  <div className="flex justify-between text-neutral-secondary">
                    <span>Room Tariff Subtotal</span>
                    <span className="font-semibold text-neutral-dark">
                      {formatCurrencyINR(roomSubtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-neutral-secondary">
                    <span>Goods &amp; Services Tax (GST {taxRate}%)</span>
                    <span className="font-semibold text-neutral-dark">
                      {formatCurrencyINR(taxAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-neutral-border text-xs font-bold text-neutral-dark">
                    <span>Gross Total Tariff</span>
                    <span className="text-sm font-black text-neutral-dark">
                      {formatCurrencyINR(grossTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 text-xs text-emerald-800 font-bold bg-emerald-50/70 px-2.5 py-1.5 rounded border border-emerald-200">
                    <span>50% Advance Deposit Paid</span>
                    <span className="font-black text-emerald-700">
                      {formatCurrencyINR(advancePaid)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-neutral-dark font-bold px-2.5 pt-1">
                    <span>Remaining 50% Balance Due at Check-In</span>
                    <span className="font-bold text-brand">
                      {formatCurrencyINR(balanceDue)}
                    </span>
                  </div>
                </div>

                {/* Check-In Guidelines & Policies */}
                <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-200 text-xs flex flex-col gap-2">
                  <span className="font-bold text-neutral-dark uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-brand" />
                    Important Check-In Guidelines &amp; Policies
                  </span>
                  <ul className="text-[11px] text-neutral-600 space-y-1 pl-4 list-disc">
                    <li>
                      <strong>Mandatory ID:</strong> Original Aadhar Card is required for every guest upon arrival (Primary guest 18+).
                    </li>
                    <li>
                      <strong>Bedding:</strong> All bedrooms feature premium Wakefit Memory Foam mattresses.
                    </li>
                    <li>
                      <strong>Cancellation Policy:</strong> Confirmed direct reservations are strictly non-refundable.
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Post-Booking Actions (Hidden in Print) */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 print:hidden">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={handlePrint}
                className="gap-2 font-semibold cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Save Voucher</span>
              </Button>

              <div className="flex items-center gap-3">
                <Link to="/booking" onClick={resetBookingFlow}>
                  <Button variant="outline" size="md" className="gap-2 font-semibold cursor-pointer">
                    <CalendarDays className="w-4 h-4" />
                    <span>Book Another Stay</span>
                  </Button>
                </Link>

                <Link to="/" onClick={resetBookingFlow}>
                  <Button variant="primary" size="md" className="gap-2 font-bold shadow-sm cursor-pointer">
                    <Home className="w-4 h-4" />
                    <span>Return to Home</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </div>
  );
};
