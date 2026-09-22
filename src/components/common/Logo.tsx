import React from 'react';
import { BrandLogoSvg } from '../../assets/logos/BrandLogoSvg';
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
 * - 100% Transparent SVG logo mark.
 * - No white background box or raster JPEG/PNG.
 * - Removed "HOTEL & HOSPITALITY" per client instructions.
 * - Brand styling: Black "MANOHAR" + Brand Red "GRAND".
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
      svg: 'w-7 h-7',
      title: 'text-base font-extrabold tracking-tight',
    },
    md: {
      svg: 'w-9 h-9',
      title: 'text-lg md:text-xl font-extrabold tracking-tight',
    },
    lg: {
      svg: 'w-11 h-11',
      title: 'text-xl md:text-2xl font-extrabold tracking-tight',
    },
    xl: {
      svg: 'w-14 h-14',
      title: 'text-2xl md:text-3xl font-black tracking-tight',
    },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={cn('flex items-center gap-2.5 select-none', className)}>
      {/* Transparent SVG Logo Mark */}
      <div className={cn('shrink-0 flex items-center justify-center', imageClassName)}>
        <BrandLogoSvg
          className={currentSize.svg}
          accentColor="#FE0000"
          darkColor={textVariant === 'light' ? '#FFFFFF' : '#171717'}
        />
      </div>

      {showText && (
        <span
          className={cn(
            'font-sans leading-none',
            currentSize.title,
            textVariant === 'light' ? 'text-white' : 'text-neutral-dark'
          )}
        >
          MANOHAR <span className="text-brand">GRAND</span>
        </span>
      )}
    </div>
  );
};
