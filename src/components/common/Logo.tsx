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
      img: 'w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10',
      title: 'text-sm xs:text-base sm:text-lg md:text-xl font-black tracking-tight',
    },
    lg: {
      img: 'w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12',
      title: 'text-base sm:text-xl md:text-2xl font-black tracking-tight',
    },
    xl: {
      img: 'w-11 h-11 sm:w-13 sm:h-13 md:w-14 md:h-14',
      title: 'text-xl sm:text-2xl md:text-3xl font-black tracking-tight',
    },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={cn('flex items-center gap-2 sm:gap-2.5 select-none shrink-0', className)}>
      {/* Official Brand Logo Image */}
      <div
        className={cn(
          'relative rounded-lg overflow-hidden shrink-0 flex items-center justify-center p-0.5 shadow-2xs',
          textVariant === 'light' ? 'bg-white' : 'bg-transparent',
          currentSize.img,
          imageClassName
        )}
      >
        <img
          src="/logomg.jpeg"
          alt="Manohar Grand Logo"
          className="w-full h-full object-contain"
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

