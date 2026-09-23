import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  X,
  Clock,
  ArrowUpRight,
  MessageSquare,
} from 'lucide-react';
import { PLACEHOLDER_HOTEL_INFO } from '../../data/placeholderHotelInfo';
import { cn } from '../../utils/cn';

export const FloatingContactWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Show after scrolling a little or immediately on load
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 80) {
        setIsVisible(true);
      } else {
        setIsVisible(true); // Always keep accessible or smoothly animate
      }
    };

    setIsVisible(true);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      className={cn(
        'fixed z-40 transition-all duration-300 ease-in-out print:hidden',
        // On mobile: sit above bottom nav bar (pb-20 => bottom-20), on tablet/desktop: bottom-6
        'bottom-20 left-3 xs:left-4 md:bottom-6 md:left-6',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      )}
    >
      {/* Quick Contact Modal / Popover */}
      {isOpen && (
        <div
          className="mb-3 w-[290px] xs:w-[320px] bg-white text-neutral-900 rounded-2xl shadow-2xl border border-neutral-200/90 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          role="dialog"
          aria-label="Quick Contact Options"
        >
          {/* Header */}
          <div className="bg-neutral-900 text-white p-3.5 flex items-center justify-between border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center text-brand">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Contact Manohar Grand</h4>
                <p className="text-[10px] text-neutral-300 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-feedback-success" />
                  <span>24/7 Front Desk Available</span>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              aria-label="Close contact popup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Contact Action List */}
          <div className="p-3 space-y-2 bg-neutral-50/50">
            {/* Primary Phone */}
            <a
              href="tel:7997044999"
              className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-neutral-200/80 hover:border-brand hover:bg-brand-subtle transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-50 text-brand flex items-center justify-center group-hover:bg-brand group-hover:text-white transition-colors">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="text-[10px] font-semibold text-neutral-500 block uppercase">Call Primary</span>
                  <span className="text-xs font-bold text-neutral-900 group-hover:text-brand transition-colors">
                    +91 7997044999
                  </span>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-neutral-400 group-hover:text-brand group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </a>

            {/* Secondary Phone */}
            <a
              href="tel:7997022999"
              className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-neutral-200/80 hover:border-brand hover:bg-brand-subtle transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-50 text-brand flex items-center justify-center group-hover:bg-brand group-hover:text-white transition-colors">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="text-[10px] font-semibold text-neutral-500 block uppercase">Call Secondary</span>
                  <span className="text-xs font-bold text-neutral-900 group-hover:text-brand transition-colors">
                    +91 7997022999
                  </span>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-neutral-400 group-hover:text-brand group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </a>

            {/* WhatsApp Chat */}
            <a
              href="https://wa.me/917997044999?text=Hello%20Manohar%20Grand,%20I%20would%20like%20to%20inquire%20about%20room%20availability."
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-neutral-200/80 hover:border-feedback-success hover:bg-emerald-50/50 transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-feedback-success flex items-center justify-center group-hover:bg-feedback-success group-hover:text-white transition-colors">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="text-[10px] font-semibold text-neutral-500 block uppercase">WhatsApp</span>
                  <span className="text-xs font-bold text-neutral-900 group-hover:text-feedback-success transition-colors">
                    Chat on WhatsApp
                  </span>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-neutral-400 group-hover:text-feedback-success group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </a>

            {/* Email */}
            <a
              href={`mailto:${PLACEHOLDER_HOTEL_INFO.email}`}
              className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-neutral-200/80 hover:border-brand hover:bg-brand-subtle transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-neutral-100 text-neutral-700 flex items-center justify-center group-hover:bg-brand group-hover:text-white transition-colors">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="text-left truncate max-w-[170px]">
                  <span className="text-[10px] font-semibold text-neutral-500 block uppercase">Email Reception</span>
                  <span className="text-[11px] font-bold text-neutral-900 group-hover:text-brand transition-colors truncate block">
                    {PLACEHOLDER_HOTEL_INFO.email}
                  </span>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-neutral-400 group-hover:text-brand group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </a>
          </div>

          {/* Full Contact Page Footer Link */}
          <div className="p-2.5 bg-neutral-100 border-t border-neutral-200 text-center">
            <Link
              to="/contact"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-brand hover:text-brand-hover hover:underline"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>View Location, Map &amp; Full Details</span>
            </Link>
          </div>
        </div>
      )}

      {/* Floating Button & Pill Badge */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={cn(
            'group relative flex items-center justify-center',
            'w-13 h-13 sm:w-14 sm:h-14 rounded-full',
            'bg-gradient-to-tr from-[#E00000] to-[#FE0000] text-white',
            'shadow-[0_8px_24px_rgba(254,0,0,0.42)] hover:shadow-[0_12px_28px_rgba(254,0,0,0.55)]',
            'transition-all duration-300 transform active:scale-95 hover:scale-105',
            'border-2 border-white/80 focus-visible:outline-brand cursor-pointer'
          )}
          aria-label={isOpen ? 'Close contact menu' : 'Contact Us'}
          aria-expanded={isOpen}
        >
          {/* Subtle pulse ring animation */}
          <span className="absolute -inset-1 rounded-full bg-brand/30 animate-ping pointer-events-none opacity-60" />

          {isOpen ? (
            <X className="w-6 h-6 text-white relative z-10 transition-transform duration-200" />
          ) : (
            <MessageCircle className="w-6 h-6 text-white relative z-10 transition-transform duration-200 group-hover:scale-110" />
          )}
        </button>

        {/* "Contact us" Pill Badge */}
        {!isOpen && (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className={cn(
              'px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md',
              'text-neutral-900 font-bold text-xs tracking-tight',
              'border border-neutral-200/90 shadow-[0_4px_16px_rgba(0,0,0,0.12)]',
              'hover:bg-brand hover:text-white hover:border-brand transition-all duration-200',
              'animate-in fade-in slide-in-from-left-2 cursor-pointer'
            )}
          >
            Contact us
          </button>
        )}
      </div>
    </div>
  );
};
