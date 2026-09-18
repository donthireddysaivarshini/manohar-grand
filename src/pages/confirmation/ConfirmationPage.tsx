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
} from 'lucide-react';
import { Container } from '../../components/common/Container';
import { Section } from '../../components/common/Section';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card, CardContent } from '../../components/common/Card';
import { Logo } from '../../components/common/Logo';
import { CheckoutProgress } from '../../components/checkout/CheckoutProgress';
import { useBooking } from '../../store/BookingContext';
import { paymentService } from '../../services';
import { BookingSnapshot } from '../../types/checkout';
import { formatDateDisplay } from '../../utils/dateUtils';
import { formatCurrencyINR } from '../../utils/formatters';

export const ConfirmationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentSnapshot, resetBookingFlow } = useBooking();

  const [snapshot, setSnapshot] = useState<BookingSnapshot | null>(currentSnapshot);
  const [isLoading, setIsLoading] = useState(!currentSnapshot);

  useEffect(() => {
    document.title = 'Demo Booking Voucher | Manohar Grand Hotel';

    const fetchSnapshot = async () => {
      if (currentSnapshot && currentSnapshot.bookingReference === id) {
        setSnapshot(currentSnapshot);
        setIsLoading(false);
        return;
      }

      if (id) {
        const found = await paymentService.getBookingSnapshot(id);
        setSnapshot(found);
      }
      setIsLoading(false);
    };

    fetchSnapshot();
  }, [id, currentSnapshot]);

  // Invalid / Direct URL access with missing snapshot
  if (!isLoading && !snapshot) {
    return (
      <div className="py-16 flex-1 flex items-center justify-center">
        <Container size="md">
          <div className="text-center flex flex-col items-center gap-5 max-w-md mx-auto bg-white p-8 rounded-card border border-neutral-border shadow-card">
            <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400">
              <Hotel className="w-7 h-7" />
            </div>

            <Badge variant="default" size="md">
              Voucher Not Found
            </Badge>

            <h1 className="text-2xl font-extrabold text-neutral-dark">
              Reservation Session Expired
            </h1>

            <p className="text-xs sm:text-sm text-neutral-secondary leading-relaxed">
              No active demo reservation was found matching reference <strong>{id}</strong>.
            </p>

            <Link to="/booking">
              <Button variant="primary" size="md" className="font-bold shadow-sm">
                Start a New Reservation
              </Button>
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  if (isLoading || !snapshot) {
    return (
      <div className="py-20 flex justify-center items-center">
        <div className="h-40 w-full max-w-md bg-neutral-200 animate-pulse rounded-card" />
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

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

              <Badge variant="success" size="md" className="font-bold tracking-wider px-3 py-1">
                Demo Booking Confirmed
              </Badge>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-dark">
                Thank you, {snapshot.guest.fullName}!
              </h1>

              <p className="text-xs sm:text-sm text-neutral-secondary max-w-lg leading-relaxed">
                Your simulated reservation has been recorded in the demo environment. A confirmation voucher has been generated below.
              </p>

              <div className="p-3 bg-neutral-light rounded-lg border border-neutral-border text-xs flex flex-col sm:flex-row items-center gap-2 sm:gap-6">
                <div>
                  <span className="text-neutral-secondary">Demo Booking Reference: </span>
                  <span className="font-mono font-black text-brand text-sm">{snapshot.bookingReference}</span>
                </div>
                <div className="hidden sm:block text-neutral-300">|</div>
                <div>
                  <span className="text-neutral-secondary">Simulated Transaction: </span>
                  <span className="font-mono font-bold text-neutral-dark">{snapshot.payment.transactionId}</span>
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
                      Reservation Voucher (Demo)
                    </span>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-xs text-neutral-secondary block">Date Issued:</span>
                    <span className="text-xs font-bold text-neutral-dark">
                      {new Date(snapshot.createdAt).toLocaleDateString('en-IN', {
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
                    <span className="font-bold text-neutral-dark text-sm">{snapshot.guest.fullName}</span>
                    <span className="flex items-center gap-1.5 text-neutral-secondary">
                      <Mail className="w-3 h-3" /> {snapshot.guest.email}
                    </span>
                    <span className="flex items-center gap-1.5 text-neutral-secondary">
                      <Phone className="w-3 h-3" /> {snapshot.guest.phone}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="font-bold text-neutral-dark uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <Hotel className="w-3.5 h-3.5 text-brand" />
                      Stay Details
                    </span>
                    <div className="flex justify-between">
                      <span className="text-neutral-secondary">Check-In:</span>
                      <span className="font-bold text-neutral-dark">{formatDateDisplay(snapshot.stay.checkIn)} (12:00 PM Demo)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-secondary">Check-Out:</span>
                      <span className="font-bold text-neutral-dark">{formatDateDisplay(snapshot.stay.checkOut)} (11:00 AM Demo)</span>
                    </div>
                    <div className="flex justify-between border-t border-neutral-border/60 pt-1 font-medium">
                      <span className="text-neutral-secondary">Total Stay:</span>
                      <span className="font-bold text-brand">{snapshot.stay.nights} Nights • {snapshot.occupancy.rooms} Rooms ({snapshot.occupancy.adults}A, {snapshot.occupancy.children}C)</span>
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
                          <th className="py-2.5 px-3 text-right">Demo Rate</th>
                          <th className="py-2.5 px-3 text-right">Line Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-border/60">
                        {snapshot.selectedRooms.map((room) => (
                          <tr key={room.categoryId}>
                            <td className="py-3 px-3 font-bold text-neutral-dark">
                              {room.categoryName}
                            </td>
                            <td className="py-3 px-3 text-center">{room.quantity}</td>
                            <td className="py-3 px-3 text-right">{formatCurrencyINR(room.ratePerNight)} / nt</td>
                            <td className="py-3 px-3 text-right font-bold text-neutral-dark">
                              {formatCurrencyINR(room.ratePerNight * room.quantity * snapshot.stay.nights)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Financial Breakdown */}
                <div className="flex flex-col gap-2 p-4 rounded-lg bg-neutral-light border border-neutral-border text-xs">
                  <div className="flex justify-between text-neutral-secondary">
                    <span>Room Subtotal</span>
                    <span className="font-semibold text-neutral-dark">
                      {formatCurrencyINR(snapshot.pricing.subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-neutral-secondary">
                    <span>Demo Taxes ({snapshot.pricing.taxRatePercent}%)</span>
                    <span className="font-semibold text-neutral-dark">
                      {formatCurrencyINR(snapshot.pricing.taxAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-neutral-border text-sm font-bold text-neutral-dark">
                    <span>Total Demo Amount Paid</span>
                    <span className="text-xl font-black text-brand">
                      {formatCurrencyINR(snapshot.pricing.totalPayable)}
                    </span>
                  </div>
                </div>

                {/* Simulation Notice */}
                <div className="flex items-center gap-2 p-3 rounded bg-amber-50 border border-amber-200 text-[11px] text-amber-900">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-feedback-warning" />
                  <span>Demo Voucher: Generated for frontend prototype testing. Official reservation confirmation will be issued when backend booking engine is live.</span>
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
                className="gap-2 font-semibold"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Save Voucher</span>
              </Button>

              <div className="flex items-center gap-3">
                <Link to="/booking" onClick={resetBookingFlow}>
                  <Button variant="outline" size="md" className="gap-2 font-semibold">
                    <CalendarDays className="w-4 h-4" />
                    <span>Book Another Stay</span>
                  </Button>
                </Link>

                <Link to="/" onClick={resetBookingFlow}>
                  <Button variant="primary" size="md" className="gap-2 font-bold shadow-sm">
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
