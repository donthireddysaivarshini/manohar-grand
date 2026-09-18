import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { CalendarDays } from 'lucide-react';
import { Drawer } from '../common/Drawer';
import { Button } from '../common/Button';
import { Logo } from '../common/Logo';
import { NavItem } from './Navbar';
import { cn } from '../../utils/cn';

export interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  navItems: NavItem[];
}

export const MobileNav: React.FC<MobileNavProps> = ({
  isOpen,
  onClose,
  navItems,
}) => {
  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      position="right"
      title="Navigation"
    >
      <div className="flex flex-col h-full justify-between gap-6 py-2">
        {/* Brand Banner */}
        <div className="p-3 bg-neutral-light rounded-lg border border-neutral-border">
          <Logo size="sm" />
        </div>

        {/* Navigation List */}
        <nav className="flex flex-col gap-1.5" aria-label="Mobile Navigation Links">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center justify-between px-4 py-3 rounded-lg text-base font-semibold transition-colors',
                  isActive
                    ? 'bg-brand-subtle text-brand border border-brand/20'
                    : 'text-neutral-text hover:bg-neutral-light'
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Prominent Mobile Book Now CTA */}
        <div className="pt-4 border-t border-neutral-border flex flex-col gap-3">
          <Link to="/booking" onClick={onClose} className="w-full">
            <Button variant="primary" size="lg" className="w-full gap-2 font-bold shadow-md">
              <CalendarDays className="w-5 h-5" />
              Book Now
            </Button>
          </Link>
          <p className="text-center text-xs text-neutral-secondary">
            Best rates guaranteed for direct booking
          </p>
        </div>
      </div>
    </Drawer>
  );
};
