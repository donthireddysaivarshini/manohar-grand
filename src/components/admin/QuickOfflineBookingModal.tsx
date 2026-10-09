import React, { useState } from 'react';
import { Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useInventory } from '../../store/InventoryContext';
import { bookingApiService } from '../../services/api/bookingApiService';
import { getTodayDateString, addDaysToDate, isValidDateRange } from '../../utils/dateUtils';

export interface QuickOfflineBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (bookingData: any) => void;
}

export const QuickOfflineBookingModal: React.FC<QuickOfflineBookingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { categories } = useInventory();
  const today = getTodayDateString();
  const tomorrow = addDaysToDate(today, 1);

  const [categoryId, setCategoryId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [checkIn, setCheckIn] = useState<string>(today);
  const [checkOut, setCheckOut] = useState<string>(tomorrow);
  const [guestName, setGuestName] = useState<string>('');
  const [guestPhone, setGuestPhone] = useState<string>('');
  const [source, setSource] = useState<'walk_in' | 'phone' | 'whatsapp' | 'reception'>('walk_in');
  const [notes, setNotes] = useState<string>('');
  const [adults, setAdults] = useState<number>(2);
  const [children, setChildren] = useState<number>(0);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successBooking, setSuccessBooking] = useState<any | null>(null);

  // Set default category when available
  React.useEffect(() => {
    if (categories.length > 0 && !categoryId) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId]);

  const maxAdultsAllowed = quantity * 3;
  const maxChildrenAllowed = quantity * 1;

  const handleQuantityChange = (newQty: number) => {
    setQuantity(newQty);
    if (adults > newQty * 3) setAdults(newQty * 3);
    if (children > newQty * 1) setChildren(newQty * 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isValidDateRange(checkIn, checkOut)) {
      setError('Check-out date must be strictly after check-in date.');
      return;
    }

    if (!categoryId) {
      setError('Please select a room category.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await bookingApiService.createQuickWalkInBooking({
        category_id: categoryId,
        room_quantity: quantity,
        check_in: checkIn,
        check_out: checkOut,
        guest_name: guestName.trim() || 'Front Desk Walk-In',
        guest_phone: guestPhone.trim(),
        source: source,
        internal_notes: notes.trim(),
        total_adults: adults,
        total_children: children,
      });

      setSuccessBooking(res);
      if (onSuccess) onSuccess(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to create offline booking. Please verify room availability.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setSuccessBooking(null);
    setError(null);
    setGuestName('');
    setGuestPhone('');
    setNotes('');
    setQuantity(1);
    setAdults(2);
    setChildren(0);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleResetAndClose}
      title="Quick Offline Booking (Walk-In / Phone)"
      description="Instantly deduct room count for walk-ins or phone calls without requiring full KYC or payment details."
    >
      {successBooking ? (
        <div className="py-6 text-center space-y-4">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-neutral-dark">Offline Reservation Confirmed!</h3>
            <p className="text-sm text-neutral-secondary mt-1">
              Booking Reference:{' '}
              <span className="font-mono font-bold text-brand">{successBooking.booking_reference || 'Confirmed'}</span>
            </p>
            <p className="text-xs text-neutral-500 mt-2">
              {quantity} room(s) allocated for {checkIn} to {checkOut}. Inventory has been decremented in real-time.
            </p>
          </div>
          <Button type="button" variant="primary" onClick={handleResetAndClose} className="w-full">
            Done / Close
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Category & Rooms */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-neutral-dark block mb-1">
                Room Category *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm bg-neutral-light border border-neutral-border text-neutral-text focus:outline-none focus:border-brand font-medium"
                required
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-dark block mb-1">
                Number of Rooms *
              </label>
              <select
                value={quantity}
                onChange={(e) => handleQuantityChange(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg text-sm bg-neutral-light border border-neutral-border text-neutral-text focus:outline-none focus:border-brand font-medium"
              >
                {Array.from({ length: 5 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? 'Room' : 'Rooms'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. Stay Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-neutral-dark flex items-center gap-1 mb-1">
                <Calendar className="w-3.5 h-3.5 text-brand" />
                Check-In Date *
              </label>
              <input
                type="date"
                min={today}
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm bg-neutral-light border border-neutral-border text-neutral-text focus:outline-none focus:border-brand font-medium"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-dark flex items-center gap-1 mb-1">
                <Calendar className="w-3.5 h-3.5 text-brand" />
                Check-Out Date *
              </label>
              <input
                type="date"
                min={checkIn ? addDaysToDate(checkIn, 1) : today}
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm bg-neutral-light border border-neutral-border text-neutral-text focus:outline-none focus:border-brand font-medium"
                required
              />
            </div>
          </div>

          {/* 3. Occupancy (Enforced: Max 3 adults + 1 child per room) */}
          <div className="grid grid-cols-2 gap-3 bg-neutral-light/60 p-2.5 rounded-lg border border-neutral-border/60">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-neutral-dark">Adults</label>
                <span className="text-[10px] text-neutral-secondary">Max {maxAdultsAllowed}</span>
              </div>
              <input
                type="number"
                min={quantity}
                max={maxAdultsAllowed}
                value={adults}
                onChange={(e) => setAdults(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded-md text-sm bg-white border border-neutral-border text-neutral-text font-medium"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-neutral-dark">Children (&lt;10y)</label>
                <span className="text-[10px] text-neutral-secondary">Max {maxChildrenAllowed}</span>
              </div>
              <input
                type="number"
                min={0}
                max={maxChildrenAllowed}
                value={children}
                onChange={(e) => setChildren(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded-md text-sm bg-white border border-neutral-border text-neutral-text font-medium"
              />
            </div>
          </div>

          {/* 4. Optional Guest Details & Booking Source */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-neutral-dark block mb-1">
                Guest Reference (Optional)
              </label>
              <input
                type="text"
                placeholder="Defaults to 'Front Desk Walk-In'"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm bg-neutral-light border border-neutral-border text-neutral-text focus:outline-none focus:border-brand font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-dark block mb-1">
                Booking Channel
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg text-sm bg-neutral-light border border-neutral-border text-neutral-text focus:outline-none focus:border-brand font-medium"
              >
                <option value="walk_in">Front Desk Walk-In</option>
                <option value="phone">Phone Reservation</option>
                <option value="whatsapp">WhatsApp Direct</option>
                <option value="reception">Reception Counter</option>
              </select>
            </div>
          </div>

          {/* 5. Internal Notes */}
          <div>
            <label className="text-xs font-bold text-neutral-dark block mb-1">
              Internal Staff Note (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Paid cash at counter, key handed over"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm bg-neutral-light border border-neutral-border text-neutral-text focus:outline-none focus:border-brand font-medium"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <Button type="button" variant="outline" size="sm" onClick={handleResetAndClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting}
              className="font-bold shadow-sm"
            >
              {isSubmitting ? 'Confirming...' : 'Confirm Offline Booking'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
