import React, { HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'brand' | 'success' | 'warning' | 'error' | 'outline';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  size = 'sm',
  children,
  ...props
}) => {
  const variants = {
    default: 'bg-neutral-light text-neutral-text border border-neutral-border',
    brand: 'bg-brand text-white',
    success: 'bg-green-50 text-feedback-success border border-green-200',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200',
    error: 'bg-red-50 text-feedback-error border border-red-200',
    outline: 'bg-transparent text-neutral-text border border-neutral-border',
  };

  const sizes = {
    sm: 'text-[11px] font-semibold px-2 py-0.5 rounded-md',
    md: 'text-xs font-semibold px-2.5 py-1 rounded-md',
  };

  return (
    <span
      className={cn('inline-flex items-center justify-center select-none tracking-wide', variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </span>
  );
};
