import React, { InputHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, disabled, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold tracking-wide text-neutral-text uppercase select-none"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          className={cn(
            'w-full px-3.5 py-2.5 rounded-lg text-sm bg-white border border-neutral-border text-neutral-text transition-all placeholder:text-neutral-muted',
            'focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand',
            'disabled:bg-neutral-light disabled:cursor-not-allowed disabled:text-neutral-secondary',
            error && 'border-feedback-error focus:border-feedback-error focus:ring-feedback-error',
            className
          )}
          {...props}
        />
        {error && (
          <span id={`${inputId}-error`} className="text-xs text-feedback-error font-medium">
            {error}
          </span>
        )}
        {!error && helperText && (
          <span id={`${inputId}-helper`} className="text-xs text-neutral-secondary">
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
