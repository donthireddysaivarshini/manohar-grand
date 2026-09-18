import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays, ShieldCheck, Check, Phone, ArrowRight, ShieldAlert } from 'lucide-react';
import { Card, CardContent } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { RoomCategoryExtended } from '../../data/roomCategories';
import { formatCurrencyINR } from '../../utils/formatters';
import { useBooking } from '../../store/BookingContext';

export interface RoomBookingCardProps {
  category: RoomCategoryExtended;
}

export const RoomBookingCard: React.FC<RoomBookingCardProps> = ({ category }) => {
  const navigate = useNavigate();
  const { setSelectedCategorySlug } = useBooking();

  const handleBookNow = () => {
    setSelectedCategorySlug(category.slug);
    navigate('/booking');
  };

  return (
    <Card variant="elevated" className="bg-white border-neutral-border p-6 shadow-elevated sticky top-24">
      <CardContent className="p-0 flex flex-col gap-5">
        {/* Pricing Header */}
        <div className="flex flex-col gap-1 pb-4 border-b border-neutral-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-secondary">
              Direct Booking Rate
            </span>
            <Badge variant="brand" size="sm" className="font-bold">
              {category.name}
            </Badge>
          </div>

          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-3xl font-black text-brand">
              {formatCurrencyINR(category.demoBasePricePerNight)}
            </span>
            <span className="text-xs text-neutral-secondary font-medium">/ night</span>
          </div>

          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-amber-700 bg-amber-50 p-2 rounded-md border border-amber-200">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-feedback-warning" />
            <span>Demo rate — replace with client-confirmed rate.</span>
          </div>
        </div>

        {/* Confirmed Inventory Badge */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-light border border-neutral-border text-xs">
          <span className="text-neutral-secondary font-medium">Property Inventory:</span>
          <span className="font-bold text-neutral-dark">
            {category.totalInventory} Rooms (Confirmed)
          </span>
        </div>

        {/* Inclusions / Perks list */}
        <div className="flex flex-col gap-2.5 text-xs text-neutral-secondary">
          <span className="font-bold uppercase tracking-wider text-neutral-dark text-[11px]">
            Reservation Inclusions:
          </span>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-feedback-success shrink-0" />
            <span>Best rate guarantee for direct reservations</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-feedback-success shrink-0" />
            <span>Private attached bathroom &amp; daily housekeeping</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-feedback-success shrink-0" />
            <span>Instant booking voucher &amp; no hidden middleman fees</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 pt-2">
          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={handleBookNow}
            className="w-full gap-2 font-bold shadow-md h-12"
          >
            <CalendarDays className="w-5 h-5" />
            <span>Book This Room</span>
            <ArrowRight className="w-4 h-4 ml-auto" />
          </Button>

          <Link to="/contact" className="w-full">
            <Button variant="outline" size="md" className="w-full gap-2 font-semibold text-xs">
              <Phone className="w-3.5 h-3.5" />
              Inquire with Front Desk
            </Button>
          </Link>
        </div>

        {/* Security / Direct Guarantee */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-neutral-400 pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-feedback-success" />
          <span>Secure direct reservation simulation</span>
        </div>
      </CardContent>
    </Card>
  );
};
