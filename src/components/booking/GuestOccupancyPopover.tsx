import React, { useState, useRef, useEffect } from 'react';
import { Users, Plus, Minus, ChevronDown, Check } from 'lucide-react';
import { Button } from '../common/Button';
import { DEMO_OCCUPANCY_CONFIG } from '../../data/demoOccupancyConfig';

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
            {totalGuests} {totalGuests === 1 ? 'Guest' : 'Guests'} • {rooms} {rooms === 1 ? 'Room' : 'Rooms'}
          </span>
        </span>
        <ChevronDown className={`w-4 h-4 text-neutral-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-30 p-4 bg-white rounded-card border border-neutral-border shadow-elevated animate-in fade-in zoom-in-95 duration-150 min-w-[280px]">
          <div className="flex flex-col gap-4">
            {/* Adults Stepper */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-neutral-dark block">Adults</span>
                <span className="text-[11px] text-neutral-secondary">Ages 13 and above (Demo)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  disabled={adults <= DEMO_OCCUPANCY_CONFIG.limits.minAdults}
                  onClick={() => onChange({ adults: adults - 1, children: childrenCount, rooms })}
                  aria-label="Decrease adult guests"
                  className="w-8 h-8 rounded-full border border-neutral-border flex items-center justify-center text-neutral-dark hover:bg-neutral-light disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-6 text-center text-sm font-bold text-neutral-dark">{adults}</span>
                <button
                  type="button"
                  disabled={adults >= DEMO_OCCUPANCY_CONFIG.limits.maxAdults}
                  onClick={() => onChange({ adults: adults + 1, children: childrenCount, rooms })}
                  aria-label="Increase adult guests"
                  className="w-8 h-8 rounded-full border border-neutral-border flex items-center justify-center text-neutral-dark hover:bg-neutral-light disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Children Stepper */}
            <div className="flex items-center justify-between border-t border-neutral-border/60 pt-3">
              <div>
                <span className="text-xs font-bold text-neutral-dark block">Children</span>
                <span className="text-[11px] text-neutral-secondary">Ages 0 to 12 (Demo)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  disabled={childrenCount <= DEMO_OCCUPANCY_CONFIG.limits.minChildren}
                  onClick={() => onChange({ adults, children: childrenCount - 1, rooms })}
                  aria-label="Decrease children"
                  className="w-8 h-8 rounded-full border border-neutral-border flex items-center justify-center text-neutral-dark hover:bg-neutral-light disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-6 text-center text-sm font-bold text-neutral-dark">{childrenCount}</span>
                <button
                  type="button"
                  disabled={childrenCount >= DEMO_OCCUPANCY_CONFIG.limits.maxChildren}
                  onClick={() => onChange({ adults, children: childrenCount + 1, rooms })}
                  aria-label="Increase children"
                  className="w-8 h-8 rounded-full border border-neutral-border flex items-center justify-center text-neutral-dark hover:bg-neutral-light disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Rooms Stepper */}
            <div className="flex items-center justify-between border-t border-neutral-border/60 pt-3">
              <div>
                <span className="text-xs font-bold text-neutral-dark block">Rooms</span>
                <span className="text-[11px] text-neutral-secondary">Target room count (Demo)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  disabled={rooms <= DEMO_OCCUPANCY_CONFIG.limits.minRooms}
                  onClick={() => onChange({ adults, children: childrenCount, rooms: rooms - 1 })}
                  aria-label="Decrease rooms count"
                  className="w-8 h-8 rounded-full border border-neutral-border flex items-center justify-center text-neutral-dark hover:bg-neutral-light disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-6 text-center text-sm font-bold text-neutral-dark">{rooms}</span>
                <button
                  type="button"
                  disabled={rooms >= DEMO_OCCUPANCY_CONFIG.limits.maxRooms}
                  onClick={() => onChange({ adults, children: childrenCount, rooms: rooms + 1 })}
                  aria-label="Increase rooms count"
                  className="w-8 h-8 rounded-full border border-neutral-border flex items-center justify-center text-neutral-dark hover:bg-neutral-light disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="w-full mt-2 font-bold gap-1.5"
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
