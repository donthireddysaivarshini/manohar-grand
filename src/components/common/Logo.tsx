import React from 'react';
import { cn } from '../../utils/cn';

export interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textVariant?: 'dark' | 'light';
  className?: string;
  imageClassName?: string;
}

/**
 * Centralized Manohar Grand Brand Logo component.
 * - Uses client's official brand logo (/logomg.jpeg).
 * - "MANOHAR GRAND" displayed in solid black color in header / light in dark mode.
 * - Clean responsive dimensions.
 */
export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  textVariant = 'dark',
  className,
  imageClassName,
}) => {
  const sizeMap = {
    sm: {
      img: 'w-7 h-7 sm:w-8 sm:h-8',
      title: 'text-sm sm:text-base font-extrabold tracking-tight',
    },
    md: {
      img: 'w-8 h-8 sm:w-10 sm:h-10',
      title: 'text-base sm:text-lg md:text-xl font-black tracking-tight',
    },
    lg: {
      img: 'w-10 h-10 sm:w-12 sm:h-12',
      title: 'text-lg sm:text-xl md:text-2xl font-black tracking-tight',
    },
    xl: {
      img: 'w-12 h-12 sm:w-14 sm:h-14',
      title: 'text-xl sm:text-2xl md:text-3xl font-black tracking-tight',
    },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={cn('flex items-center gap-2 sm:gap-2.5 select-none shrink-0', className)}>
      {/* Official Brand Logo Image */}
      <div
        className={cn(
          'relative rounded-lg overflow-hidden shrink-0 bg-transparent flex items-center justify-center',
          currentSize.img,
          imageClassName
        )}
      >
        <img
          src="/logomg.jpeg"
          alt="Manohar Grand Logo"
          className="w-full h-full object-contain mix-blend-multiply"
          loading="eager"
        />
      </div>

      {showText && (
        <span
          className={cn(
            'font-sans uppercase leading-none whitespace-nowrap',
            currentSize.title,
            textVariant === 'light' ? 'text-white' : 'text-black'
          )}
        >
          MANOHAR GRAND
        </span>
      )}
    </div>
  );
};

