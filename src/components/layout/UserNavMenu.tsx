import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, LogOut, BookOpen, LayoutDashboard, UserCheck, ChevronDown } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { cn } from '../../utils/cn';

export const UserNavMenu: React.FC = () => {
  const { user, isAuthenticated, isLoading, logout, openAuthModal } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="w-8 h-8 rounded-lg bg-neutral-800 animate-pulse shrink-0" />
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <button
        type="button"
        onClick={() => openAuthModal('login')}
        className={cn(
          'inline-flex items-center justify-center gap-1.5 h-8 sm:h-9 px-2.5 sm:px-3 rounded-lg',
          'bg-neutral-800 border border-neutral-700/80 text-neutral-200 hover:text-white hover:border-neutral-500',
          'text-xs font-semibold transition-all shrink-0 focus-visible:outline-brand cursor-pointer'
        )}
        aria-label="Customer Sign In"
      >
        <User className="w-3.5 h-3.5 text-brand shrink-0" />
        <span className="font-bold">Sign In</span>
      </button>
    );
  }

  // Derive display name
  const displayName = user.full_name || user.first_name || user.email.split('@')[0];
  const userInitial = (displayName || 'U').charAt(0).toUpperCase();

  return (
    <div className="relative shrink-0" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User account menu"
        className={cn(
          'inline-flex items-center gap-2 h-8 sm:h-9 px-2.5 sm:px-3 rounded-lg',
          'bg-neutral-800/90 border border-neutral-700 text-neutral-100 hover:border-neutral-500',
          'text-xs font-semibold transition-all cursor-pointer focus-visible:outline-brand',
          isOpen && 'border-brand ring-2 ring-brand/20 bg-neutral-800'
        )}
      >
        <div className="w-5 h-5 rounded-full bg-brand text-white flex items-center justify-center text-[10px] font-black shrink-0 shadow-xs">
          {userInitial}
        </div>
        <span className="hidden sm:inline font-bold max-w-[100px] truncate">
          {displayName}
        </span>
        <ChevronDown
          className={cn(
            'w-3.5 h-3.5 text-neutral-400 transition-transform duration-200',
            isOpen && 'rotate-180 text-brand'
          )}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={cn(
            'absolute right-0 mt-2 w-56 rounded-xl bg-[#1c1c1c] text-neutral-200',
            'border border-neutral-700/90 shadow-2xl z-50 py-1.5',
            'animate-in fade-in-50 zoom-in-95 duration-150'
          )}
        >
          {/* User Info Header */}
          <div className="px-3.5 py-2.5 border-b border-neutral-800">
            <p className="text-xs font-bold text-white truncate">{displayName}</p>
            <p className="text-[11px] text-neutral-400 truncate">{user.email}</p>
          </div>

          {/* Navigation Links */}
          <div className="py-1 space-y-0.5">
            <Link
              to="/account/dashboard"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-neutral-200 hover:bg-neutral-800 hover:text-white transition-colors"
            >
              <LayoutDashboard className="w-4 h-4 text-brand shrink-0" />
              <span>Activity Dashboard</span>
            </Link>

            <Link
              to="/account/bookings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-neutral-200 hover:bg-neutral-800 hover:text-white transition-colors"
            >
              <BookOpen className="w-4 h-4 text-brand shrink-0" />
              <span>My Bookings & Stays</span>
            </Link>

            <Link
              to="/account/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-neutral-200 hover:bg-neutral-800 hover:text-white transition-colors"
            >
              <UserCheck className="w-4 h-4 text-brand shrink-0" />
              <span>Profile Details</span>
            </Link>
          </div>

          {/* Sign Out Action */}
          <div className="pt-1 mt-1 border-t border-neutral-800">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-colors text-left cursor-pointer"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
