import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays, ShieldCheck, Check, Phone, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { ApiRoomCategory } from '../../types/booking';
import { formatCurrencyINR } from '../../utils/formatters';
import { useBooking } from '../../store/BookingContext';

export interface RoomBookingCardProps {
  category: ApiRoomCategory;
}

export const RoomBookingCard: React.FC<RoomBookingCardProps> = ({ category }) => {
  const navigate = useNavigate();
  const { setSelectedCategorySlug } = useBooking();

  const handleBookNow = () => {
    setSelectedCategorySlug(category.slug);
    navigate('/booking');
  };

  const basePrice = parseFloat(category.base_price_per_night) || 0;
  const roomCount = category.total_physical_room_count || category.active_physical_room_count;

  return (
    <Card variant="elevated" className="bg-white border-neutral-200/90 p-6 shadow-elevated sticky top-24 rounded-2xl">
      <CardContent className="p-0 flex flex-col gap-5">
        {/* Pricing Header */}
        <div className="flex flex-col gap-1 pb-4 border-b border-neutral-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-secondary">
              Direct Tariff
            </span>
            <Badge variant="brand" size="sm" className="font-bold">
              {category.name}
            </Badge>
          </div>

          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-3xl font-black text-brand">
              {formatCurrencyINR(basePrice)}
            </span>
            <span className="text-xs text-neutral-secondary font-medium">/ night</span>
          </div>

          <span className="text-[11px] text-neutral-500 mt-0.5">
            Excl. 5% GST • Transparent billing at checkout
          </span>
        </div>

        {/* Confirmed Inventory Badge (if available) */}
        {roomCount > 0 && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-xs">
            <span className="text-neutral-secondary font-medium">Operational Capacity:</span>
            <span className="font-bold text-neutral-dark">
              {roomCount} Rooms
            </span>
          </div>
        )}

        {/* Inclusions / Perks list */}
        <div className="flex flex-col gap-2.5 text-xs text-neutral-secondary">
          <span className="font-bold uppercase tracking-wider text-neutral-dark text-[11px]">
            Reservation Inclusions:
          </span>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-feedback-success shrink-0" />
            <span>Best direct hotel rate guarantee</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-feedback-success shrink-0" />
            <span>Private attached bath &amp; 24/7 hot water</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-feedback-success shrink-0" />
            <span>WAKEFIT mattress &amp; 32" Smart TV in bedroom</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-feedback-success shrink-0" />
            <span>Instant booking voucher &amp; no middleman fee</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 pt-2">
          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={handleBookNow}
            className="w-full gap-2 font-bold shadow-md h-12 text-sm"
          >
            <CalendarDays className="w-5 h-5" />
            <span>Book This Room</span>
            <ArrowRight className="w-4 h-4 ml-auto" />
          </Button>

          <Link to="/contact" className="w-full">
            <Button variant="outline" size="md" className="w-full gap-2 font-semibold text-xs h-10">
              <Phone className="w-3.5 h-3.5" />
              Inquire with Front Desk
            </Button>
          </Link>
        </div>

        {/* Security / ID Notice */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-neutral-500 pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-feedback-success" />
          <span>Original Aadhar ID required at check-in (18+)</span>
        </div>
      </CardContent>
    </Card>
  );
};
