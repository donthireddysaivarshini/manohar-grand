import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ArrowRight, ShieldCheck } from 'lucide-react';
import { Container } from '../common/Container';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { DEMO_MEDIA } from '../../data/demoMedia';

export const HeroSection: React.FC = () => {
  return (
    <div className="relative min-h-[580px] sm:min-h-[640px] lg:min-h-[700px] flex items-center bg-neutral-dark text-white overflow-hidden">
      {/* Hero Background Stock Image with Gradient Overlay */}
      <img
        src={DEMO_MEDIA.hero.url}
        alt={DEMO_MEDIA.hero.alt}
        className="absolute inset-0 w-full h-full object-cover object-center opacity-40 scale-105 transform animate-in fade-in duration-1000"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-dark via-neutral-dark/60 to-neutral-dark/40" />

      <Container size="xl" className="relative z-10 py-16 sm:py-24">
        <div className="max-w-3xl flex flex-col items-start gap-5 sm:gap-6">
          <Badge
            variant="brand"
            size="md"
            className="bg-brand text-white font-bold tracking-wider px-3.5 py-1 uppercase text-xs shadow-md"
          >
            Hotel &amp; Direct Booking
          </Badge>

          <h1 className="text-3xl xs:text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight text-balance">
            A Comfortable Stay at <br />
            <span className="text-brand">Manohar Grand</span>
          </h1>

          <p className="text-base sm:text-lg text-neutral-200 max-w-xl font-normal leading-relaxed text-balance">
            Experience comfortable AC and Non-AC accommodations, welcoming hospitality, and effortless direct booking with best rates guaranteed.
          </p>

          <div className="flex flex-wrap items-center gap-3.5 pt-2">
            <Link to="/booking">
              <Button variant="primary" size="lg" className="font-bold shadow-lg gap-2 h-12 px-7">
                <CalendarDays className="w-5 h-5" />
                Book Your Stay
              </Button>
            </Link>
            <Link to="/rooms">
              <Button
                variant="outline"
                size="lg"
                className="bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-sm gap-2 h-12 font-semibold"
              >
                Explore Rooms
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="flex items-center gap-2 text-xs text-neutral-300 pt-2 font-medium">
            <ShieldCheck className="w-4 h-4 text-brand" />
            <span>28 Total Rooms (20 AC / 8 Non-AC) • Direct Reservation Guarantee</span>
          </div>
        </div>
      </Container>
    </div>
  );
};
