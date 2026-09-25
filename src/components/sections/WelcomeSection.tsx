import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, MapPin } from 'lucide-react';
import { Container } from '../common/Container';
import { Section } from '../common/Section';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { ScrollReveal } from '../common/ScrollReveal';
import { DEMO_MEDIA } from '../../data/demoMedia';

export const WelcomeSection: React.FC = () => {
  return (
    <Section variant="white" padding="lg">
      <Container size="xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          {/* Left: Dual Image Showcase */}
          <ScrollReveal direction="up" className="relative">
            <div className="relative z-10 aspect-[4/3] rounded-2xl overflow-hidden shadow-card border border-neutral-border bg-neutral-100 group">
              <img
                src={DEMO_MEDIA.welcome.primary}
                alt="Hotel reception and welcoming ambience (Demo Stock)"
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="hidden sm:block absolute -bottom-3 -right-2 md:-bottom-4 md:-right-4 z-20 w-1/2 aspect-[4/3] rounded-xl overflow-hidden shadow-elevated border-4 border-white bg-neutral-100">
              <img
                src={DEMO_MEDIA.welcome.secondary}
                alt="Guest room detail (Demo Stock)"
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>
          </ScrollReveal>

          {/* Right: Editorial Intro Content */}
          <ScrollReveal direction="up" className="flex flex-col items-start gap-4 sm:gap-5">
            <Badge variant="brand" size="md">
              Welcome to Manohar Grand
            </Badge>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-neutral-dark tracking-tight leading-snug">
              Redefines Luxury with Affordable Prices
            </h2>

            <p className="text-sm sm:text-base text-neutral-secondary leading-relaxed">
              Located in the heart of Hyderabad, Manohar Grand blends comfort, luxury, and convenience for every traveler. Our elegantly designed rooms feature modern amenities like high-speed Wi-Fi, plush bedding, and stunning views of Nexus Forum Mall and JNTU Metro Station, just minutes away.we promise exceptional hospitality and an unforgettable stay.
            </p>

            {/* Location & Key Feature Highlights */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 py-1">
              <div className="p-3.5 rounded-xl bg-[#F7F7F7] border border-neutral-200/90 flex items-start gap-3">
                <MapPin className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-neutral-dark">Prime Location</h4>
                  <p className="text-[11px] text-neutral-secondary mt-0.5">
                    Walkable distance from JNTU Metro Station, Kukatpally
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
