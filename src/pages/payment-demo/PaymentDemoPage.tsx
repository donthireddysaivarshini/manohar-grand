import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, ArrowLeft, ShieldAlert } from 'lucide-react';
import { Container } from '../../components/common/Container';
import { Section } from '../../components/common/Section';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card, CardContent } from '../../components/common/Card';

export const PaymentDemoPage: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [simulationStatus, setSimulationStatus] = useState<string | null>(null);

  const handleSimulate = (outcome: 'success' | 'failed') => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setSimulationStatus(outcome);
    }, 500);
  };

  return (
    <div className="flex flex-col w-full py-12">
      <Section variant="default" padding="sm">
        <Container size="md">
          <Card variant="bordered" className="bg-white p-8 rounded-2xl shadow-card border border-neutral-border">
            <CardContent className="p-0 flex flex-col items-center text-center gap-5">
              <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
                <CreditCard className="w-7 h-7" />
              </div>

              <Badge variant="warning" size="md">
                Development Sandbox Only
              </Badge>

              <h1 className="text-2xl font-extrabold text-neutral-dark">
                Production Payment Gateway Active
              </h1>

              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-3 text-left">
                <ShieldAlert className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  Real Razorpay Advance Payment integration is now fully active in the Manohar Grand customer booking flow.
                  Please use the official <strong>/booking → /checkout</strong> flow to test real Razorpay Checkout modals with test mode credentials.
                </div>
              </div>

              {simulationStatus && (
                <div className="p-3 rounded-lg bg-neutral-100 text-xs font-mono text-neutral-700">
                  Simulation Outcome: {simulationStatus.toUpperCase()}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Link to="/booking">
                  <Button variant="primary" size="md" className="gap-2 font-bold shadow-sm cursor-pointer">
                    <ArrowLeft className="w-4 h-4" />
                    <span>Go to Live Booking Flow</span>
                  </Button>
                </Link>

                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  disabled={isProcessing}
                  onClick={() => handleSimulate('success')}
                  className="font-semibold text-xs cursor-pointer"
                >
                  Simulate Standalone Probe
                </Button>
              </div>
            </CardContent>
          </Card>
        </Container>
      </Section>
    </div>
  );
};
