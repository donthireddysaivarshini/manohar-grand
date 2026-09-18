import React, { HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export interface SkeletonLoaderProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'rectangular' | 'circular' | 'text';
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  className,
  variant = 'rectangular',
  ...props
}) => {
  const variants = {
    rectangular: 'rounded-lg',
    circular: 'rounded-full',
    text: 'rounded h-4 w-full',
  };

  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse bg-neutral-200/80', variants[variant], className)}
      {...props}
    />
  );
};
