import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Loader2, 
  Info, 
  ShieldAlert 
} from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { bookingApiService } from '../../services/api/bookingApiService';
import { ApiCancellationPreview } from '../../types/booking';
import { formatCurrencyINR } from '../../utils/formatters';
import { formatDateDisplay } from '../../utils/dateUtils';

interface CancellationModalProps {
  bookingReference: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const REASON_OPTIONS = [
  'Change of travel plans',
  'Personal emergency',
  'Found alternative accommodation',
  'Medical / Health issue',
  'Travel dates postponed',
  'Booking created by mistake',
  'Other reasons',
];

export const CancellationModal: React.FC<CancellationModalProps> = ({
  bookingReference,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [preview, setPreview] = useState<ApiCancellationPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState<string>(REASON_OPTIONS[0]);
  const [customNotes, setCustomNotes] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen || !bookingReference) return;

    setLoading(true);
    setError(null);
    setIsSuccess(false);

    bookingApiService
      .getCancellationPreview(bookingReference)
      .then((data) => {
        setPreview(data);
      })
      .catch((err) => {
        setError(err?.message || 'Failed to calculate cancellation policy details.');
      })
      .finally(() => setLoading(false));
  }, [isOpen, bookingReference]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) {
      setError('Please select a reason for cancellation.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await bookingApiService.requestCancellation(bookingReference, {
        reason,
        notes: customNotes,
      });
      setIsSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 2500);
    } catch (err: any) {
      setError(err?.message || 'Failed to submit cancellation request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-neutral-100 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900">Request Cancellation</h3>
              <p className="text-xs text-neutral-500">Ref: <span className="font-mono font-semibold text-neutral-700">{bookingReference}</span></p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex flex-col gap-5">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-neutral-500">
              <Loader2 className="w-8 h-8 text-brand animate-spin" />
              <span className="text-xs font-medium">Calculating policy & refund estimate...</span>
            </div>
          ) : isSuccess ? (
            <div className="py-8 flex flex-col items-center justify-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="flex flex-col gap-1.5">
                <h4 className="text-lg font-bold text-neutral-900">Cancellation Request Submitted</h4>
                <p className="text-xs text-neutral-600 max-w-sm">
                  Your request is under review by our front desk management. If eligible for a refund, it will be credited to your original payment method.
                </p>
              </div>
            </div>
          ) : error && !preview ? (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          ) : preview ? (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* Policy Callout Banner */}
              <div className={`p-4 rounded-2xl border ${
                preview.is_eligible_for_refund 
                  ? 'bg-emerald-50/70 border-emerald-200' 
                  : 'bg-amber-50/70 border-amber-200'
              }`}>
                <div className="flex items-start gap-3">
                  <Info className={`w-5 h-5 shrink-0 mt-0.5 ${
                    preview.is_eligible_for_refund ? 'text-emerald-600' : 'text-amber-600'
                  }`} />
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-neutral-900">Cancellation Policy</span>
                      <Badge 
                        variant={preview.is_eligible_for_refund ? 'success' : 'default'} 
                        size="sm"
                        className={preview.is_eligible_for_refund ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'}
                      >
                        {preview.is_eligible_for_refund ? '50% Refund Eligible' : 'Non-Refundable (100% Fee)'}
                      </Badge>
                    </div>
                    <p className="text-xs text-neutral-600 leading-relaxed">
                      {preview.policy_label}
                    </p>
                  </div>
                </div>
              </div>

              {/* Financial Calculation Breakdown */}
              <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-150 flex flex-col gap-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-500">Check-in Scheduled:</span>
                  <span className="font-semibold text-neutral-800">{formatDateDisplay(preview.check_in_date)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-500">Days Prior to Arrival:</span>
                  <span className="font-semibold text-neutral-800">{preview.days_before_checkin} Days</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-500">Total Paid Amount:</span>
                  <span className="font-bold text-neutral-900">{formatCurrencyINR(parseFloat(preview.total_paid_amount))}</span>
                </div>
                
                <div className="h-px bg-neutral-200 my-0.5" />

                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-500">Cancellation Fee ({preview.cancellation_fee_percentage}%):</span>
                  <span className="font-semibold text-neutral-700">-{formatCurrencyINR(parseFloat(preview.cancellation_fee))}</span>
                </div>

                <div className="flex justify-between items-center text-xs pt-1 border-t border-neutral-200">
                  <span className="font-bold text-neutral-900">Estimated Refund Amount:</span>
                  <span className={`text-sm font-extrabold ${
                    preview.is_eligible_for_refund ? 'text-emerald-700' : 'text-neutral-600'
                  }`}>
                    {formatCurrencyINR(parseFloat(preview.refund_amount))}
                  </span>
                </div>
              </div>

              {/* Cancellation Reason Selection */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-neutral-800">
                  Reason for Cancellation <span className="text-red-500">*</span>
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full text-xs font-medium border border-neutral-300 rounded-xl p-3 bg-white focus:outline-hidden focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  required
                >
                  {REASON_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Additional Comments */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-neutral-700">
                  Additional Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="Provide any specific details or remarks for the front desk..."
                  className="w-full text-xs font-medium border border-neutral-300 rounded-xl p-3 bg-white focus:outline-hidden focus:ring-2 focus:ring-brand/20 focus:border-brand resize-none"
                />
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  disabled={submitting}
                  className="font-semibold text-xs"
                >
                  Keep Reservation
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={submitting}
                  className="font-bold text-xs bg-red-600 hover:bg-red-700 text-white border-red-600 gap-1.5"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirm Cancellation Request</span>
                </Button>
              </div>
            </form>
          ) : null}
        </div>
      </div>
    </div>
  );
};
