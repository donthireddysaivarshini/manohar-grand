import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ArrowRight, MapPin } from 'lucide-react';
import { Container } from '../common/Container';
import { Button } from '../common/Button';
import { useHotelConfig } from '../../store/HotelConfigContext';
import { cmsApiService } from '../../services/api/cmsApiService';
import { ApiCMSSection } from '../../types/cms';

/**
 * Backend-driven Homepage Hero Section.
 * - Dynamic Title & Subtitle from CMSSection (key: 'hero') / HotelConfiguration
 * - Dynamic Landmark/Connectivity badge from HotelConfiguration / CMSSection metadata
 * - Dynamic background imagery from GalleryMedia / Fallback
 */
export const HeroSection: React.FC = () => {
  const { config } = useHotelConfig();
  const [heroSection, setHeroSection] = useState<ApiCMSSection | null>(null);
  const [bgImage, setBgImage] = useState<string>('');

  useEffect(() => {
    const loadHeroData = async () => {
      try {
        const sections = await cmsApiService.getSections('hero');
        if (sections.length > 0) {
          setHeroSection(sections[0]);
        }
      } catch (err) {
        console.warn('Could not load hero CMS section:', err);
      }

      try {
        const gallery = await cmsApiService.getGallery();
        const heroImg = gallery.find((g) => g.is_featured || g.category === 'property' || g.category === 'exterior');
        if (heroImg) {
          setBgImage(heroImg.image_url);
        }
      } catch (err) {
        console.warn('Could not load hero gallery media:', err);
      }
    };

    loadHeroData();
  }, []);

  const headline = heroSection?.title || `Welcome to ${config.hotel_name || 'Manohar Grand'}`;
  const subtitle = heroSection?.subtitle || 'Luxury Air-conditioned and Non A/c Rooms';
  const connectivityBadge = heroSection?.metadata?.connectivity_badge || (config.near_landmark ? `Walkable distance from ${config.near_landmark}` : 'Prime Location & Transit Access');

  return (
    <div className="relative min-h-[340px] sm:min-h-[380px] lg:min-h-[420px] flex items-center bg-neutral-dark text-white overflow-hidden">
      {/* Dynamic Background Image with Gradient Overlay */}
      {bgImage && (
        <img
          src={bgImage}
          alt={headline}
          className="absolute inset-0 w-full h-full object-cover object-center opacity-30 scale-105 transform animate-in fade-in duration-700"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-dark via-neutral-dark/80 to-neutral-dark/60" />

      <Container size="xl" className="relative z-10 py-8 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl flex flex-col items-start gap-3 sm:gap-4">
          {/* 1. Main Headline */}
          <h1 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
            {headline}
          </h1>

          {/* 2. Room Category Highlight / Subtitle in White */}
          <p className="text-sm xs:text-base sm:text-lg lg:text-xl font-medium text-white tracking-tight leading-snug">
            {subtitle}
          </p>

          {/* 3. Location / Connectivity Highlight Badge */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs sm:text-sm font-semibold text-neutral-200 mt-0.5">
            <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand shrink-0" />
            <span>{connectivityBadge}</span>
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
