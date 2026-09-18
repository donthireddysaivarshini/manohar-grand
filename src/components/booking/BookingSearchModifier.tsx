import React, { useState } from 'react';
import { Calendar, RefreshCw, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { Button } from '../common/Button';
import { GuestOccupancyPopover } from './GuestOccupancyPopover';
import { useBooking } from '../../store/BookingContext';
import {
  formatDateDisplay,
  getTodayDateString,
  addDaysToDate,
  isValidDateRange,
} from '../../utils/dateUtils';

export interface BookingSearchModifierProps {
  onSearchUpdate?: () => void;
}

export const BookingSearchModifier: React.FC<BookingSearchModifierProps> = ({ onSearchUpdate }) => {
  const { searchParams, setSearchParams, nightsCount } = useBooking();
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

  // Local state during edit
  const [checkIn, setCheckIn] = useState(searchParams.checkIn);
  const [checkOut, setCheckOut] = useState(searchParams.checkOut);
  const [adults, setAdults] = useState(searchParams.adults);
  const [childrenCount, setChildrenCount] = useState(searchParams.children);
  const [rooms, setRooms] = useState(searchParams.rooms);
  const [dateError, setDateError] = useState<string | null>(null);

  const today = getTodayDateString();

  const handleCheckInChange = (newCheckIn: string) => {
    setCheckIn(newCheckIn);
    setDateError(null);
    // If checkOut is before or same as newCheckIn, automatically adjust checkOut to +1 day
    if (!newCheckIn || !isValidDateRange(newCheckIn, checkOut)) {
      setCheckOut(addDaysToDate(newCheckIn, 1));
    }
  };

  const handleCheckOutChange = (newCheckOut: string) => {
    setCheckOut(newCheckOut);
    if (checkIn && !isValidDateRange(checkIn, newCheckOut)) {
      setDateError('Check-out date must be after check-in date');
    } else {
      setDateError(null);
    }
  };

  const handleApplyChanges = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidDateRange(checkIn, checkOut)) {
      setDateError('Check-out date must be after check-in date');
      return;
    }

    setDateError(null);
    setSearchParams({
      checkIn,
      checkOut,
      adults,
      children: childrenCount,
      rooms,
    });

    setIsMobileExpanded(false);
    if (onSearchUpdate) onSearchUpdate();
  };

  const totalGuests = searchParams.adults + searchParams.children;

  return (
    <div className="w-full bg-white rounded-card border border-neutral-border shadow-card p-4 sm:p-5 mb-8">
      {/* Mobile Summary & Toggle Header */}
      <div className="flex sm:hidden items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-secondary">
            Stay Dates &amp; Occupancy
          </span>
          <p className="text-xs font-bold text-neutral-dark mt-0.5">
            {formatDateDisplay(searchParams.checkIn)} → {formatDateDisplay(searchParams.checkOut)} ({nightsCount} {nightsCount === 1 ? 'night' : 'nights'})
          </p>
          <span className="text-[11px] text-neutral-secondary">
            {totalGuests} {totalGuests === 1 ? 'Guest' : 'Guests'} • {searchParams.rooms} {searchParams.rooms === 1 ? 'Room' : 'Rooms'}
          </span>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsMobileExpanded(!isMobileExpanded)}
          className="gap-1 text-xs shrink-0 font-semibold"
        >
          <span>{isMobileExpanded ? 'Hide' : 'Modify'}</span>
          {isMobileExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </Button>
      </div>

      {/* Search Form: Visible on desktop or when expanded on mobile */}
      <div className={`${isMobileExpanded ? 'block pt-4 mt-4 border-t border-neutral-border/60' : 'hidden sm:block'}`}>
        <form onSubmit={handleApplyChanges} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 items-end">
          {/* Check-in Date (3 cols) */}
          <div className="lg:col-span-3 flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-dark flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-brand" />
              Check-In Date
            </label>
            <input
              type="date"
              min={today}
              value={checkIn}
              onChange={(e) => handleCheckInChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-neutral-light border border-neutral-border text-neutral-text focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand font-medium"
              required
            />
          </div>

          {/* Check-out Date (3 cols) */}
          <div className="lg:col-span-3 flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-dark flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-brand" />
              Check-Out Date
            </label>
            <input
              type="date"
              min={checkIn ? addDaysToDate(checkIn, 1) : today}
              value={checkOut}
              onChange={(e) => handleCheckOutChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-neutral-light border border-neutral-border text-neutral-text focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand font-medium"
              required
            />
          </div>

          {/* Guest Occupancy Popover (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-dark">
              Guests &amp; Rooms
            </label>
            <GuestOccupancyPopover
              adults={adults}
              childrenCount={childrenCount}
              rooms={rooms}
              onChange={(val) => {
                setAdults(val.adults);
                setChildrenCount(val.children);
                setRooms(val.rooms);
              }}
            />
          </div>

          {/* Update Button (2 cols) */}
          <div className="sm:col-span-2 lg:col-span-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full gap-2 font-bold shadow-sm h-10"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Update
            </Button>
          </div>
        </form>

        {dateError && (
          <div className="mt-3 flex items-center gap-2 text-xs text-feedback-error font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{dateError}</span>
          </div>
        )}
      </div>
    </div>
  );
};
