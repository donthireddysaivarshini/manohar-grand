import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ArrowRight, MapPin } from 'lucide-react';
import { Container } from '../common/Container';
import { Button } from '../common/Button';
import { DEMO_MEDIA } from '../../data/demoMedia';

/**
 * Compact Homepage Hero Section.
 * - Hierarchy:
 *   1. Welcome to Manohar Grand (Main Heading)
 *   2. Luxury Air-conditioned and Non A/c Rooms (Bold Brand Red on mobile) / Desktop narrative
 *   3. Walkable distance from JNTU Metro Station (Location highlight)
 *   4. [Book Your Stay] [Explore Rooms] (CTAs)
 * - Removed small red duplicate "MANOHAR GRAND" label.
 */
export const HeroSection: React.FC = () => {
  return (
    <div className="relative min-h-[340px] sm:min-h-[380px] lg:min-h-[420px] flex items-center bg-neutral-dark text-white overflow-hidden">
      {/* Background Image with Gradient Overlay */}
      <img
        src={DEMO_MEDIA.hero.url}
        alt={DEMO_MEDIA.hero.alt}
        className="absolute inset-0 w-full h-full object-cover object-center opacity-30 scale-105 transform animate-in fade-in duration-700"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-dark via-neutral-dark/80 to-neutral-dark/60" />

      <Container size="xl" className="relative z-10 py-6 sm:py-10 lg:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl flex flex-col items-start gap-2.5 sm:gap-3.5">
          {/* 1. Main Headline */}
          <h1 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
            Welcome to Manohar Grand
          </h1>

          {/* 2. Room Category Highlight / Subtitle */}
          {/* Mobile Copy: Bold Brand Red */}
          <p className="block sm:hidden text-xs xs:text-sm font-bold text-brand tracking-tight leading-snug">
            Luxury Air-conditioned and Non A/c Rooms
          </p>

          {/* Desktop Narrative Copy */}
          <p className="hidden md:block text-sm sm:text-base text-neutral-200 font-normal leading-relaxed text-pretty max-w-2xl">
            Located in the heart of Hyderabad, Manohar Grand blends comfort, luxury, and convenience for every traveler. Our elegantly designed rooms feature modern amenities like high-speed Wi-Fi, plush bedding, and stunning views of Nexus Forum Mall and JNTU Metro Station, just minutes away.we promise exceptional hospitality and an unforgettable stay.
          </p>

          {/* Tablet Narrative Copy */}
          <p className="hidden sm:block md:hidden text-xs sm:text-sm text-neutral-200 font-normal leading-relaxed text-pretty">
            Located in the heart of Hyderabad, Manohar Grand blends comfort, luxury, and convenience with modern amenities, high-speed Wi-Fi, and walkable access to JNTU Metro Station &amp; Nexus Forum Mall.
          </p>

          {/* 3. Location / Connectivity Highlight Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[11px] sm:text-xs font-semibold text-neutral-200 mt-0.5">
            <MapPin className="w-3.5 h-3.5 text-brand shrink-0" />
            <span>Walkable distance from JNTU Metro Station</span>
          </div>

          {/* 4. Quick Action CTAs */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 pt-1.5 w-full sm:w-auto">
            <Link to="/booking" className="flex-1 sm:flex-none">
              <Button variant="primary" size="md" className="w-full sm:w-auto font-bold shadow-lg gap-2 h-10 sm:h-11 px-5 sm:px-6 text-xs sm:text-sm">
                <CalendarDays className="w-4 h-4" />
                Book Your Stay
              </Button>
            </Link>
            <Link to="/rooms" className="flex-1 sm:flex-none">
              <Button
                variant="outline"
                size="md"
                className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-sm gap-2 h-10 sm:h-11 px-4 sm:px-6 text-xs sm:text-sm font-semibold"
              >
                <span>Explore Rooms</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
};


