import React from 'react';

export interface BrandLogoSvgProps {
  className?: string;
  width?: number | string;
  height?: number | string;
  accentColor?: string;
  darkColor?: string;
}

/**
 * Clean, transparent SVG logo mark for Manohar Grand.
 * Features modern architectural/hospitality monograms with brand red accent.
 * No raster images, no white background box.
 */
export const BrandLogoSvg: React.FC<BrandLogoSvgProps> = ({
  className = 'w-10 h-10',
  width,
  height,
  accentColor = '#FE0000',
  darkColor = '#171717',
}) => {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      width={width}
      height={height}
      aria-label="Manohar Grand Emblem"
    >
      {/* Outer subtle shield / architectural crest */}
      <rect
        x="3"
        y="3"
        width="42"
        height="42"
        rx="10"
        stroke={darkColor}
        strokeWidth="2"
        strokeOpacity="0.15"
        fill="transparent"
      />
      
      {/* Dynamic 'M' geometry (Hospitality Arch Pillars) */}
      <path
        d="M12 36V14L20 25L24 19L28 25L36 14V36"
        stroke={darkColor}
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Brand Red Accent Crown / Canopy Arch */}
      <path
        d="M20 12L24 7L28 12"
        stroke={accentColor}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="24" cy="7" r="1.5" fill={accentColor} />

      {/* Modern Luxury Baseline Bar in Brand Red */}
      <rect
        x="15"
        y="38"
        width="18"
        height="2.5"
        rx="1.25"
        fill={accentColor}
      />
    </svg>
  );
};
