import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { CalendarDays, Phone } from 'lucide-react';
import { Container } from '../common/Container';
import { Button } from '../common/Button';
import { Logo } from '../common/Logo';
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
  return (
    <header className="sticky top-0 z-40 bg-white/98 backdrop-blur-md border-b border-neutral-200 shadow-xs transition-all">
      <Container size="xl">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo Area */}
          <Link
            to="/"
            className="flex items-center gap-2 group focus-visible:outline-brand rounded-lg p-0.5"
            aria-label="Manohar Grand Home"
          >
            <Logo size="md" />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 xl:gap-8" aria-label="Main Navigation">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    'text-sm font-semibold tracking-wide transition-colors hover:text-brand relative py-1 focus-visible:outline-brand rounded',
                    isActive ? 'text-brand font-bold' : 'text-neutral-dark'
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

          {/* Header Actions (Call & Book) */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <a
              href="tel:7997044999"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 text-neutral-700 hover:text-brand hover:border-brand/40 text-xs font-bold transition-colors"
              aria-label="Call Front Desk"
            >
              <Phone className="w-3.5 h-3.5 text-brand" />
              <span className="hidden xs:inline">7997044999</span>
            </a>

            <Link to="/booking">
              <Button variant="primary" size="sm" className="gap-1.5 font-bold text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4">
                <CalendarDays className="w-4 h-4" />
                <span>Book</span>
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </header>
  );
};

