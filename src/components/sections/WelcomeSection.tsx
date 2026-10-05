import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, MapPin } from 'lucide-react';
import { Container } from '../common/Container';
import { Section } from '../common/Section';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { ScrollReveal } from '../common/ScrollReveal';
import { useHotelConfig } from '../../store/HotelConfigContext';
import { cmsApiService } from '../../services/api/cmsApiService';
import { ApiCMSSection } from '../../types/cms';

export const WelcomeSection: React.FC = () => {
  const { config } = useHotelConfig();
  const [welcomeSection, setWelcomeSection] = useState<ApiCMSSection | null>(null);
  const [primaryImage, setPrimaryImage] = useState<string>('');
  const [secondaryImage, setSecondaryImage] = useState<string>('');

  useEffect(() => {
    const loadWelcomeData = async () => {
      try {
        const sections = await cmsApiService.getSections('welcome');
        if (sections.length > 0) {
          setWelcomeSection(sections[0]);
        }
      } catch (err) {
        console.warn('Could not load welcome CMS section:', err);
      }

      try {
        const gallery = await cmsApiService.getGallery();
        if (gallery.length > 0) {
          setPrimaryImage(gallery[0].image_url);
        }
        if (gallery.length > 1) {
          setSecondaryImage(gallery[1].image_url);
        }
      } catch (err) {
        console.warn('Could not load welcome gallery media:', err);
      }
    };

    loadWelcomeData();
  }, []);

  const badgeText = `Welcome to ${config.hotel_name || 'Manohar Grand'}`;
  const title = welcomeSection?.title || 'Redefines Luxury with Affordable Prices';
  const body = welcomeSection?.body || (
    `Located conveniently in the city, ${config.hotel_name || 'Manohar Grand'} blends comfort, value, and convenience for every traveler. ` +
    'Our rooms feature modern amenities, plush bedding, and 24/7 dedicated hospitality.'
  );

  return (
    <Section variant="white" padding="lg">
      <Container size="xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          {/* Left: Dual Image Showcase */}
          <ScrollReveal direction="up" className="relative">
            {primaryImage ? (
              <div className="relative z-10 aspect-[4/3] rounded-2xl overflow-hidden shadow-card border border-neutral-200 bg-neutral-100 group">
                <img
                  src={primaryImage}
                  alt={`${config.hotel_name || 'Manohar Grand'} welcoming ambience`}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            ) : (
              <div className="relative z-10 aspect-[4/3] rounded-2xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-400 text-xs">
                {config.hotel_name || 'Manohar Grand'}
              </div>
            )}
            {secondaryImage && (
              <div className="hidden sm:block absolute -bottom-3 -right-2 md:-bottom-4 md:-right-4 z-20 w-1/2 aspect-[4/3] rounded-xl overflow-hidden shadow-elevated border-4 border-white bg-neutral-100">
                <img
                  src={secondaryImage}
                  alt={`${config.hotel_name || 'Manohar Grand'} guest accommodations`}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </ScrollReveal>

          {/* Right: Editorial Intro Content */}
          <ScrollReveal direction="up" className="flex flex-col items-start gap-4 sm:gap-5">
            <Badge variant="brand" size="md">
              {badgeText}
            </Badge>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-neutral-dark tracking-tight leading-snug">
              {title}
            </h2>

            <p className="text-sm sm:text-base text-neutral-secondary leading-relaxed">
              {body}
            </p>

            {/* Location & Key Feature Highlights */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 py-1">
              <div className="p-3.5 rounded-xl bg-[#F7F7F7] border border-neutral-200/90 flex items-start gap-3">
                <MapPin className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-neutral-dark">Prime Location</h4>
                  <p className="text-[11px] text-neutral-secondary mt-0.5">
                    {config.near_landmark ? `Walkable distance from ${config.near_landmark}` : config.address}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F7F7F7] border border-neutral-200/90 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-feedback-success shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-neutral-dark">24/7 Front Desk</h4>
                  <p className="text-[11px] text-neutral-secondary mt-0.5">
                    Round-the-clock reception assistance and parking
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 text-xs text-neutral-secondary pt-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-feedback-success shrink-0" />
                <span>Air-Conditioned and Non-AC room categories available</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-feedback-success shrink-0" />
                <span>Attached private bathrooms with 24/7 hot water supply</span>
              </div>
            </div>

            <div className="pt-2">
              <Link to="/about">
                <Button variant="outline" size="md" className="gap-2 font-semibold">
                  Read More About Us
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </Container>
    </Section>
  );
};
