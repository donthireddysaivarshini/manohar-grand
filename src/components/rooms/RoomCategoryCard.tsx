import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Bed, ArrowRight, Check, Car, Wind, AlertCircle, Sparkles } from 'lucide-react';
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
 * Enhanced Responsive Room Category Card.
 * - Optimized for iPhone & all viewports (zero horizontal overflow or text clipping).
 * - Clear occupancy & Wakefit mattress comfort badge.
 * - AC and Non-AC specific feature callouts.
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
      className="bg-white border border-neutral-200/90 rounded-2xl overflow-hidden flex flex-col h-full group transition-all duration-300 hover:border-brand/40 hover:-translate-y-1.5 hover:shadow-card-hover w-full max-w-full"
    >
      {/* 1. Image Showcase with Badges */}
      <Link
        to={`/rooms/${category.slug}`}
        className="relative aspect-[16/10] overflow-hidden bg-neutral-100 block cursor-pointer w-full"
        aria-label={`View ${category.name} details`}
      >
        <img
          src={category.demoImages.hero}
          alt={`${category.name} room preview`}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className="absolute top-2.5 left-2.5 sm:top-3.5 sm:left-3.5 flex flex-wrap gap-1.5 sm:gap-2 max-w-[90%]">
          <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold bg-brand text-white shadow-md">
            {category.name}
          </span>
          <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-semibold bg-neutral-900/85 backdrop-blur-md text-white shadow-sm flex items-center gap-1">
            <Car className="w-3 h-3 text-brand shrink-0" />
            <span>Parking Available</span>
          </span>
        </div>
      </Link>

      {/* 2. Card Content Area */}
      <div className="p-4 xs:p-5 sm:p-6 flex-1 flex flex-col justify-between gap-4">
        <div className="flex flex-col gap-3">
          {/* Header Title & Pricing */}
          <div className="flex items-start justify-between gap-2 flex-wrap sm:flex-nowrap">
            <Link to={`/rooms/${category.slug}`} className="group/title min-w-0 flex-1">
              <h3 className="text-lg xs:text-xl font-extrabold text-neutral-dark group-hover/title:text-brand transition-colors truncate">
                {category.name}
              </h3>
              <p className="text-[11px] xs:text-xs text-neutral-secondary mt-0.5">
                {isAc ? 'Air-Conditioned Climate Control' : 'Ceiling Fan & Natural Ventilation'}
              </p>
            </Link>

            <div className="text-right shrink-0">
              <span className="text-[9px] xs:text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
                Demo Rate
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-lg xs:text-xl font-black text-brand tracking-tight">
                  {formatCurrencyINR(category.demoBasePricePerNight)}
                </span>
                <span className="text-[11px] text-neutral-500 font-medium">/ night</span>
              </div>
            </div>
          </div>

          {/* Wakefit Mattress & Smart TV Feature Banner */}
          <div className="p-2.5 rounded-xl bg-red-50/70 border border-brand/20 flex flex-col gap-1 text-xs text-brand">
            <div className="flex items-center gap-1.5 font-bold">
              <Sparkles className="w-3.5 h-3.5 text-brand shrink-0" />
              <span className="text-[11px] sm:text-xs">
                WAKEFIT Memory Foam Mattress in all bedrooms
              </span>
            </div>
            <span className="text-[10px] text-neutral-600 pl-5">
              32" Smart TV with OTT Apps (subscription not included)
            </span>
          </div>

          {/* Key Feature Pills */}
          <div className="flex flex-wrap items-center gap-1.5 xs:gap-2 text-xs text-neutral-secondary">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 xs:px-2.5 xs:py-1 rounded-md bg-[#F7F7F7] border border-neutral-200 text-neutral-700 font-semibold text-[11px] xs:text-xs">
              <Users className="w-3 h-3 text-brand shrink-0" />
              Up to 2 Guests (Base)
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 xs:px-2.5 xs:py-1 rounded-md bg-[#F7F7F7] border border-neutral-200 text-neutral-700 font-medium text-[11px] xs:text-xs">
              <Bed className="w-3 h-3 text-neutral-500 shrink-0" />
              Double Bed
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 xs:px-2.5 xs:py-1 rounded-md bg-[#F7F7F7] border border-neutral-200 text-neutral-700 font-medium text-[11px] xs:text-xs">
              <Wind className="w-3 h-3 text-neutral-500 shrink-0" />
              {isAc ? 'AC Climate' : 'Ceiling Fan'}
            </span>
          </div>

          {/* Occupancy Notice Box */}
          {isAc ? (
            <div className="p-2.5 xs:p-3 rounded-xl bg-[#F7F7F7] border border-neutral-200/90 flex items-start gap-2 text-[11px] xs:text-xs text-neutral-600">
              <AlertCircle className="w-4 h-4 text-brand shrink-0 mt-0.5" />
              <div className="leading-snug">
                <strong className="text-neutral-dark">Occupancy: </strong>
                Extra charge applies for 3rd &amp; 4th guest (confirmed at check-in).
              </div>
            </div>
          ) : (
            <div className="p-2.5 xs:p-3 rounded-xl bg-[#F7F7F7] border border-neutral-200/90 flex items-start gap-2 text-[11px] xs:text-xs text-neutral-600">
              <Check className="w-4 h-4 text-feedback-success shrink-0 mt-0.5" />
              <div className="leading-snug">
                <strong className="text-neutral-dark">Economical: </strong>
                Clean, budget stay with Wakefit comfort and attached bath.
              </div>
            </div>
          )}

          {/* Checklist */}
          <ul className="grid grid-cols-1 xs:grid-cols-2 gap-1.5 text-[11px] xs:text-xs text-neutral-secondary pt-0.5">
            <li className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-feedback-success shrink-0" />
              <span className="truncate">Attached Bath &amp; Hot Water</span>
            </li>
            <li className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-feedback-success shrink-0" />
              <span className="truncate">24/7 Front Desk Support</span>
            </li>
            <li className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-feedback-success shrink-0" />
              <span className="truncate">Car Parking on Property</span>
            </li>
            <li className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-feedback-success shrink-0" />
              <span className="truncate">Daily Housekeeping</span>
            </li>
          </ul>
        </div>

        {/* 3. Action Buttons */}
        <div className="pt-2 flex items-center gap-2 xs:gap-3 border-t border-neutral-100">
          <Link to={`/rooms/${category.slug}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full font-semibold h-9 xs:h-10 text-xs">
              View Details
            </Button>
          </Link>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleBookNow}
            className="flex-1 font-bold gap-1 shadow-sm h-9 xs:h-10 text-xs"
          >
            Book Now
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
