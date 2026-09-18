import React, { HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export const Container: React.FC<ContainerProps> = ({
  className,
  size = 'xl',
  children,
  ...props
}) => {
  const sizes = {
    sm: 'max-w-3xl',
    md: 'max-w-5xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    full: 'max-w-full',
  };

  return (
    <div
      className={cn('w-full mx-auto px-4 xs:px-4 sm:px-6 md:px-8', sizes[size], className)}
      {...props}
    >
      {children}
    </div>
  );
};
