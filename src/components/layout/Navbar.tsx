import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, CalendarDays } from 'lucide-react';
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
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-border transition-all">
        <Container size="xl">
          <div className="flex items-center justify-between h-20">
            {/* Brand Logo Area */}
            <Link
              to="/"
              className="flex items-center gap-2 group focus-visible:outline-brand rounded-lg p-1"
              aria-label="Manohar Grand Home"
            >
              <Logo size="md" />
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-8" aria-label="Main Navigation">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={({ isActive }) =>
                    cn(
                      'text-sm font-semibold tracking-wide transition-colors hover:text-brand relative py-1 focus-visible:outline-brand rounded',
                      isActive ? 'text-brand font-bold' : 'text-neutral-text'
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

            {/* Desktop Action & Mobile Menu Toggle */}
            <div className="flex items-center gap-4">
              <Link to="/booking" className="hidden sm:inline-flex">
                <Button variant="primary" size="md" className="gap-2 font-semibold">
                  <CalendarDays className="w-4 h-4" />
                  Book Now
                </Button>
              </Link>

              {/* Mobile Hamburger Button */}
              <button
                type="button"
                onClick={() => setIsMobileOpen(true)}
                className="lg:hidden p-2 rounded-lg text-neutral-text hover:bg-neutral-light hover:text-brand focus-visible:outline-brand transition-colors"
                aria-label="Open mobile navigation menu"
                aria-expanded={isMobileOpen}
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </Container>
      </header>

      {/* Mobile Navigation Drawer */}
      <MobileNav
        isOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
        navItems={NAV_ITEMS}
      />
    </>
  );
};
