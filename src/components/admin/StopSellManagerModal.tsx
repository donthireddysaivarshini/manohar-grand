import React, { useState, useEffect } from 'react';
import { ShieldAlert, Calendar, Plus, Trash2, Power, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { useInventory } from '../../store/InventoryContext';
import { stopSellApiService, ApiStopSell } from '../../services/api/stopSellApiService';
import { getTodayDateString, addDaysToDate, isValidDateRange } from '../../utils/dateUtils';

export interface StopSellManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

export const StopSellManagerModal: React.FC<StopSellManagerModalProps> = ({
  isOpen,
  onClose,
  onUpdated,
}) => {
  const { categories } = useInventory();
  const today = getTodayDateString();
  const tomorrow = addDaysToDate(today, 1);

  const [stopSells, setStopSells] = useState<ApiStopSell[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);

  // Form state
  const [startDate, setStartDate] = useState<string>(today);
  const [endDate, setEndDate] = useState<string>(tomorrow);
  const [isHotelWide, setIsHotelWide] = useState<boolean>(true);
  const [categoryId, setCategoryId] = useState<string>('');
  const [reason, setReason] = useState<string>('Hotel Fully Booked');
  const [notes, setNotes] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  const fetchList = async () => {
    setIsLoading(true);
    try {
      const data = await stopSellApiService.getStopSells();
      setStopSells(data);
    } catch (err: any) {
      console.warn('Could not load stop sells:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchList();
      setFeedback(null);
    }
  }, [isOpen]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!isValidDateRange(startDate, endDate)) {
      setFeedback({ type: 'error', message: 'End date must be strictly after start date.' });
      return;
    }

    if (!isHotelWide && !categoryId) {
      setFeedback({ type: 'error', message: 'Please select a room category.' });
      return;
    }

    setIsSubmitting(true);
    try {
      await stopSellApiService.createStopSell({
        start_date: startDate,
        end_date: endDate,
        is_hotel_wide: isHotelWide,
        category_id: isHotelWide ? undefined : categoryId,
        reason: reason.trim() || 'Hotel Fully Booked',
        notes: notes.trim(),
      });

      setFeedback({
        type: 'success',
        message: isHotelWide
          ? `Entire hotel successfully marked as Fully Booked for ${startDate} to ${endDate}. Availability is now 0.`
          : `Category successfully stopped from selling for ${startDate} to ${endDate}.`,
      });

      setShowCreateForm(false);
      fetchList();
      if (onUpdated) onUpdated();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to apply stop-sell.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await stopSellApiService.toggleStopSell(id);
      fetchList();
      if (onUpdated) onUpdated();
    } catch (err: any) {
      setFeedback({ type: 'error', message: 'Failed to toggle status.' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this blackout rule? Room availability will be restored.')) return;
    try {
      await stopSellApiService.deleteStopSell(id);
      fetchList();
      if (onUpdated) onUpdated();
    } catch (err: any) {
      setFeedback({ type: 'error', message: 'Failed to delete blackout rule.' });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Hotel Full Booked (Stop-Sell / Blackout Manager)"
      description="Safely close out hotel or category inventory for selected dates. Sets available rooms to 0 without damaging physical room data."
      className="max-w-2xl"
    >
      <div className="space-y-5">
        {feedback && (
          <div
            className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
              feedback.type === 'error'
                ? 'bg-rose-50 border border-rose-200 text-rose-800'
                : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
            }`}
          >
            {feedback.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Top Action Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-border">
          <div>
            <span className="text-xs font-bold text-neutral-dark uppercase tracking-wider">
              Active Stop-Sells ({stopSells.filter((s) => s.is_active).length})
            </span>
          </div>
          <Button
            type="button"
            variant={showCreateForm ? 'outline' : 'primary'}
            size="sm"
            onClick={() => {
              setShowCreateForm(!showCreateForm);
              setFeedback(null);
            }}
            className="gap-1.5 font-bold"
          >
            {showCreateForm ? (
              'Cancel'
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Add Full Booked Dates
              </>
            )}
          </Button>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <form
            onSubmit={handleCreate}
            className="p-4 rounded-xl bg-neutral-light border border-neutral-border space-y-4 animate-in fade-in duration-150"
          >
            <h4 className="text-sm font-bold text-neutral-dark flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-brand" />
              Configure Stop-Sell / Fully Booked Date Range
            </h4>

            {/* Scope Selection */}
            <div>
              <label className="text-xs font-bold text-neutral-dark block mb-1.5">
                Blackout Scope *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsHotelWide(true)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all text-left ${
                    isHotelWide
                      ? 'border-brand bg-brand/10 text-brand shadow-xs'
                      : 'border-neutral-border bg-white text-neutral-text hover:bg-neutral-light'
                  }`}
                >
                  ?? Entire Hotel (All Rooms)
                  <span className="block text-[10px] font-normal text-neutral-secondary mt-0.5">
                    Closes website bookings completely
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsHotelWide(false)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all text-left ${
                    !isHotelWide
                      ? 'border-brand bg-brand/10 text-brand shadow-xs'
                      : 'border-neutral-border bg-white text-neutral-text hover:bg-neutral-light'
                  }`}
                >
                  ?? Specific Category Only
                  <span className="block text-[10px] font-normal text-neutral-secondary mt-0.5">
                    Stop sell on AC or Non-AC only
                  </span>
                </button>
              </div>
            </div>

            {!isHotelWide && (
              <div>
                <label className="text-xs font-bold text-neutral-dark block mb-1">
                  Select Room Category *
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm bg-white border border-neutral-border text-neutral-text font-medium"
                  required
                >
                  <option value="">-- Choose Category --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Date Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-neutral-dark flex items-center gap-1 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-brand" />
                  From Date (Check-in inclusive) *
                </label>
                <input
                  type="date"
                  min={today}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm bg-white border border-neutral-border text-neutral-text font-medium"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-dark flex items-center gap-1 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-brand" />
                  To Date (Checkout exclusive) *
                </label>
                <input
                  type="date"
                  min={startDate ? addDaysToDate(startDate, 1) : today}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm bg-white border border-neutral-border text-neutral-text font-medium"
                  required
                />
              </div>
            </div>

            {/* Reason & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-neutral-dark block mb-1">
                  Reason for Stop-Sell
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm bg-white border border-neutral-border text-neutral-text font-medium"
                >
                  <option value="Hotel Fully Booked">Hotel Fully Booked (Offline / Direct)</option>
                  <option value="Private Event / Wedding Booking">Private Event / Wedding Booking</option>
                  <option value="Scheduled Maintenance / Renovation">Scheduled Maintenance / Renovation</option>
                  <option value="Emergency Closure">Emergency Closure</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-dark block mb-1">
                  Internal Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Offline corporate block held"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm bg-white border border-neutral-border text-neutral-text font-medium"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" disabled={isSubmitting} className="font-bold">
                {isSubmitting ? 'Saving...' : 'Activate Stop-Sell'}
              </Button>
            </div>
          </form>
        )}

        {/* Existing Records List */}
        {isLoading ? (
          <div className="py-8 text-center text-xs text-neutral-secondary">
            Loading active stop-sells...
          </div>
        ) : stopSells.length === 0 ? (
          <div className="py-8 text-center rounded-xl bg-neutral-light border border-dashed border-neutral-border">
            <Clock className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-neutral-dark">No Stop-Sell Rules Active</p>
            <p className="text-xs text-neutral-secondary mt-1">
              Hotel rooms are operating on normal calculated availability.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
            {stopSells.map((s) => (
              <div
                key={s.id}
                className={`p-3 rounded-lg border flex items-center justify-between gap-3 text-xs transition-all ${
                  s.is_active
                    ? 'bg-white border-neutral-border shadow-xs'
                    : 'bg-neutral-light/50 border-neutral-border/50 opacity-60'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={s.is_active ? 'brand' : 'default'} size="sm">
                      {s.is_active ? 'Active Blackout' : 'Deactivated'}
                    </Badge>
                    <span className="font-bold text-neutral-dark">
                      {s.is_hotel_wide ? 'Entire Hotel (All Rooms)' : `Category: ${s.category_name || 'N/A'}`}
                    </span>
                  </div>
                  <p className="text-neutral-secondary font-medium">
                    ?? {s.start_date} ? {s.end_date} ({s.nights_count} {s.nights_count === 1 ? 'night' : 'nights'})
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    Reason: <strong>{s.reason}</strong> {s.notes ? `• ${s.notes}` : ''}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggle(s.id)}
                    title={s.is_active ? 'Deactivate stop-sell' : 'Activate stop-sell'}
                    className={`p-2 rounded-lg border transition-all ${
                      s.is_active
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                        : 'border-neutral-border bg-white text-neutral-500 hover:bg-neutral-light'
                    }`}
                  >
                    <Power className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(s.id)}
                    title="Remove stop-sell record"
                    className="p-2 rounded-lg border border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pt-2 border-t border-neutral-border flex justify-end">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
