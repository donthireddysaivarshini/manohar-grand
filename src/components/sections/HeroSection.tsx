import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ArrowRight, MapPin } from 'lucide-react';
import { Container } from '../common/Container';
import { Button } from '../common/Button';
import { DEMO_MEDIA } from '../../data/demoMedia';

/**
 * Clean, Unified Homepage Hero Section (Mobile & Desktop).
 * - Hierarchy:
 *   1. Welcome to Manohar Grand (Main Heading)
 *   2. Luxury Air-conditioned and Non A/c Rooms (Bold Brand Red)
 *   3. Walkable distance from JNTU Metro Station (Location highlight)
 *   4. [Book Your Stay] [Explore Rooms] (Action CTAs)
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

      <Container size="xl" className="relative z-10 py-8 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl flex flex-col items-start gap-3 sm:gap-4">
          {/* 1. Main Headline */}
          <h1 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
            Welcome to Manohar Grand
          </h1>

          {/* 2. Room Category Highlight / Subtitle in Bold Brand Red */}
          <p className="text-sm xs:text-base sm:text-lg lg:text-xl font-bold text-brand tracking-tight leading-snug">
            Luxury Air-conditioned and Non A/c Rooms
          </p>

          {/* 3. Location / Connectivity Highlight Badge */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs sm:text-sm font-semibold text-neutral-200 mt-0.5">
            <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand shrink-0" />
            <span>Walkable distance from JNTU Metro Station</span>
          </div>

          {/* 4. Quick Action CTAs */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3.5 pt-2 w-full sm:w-auto">
            <Link to="/booking" className="flex-1 sm:flex-none">
              <Button variant="primary" size="md" className="w-full sm:w-auto font-bold shadow-lg gap-2 h-10 sm:h-12 px-5 sm:px-7 text-xs sm:text-sm">
                <CalendarDays className="w-4 h-4" />
                Book Your Stay
              </Button>
            </Link>
            <Link to="/rooms" className="flex-1 sm:flex-none">
              <Button
                variant="outline"
                size="md"
                className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-sm gap-2 h-10 sm:h-12 px-4 sm:px-7 text-xs sm:text-sm font-semibold"
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
