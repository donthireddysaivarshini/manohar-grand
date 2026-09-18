import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BedDouble, ArrowLeft } from 'lucide-react';
import { Container } from '../../components/common/Container';
import { Section } from '../../components/common/Section';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { CheckoutProgress } from '../../components/checkout/CheckoutProgress';
import { GuestDetailsForm } from '../../components/checkout/GuestDetailsForm';
import { BookingReview } from '../../components/checkout/BookingReview';
import { CheckoutSummary } from '../../components/checkout/CheckoutSummary';
import { useBooking } from '../../store/BookingContext';

export const CheckoutPage: React.FC = () => {
  const { totalSelectedRoomsCount } = useBooking();
  const [checkoutStep, setCheckoutStep] = useState<'details' | 'review'>('details');

  useEffect(() => {
    document.title = 'Checkout & Guest Details | Manohar Grand Hotel';
  }, []);

  const hasSelectedRooms = totalSelectedRoomsCount > 0;

  // Empty / Direct URL Access Handling
  if (!hasSelectedRooms) {
    return (
      <div className="py-16 flex-1 flex items-center justify-center">
        <Container size="md">
          <div className="text-center flex flex-col items-center gap-5 max-w-md mx-auto bg-white p-8 rounded-card border border-neutral-border shadow-card">
            <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center text-brand">
              <BedDouble className="w-7 h-7" />
            </div>

            <Badge variant="warning" size="md">
              No Active Reservation Found
            </Badge>

            <h1 className="text-2xl font-extrabold text-neutral-dark">
              Select Your Rooms First
            </h1>

            <p className="text-xs sm:text-sm text-neutral-secondary leading-relaxed">
              Your booking session does not have any selected room categories. Please choose your stay dates and accommodations to proceed.
            </p>

            <Link to="/booking">
              <Button variant="primary" size="md" className="gap-2 font-bold shadow-sm">
                <ArrowLeft className="w-4 h-4" />
                <span>Go to Room Selection</span>
              </Button>
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full">
      {/* 1. Progress Step Bar */}
      <CheckoutProgress currentStep={checkoutStep} />

      <Section variant="default" padding="sm" className="py-6">
        <Container size="xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Form or Review (8 cols) */}
            <div className="lg:col-span-8">
              {checkoutStep === 'details' ? (
                <GuestDetailsForm onProceedToReview={() => setCheckoutStep('review')} />
              ) : (
                <BookingReview onBackToDetails={() => setCheckoutStep('details')} />
              )}
            </div>

            {/* Right Column: Sticky Summary (4 cols) */}
            <div className="lg:col-span-4">
              <CheckoutSummary />
            </div>
          </div>
        </Container>
      </Section>
    </div>
  );
};
