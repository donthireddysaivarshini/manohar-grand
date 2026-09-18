import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, Home, Search, ArrowRight } from 'lucide-react';
import { Button } from '../common/Button';
import { useBooking } from '../../store/BookingContext';
import { DEMO_OCCUPANCY_CONFIG } from '../../data/demoOccupancyConfig';
import { cn } from '../../utils/cn';

export interface BookingSearchWidgetProps {
  className?: string;
  variant?: 'floating' | 'inline';
}

export const BookingSearchWidget: React.FC<BookingSearchWidgetProps> = ({
  className,
  variant = 'floating',
}) => {
  const navigate = useNavigate();
  const { searchParams, setSearchParams } = useBooking();

  // Local widget state for smooth editing
  const [checkIn, setCheckIn] = useState(searchParams.checkIn || '');
  const [checkOut, setCheckOut] = useState(searchParams.checkOut || '');
  const [adults, setAdults] = useState(searchParams.adults || 2);
  const [rooms, setRooms] = useState(searchParams.rooms || 1);

  // Get tomorrow's date for default minimum date
  const today = new Date().toISOString().split('T')[0];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Update booking store context
    setSearchParams({
      checkIn: checkIn || today,
      checkOut: checkOut || today,
      adults: Number(adults),
      rooms: Number(rooms),
    });
    // Navigate to booking page
    navigate('/booking');
  };

  return (
    <div
      className={cn(
        'w-full bg-white rounded-card border border-neutral-border shadow-elevated p-4 sm:p-6 transition-all',
        variant === 'floating' && '-mt-10 sm:-mt-14 relative z-20',
        className
      )}
    >
      <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
        {/* Field 1: Check-in Date */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-neutral-dark flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-brand" />
            Check-In
          </label>
          <input
            type="date"
            min={today}
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-neutral-light border border-neutral-border text-neutral-text focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand font-medium"
          />
        </div>

        {/* Field 2: Check-out Date */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-neutral-dark flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-brand" />
            Check-Out
          </label>
          <input
            type="date"
            min={checkIn || today}
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-neutral-light border border-neutral-border text-neutral-text focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand font-medium"
          />
        </div>

        {/* Field 3: Guests */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-neutral-dark flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-brand" />
            Guests
          </label>
          <select
            value={adults}
            onChange={(e) => setAdults(Number(e.target.value))}
            className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-neutral-light border border-neutral-border text-neutral-text focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand font-medium"
          >
            {Array.from(
              { length: DEMO_OCCUPANCY_CONFIG.limits.maxAdults - DEMO_OCCUPANCY_CONFIG.limits.minAdults + 1 },
              (_, i) => i + DEMO_OCCUPANCY_CONFIG.limits.minAdults
            ).map((num) => (
              <option key={num} value={num}>
                {num} {num === 1 ? 'Guest' : 'Guests'}
              </option>
            ))}
          </select>
        </div>

        {/* Field 4: Rooms */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-neutral-dark flex items-center gap-1.5">
            <Home className="w-3.5 h-3.5 text-brand" />
            Rooms
          </label>
          <select
            value={rooms}
            onChange={(e) => setRooms(Number(e.target.value))}
            className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-neutral-light border border-neutral-border text-neutral-text focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand font-medium"
          >
            {Array.from(
              { length: DEMO_OCCUPANCY_CONFIG.limits.maxRooms - DEMO_OCCUPANCY_CONFIG.limits.minRooms + 1 },
              (_, i) => i + DEMO_OCCUPANCY_CONFIG.limits.minRooms
            ).map((num) => (
              <option key={num} value={num}>
                {num} {num === 1 ? 'Room' : 'Rooms'}
              </option>
            ))}
          </select>
        </div>

        {/* Field 5: Submit CTA */}
        <div className="sm:col-span-2 lg:col-span-1">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full font-bold shadow-md gap-2 h-11"
          >
            <Search className="w-4 h-4" />
            <span>Check Rates</span>
            <ArrowRight className="w-4 h-4 hidden xs:inline-block" />
          </Button>
        </div>
      </form>
    </div>
  );
};
