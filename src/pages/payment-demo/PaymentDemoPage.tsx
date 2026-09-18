import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CreditCard, ArrowLeft } from 'lucide-react';
import { Container } from '../../components/common/Container';
import { Section } from '../../components/common/Section';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { CheckoutProgress } from '../../components/checkout/CheckoutProgress';
import { CheckoutSummary } from '../../components/checkout/CheckoutSummary';
import { DemoPaymentPanel } from '../../components/payment/DemoPaymentPanel';
import { PaymentStatusAlert } from '../../components/payment/PaymentStatusAlert';
import { useBooking } from '../../store/BookingContext';
import { paymentService } from '../../services';
import { PaymentSimulationMethod, PaymentSimulationStatus } from '../../types/checkout';

export const PaymentDemoPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentSnapshot,
    priceBreakdown,
    totalSelectedRoomsCount,
    updateSnapshotPayment,
  } = useBooking();

  const [paymentStatus, setPaymentStatus] = useState<PaymentSimulationStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    document.title = 'Demo Payment Simulation | Manohar Grand Hotel';
  }, []);

  const hasActiveSession = currentSnapshot !== null && totalSelectedRoomsCount > 0;

  // Direct URL access without active booking snapshot
  if (!hasActiveSession) {
    return (
      <div className="py-16 flex-1 flex items-center justify-center">
        <Container size="md">
          <div className="text-center flex flex-col items-center gap-5 max-w-md mx-auto bg-white p-8 rounded-card border border-neutral-border shadow-card">
            <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center text-brand">
              <CreditCard className="w-7 h-7" />
            </div>

            <Badge variant="warning" size="md">
              Payment Session Unavailable
            </Badge>

            <h1 className="text-2xl font-extrabold text-neutral-dark">
              No Pending Checkout Found
            </h1>

            <p className="text-xs sm:text-sm text-neutral-secondary leading-relaxed">
              Your payment session has expired or no reservation is currently awaiting payment. Please start from room selection.
            </p>

            <Link to="/booking">
              <Button variant="primary" size="md" className="gap-2 font-bold shadow-sm">
                <ArrowLeft className="w-4 h-4" />
                <span>Start New Reservation</span>
              </Button>
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  const handleSimulateOutcome = async (
    method: PaymentSimulationMethod,
    outcome: 'success' | 'failed' | 'cancelled'
  ) => {
    setIsProcessing(true);
    setErrorMessage('');

    // Simulate realistic 600ms network delay
    setTimeout(async () => {
      try {
        const intent = await paymentService.createPaymentIntent(currentSnapshot);
        const result = await paymentService.processDemoPayment(intent.intentId, method, outcome);

        if (result.status === 'success') {
          await updateSnapshotPayment('success', result.transactionId, method);
          navigate(`/booking/confirmation/${currentSnapshot.bookingReference}`);
        } else if (result.status === 'failed') {
          await updateSnapshotPayment('failed', result.transactionId, method);
          setPaymentStatus('failed');
          setErrorMessage(result.message);
        } else {
          await updateSnapshotPayment('cancelled', result.transactionId, method);
          setPaymentStatus('cancelled');
          setErrorMessage(result.message);
        }
      } finally {
        setIsProcessing(false);
      }
    }, 600);
  };

  return (
    <div className="flex flex-col w-full">
      {/* 1. Progress Step Bar */}
      <CheckoutProgress currentStep="payment" />

      <Section variant="default" padding="sm" className="py-6">
        <Container size="xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Payment Simulator Panel or Status Alert (8 cols) */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              {paymentStatus === 'failed' || paymentStatus === 'cancelled' ? (
                <PaymentStatusAlert
                  status={paymentStatus}
                  message={errorMessage}
                  onRetry={() => setPaymentStatus('idle')}
                  onReturnToCheckout={() => navigate('/checkout')}
                />
              ) : (
                <DemoPaymentPanel
                  totalAmount={priceBreakdown.totalPayable}
                  bookingReference={currentSnapshot.bookingReference}
                  isProcessing={isProcessing}
                  onSimulateOutcome={handleSimulateOutcome}
                />
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
