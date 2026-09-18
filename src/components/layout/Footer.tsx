import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, ShieldCheck } from 'lucide-react';
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
              Experience comfortable rooms, contemporary conveniences, and warm hospitality. Direct booking platform.
            </p>
            <div className="flex items-center gap-2 text-xs text-neutral-400 pt-2">
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
                <Link to="/contact" className="hover:text-brand transition-colors">
                  Location &amp; Contact
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

          {/* Col 4: Contact & Policies (Placeholders) */}
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
                  {PLACEHOLDER_HOTEL_INFO.placeholderAddress}
                </span>
              </a>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-brand shrink-0" />
                <span className="text-xs text-neutral-400">
                  {PLACEHOLDER_HOTEL_INFO.placeholderPhone}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-brand shrink-0" />
                <span className="text-xs text-neutral-400">
                  {PLACEHOLDER_HOTEL_INFO.placeholderEmail}
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
              Privacy Policy (Placeholder)
            </span>
            <span className="hover:text-neutral-400 cursor-pointer">
              Terms &amp; Conditions (Placeholder)
            </span>
            <span className="hover:text-neutral-400 cursor-pointer">
              Cancellation Policy (Placeholder)
            </span>
          </div>
        </div>
      </Container>
    </footer>
  );
};
