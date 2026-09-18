import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../utils/cn';

export type CheckoutStep = 'stay' | 'details' | 'review' | 'payment' | 'confirmation';

export interface CheckoutProgressProps {
  currentStep: CheckoutStep;
}

const STEPS: { id: CheckoutStep; label: string; number: number }[] = [
  { id: 'stay', label: 'Select Stay', number: 1 },
  { id: 'details', label: 'Guest Details', number: 2 },
  { id: 'review', label: 'Review', number: 3 },
  { id: 'payment', label: 'Demo Payment', number: 4 },
  { id: 'confirmation', label: 'Confirmation', number: 5 },
];

export const CheckoutProgress: React.FC<CheckoutProgressProps> = ({ currentStep }) => {
  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <div className="w-full bg-white border-b border-neutral-border py-4 mb-6">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between relative">
          {/* Progress Connecting Line */}
          <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-0.5 bg-neutral-border -z-0 hidden sm:block" />

          {STEPS.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <div key={step.id} className="relative z-10 flex flex-col items-center gap-1.5 bg-white sm:px-2">
                <div
                  className={cn(
                    'w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2',
                    isCompleted && 'bg-brand border-brand text-white',
                    isCurrent && 'bg-brand text-white border-brand ring-4 ring-brand/20',
                    !isCompleted && !isCurrent && 'bg-neutral-light border-neutral-border text-neutral-secondary'
                  )}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : step.number}
                </div>

                <span
                  className={cn(
                    'text-[10px] sm:text-xs font-semibold whitespace-nowrap',
                    isCurrent ? 'text-brand font-bold' : isCompleted ? 'text-neutral-dark' : 'text-neutral-secondary'
                  )}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
