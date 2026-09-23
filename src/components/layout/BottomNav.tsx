import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, BedDouble, CalendarDays, Image, Menu } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface BottomNavProps {
  onOpenMenu: () => void;
  isMenuOpen?: boolean;
}

/**
 * Persistent Mobile Bottom Navigation.
 * - Primary mobile navigation bar.
 * - 5 items: Home, Rooms, Book (Center), Gallery, More (Hamburger drawer trigger).
 * - Fixed bottom with backdrop blur and subtle border.
 * - Brand red #FE0000 for active state.
 * - Native iOS safe-area padding support.
 */
export const BottomNav: React.FC<BottomNavProps> = ({ onOpenMenu, isMenuOpen }) => {
  const { pathname } = useLocation();

  const isOtherSectionActive = [
    '/amenities',
    '/corporate-booking',
    '/about',
    '/contact',
    '/account',
  ].some((path) => pathname.startsWith(path));

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 md:hidden',
        'bg-white/95 backdrop-blur-lg border-t border-neutral-200/90 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]',
        'px-2 pt-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom))]',
        'print:hidden'
      )}
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {/* 1. Home */}
        <NavLink
          to="/"
          className={({ isActive }) =>
            cn(
              'flex-1 min-w-0 flex flex-col items-center justify-center py-1 px-1 xs:px-2 min-h-[44px] rounded-lg transition-all',
              'focus-visible:outline-brand group text-center',
              isActive ? 'text-brand' : 'text-neutral-500 hover:text-neutral-900'
            )
          }
        >
          {({ isActive }) => (
            <>
              <div className="relative">
                <Home
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
                Home
              </span>
            </>
          )}
        </NavLink>

        {/* 2. Rooms */}
        <NavLink
          to="/rooms"
          className={({ isActive }) =>
            cn(
              'flex-1 min-w-0 flex flex-col items-center justify-center py-1 px-1 xs:px-2 min-h-[44px] rounded-lg transition-all',
              'focus-visible:outline-brand group text-center',
              isActive ? 'text-brand' : 'text-neutral-500 hover:text-neutral-900'
            )
          }
        >
          {({ isActive }) => (
            <>
              <div className="relative">
                <BedDouble
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
                Rooms
              </span>
            </>
          )}
        </NavLink>

        {/* 3. Center Book CTA */}
        <NavLink
          to="/booking"
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center group -mt-5 focus-visible:outline-brand',
              isActive ? 'text-brand' : 'text-neutral-dark'
            )
          }
          aria-label="Book Your Stay"
        >
          {({ isActive }) => (
            <>
              <div
                className={cn(
                  'w-12 h-12 p-2.5 rounded-full flex items-center justify-center transition-all duration-300 transform',
                  'shadow-[0_4px_14px_rgba(254,0,0,0.35)] group-active:scale-95',
                  isActive
                    ? 'bg-brand text-white scale-105 ring-4 ring-brand/20'
                    : 'bg-brand text-white hover:bg-brand-hover'
                )}
              >
                <CalendarDays className="w-6 h-6" />
              </div>
              <span
                className={cn(
                  'text-[10px] font-bold tracking-tight mt-1 transition-colors',
                  isActive ? 'text-brand' : 'text-neutral-dark'
                )}
              >
                Book
              </span>
            </>
          )}
        </NavLink>

        {/* 4. Gallery */}
        <NavLink
          to="/gallery"
          className={({ isActive }) =>
            cn(
              'flex-1 min-w-0 flex flex-col items-center justify-center py-1 px-1 xs:px-2 min-h-[44px] rounded-lg transition-all',
              'focus-visible:outline-brand group text-center',
              isActive ? 'text-brand' : 'text-neutral-500 hover:text-neutral-900'
            )
          }
        >
          {({ isActive }) => (
            <>
              <div className="relative">
                <Image
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
                Gallery
              </span>
            </>
          )}
        </NavLink>

        {/* 5. More (Opens Full Hamburger Menu Drawer) */}
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Open More Menu"
          aria-expanded={isMenuOpen}
          className={cn(
            'flex-1 min-w-0 flex flex-col items-center justify-center py-1 px-1 xs:px-2 min-h-[44px] rounded-lg transition-all',
            'focus-visible:outline-brand group text-center',
            isMenuOpen || isOtherSectionActive
              ? 'text-brand'
              : 'text-neutral-500 hover:text-neutral-900'
          )}
        >
          <div className="relative">
            <Menu
              className={cn(
                'w-5 h-5 transition-transform duration-200 group-active:scale-90',
                isMenuOpen || isOtherSectionActive
                  ? 'stroke-[2.4px] scale-110 text-brand'
                  : 'stroke-[1.8px]'
              )}
            />
            {(isMenuOpen || isOtherSectionActive) && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-brand rounded-full" />
            )}
          </div>
          <span
            className={cn(
              'text-[10px] font-semibold mt-1 tracking-tight',
              isMenuOpen || isOtherSectionActive ? 'font-bold text-brand' : 'text-neutral-500'
            )}
          >
            More
          </span>
        </button>
      </div>
    </nav>
  );
};
