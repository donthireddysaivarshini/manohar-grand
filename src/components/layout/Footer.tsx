import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, ShieldCheck, Clock } from 'lucide-react';
import { Container } from '../common/Container';
import { Logo } from '../common/Logo';
import { useHotelConfig } from '../../store/HotelConfigContext';

export const Footer: React.FC = () => {
  const { config } = useHotelConfig();
  const currentYear = new Date().getFullYear();

  const primaryCleanPhone = config.primary_phone.replace(/[^0-9]/g, '');
  const secondaryCleanPhone = config.secondary_phone.replace(/[^0-9]/g, '');

  return (
    <footer className="bg-neutral-dark text-white border-t border-neutral-800 pt-14 pb-8">
      <Container size="xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-neutral-800/80">
          {/* Col 1: Brand & Overview */}
          <div className="flex flex-col gap-4">
            <Link to="/" aria-label="Manohar Grand Home">
              <Logo size="md" textVariant="light" />
            </Link>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Experience comfortable AC &amp; Non-AC rooms, 24/7 front desk service, and direct booking benefits at {config.hotel_name || 'Manohar Grand'}.
            </p>

            {/* Social Media Links */}
            <div className="flex items-center gap-3 pt-1">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Manohar Grand on Facebook"
                className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center transition-transform hover:scale-110 active:scale-95 shadow-sm"
              >
                <svg className="w-full h-full" viewBox="0 0 36 36" fill="none">
                  <circle cx="18" cy="18" r="18" fill="#1877F2" />
                  <path d="M22.5 18.5H19.5V27H16V18.5H14.5V15.5H16V13.5C16 11.2 17.3 10 19.8 10C20.9 10 21.8 10.1 22.1 10.15V12.75H20.6C19.5 12.75 19.5 13.3 19.5 14.1V15.5H22.8L22.5 18.5Z" fill="white" />
                </svg>
              </a>

              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Manohar Grand on Instagram"
                className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center transition-transform hover:scale-110 active:scale-95 shadow-sm"
              >
                <svg className="w-full h-full" viewBox="0 0 36 36" fill="none">
                  <defs>
                    <linearGradient id="footer-ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#FFDC80" />
                      <stop offset="20%" stopColor="#FEA734" />
                      <stop offset="40%" stopColor="#FE3E4D" />
                      <stop offset="65%" stopColor="#FF0C5C" />
                      <stop offset="85%" stopColor="#D11A91" />
                      <stop offset="100%" stopColor="#833AB4" />
                    </linearGradient>
                  </defs>
                  <circle cx="18" cy="18" r="18" fill="url(#footer-ig-grad)" />
                  <rect x="9" y="9" width="18" height="18" rx="5" stroke="white" strokeWidth="2" fill="none" />
                  <circle cx="18" cy="18" r="4.5" stroke="white" strokeWidth="2" fill="none" />
                  <circle cx="22.6" cy="13.4" r="1.1" fill="white" />
                </svg>
              </a>
            </div>

            <div className="flex items-center gap-2 text-xs text-neutral-400 pt-1">
              <ShieldCheck className="w-4 h-4 text-brand" />
              <span>Verified Direct Reservations</span>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-white">
              Navigation
            </h4>
            <ul className="flex flex-col gap-2 text-sm text-neutral-400">
              <li>
                <Link to="/" className="hover:text-brand transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/rooms" className="hover:text-brand transition-colors">
                  Rooms &amp; Suites
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-brand transition-colors">
                  About Hotel
                </Link>
              </li>
              <li>
                <Link to="/amenities" className="hover:text-brand transition-colors">
                  Hotel Amenities
                </Link>
              </li>
              <li>
                <Link to="/gallery" className="hover:text-brand transition-colors">
                  Photo Gallery
                </Link>
              </li>
              <li>
                <Link to="/corporate-booking" className="hover:text-brand transition-colors">
                  Corporate / Bulk Booking
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-brand transition-colors">
                  Location &amp; Contact
                </Link>
              </li>
              <li>
                <Link to="/booking" className="text-brand font-semibold hover:underline">
                  Book Your Stay &rarr;
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Room Categories */}
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-white">
              Room Categories
            </h4>
            <ul className="flex flex-col gap-2 text-sm text-neutral-400">
              <li>
                <Link to="/rooms/ac-room" className="hover:text-brand transition-colors flex items-center justify-between">
                  <span>AC Room</span>
                </Link>
              </li>
              <li>
                <Link to="/rooms/non-ac-room" className="hover:text-brand transition-colors flex items-center justify-between">
                  <span>Non-AC Room</span>
                </Link>
              </li>
              <li className="pt-2">
                <Link to="/booking" className="text-xs font-semibold text-brand hover:underline inline-block">
                  Check Live Availability &rarr;
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Confirmed Contact & Hours */}
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-white">
              Contact &amp; Location
            </h4>
            <div className="flex flex-col gap-3 text-sm text-neutral-400">
              <a
                href={config.google_maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2.5 hover:text-white transition-colors group"
              >
                <MapPin className="w-4 h-4 text-brand shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <span className="text-xs leading-relaxed text-neutral-400 group-hover:text-neutral-200 break-words">
                  {config.address}
                </span>
              </a>

              <div className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                <div className="flex flex-col gap-0.5 text-xs text-neutral-400">
                  <a href={`tel:${primaryCleanPhone}`} className="hover:text-white transition-colors">
                    {config.primary_phone}
                  </a>
                  {config.secondary_phone && (
                    <a href={`tel:${secondaryCleanPhone}`} className="hover:text-white transition-colors">
                      {config.secondary_phone}
                    </a>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-brand shrink-0" />
                <span className="text-xs text-neutral-400 select-all break-all">
                  {config.email}
                </span>
              </div>

              <div className="flex items-start gap-2.5 pt-1 border-t border-neutral-800/80">
                <Clock className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                <span className="text-xs text-neutral-300 font-medium">
                  Check-in: {config.standard_check_in_time} | Check-out: {config.standard_check_out_time}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500 text-center sm:text-left">
          <p>&copy; {currentYear} Manohar Grand. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <span className="hover:text-neutral-400 cursor-pointer">
              Privacy Policy
            </span>
            <span className="hover:text-neutral-400 cursor-pointer">
              Terms &amp; Conditions
            </span>
            <span className="hover:text-neutral-400 cursor-pointer">
              Cancellation Policy
            </span>
            <a href="/admin" className="hover:text-amber-400 transition-colors cursor-pointer text-neutral-400 font-medium">
              Staff Portal
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
};
