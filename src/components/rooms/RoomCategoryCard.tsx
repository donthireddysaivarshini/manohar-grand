import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Bed, ArrowRight, Check, Car, Wind, AlertCircle } from 'lucide-react';
import { RoomCategory } from '../../types/roomCategory';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { formatCurrencyINR } from '../../utils/formatters';
import { useBooking } from '../../store/BookingContext';

export interface RoomCategoryCardProps {
  category: RoomCategory & {
    occupancyNote?: string;
  };
}

/**
 * Enhanced Room Category Card.
 * - Larger image proportion with smooth hover zoom.
 * - Clear occupancy indicators (Up to 2 guests + 3rd/4th guest extra charge notice for AC).
 * - Car parking convenience badge.
 * - Semantic navigation: AC -> /rooms/ac-room, Non-AC -> /rooms/non-ac-room, Book Now -> /booking.
 */
export const RoomCategoryCard: React.FC<RoomCategoryCardProps> = ({ category }) => {
  const navigate = useNavigate();
  const { setSelectedCategorySlug } = useBooking();

  const handleBookNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCategorySlug(category.slug);
    navigate('/booking');
  };

  const isAc = category.id === 'ac-room' || category.slug === 'ac-room';

  return (
    <Card
      variant="default"
      className="bg-white border border-neutral-200/90 rounded-2xl overflow-hidden flex flex-col h-full group transition-all duration-300 hover:border-brand/40 hover:-translate-y-1.5 hover:shadow-card-hover"
    >
      {/* 1. Large Image Showcase with Badges */}
      <Link
        to={`/rooms/${category.slug}`}
        className="relative aspect-[16/10] overflow-hidden bg-neutral-100 block cursor-pointer"
        aria-label={`View ${category.name} details`}
      >
        <img
          src={category.demoImages.hero}
          alt={`${category.name} room preview (Demo Stock)`}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className="absolute top-3.5 left-3.5 flex flex-wrap gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand text-white shadow-md">
            {category.name}
          </span>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-neutral-900/80 backdrop-blur-md text-white shadow-sm flex items-center gap-1">
            <Car className="w-3 h-3 text-brand" />
            Parking Available
          </span>
        </div>
      </Link>

      {/* 2. Card Content Area */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between gap-4.5">
        <div className="flex flex-col gap-3">
          {/* Header Title & Pricing */}
          <div className="flex items-start justify-between gap-3">
            <Link to={`/rooms/${category.slug}`} className="group/title">
              <h3 className="text-xl font-extrabold text-neutral-dark group-hover/title:text-brand transition-colors">
                {category.name}
              </h3>
              <p className="text-xs text-neutral-secondary mt-0.5">
                {isAc ? 'Air-Conditioned Comfort' : 'Natural Ventilation & Ceiling Fan'}
              </p>
            </Link>

            <div className="text-right shrink-0">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
                Demo Rate
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-brand tracking-tight">
                  {formatCurrencyINR(category.demoBasePricePerNight)}
                </span>
                <span className="text-xs text-neutral-500 font-medium">/ night</span>
              </div>
            </div>
          </div>

          {/* Key Amenities / Feature Pills */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-secondary py-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F7F7F7] border border-neutral-200 text-neutral-700 font-semibold">
              <Users className="w-3.5 h-3.5 text-brand" />
              Up to 2 Guests (Base)
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F7F7F7] border border-neutral-200 text-neutral-700 font-medium">
              <Bed className="w-3.5 h-3.5 text-neutral-500" />
              Double Bed
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F7F7F7] border border-neutral-200 text-neutral-700 font-medium">
              <Wind className="w-3.5 h-3.5 text-neutral-500" />
              {isAc ? 'AC Climate' : 'Ceiling Fan'}
            </span>
          </div>

          {/* Grey Highlight Box for Extra Occupancy Note */}
          {isAc ? (
            <div className="p-3 rounded-xl bg-[#F7F7F7] border border-neutral-200/90 flex items-start gap-2 text-xs text-neutral-600">
              <AlertCircle className="w-4 h-4 text-brand shrink-0 mt-0.5" />
              <div className="leading-snug">
                <strong className="text-neutral-dark">Occupancy Notice: </strong>
                Extra charge may apply for 3rd &amp; 4th guest (rate to be confirmed upon check-in).
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-[#F7F7F7] border border-neutral-200/90 flex items-start gap-2 text-xs text-neutral-600">
              <Check className="w-4 h-4 text-feedback-success shrink-0 mt-0.5" />
              <div className="leading-snug">
                <strong className="text-neutral-dark">Economical Stay: </strong>
                Up to 2 guests in clean, well-ventilated accommodation with attached bath.
              </div>
            </div>
          )}

          {/* Quick Checklist */}
          <ul className="grid grid-cols-2 gap-1.5 text-xs text-neutral-secondary pt-1">
            <li className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-feedback-success shrink-0" />
              <span>Attached Bath &amp; Hot Water</span>
            </li>
            <li className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-feedback-success shrink-0" />
              <span>24/7 Front Desk Support</span>
            </li>
            <li className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-feedback-success shrink-0" />
              <span>Car Parking on Property</span>
            </li>
            <li className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-feedback-success shrink-0" />
              <span>Daily Housekeeping</span>
            </li>
          </ul>
        </div>

        {/* 3. Action Buttons */}
        <div className="pt-2 flex items-center gap-3 border-t border-neutral-100">
          <Link to={`/rooms/${category.slug}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full font-semibold h-10">
              View Details
            </Button>
          </Link>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleBookNow}
            className="flex-1 font-bold gap-1.5 shadow-sm h-10"
          >
            Book Now
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
