import React, { useState, useRef, useEffect } from 'react';
import { Users, Plus, Minus, ChevronDown, Check, Info } from 'lucide-react';
import { Button } from '../common/Button';
import { HOTEL_OCCUPANCY_POLICY } from '../../data/demoOccupancyConfig';

export interface GuestOccupancyPopoverProps {
  adults: number;
  childrenCount: number;
  rooms: number;
  onChange: (values: { adults: number; children: number; rooms: number }) => void;
}

export const GuestOccupancyPopover: React.FC<GuestOccupancyPopoverProps> = ({
  adults,
  childrenCount,
  rooms,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const totalGuests = adults + childrenCount;
  const maxAdultsAllowed = rooms * HOTEL_OCCUPANCY_POLICY.perRoomLimits.maxAdults;
  const maxChildrenAllowed = rooms * HOTEL_OCCUPANCY_POLICY.perRoomLimits.maxChildrenBelow10;

  const handleRoomsChange = (newRooms: number) => {
    if (newRooms < 1 || newRooms > 10) return;
    const clampedAdults = Math.min(adults, newRooms * HOTEL_OCCUPANCY_POLICY.perRoomLimits.maxAdults);
    const clampedChildren = Math.min(childrenCount, newRooms * HOTEL_OCCUPANCY_POLICY.perRoomLimits.maxChildrenBelow10);
    onChange({
      adults: Math.max(newRooms, clampedAdults),
      children: clampedChildren,
      rooms: newRooms,
    });
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm bg-neutral-light border border-neutral-border text-neutral-text hover:border-brand/50 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand font-medium transition-all"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <span className="flex items-center gap-2 truncate">
          <Users className="w-4 h-4 text-brand shrink-0" />
          <span>
            {totalGuests} {totalGuests === 1 ? 'Guest' : 'Guests'}  {rooms} {rooms === 1 ? 'Room' : 'Rooms'}
          </span>
        </span>
        <ChevronDown className={`w-4 h-4 text-neutral-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-30 p-4 bg-white rounded-card border border-neutral-border shadow-elevated animate-in fade-in zoom-in-95 duration-150 min-w-[300px]">
          <div className="flex flex-col gap-4">
            {/* Rooms Stepper */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-neutral-dark block">Rooms</span>
                <span className="text-[11px] text-neutral-secondary">Number of rooms</span>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  disabled={rooms <= 1}
                  onClick={() => handleRoomsChange(rooms - 1)}
                  aria-label="Decrease rooms count"
                  className="w-8 h-8 rounded-full border border-neutral-border flex items-center justify-center text-neutral-dark hover:bg-neutral-light disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-6 text-center text-sm font-bold text-neutral-dark">{rooms}</span>
                <button
                  type="button"
                  disabled={rooms >= 10}
                  onClick={() => handleRoomsChange(rooms + 1)}
                  aria-label="Increase rooms count"
                  className="w-8 h-8 rounded-full border border-neutral-border flex items-center justify-center text-neutral-dark hover:bg-neutral-light disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Adults Stepper */}
            <div className="flex items-center justify-between border-t border-neutral-border/60 pt-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-neutral-dark block">Adults</span>
                  <span className="text-[10px] bg-brand/10 text-brand px-1.5 py-0.5 rounded font-medium">
                    Max 3 / room
                  </span>
                </div>
                <span className="text-[11px] text-neutral-secondary">Age 10+ years</span>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  disabled={adults <= rooms}
                  onClick={() => onChange({ adults: adults - 1, children: childrenCount, rooms })}
                  aria-label="Decrease adult guests"
                  className="w-8 h-8 rounded-full border border-neutral-border flex items-center justify-center text-neutral-dark hover:bg-neutral-light disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-6 text-center text-sm font-bold text-neutral-dark">{adults}</span>
                <button
                  type="button"
                  disabled={adults >= maxAdultsAllowed}
                  onClick={() => onChange({ adults: adults + 1, children: childrenCount, rooms })}
                  aria-label="Increase adult guests"
                  title={adults >= maxAdultsAllowed ? `Maximum 3 adults per room (Max ${maxAdultsAllowed} for ${rooms} room${rooms > 1 ? 's' : ''})` : ''}
                  className="w-8 h-8 rounded-full border border-neutral-border flex items-center justify-center text-neutral-dark hover:bg-neutral-light disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Children Stepper (under 10 yrs) */}
            <div className="flex items-center justify-between border-t border-neutral-border/60 pt-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-neutral-dark block">Children (Below 10 yrs)</span>
                  <span className="text-[10px] bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded font-medium">
                    Max 1 / room
                  </span>
                </div>
                <span className="text-[11px] text-neutral-secondary">Age 0 to 9 years</span>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  disabled={childrenCount <= 0}
                  onClick={() => onChange({ adults, children: childrenCount - 1, rooms })}
                  aria-label="Decrease children"
                  className="w-8 h-8 rounded-full border border-neutral-border flex items-center justify-center text-neutral-dark hover:bg-neutral-light disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-6 text-center text-sm font-bold text-neutral-dark">{childrenCount}</span>
                <button
                  type="button"
                  disabled={childrenCount >= maxChildrenAllowed}
                  onClick={() => onChange({ adults, children: childrenCount + 1, rooms })}
                  aria-label="Increase children"
                  title={childrenCount >= maxChildrenAllowed ? `Maximum 1 child below 10 years per room (Max ${maxChildrenAllowed} for ${rooms} room${rooms > 1 ? 's' : ''})` : ''}
                  className="w-8 h-8 rounded-full border border-neutral-border flex items-center justify-center text-neutral-dark hover:bg-neutral-light disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Policy Notice Box */}
            <div className="rounded-lg bg-neutral-light/80 border border-neutral-border/60 p-2.5 text-[11px] text-neutral-secondary flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-brand shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p>
                  <strong>Hotel Policy:</strong> Max 3 Adults and 1 Child (under 10 yrs) per room.
                </p>
                <p className="text-[10px] text-neutral-dark/80">
                   <strong>Children above 10 years:</strong> Must be counted as Adults (max 3 adults/room).
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="w-full font-bold gap-1.5"
            >
              <Check className="w-4 h-4" />
              Apply
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
