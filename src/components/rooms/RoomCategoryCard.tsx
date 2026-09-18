import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Bed, Wind, ArrowRight, Check } from 'lucide-react';
import { RoomCategory } from '../../types/roomCategory';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { formatCurrencyINR } from '../../utils/formatters';
import { useBooking } from '../../store/BookingContext';

export interface RoomCategoryCardProps {
  category: RoomCategory;
}

export const RoomCategoryCard: React.FC<RoomCategoryCardProps> = ({ category }) => {
  const navigate = useNavigate();
  const { setSelectedCategorySlug } = useBooking();

  const handleBookNow = () => {
    setSelectedCategorySlug(category.slug);
    navigate('/booking');
  };

  return (
    <Card variant="elevated" className="bg-white flex flex-col h-full group">
      {/* Image Container with Badges */}
      <div className="relative aspect-[16/10] overflow-hidden bg-neutral-100">
        <img
          src={category.demoImages.hero}
          alt={`${category.name} room preview (Demo Image)`}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <Badge variant="brand" size="sm" className="font-bold shadow-sm">
            {category.name}
          </Badge>
          <Badge variant="default" size="sm" className="bg-white/90 backdrop-blur-sm shadow-sm">
            {category.totalInventory} Rooms (Confirmed)
          </Badge>
        </div>
      </div>

      {/* Card Content Area */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between gap-5">
        <div className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-xl font-bold text-neutral-dark group-hover:text-brand transition-colors">
              {category.name}
            </h3>
            <div className="text-right">
              <span className="text-xs text-neutral-secondary font-medium block">Starting from</span>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-extrabold text-brand">
                  {formatCurrencyINR(category.demoBasePricePerNight)}
                </span>
                <span className="text-[11px] text-neutral-secondary font-medium">/ night</span>
              </div>
              <span className="text-[10px] text-neutral-400 block -mt-0.5">Demo Rate</span>
            </div>
          </div>

          {/* Quick Specification Pills */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-secondary py-1 border-y border-neutral-border/60">
            <span className="flex items-center gap-1.5 font-medium">
              <Users className="w-4 h-4 text-brand" />
              Up to {category.demoCapacity.maxAdults} Guests
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <Bed className="w-4 h-4 text-brand" />
              {category.demoBedType.replace(' (Demo specification)', '')}
            </span>
            {category.id === 'ac-room' ? (
              <span className="flex items-center gap-1.5 font-medium text-feedback-success">
                <Wind className="w-4 h-4" />
                Air Conditioned
              </span>
            ) : (
              <span className="flex items-center gap-1.5 font-medium text-neutral-600">
                <Wind className="w-4 h-4 text-neutral-400" />
                Ceiling Fan
              </span>
            )}
          </div>

          {/* Selected Demo Amenities */}
          <ul className="flex flex-col gap-1.5 text-xs text-neutral-secondary">
            {category.demoAmenities.slice(0, 3).map((amenity, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-feedback-success shrink-0" />
                <span className="truncate">{amenity}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center gap-3">
          <Link to={`/rooms/${category.slug}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full font-semibold">
              View Details
            </Button>
          </Link>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleBookNow}
            className="flex-1 font-bold gap-1.5"
          >
            Book Now
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
