import React from 'react';
import { cn } from '../../utils/cn';

export type Icon3DName =
  | 'comfortable-stay'
  | 'connectivity'
  | 'easy-booking'
  | 'parking'
  | 'housekeeping'
  | 'air-conditioning'
  | 'hot-water'
  | 'wifi'
  | 'power-backup'
  | 'security'
  | 'corporate'
  | 'tv'
  | 'reception';

export interface Icon3DProps {
  name: Icon3DName | string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  withSurface?: boolean;
}

/**
 * 3D Hospitality Icon System
 * - Centralized registry with dimensional gradient layers, soft ambient lighting, and subtle shadow depth.
 * - Sits on a soft-grey/off-white (#F7F7F7) rounded surface.
 * - Ready for seamless replacement when client drops in external 3D raster/glTF/SVG renders.
 */
export const Icon3D: React.FC<Icon3DProps> = ({
  name,
  size = 'md',
  className,
  withSurface = true,
}) => {
  const sizeMap = {
    sm: {
      surface: 'w-10 h-10 p-1.5 rounded-lg',
      svg: 'w-6 h-6',
    },
    md: {
      surface: 'w-14 h-14 p-2 rounded-xl',
      svg: 'w-9 h-9',
    },
    lg: {
      surface: 'w-16 h-16 p-2.5 rounded-2xl',
      svg: 'w-11 h-11',
    },
    xl: {
      surface: 'w-20 h-20 p-3 rounded-2xl',
      svg: 'w-14 h-14',
    },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  const renderIconGraphic = () => {
    switch (name) {
      case 'comfortable-stay':
        return (
          <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="bedFrame" x1="8" y1="20" x2="56" y2="48" gradientUnits="userSpaceOnUse">
                <stop stopColor="#374151" />
                <stop offset="1" stopColor="#111827" />
              </linearGradient>
              <linearGradient id="mattress" x1="12" y1="28" x2="52" y2="44" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFFFFF" />
                <stop offset="1" stopColor="#E5E7EB" />
              </linearGradient>
              <linearGradient id="duvet" x1="14" y1="34" x2="50" y2="52" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FE2828" />
                <stop offset="1" stopColor="#B91C1C" />
              </linearGradient>
              <linearGradient id="pillow" x1="16" y1="22" x2="28" y2="30" gradientUnits="userSpaceOnUse">
                <stop stopColor="#F9FAFB" />
                <stop offset="1" stopColor="#D1D5DB" />
              </linearGradient>
            </defs>
            {/* Headboard */}
            <rect x="10" y="14" width="44" height="24" rx="4" fill="url(#bedFrame)" />
            <rect x="13" y="17" width="38" height="8" rx="2" fill="#4B5563" fillOpacity="0.4" />
            {/* Pillows */}
            <rect x="15" y="24" width="14" height="8" rx="3" fill="url(#pillow)" />
            <rect x="35" y="24" width="14" height="8" rx="3" fill="url(#pillow)" />
            {/* Mattress Base */}
            <rect x="8" y="32" width="48" height="18" rx="4" fill="url(#mattress)" />
            {/* Duvet in Brand Red Accent */}
            <path d="M8 38C8 35.7909 9.79086 34 12 34H52C54.2091 34 56 35.7909 56 38V48C56 50.2091 54.2091 52 52 52H12C9.79086 52 8 50.2091 8 48V38Z" fill="url(#duvet)" />
            <path d="M12 34H52C53.1046 34 54 34.8954 54 36V38H10V36C10 34.8954 10.8954 34 12 34Z" fill="#FFFFFF" fillOpacity="0.3" />
            {/* Bed Legs */}
            <rect x="10" y="50" width="4" height="6" rx="1" fill="#1F2937" />
            <rect x="50" y="50" width="4" height="6" rx="1" fill="#1F2937" />
          </svg>
        );

      case 'connectivity':
        return (
          <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="trainBody" x1="16" y1="12" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FE2828" />
                <stop offset="1" stopColor="#B91C1C" />
              </linearGradient>
              <linearGradient id="trainWindow" x1="20" y1="20" x2="44" y2="28" gradientUnits="userSpaceOnUse">
                <stop stopColor="#F3F4F6" />
                <stop offset="1" stopColor="#9CA3AF" />
              </linearGradient>
            </defs>
            {/* Metro/Train Cabin 3D */}
            <rect x="16" y="10" width="32" height="40" rx="8" fill="url(#trainBody)" />
            {/* Windshield */}
            <rect x="20" y="16" width="24" height="14" rx="4" fill="url(#trainWindow)" />
            <rect x="22" y="18" width="9" height="10" rx="2" fill="#1F2937" />
            <rect x="33" y="18" width="9" height="10" rx="2" fill="#1F2937" />
            {/* Headlights */}
            <circle cx="23" cy="40" r="3" fill="#FEF08A" />
            <circle cx="41" cy="40" r="3" fill="#FEF08A" />
            {/* Front Grill */}
            <rect x="28" y="38" width="8" height="4" rx="1" fill="#111827" fillOpacity="0.6" />
            {/* Rails / Tracks base */}
            <path d="M12 54L22 48M52 54L42 48" stroke="#4B5563" strokeWidth="3" strokeLinecap="round" />
            <line x1="10" y1="56" x2="54" y2="56" stroke="#9CA3AF" strokeWidth="3" strokeLinecap="round" />
          </svg>
        );

      case 'easy-booking':
        return (
          <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="ticketGrad" x1="12" y1="14" x2="52" y2="50" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFFFFF" />
                <stop offset="1" stopColor="#E5E7EB" />
              </linearGradient>
              <linearGradient id="badgeGrad" x1="36" y1="32" x2="56" y2="52" gradientUnits="userSpaceOnUse">
                <stop stopColor="#10B981" />
                <stop offset="1" stopColor="#047857" />
              </linearGradient>
            </defs>
            {/* Calendar / Ticket Slate */}
            <rect x="12" y="12" width="40" height="42" rx="7" fill="url(#ticketGrad)" stroke="#E5E7EB" strokeWidth="2" />
            <rect x="12" y="12" width="40" height="12" rx="6" fill="#FE0000" />
            <circle cx="22" cy="18" r="2" fill="#FFFFFF" />
            <circle cx="42" cy="18" r="2" fill="#FFFFFF" />
            {/* Lines */}
            <rect x="18" y="30" width="16" height="3" rx="1.5" fill="#9CA3AF" />
            <rect x="18" y="37" width="22" height="3" rx="1.5" fill="#D1D5DB" />
            <rect x="18" y="44" width="12" height="3" rx="1.5" fill="#D1D5DB" />
            {/* 3D Success Seal */}
            <circle cx="44" cy="42" r="10" fill="url(#badgeGrad)" />
            <path d="M40 42L43 45L48 39" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );

      case 'parking':
        return (
          <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="carRoof" x1="14" y1="12" x2="50" y2="48" gradientUnits="userSpaceOnUse">
                <stop stopColor="#1E293B" />
                <stop offset="1" stopColor="#0F172A" />
              </linearGradient>
              <linearGradient id="pBadge" x1="34" y1="8" x2="54" y2="28" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FE0000" />
                <stop offset="1" stopColor="#B91C1C" />
              </linearGradient>
            </defs>
            {/* Canopy / Parking Roof */}
            <path d="M10 24L32 14L54 24" stroke="#64748B" strokeWidth="3.5" strokeLinecap="round" />
            {/* Car silhouette */}
            <rect x="14" y="34" width="36" height="16" rx="5" fill="url(#carRoof)" />
            <path d="M19 34L24 24H40L45 34H19Z" fill="#334155" />
            <rect x="26" y="26" width="12" height="6" rx="1" fill="#94A3B8" />
            {/* Wheels */}
            <circle cx="22" cy="50" r="4.5" fill="#0F172A" stroke="#E2E8F0" strokeWidth="1.5" />
            <circle cx="42" cy="50" r="4.5" fill="#0F172A" stroke="#E2E8F0" strokeWidth="1.5" />
            {/* Headlight */}
            <circle cx="17" cy="40" r="2" fill="#FDE047" />
            <circle cx="47" cy="40" r="2" fill="#EF4444" />
            {/* 'P' Badge */}
            <circle cx="46" cy="18" r="9" fill="url(#pBadge)" />
            <text x="46" y="22" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="bold" fontFamily="sans-serif">P</text>
          </svg>
        );

      case 'housekeeping':
        return (
          <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="wandGrad" x1="16" y1="48" x2="44" y2="16" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FE0000" />
                <stop offset="1" stopColor="#F97316" />
              </linearGradient>
              <linearGradient id="sparkleGrad" x1="36" y1="12" x2="52" y2="28" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FBBF24" />
                <stop offset="1" stopColor="#D97706" />
              </linearGradient>
            </defs>
            {/* Vacuum / Hospitality Broom wand */}
            <path d="M16 48L38 22" stroke="url(#wandGrad)" strokeWidth="5" strokeLinecap="round" />
            {/* Cleaning Brush Head */}
            <path d="M12 52L22 42C23 44 25 46 27 47L17 57C14 57 12 55 12 52Z" fill="#374151" />
            {/* Sparkles */}
            <path d="M44 14L46 20L52 22L46 24L44 30L42 24L36 22L42 20L44 14Z" fill="url(#sparkleGrad)" />
            <path d="M26 12L27 16L31 17L27 18L26 22L25 18L21 17L25 16L26 12Z" fill="#FBBF24" />
            <path d="M48 36L49 39L52 40L49 41L48 44L47 41L44 40L47 39L48 36Z" fill="#FBBF24" />
          </svg>
        );

      case 'air-conditioning':
        return (
          <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="acBody" x1="10" y1="16" x2="54" y2="36" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFFFFF" />
                <stop offset="1" stopColor="#E2E8F0" />
              </linearGradient>
            </defs>
            {/* Split AC Unit */}
            <rect x="10" y="16" width="44" height="20" rx="4" fill="url(#acBody)" stroke="#CBD5E1" strokeWidth="2" />
            <line x1="14" y1="28" x2="50" y2="28" stroke="#94A3B8" strokeWidth="1.5" />
            <rect x="42" y="20" width="7" height="4" rx="1" fill="#0284C7" />
            {/* Air Waves in Light Blue */}
            <path d="M18 42C20 44 24 44 26 42C28 40 32 40 34 42" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M24 48C26 50 30 50 32 48C34 46 38 46 40 48" stroke="#0284C7" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M30 54C32 56 36 56 38 54C40 52 44 52 46 54" stroke="#0369A1" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        );

      case 'hot-water':
        return (
          <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-md">
            {/* Shower head */}
            <path d="M12 18H28C32 18 36 22 36 26V30H46" stroke="#475569" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M28 30L44 30L40 36L32 36L28 30Z" fill="#334155" />
            {/* Water Droplets */}
            <circle cx="32" cy="43" r="2.5" fill="#38BDF8" />
            <circle cx="40" cy="43" r="2.5" fill="#38BDF8" />
            <circle cx="36" cy="50" r="3" fill="#0284C7" />
            <circle cx="44" cy="52" r="2" fill="#0284C7" />
            <circle cx="30" cy="53" r="2" fill="#0284C7" />
            {/* Warm Steam in Orange */}
            <path d="M48 24C49 22 51 22 52 24C53 26 55 26 56 24" stroke="#F97316" strokeWidth="2" strokeLinecap="round" />
          </svg>
        );

      case 'wifi':
        return (
          <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-md">
            <path d="M14 22C24 13 40 13 50 22" stroke="#FE0000" strokeWidth="4.5" strokeLinecap="round" />
            <path d="M20 29C27 22 37 22 44 29" stroke="#E11D48" strokeWidth="4" strokeLinecap="round" />
            <path d="M26 36C30 32 34 32 38 36" stroke="#BE123C" strokeWidth="3.5" strokeLinecap="round" />
            <circle cx="32" cy="45" r="4.5" fill="#FE0000" />
          </svg>
        );

      case 'power-backup':
        return (
          <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-md">
            <rect x="14" y="18" width="36" height="34" rx="6" fill="#1E293B" />
            <rect x="24" y="12" width="16" height="6" rx="2" fill="#475569" />
            {/* Lightning Bolt in Vibrant Amber */}
            <path d="M35 24L24 36H33L29 46L41 33H32L35 24Z" fill="#FBBF24" stroke="#D97706" strokeWidth="1" />
          </svg>
        );

      case 'security':
        return (
          <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-md">
            <path d="M32 10L48 16V30C48 41 41 50 32 54C23 50 16 41 16 30V16L32 10Z" fill="#1E293B" stroke="#475569" strokeWidth="2" />
            <circle cx="32" cy="30" r="7" fill="#FE0000" />
            <circle cx="32" cy="30" r="3" fill="#FFFFFF" />
            <rect x="28" y="38" width="8" height="5" rx="1.5" fill="#10B981" />
          </svg>
        );

      case 'corporate':
        return (
          <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-md">
            <rect x="14" y="16" width="22" height="36" rx="3" fill="#1E293B" />
            <rect x="34" y="24" width="18" height="28" rx="3" fill="#334155" />
            {/* Windows */}
            <rect x="18" y="22" width="4" height="4" rx="1" fill="#93C5FD" />
            <rect x="26" y="22" width="4" height="4" rx="1" fill="#93C5FD" />
            <rect x="18" y="30" width="4" height="4" rx="1" fill="#93C5FD" />
            <rect x="26" y="30" width="4" height="4" rx="1" fill="#93C5FD" />
            <rect x="18" y="38" width="4" height="4" rx="1" fill="#93C5FD" />
            <rect x="26" y="38" width="4" height="4" rx="1" fill="#93C5FD" />
            {/* Front Canopy */}
            <rect x="20" y="46" width="10" height="6" rx="1" fill="#FE0000" />
          </svg>
        );

      case 'reception':
      default:
        return (
          <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-md">
            <path d="M14 42H50V46H14V42Z" fill="#1E293B" />
            <path d="M18 42C18 30 24 24 32 24C40 24 46 30 46 42H18Z" fill="#FE0000" />
            <rect x="30" y="18" width="4" height="6" rx="2" fill="#D97706" />
            <circle cx="32" cy="16" r="3" fill="#FBBF24" />
          </svg>
        );
    }
  };

  if (!withSurface) {
    return <div className={cn(currentSize.svg, className)}>{renderIconGraphic()}</div>;
  }

  return (
    <div
      className={cn(
        'bg-[#F7F7F7] border border-neutral-200/80 shadow-sm flex items-center justify-center shrink-0 transition-transform duration-300 hover:scale-105',
        currentSize.surface,
        className
      )}
    >
      <div className={cn('flex items-center justify-center', currentSize.svg)}>
        {renderIconGraphic()}
      </div>
    </div>
  );
};
