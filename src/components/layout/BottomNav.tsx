import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, BedDouble, CalendarDays, Image, PhoneCall } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface BottomNavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  isPrimary?: boolean;
}

export const BOTTOM_NAV_ITEMS: BottomNavItem[] = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Rooms', href: '/rooms', icon: BedDouble },
  { label: 'Book', href: '/booking', icon: CalendarDays, isPrimary: true },
  { label: 'Gallery', href: '/gallery', icon: Image },
  { label: 'Contact', href: '/contact', icon: PhoneCall },
];

/**
 * Persistent Mobile Bottom Navigation.
 * - Primary mobile navigation bar replacing hamburger dependency.
 * - Fixed bottom with backdrop blur and subtle border.
 * - Brand red #FE0000 for active state.
 * - Center "Book" button styled prominently.
 * - Native iOS safe-area padding support.
 */
export const BottomNav: React.FC = () => {
  const { pathname } = useLocation();

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 lg:hidden',
        'bg-white/95 backdrop-blur-lg border-t border-neutral-200/90 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]',
        'px-2 pt-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom))]',
        'print:hidden'
      )}
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);

          if (item.isPrimary) {
            return (
              <NavLink
                key={item.href}
                to={item.href}
                className="flex flex-col items-center group -mt-5 focus-visible:outline-brand"
                aria-label="Book Your Stay"
              >
                <div
                  className={cn(
                    'w-12 h-12 p-2.5 rounded-full flex items-center justify-center transition-all duration-300 transform',
                    'shadow-[0_4px_14px_rgba(254,0,0,0.35)] group-active:scale-95',
                    isActive
                      ? 'bg-brand text-white scale-105 ring-4 ring-brand/20'
                      : 'bg-brand text-white hover:bg-brand-hover'
                  )}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <span
                  className={cn(
                    'text-[10px] font-bold tracking-tight mt-1 transition-colors',
                    isActive ? 'text-brand' : 'text-neutral-dark'
                  )}
                >
                  {item.label}
                </span>
              </NavLink>
            );
          }

          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={cn(
                'flex flex-col items-center justify-center py-1 px-3 min-w-[56px] min-h-[44px] rounded-lg transition-all',
                'focus-visible:outline-brand group',
                isActive ? 'text-brand' : 'text-neutral-500 hover:text-neutral-900'
              )}
            >
              <div className="relative">
                <Icon
                  className={cn(
                    'w-5 h-5 transition-transform duration-200 group-active:scale-90',
                    isActive ? 'stroke-[2.4px] scale-110' : 'stroke-[1.8px]'
                  )}
                />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-brand rounded-full" />
                )}
              </div>
              <span
                className={cn(
                  'text-[10px] font-semibold mt-1 tracking-tight',
                  isActive ? 'font-bold text-brand' : 'text-neutral-500'
                )}
              >
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
