import React, { HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export interface SectionProps extends HTMLAttributes<HTMLElement> {
  variant?: 'default' | 'white' | 'dark' | 'brand-subtle';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

export const Section: React.FC<SectionProps> = ({
  className,
  variant = 'default',
  padding = 'md',
  children,
  ...props
}) => {
  const variants = {
    default: 'bg-neutral-light text-neutral-text',
    white: 'bg-white text-neutral-text',
    dark: 'bg-neutral-dark text-white',
    'brand-subtle': 'bg-brand-subtle text-neutral-text',
  };

  const paddings = {
    none: 'py-0',
    sm: 'py-6 md:py-8',
    md: 'py-10 md:py-16',
    lg: 'py-16 md:py-24',
    xl: 'py-20 md:py-32',
  };

  return (
    <section className={cn('w-full', variants[variant], paddings[padding], className)} {...props}>
      {children}
    </section>
  );
};
