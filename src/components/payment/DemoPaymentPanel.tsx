import React, { useState } from 'react';
import { CreditCard, QrCode, Banknote, ShieldAlert, CheckCircle2, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { Card, CardContent } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { PaymentSimulationMethod } from '../../types/checkout';
import { formatCurrencyINR } from '../../utils/formatters';

export interface DemoPaymentPanelProps {
  totalAmount: number;
  bookingReference: string;
  isProcessing: boolean;
  onSimulateOutcome: (method: PaymentSimulationMethod, outcome: 'success' | 'failed' | 'cancelled') => void;
}

export const DemoPaymentPanel: React.FC<DemoPaymentPanelProps> = ({
  totalAmount,
  bookingReference,
  isProcessing,
  onSimulateOutcome,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentSimulationMethod>('card');

  return (
    <Card variant="bordered" className="bg-white p-6 sm:p-8 shadow-elevated">
      <CardContent className="p-0 flex flex-col gap-6">
        {/* Header & Simulation Notice */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Badge variant="brand" size="sm" className="font-bold">
              Demo Payment Gateway
            </Badge>
            <span className="text-xs text-neutral-secondary font-mono">
              Ref: {bookingReference}
            </span>
          </div>

          <h2 className="text-2xl font-black text-neutral-dark">
            Payment Simulation
          </h2>

          <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-feedback-warning shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Safe Demonstration Environment: </span>
              This interface is a frontend simulation. No actual payment credentials are collected and no real funds are charged. Select a simulated method and trigger an outcome below.
            </div>
          </div>
        </div>

        {/* Amount to Pay (Read-Only, Derived from State) */}
        <div className="p-4 rounded-lg bg-neutral-light border border-neutral-border flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-secondary block">
              Total Demo Amount
            </span>
            <span className="text-xs text-neutral-500">Derived from booking calculation</span>
          </div>
          <span className="text-3xl font-black text-brand">
            {formatCurrencyINR(totalAmount)}
          </span>
        </div>

        {/* Simulated Method Selector */}
        <div className="flex flex-col gap-3">
          <label className="text-xs font-bold uppercase tracking-wider text-neutral-dark">
            Select Simulated Payment Method
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setSelectedMethod('card')}
              className={`p-4 rounded-lg border text-left flex flex-col gap-2 transition-all ${
                selectedMethod === 'card'
                  ? 'border-brand bg-brand-subtle/50 ring-1 ring-brand'
                  : 'border-neutral-border bg-white hover:bg-neutral-light'
              }`}
            >
              <CreditCard className={`w-5 h-5 ${selectedMethod === 'card' ? 'text-brand' : 'text-neutral-500'}`} />
              <div>
                <span className="text-xs font-bold text-neutral-dark block">Credit / Debit Card</span>
                <span className="text-[10px] text-neutral-secondary">Visa, Mastercard, RuPay (Demo)</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMethod('upi')}
              className={`p-4 rounded-lg border text-left flex flex-col gap-2 transition-all ${
                selectedMethod === 'upi'
                  ? 'border-brand bg-brand-subtle/50 ring-1 ring-brand'
                  : 'border-neutral-border bg-white hover:bg-neutral-light'
              }`}
            >
              <QrCode className={`w-5 h-5 ${selectedMethod === 'upi' ? 'text-brand' : 'text-neutral-500'}`} />
              <div>
                <span className="text-xs font-bold text-neutral-dark block">UPI / QR Code</span>
                <span className="text-[10px] text-neutral-secondary">Instant demo simulation</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMethod('pay_at_hotel')}
              className={`p-4 rounded-lg border text-left flex flex-col gap-2 transition-all ${
                selectedMethod === 'pay_at_hotel'
                  ? 'border-brand bg-brand-subtle/50 ring-1 ring-brand'
                  : 'border-neutral-border bg-white hover:bg-neutral-light'
              }`}
            >
              <Banknote className={`w-5 h-5 ${selectedMethod === 'pay_at_hotel' ? 'text-brand' : 'text-neutral-500'}`} />
              <div>
                <span className="text-xs font-bold text-neutral-dark block">Pay at Hotel</span>
                <span className="text-[10px] text-neutral-secondary">Cash / Card on arrival (Demo)</span>
              </div>
            </button>
          </div>
        </div>

        {/* Safe Interactive Simulation Outcome Buttons */}
        <div className="flex flex-col gap-3 pt-4 border-t border-neutral-border">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-dark">
            Simulate Payment Outcomes:
          </span>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Success Simulator Button */}
            <Button
              type="button"
              variant="primary"
              size="lg"
              disabled={isProcessing}
              onClick={() => onSimulateOutcome(selectedMethod, 'success')}
              className="flex-1 font-bold shadow-md bg-feedback-success hover:bg-green-700 text-white gap-2 h-12"
            >
              {isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
              <span>Simulate Successful Payment</span>
            </Button>

            {/* Failure Simulator Button */}
            <Button
              type="button"
              variant="outline"
              size="lg"
              disabled={isProcessing}
              onClick={() => onSimulateOutcome(selectedMethod, 'failed')}
              className="flex-1 font-semibold text-feedback-error border-feedback-error/40 hover:bg-red-50 gap-2 h-12"
            >
              <XCircle className="w-5 h-5" />
              <span>Simulate Failed Payment</span>
            </Button>

            {/* Cancel Simulator Button */}
            <Button
              type="button"
              variant="ghost"
              size="lg"
              disabled={isProcessing}
              onClick={() => onSimulateOutcome(selectedMethod, 'cancelled')}
              className="font-semibold text-neutral-secondary hover:text-neutral-dark gap-2 h-12"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Simulate Cancellation</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
