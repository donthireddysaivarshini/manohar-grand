import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { CalendarDays, Phone, Menu } from 'lucide-react';
import { Container } from '../common/Container';
import { Button } from '../common/Button';
import { Logo } from '../common/Logo';
import { MobileNav } from './MobileNav';
import { cn } from '../../utils/cn';

export interface NavItem {
  label: string;
  href: string;
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Rooms', href: '/rooms' },
  { label: 'Amenities', href: '/amenities' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'Corporate Booking', href: '/corporate-booking' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export const Navbar: React.FC = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-neutral-dark text-white border-b border-neutral-800 shadow-md transition-all">
        <Container size="xl" className="px-3 xs:px-4 sm:px-6 md:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 md:h-20 gap-2">
            {/* Brand Logo Area */}
            <Link
              to="/"
              className="flex items-center gap-2 group focus-visible:outline-brand rounded-lg p-0.5 shrink-0 min-w-0"
              aria-label="Manohar Grand Home"
            >
              <Logo size="md" textVariant="light" />
            </Link>

            {/* Desktop & Tablet Navigation Links */}
            <nav className="hidden md:flex items-center gap-4 lg:gap-6 xl:gap-8" aria-label="Main Navigation">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={({ isActive }) =>
                    cn(
                      'text-xs lg:text-sm font-semibold tracking-wide transition-colors py-1 focus-visible:outline-brand rounded relative whitespace-nowrap',
                      isActive ? 'text-brand font-bold' : 'text-neutral-300 hover:text-white'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {item.label}
                      {isActive && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-full" />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>

            {/* Header Actions (Phone Pill, Red Book Button, Hamburger Menu) */}
            <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-3 shrink-0">
              <a
                href="tel:7997044999"
                className="inline-flex items-center justify-center gap-1.5 h-8 sm:h-9 px-2.5 sm:px-3 rounded-lg bg-neutral-800 border border-neutral-700/80 text-neutral-200 hover:text-white hover:border-neutral-500 text-xs font-semibold transition-colors"
                aria-label="Call Reception 7997044999"
              >
                <Phone className="w-3.5 h-3.5 text-brand shrink-0" />
                <span className="hidden sm:inline font-bold">7997044999</span>
              </a>

              <Link to="/booking" className="shrink-0">
                <Button variant="primary" size="sm" className="gap-1.5 font-bold text-xs h-8 sm:h-9 px-2.5 xs:px-3 sm:px-4 shrink-0 shadow-sm">
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span>Book</span>
                </Button>
              </Link>

              {/* Mobile Hamburger Drawer Trigger (Mobile Only) */}
              <button
                type="button"
                onClick={() => setIsMobileOpen(true)}
                className="md:hidden inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-neutral-800 border border-neutral-700/80 text-neutral-200 hover:text-white hover:bg-neutral-700 transition-colors focus-visible:outline-brand"
                aria-label="Open full navigation menu"
                aria-expanded={isMobileOpen}
              >
                <Menu className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        </Container>
      </header>

      {/* Complete Mobile Navigation Drawer */}
      <MobileNav
        isOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
      />
    </>
  );
};


