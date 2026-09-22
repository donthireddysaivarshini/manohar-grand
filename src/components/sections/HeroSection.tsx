import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ArrowRight, MapPin } from 'lucide-react';
import { Container } from '../common/Container';
import { Button } from '../common/Button';
import { DEMO_MEDIA } from '../../data/demoMedia';

/**
 * Compact Homepage Hero Section.
 * - Reduced vertical height to ensure booking search widget is visible in the first fold.
 * - Clean visual hierarchy with transparent SVG branding and refined typography.
 * - Removed "28 Total Rooms", "HOTEL & DIRECT BOOKING", and marketing clutter.
 * - Features client-approved location highlight: "Walkable distance from JNTU Metro Station".
 */
export const HeroSection: React.FC = () => {
  return (
    <div className="relative min-h-[360px] sm:min-h-[400px] lg:min-h-[440px] flex items-center bg-neutral-dark text-white overflow-hidden">
      {/* Background Image with Gradient Overlay */}
      <img
        src={DEMO_MEDIA.hero.url}
        alt={DEMO_MEDIA.hero.alt}
        className="absolute inset-0 w-full h-full object-cover object-center opacity-35 scale-105 transform animate-in fade-in duration-700"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-dark via-neutral-dark/70 to-neutral-dark/50" />

      <Container size="xl" className="relative z-10 py-8 sm:py-12 lg:py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl flex flex-col items-start gap-3.5 sm:gap-4.5">
          {/* Location / Connectivity Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-neutral-200">
            <MapPin className="w-3.5 h-3.5 text-brand shrink-0" />
            <span>Walkable distance from JNTU Metro Station</span>
          </div>

          {/* Clean Main Headline */}
          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-widest font-black text-brand">
              MANOHAR GRAND
            </span>
            <h1 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              Welcome to Manohar Grand
            </h1>
          </div>

          <p className="text-sm sm:text-base text-neutral-300 max-w-lg font-normal leading-relaxed text-balance">
            A comfortable hotel stay with AC &amp; Non-AC room options in Kukatpally, Hyderabad. Convenient transit and warm hospitality.
          </p>

          {/* Quick Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link to="/booking">
              <Button variant="primary" size="md" className="font-bold shadow-lg gap-2 h-11 px-6">
                <CalendarDays className="w-4 h-4" />
                Book Your Stay
              </Button>
            </Link>
            <Link to="/rooms">
              <Button
                variant="outline"
                size="md"
                className="bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-sm gap-2 h-11 font-semibold"
              >
                Explore Rooms
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
};
