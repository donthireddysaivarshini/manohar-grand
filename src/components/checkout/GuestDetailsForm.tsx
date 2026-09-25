import React, { useState } from 'react';
import { User, MessageSquare, ArrowRight, ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '../common/Card';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { useBooking } from '../../store/BookingContext';

export interface GuestDetailsFormProps {
  onProceedToReview: () => void;
}

export const GuestDetailsForm: React.FC<GuestDetailsFormProps> = ({ onProceedToReview }) => {
  const { guestDetails, setGuestDetails } = useBooking();

  const [formData, setFormData] = useState({
    fullName: guestDetails.fullName || '',
    email: guestDetails.email || '',
    phone: guestDetails.phone || '',
    specialRequests: guestDetails.specialRequests || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!formData.fullName.trim() || formData.fullName.trim().length < 2) {
      errs.fullName = 'Please enter guest full name (minimum 2 characters)';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      errs.email = 'Please enter a valid email address (e.g. name@example.com)';
    }

    // Practical phone validation: removes non-digits, requires 10 to 15 digits
    const digitsOnly = formData.phone.replace(/\D/g, '');
    if (!digitsOnly || digitsOnly.length < 10 || digitsOnly.length > 15) {
      errs.phone = 'Please enter a valid 10-digit mobile number';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setGuestDetails(formData);
      onProceedToReview();
    }
  };

  return (
    <Card variant="bordered" className="bg-white p-6 sm:p-8 shadow-card">
      <CardContent className="p-0">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-neutral-dark flex items-center gap-2">
            <User className="w-5 h-5 text-brand" />
            Lead Guest Information
          </h2>
          <p className="text-xs sm:text-sm text-neutral-secondary mt-1">
            Please provide your contact information to receive your booking voucher.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Full Name *"
            placeholder="e.g. Rahul Sharma"
            value={formData.fullName}
            onChange={(e) => {
              setFormData({ ...formData, fullName: e.target.value });
              if (errors.fullName) setErrors({ ...errors, fullName: '' });
            }}
            error={errors.fullName}
            helperText="As shown on government identification"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <Input
                label="Email Address *"
                type="email"
                placeholder="e.g. rahul@example.com"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (errors.email) setErrors({ ...errors, email: '' });
                }}
                error={errors.email}
                helperText="Booking confirmation will be sent here"
              />
            </div>

            <div className="flex flex-col gap-1">
              <Input
                label="Mobile Phone *"
                type="tel"
                placeholder="e.g. 9876543210"
                value={formData.phone}
                onChange={(e) => {
                  setFormData({ ...formData, phone: e.target.value });
                  if (errors.phone) setErrors({ ...errors, phone: '' });
                }}
                error={errors.phone}
                helperText="For arrival & check-in communication"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 mt-1">
            <label className="text-xs font-semibold tracking-wide text-neutral-text uppercase select-none flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-neutral-400" />
              Special Requests (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Early check-in preference, quiet room, or ground floor preference"
              value={formData.specialRequests}
              onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-white border border-neutral-border text-neutral-text focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand placeholder:text-neutral-muted transition-all"
            />
            <span className="text-[11px] text-neutral-400">
              Special requests are subject to hotel availability upon arrival.
            </span>
          </div>

          {/* Mandatory Guest Identification & Cancellation Notice */}
          <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/90 flex flex-col gap-2 mt-1">
            <div className="flex items-start gap-2 text-xs font-bold text-amber-900">
              <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>Mandatory Guest Policy &amp; Government ID Requirements:</span>
            </div>
            <ul className="text-[11px] text-amber-900/90 space-y-1 pl-6 list-disc">
              <li>
                <strong>Original Aadhar Card is mandatory</strong> for each and every staying guest at check-in.
              </li>
              <li>
                Primary guest must be <strong>18 years of age or older</strong>.
              </li>
              <li>
                <strong>Cancellation Policy:</strong> Cancellations made 2+ days before check-in receive a 50% refund. Cancellations made on the day of stay or within 48 hours are non-refundable (0% refund).
              </li>
            </ul>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-neutral-border/80 mt-2">
            <div className="flex items-center gap-2 text-xs text-neutral-secondary">
              <ShieldCheck className="w-4 h-4 text-feedback-success shrink-0" />
              <span>Secure reservation with Manohar Grand</span>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full sm:w-auto font-bold shadow-md gap-2"
            >
              <span>Review Reservation</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
