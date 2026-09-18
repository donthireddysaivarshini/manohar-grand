import React, { SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, id, disabled, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="text-xs font-semibold tracking-wide text-neutral-text uppercase select-none"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            disabled={disabled}
            aria-invalid={!!error}
            className={cn(
              'w-full appearance-none px-3.5 py-2.5 pr-10 rounded-lg text-sm bg-white border border-neutral-border text-neutral-text transition-all',
              'focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand',
              'disabled:bg-neutral-light disabled:cursor-not-allowed disabled:text-neutral-secondary',
              error && 'border-feedback-error focus:border-feedback-error focus:ring-feedback-error',
              className
            )}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="w-4 h-4 text-neutral-secondary absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
        </div>
        {error && (
          <span className="text-xs text-feedback-error font-medium">
            {error}
          </span>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
