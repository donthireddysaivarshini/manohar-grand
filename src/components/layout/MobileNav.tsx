import React, { useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  X,
  Home,
  BedDouble,
  Sparkles,
  Image,
  Briefcase,
  Info,
  MapPin,
  CalendarDays,
  Phone,
  User,
  ChevronRight,
  ShieldCheck,
  LogOut,
  BookOpen,
  LayoutDashboard,
} from 'lucide-react';
import { Logo } from '../common/Logo';
import { Button } from '../common/Button';
import { useAuth } from '../../store/AuthContext';
import { useHotelConfig } from '../../store/HotelConfigContext';
import { cn } from '../../utils/cn';

export interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ isOpen, onClose }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { config } = useHotelConfig();
  const cleanPhone = config.primary_phone ? config.primary_phone.replace(/[^0-9]/g, '') : '9490102008';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const displayName = user ? (user.full_name || user.first_name || user.email.split('@')[0]) : '';
  const userInitial = displayName ? displayName.charAt(0).toUpperCase() : 'U';

  const navSections = [
    {
      label: 'Main Navigation',
      items: [
        { label: 'Home', href: '/', icon: Home },
        {
          label: 'Rooms & Accommodations',
          href: '/rooms',
          icon: BedDouble,
          subItems: [
            { label: 'AC Room', href: '/rooms/ac-room' },
            { label: 'Non-AC Room', href: '/rooms/non-ac-room' },
          ],
        },
        { label: 'Hotel Amenities', href: '/amenities', icon: Sparkles },
        { label: 'Photo Gallery', href: '/gallery', icon: Image },
        { label: 'Corporate & Bulk Booking', href: '/corporate-booking', icon: Briefcase },
        { label: 'About Manohar Grand', href: '/about', icon: Info },
        { label: 'Location & Contact', href: '/contact', icon: MapPin },
      ],
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Site Navigation Menu"
    >
      <div
        className={cn(
          'fixed inset-y-0 right-0 w-full max-w-[310px] xs:max-w-[340px] bg-[#171717] text-white flex flex-col shadow-2xl z-50 border-l border-neutral-800 animate-in slide-in-from-right duration-250'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-neutral-800 bg-[#141414]">
          <Link to="/" onClick={onClose} aria-label="Manohar Grand Home">
            <Logo size="sm" textVariant="light" />
          </Link>
          <button
            onClick={onClose}
            type="button"
            aria-label="Close menu"
            className="p-1.5 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white hover:bg-neutral-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation Body */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-5">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 px-2.5 block">
                {section.label}
              </span>
              <nav className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.href} className="space-y-1">
                      <NavLink
                        to={item.href}
                        onClick={onClose}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors',
                            isActive
                              ? 'bg-brand text-white shadow-sm'
                              : 'text-neutral-200 hover:bg-neutral-800 hover:text-white'
                          )
                        }
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className="w-4 h-4 text-brand shrink-0 group-hover:text-white" />
                          <span>{item.label}</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
                      </NavLink>

                      {/* Sub-Items if present */}
                      {item.subItems && (
                        <div className="pl-6 pr-1 space-y-0.5 pt-0.5 border-l border-neutral-800 ml-4">
                          {item.subItems.map((sub) => (
                            <NavLink
                              key={sub.href}
                              to={sub.href}
                              onClick={onClose}
                              className={({ isActive }) =>
                                cn(
                                  'flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors',
                                  isActive
                                    ? 'text-brand font-bold bg-neutral-800'
                                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
                                )
                              }
                            >
                              <span>{sub.label}</span>
                              <ChevronRight className="w-3 h-3 text-neutral-600" />
                            </NavLink>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>
            </div>
          ))}

          {/* Direct Booking & Customer Account Section */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 px-2.5 block">
              Direct Booking & Account
            </span>

            <nav className="space-y-1">
              <NavLink
                to="/booking"
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors',
                    isActive
                      ? 'bg-brand text-white shadow-sm'
                      : 'text-neutral-200 hover:bg-neutral-800 hover:text-white'
                  )
                }
              >
                <div className="flex items-center gap-2.5">
                  <CalendarDays className="w-4 h-4 text-brand shrink-0" />
                  <span>Check Availability & Book</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
              </NavLink>

              {isAuthenticated && user ? (
                <>
                  {/* Logged in User Card */}
                  <div className="p-3 rounded-xl bg-neutral-800/80 border border-neutral-700/80 space-y-2 mt-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-brand text-white flex items-center justify-center text-xs font-bold shrink-0">
                        {userInitial}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-white truncate">{displayName}</p>
                        <p className="text-[10px] text-neutral-400 truncate">{user.email}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      <Link
                        to="/account/bookings"
                        onClick={onClose}
                        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700/60 text-[11px] font-semibold text-neutral-200 hover:text-white"
                      >
                        <BookOpen className="w-3 h-3 text-brand" />
                        <span>My Bookings</span>
                      </Link>
                      <Link
                        to="/account/dashboard"
                        onClick={onClose}
                        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700/60 text-[11px] font-semibold text-neutral-200 hover:text-white"
                      >
                        <LayoutDashboard className="w-3 h-3 text-brand" />
                        <span>Dashboard</span>
                      </Link>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        onClose();
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-semibold text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3 h-3" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              ) : (
                <NavLink
                  to="/account/login"
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors',
                      isActive
                        ? 'bg-brand text-white shadow-sm'
                        : 'text-neutral-200 hover:bg-neutral-800 hover:text-white'
                    )
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <User className="w-4 h-4 text-brand shrink-0" />
                    <span>Customer Account / Sign In</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
                </NavLink>
              )}
            </nav>
          </div>

          {/* Location & Quick Contact Card */}
          <div className="p-3 rounded-xl bg-neutral-800/70 border border-neutral-700/80 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <ShieldCheck className="w-4 h-4 text-feedback-success" />
              <span>Direct Booking Advantages</span>
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Walkable distance from JNTU Metro Station with 24/7 reception support.
            </p>
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-3.5 border-t border-neutral-800 bg-[#141414] space-y-2 shrink-0">
          <Link to="/booking" onClick={onClose} className="w-full block">
            <Button variant="primary" size="md" className="w-full gap-2 font-bold shadow-md h-10 text-xs">
              <CalendarDays className="w-4 h-4" />
              <span>Book Your Stay</span>
            </Button>
          </Link>

          <a
            href={`tel:${cleanPhone}`}
            className="w-full flex items-center justify-center gap-2 h-9 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-200 hover:text-white text-xs font-semibold transition-colors"
          >
            <Phone className="w-3.5 h-3.5 text-brand" />
            <span>Call Reception: {config.primary_phone}</span>
          </a>
        </div>
      </div>
    </div>
  );
};

