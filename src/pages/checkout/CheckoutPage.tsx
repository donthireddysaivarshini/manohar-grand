import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { BedDouble, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { Container } from '../../components/common/Container';
import { Section } from '../../components/common/Section';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { CheckoutProgress } from '../../components/checkout/CheckoutProgress';
import { GuestDetailsForm } from '../../components/checkout/GuestDetailsForm';
import { BookingReview } from '../../components/checkout/BookingReview';
import { CheckoutSummary } from '../../components/checkout/CheckoutSummary';
import { useBooking } from '../../store/BookingContext';
import { useAuth } from '../../store/AuthContext';

export const CheckoutPage: React.FC = () => {
  const [searchParamsUrl] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const {
    activeHold,
    checkoutSummary,
    fetchCheckoutSummary,
    totalSelectedRoomsCount,
  } = useBooking();

  const [checkoutStep, setCheckoutStep] = useState<'details' | 'review'>('details');
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const refParam = searchParamsUrl.get('ref') || activeHold?.booking_reference;

  useEffect(() => {
    document.title = 'Checkout & Guest Details | Manohar Grand Hotel';
  }, []);

  // Require Authentication
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      navigate('/account/login?redirect=/checkout', { replace: true });
    }
  }, [isAuthenticated, isAuthLoading, navigate]);

  // Load authoritative checkout summary from Django
  useEffect(() => {
    if (refParam && (!checkoutSummary || checkoutSummary.booking_reference !== refParam)) {
      setIsLoadingSummary(true);
      setSummaryError(null);
      fetchCheckoutSummary(refParam)
        .catch((err: any) => {
          console.error('Failed to load checkout summary:', err);
          setSummaryError(err?.message || 'Unable to retrieve checkout summary from server.');
        })
        .finally(() => setIsLoadingSummary(false));
    }
  }, [refParam, checkoutSummary, fetchCheckoutSummary]);

  const hasReservation = !!activeHold || !!checkoutSummary || totalSelectedRoomsCount > 0;

  // Empty / Direct URL Access without reservation
  if (!isAuthLoading && !hasReservation && !refParam) {
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
              Your session does not have an active room hold. Please choose your stay dates and accommodations to proceed.
            </p>

            <Link to="/booking">
              <Button variant="primary" size="md" className="gap-2 font-bold shadow-sm cursor-pointer">
                <ArrowLeft className="w-4 h-4" />
                <span>Go to Room Selection</span>
              </Button>
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  if (isLoadingSummary) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
        <span className="text-sm font-semibold text-neutral-secondary">
          Loading authoritative checkout summary...
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full">
      {/* 1. Progress Step Bar */}
      <CheckoutProgress currentStep={checkoutStep} />

      <Section variant="default" padding="sm" className="py-6">
        <Container size="xl">
          {summaryError && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Notice: </span>
                {summaryError}
              </div>
            </div>
          )}

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
