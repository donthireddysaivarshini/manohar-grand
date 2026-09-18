import React from 'react';
import { cn } from '../../utils/cn';

export interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textVariant?: 'dark' | 'light';
  className?: string;
  imageClassName?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  textVariant = 'dark',
  className,
  imageClassName,
}) => {
  const sizeMap = {
    sm: {
      img: 'w-8 h-8',
      title: 'text-base font-extrabold',
      subtitle: 'text-[9px]',
    },
    md: {
      img: 'w-10 h-10',
      title: 'text-lg md:text-xl font-extrabold',
      subtitle: 'text-[10px]',
    },
    lg: {
      img: 'w-12 h-12',
      title: 'text-xl md:text-2xl font-extrabold',
      subtitle: 'text-xs',
    },
    xl: {
      img: 'w-16 h-16',
      title: 'text-2xl md:text-3xl font-extrabold',
      subtitle: 'text-xs',
    },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div
        className={cn(
          'relative rounded-lg overflow-hidden shrink-0 border border-neutral-border/60 shadow-sm bg-white',
          currentSize.img,
          imageClassName
        )}
      >
        <img
          src="/logomg.jpeg"
          alt="Manohar Grand Hotel Logo"
          className="w-full h-full object-contain"
        />
      </div>

      {showText && (
        <div className="flex flex-col leading-tight">
          <span
            className={cn(
              'tracking-tight font-sans',
              currentSize.title,
              textVariant === 'light' ? 'text-white' : 'text-neutral-dark'
            )}
          >
            MANOHAR <span className="text-brand">GRAND</span>
          </span>
          <span
            className={cn(
              'uppercase tracking-widest font-semibold',
              currentSize.subtitle,
              textVariant === 'light' ? 'text-neutral-400' : 'text-neutral-secondary'
            )}
          >
            Hotel &amp; Hospitality
          </span>
        </div>
      )}
    </div>
  );
};
