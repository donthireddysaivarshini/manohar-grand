import React from 'react';
import { XCircle, AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '../common/Card';
import { Button } from '../common/Button';
import { PaymentSimulationStatus } from '../../types/checkout';

export interface PaymentStatusAlertProps {
  status: PaymentSimulationStatus;
  message?: string;
  onRetry: () => void;
  onReturnToCheckout: () => void;
}

export const PaymentStatusAlert: React.FC<PaymentStatusAlertProps> = ({
  status,
  message,
  onRetry,
  onReturnToCheckout,
}) => {
  if (status !== 'failed' && status !== 'cancelled') return null;

  const isFailed = status === 'failed';

  return (
    <Card
      variant="bordered"
      className={`p-6 sm:p-8 animate-in fade-in duration-300 ${
        isFailed ? 'bg-red-50/80 border-feedback-error/30' : 'bg-amber-50/80 border-amber-300'
      }`}
    >
      <CardContent className="p-0 flex flex-col items-center text-center gap-4">
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center ${
            isFailed ? 'bg-red-100 text-feedback-error' : 'bg-amber-100 text-amber-700'
          }`}
        >
          {isFailed ? <XCircle className="w-8 h-8" /> : <AlertTriangle className="w-8 h-8" />}
        </div>

        <div>
          <h3 className="text-xl font-bold text-neutral-dark">
            {isFailed ? 'Payment Simulation Failed' : 'Payment Simulation Cancelled'}
          </h3>
          <p className="text-xs sm:text-sm text-neutral-secondary max-w-md mt-1.5 leading-relaxed">
            {message ||
              (isFailed
                ? 'The simulated card transaction was declined. No funds were charged.'
                : 'The simulated payment process was cancelled before completion.')}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={onRetry}
            className="font-bold gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Payment Simulation Again</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onReturnToCheckout}
            className="font-semibold gap-2 bg-white"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Checkout</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
