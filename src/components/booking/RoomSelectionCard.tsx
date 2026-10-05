import React from 'react';
import { Users, Bed, Wind, Plus, Minus, Check } from 'lucide-react';
import { Card, CardContent } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { CategoryAvailabilityResult } from '../../types/booking';
import { formatCurrencyINR } from '../../utils/formatters';

import { NEUTRAL_ROOM_PLACEHOLDER } from '../../utils/mediaUtils';

export interface RoomSelectionCardProps {
  availability: CategoryAvailabilityResult;
  currentQuantity: number;
  onQuantityChange: (newQuantity: number) => void;
  nightsCount: number;
}

export const RoomSelectionCard: React.FC<RoomSelectionCardProps> = ({
  availability,
  currentQuantity,
  onQuantityChange,
  nightsCount,
}) => {
  const isSelected = currentQuantity > 0;
  const isAcRoom = availability.slug.toLowerCase().includes('ac') && !availability.slug.toLowerCase().includes('non-ac');
  const maxAvailable = availability.availableQuantity;

  const roomImage = availability.primaryImage || NEUTRAL_ROOM_PLACEHOLDER;

  return (
    <Card
      variant={isSelected ? 'elevated' : 'bordered'}
      className={`bg-white transition-all overflow-hidden ${
        isSelected ? 'border-brand ring-1 ring-brand/50 shadow-card-hover' : 'border-neutral-border'
      }`}
    >
      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
          {/* Room Image Column (4 cols) */}
          <div className="md:col-span-4 relative aspect-[16/10] md:aspect-auto min-h-[180px] bg-neutral-100 overflow-hidden">
            <img
              src={roomImage}
              alt={`${availability.categoryName} preview`}
              loading="lazy"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
              <Badge variant="brand" size="sm" className="font-bold shadow-sm">
                {availability.categoryName}
              </Badge>
              {isSelected && (
                <Badge variant="success" size="sm" className="font-bold shadow-sm flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  {currentQuantity} {currentQuantity === 1 ? 'Room Selected' : 'Rooms Selected'}
                </Badge>
              )}
            </div>
          </div>

          {/* Room Information & Controls Column (8 cols) */}
          <div className="md:col-span-8 p-5 sm:p-6 flex flex-col justify-between gap-5">
            <div className="flex flex-col gap-3">
              {/* Title & Availability Badges */}
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                <div>
                  <h3 className="text-xl font-bold text-neutral-dark">
                    {availability.categoryName}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <Badge
                      variant={availability.availableQuantity > 0 ? 'success' : 'error'}
                      size="sm"
                      className="text-[10px] font-bold"
                    >
                      {availability.availableQuantity > 0
                        ? 'Available for Selected Dates'
                        : 'Sold Out on Selected Dates'}
                    </Badge>
                  </div>
                </div>

                {/* Price Display */}
                <div className="text-left sm:text-right mt-2 sm:mt-0">
                  <span className="text-[11px] text-neutral-secondary font-medium block">
                    Base tariff
                  </span>
                  <div className="flex items-baseline sm:justify-end gap-1">
                    <span className="text-2xl font-black text-brand">
                      {formatCurrencyINR(availability.ratePerNight)}
                    </span>
                    <span className="text-xs text-neutral-secondary font-medium">/ night</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 block -mt-0.5">Excl. 5% GST</span>
                </div>
              </div>

              {/* Quick Specs */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-secondary py-2 border-y border-neutral-border/60">
                <span className="flex items-center gap-1.5 font-medium">
                  <Users className="w-3.5 h-3.5 text-brand" />
                  Up to {availability.maxAdultsPerRoom || availability.maxTotalOccupancy || 2} Guests per room
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <Bed className="w-3.5 h-3.5 text-brand" />
                  Double Bed (Wakefit Foam)
                </span>
                {isAcRoom ? (
                  <span className="flex items-center gap-1.5 font-medium text-feedback-success">
                    <Wind className="w-3.5 h-3.5" />
                    Air Conditioned
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 font-medium text-neutral-600">
                    <Wind className="w-3.5 h-3.5 text-neutral-400" />
                    Ceiling Fan &amp; Ventilation
                  </span>
                )}
              </div>

              <p className="text-xs text-neutral-secondary leading-relaxed">
                {availability.description ||
                  (isAcRoom
                    ? 'Spacious climate-controlled room with private attached bathroom, hot water amenities, and daily housekeeping.'
                    : 'Practical, well-ventilated accommodation with ceiling fan cooling, attached private bathroom, and daily housekeeping.')}
              </p>
            </div>

            {/* Room Quantity Selector & Actions */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-neutral-border/60">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-neutral-dark uppercase tracking-wider">
                  Quantity:
                </span>
                <div className="flex items-center gap-2 bg-neutral-light p-1 rounded-lg border border-neutral-border">
                  <button
                    type="button"
                    disabled={currentQuantity <= 0}
                    onClick={() => onQuantityChange(currentQuantity - 1)}
                    aria-label={`Decrease ${availability.categoryName} count`}
                    className="w-8 h-8 rounded-md bg-white border border-neutral-border flex items-center justify-center text-neutral-dark hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>

                  <span className="w-8 text-center text-sm font-bold text-neutral-dark">
                    {currentQuantity}
                  </span>

                  <button
                    type="button"
                    disabled={currentQuantity >= maxAvailable}
                    onClick={() => onQuantityChange(currentQuantity + 1)}
                    aria-label={`Increase ${availability.categoryName} count`}
                    className="w-8 h-8 rounded-md bg-white border border-neutral-border flex items-center justify-center text-neutral-dark hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {currentQuantity >= maxAvailable && maxAvailable > 0 && (
                  <span className="text-[11px] text-amber-700 font-medium">
                    Maximum limit reached
                  </span>
                )}
              </div>

              {/* Selection Summary or Select Button */}
              {currentQuantity === 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  disabled={maxAvailable <= 0}
                  onClick={() => onQuantityChange(1)}
                  className="font-bold border-brand text-brand hover:bg-brand hover:text-white transition-colors disabled:opacity-50"
                >
                  {maxAvailable > 0 ? 'Select 1 Room' : 'Sold Out'}
                </Button>
              ) : (
                <div className="text-right">
                  <span className="text-[11px] text-neutral-secondary block">
                    {currentQuantity} {currentQuantity === 1 ? 'Room' : 'Rooms'} × {nightsCount} {nightsCount === 1 ? 'night' : 'nights'}
                  </span>
                  <span className="text-base font-extrabold text-brand">
                    {formatCurrencyINR(availability.ratePerNight * currentQuantity * nightsCount)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
