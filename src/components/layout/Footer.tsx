import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, ShieldCheck, Clock } from 'lucide-react';
import { Container } from '../common/Container';
import { Logo } from '../common/Logo';
import { PLACEHOLDER_HOTEL_INFO } from '../../data/placeholderHotelInfo';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

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
              Experience comfortable AC &amp; Non-AC rooms, 24/7 front desk service, and direct booking benefits at Manohar Grand.
            </p>

            {/* Social Media Links */}
            <div className="flex items-center gap-3 pt-1">
              <a
                href={PLACEHOLDER_HOTEL_INFO.socialLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Manohar Grand on Facebook"
                className="w-9 h-9 rounded-lg bg-neutral-800 hover:bg-brand text-neutral-300 hover:text-white flex items-center justify-center transition-all"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>

              <a
                href={PLACEHOLDER_HOTEL_INFO.socialLinks.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Manohar Grand on Instagram"
                className="w-9 h-9 rounded-lg bg-neutral-800 hover:bg-brand text-neutral-300 hover:text-white flex items-center justify-center transition-all"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
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
                <Link to="/about" className="hover:text-brand transition-colors">
                  About Hotel
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
                  <span className="text-xs text-neutral-500">20 Rooms</span>
                </Link>
              </li>
              <li>
                <Link to="/rooms/non-ac-room" className="hover:text-brand transition-colors flex items-center justify-between">
                  <span>Non-AC Room</span>
                  <span className="text-xs text-neutral-500">8 Rooms</span>
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
                href={PLACEHOLDER_HOTEL_INFO.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2.5 hover:text-white transition-colors group"
              >
                <MapPin className="w-4 h-4 text-brand shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <span className="text-xs leading-relaxed text-neutral-400 group-hover:text-neutral-200">
                  {PLACEHOLDER_HOTEL_INFO.address}
                </span>
              </a>

              <div className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                <div className="flex flex-col gap-0.5 text-xs text-neutral-400">
                  <a href="tel:7997044999" className="hover:text-white transition-colors">
                    +91 7997044999
                  </a>
                  <a href="tel:7997022999" className="hover:text-white transition-colors">
                    +91 7997022999
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-brand shrink-0" />
                <a
                  href={`mailto:${PLACEHOLDER_HOTEL_INFO.email}`}
                  className="text-xs text-neutral-400 hover:text-white transition-colors"
                >
                  {PLACEHOLDER_HOTEL_INFO.email}
                </a>
              </div>

              <div className="flex items-start gap-2.5 pt-1 border-t border-neutral-800/80">
                <Clock className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                <span className="text-xs text-neutral-300 font-medium">
                  {PLACEHOLDER_HOTEL_INFO.businessHours}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <p>&copy; {currentYear} Manohar Grand. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-neutral-400 cursor-pointer">
              Privacy Policy
            </span>
            <span className="hover:text-neutral-400 cursor-pointer">
              Terms &amp; Conditions
            </span>
            <span className="hover:text-neutral-400 cursor-pointer">
              Cancellation Policy
            </span>
          </div>
        </div>
      </Container>
    </footer>
  );
};
