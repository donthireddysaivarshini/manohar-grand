import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Container } from '../common/Container';
import { Section } from '../common/Section';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { CONFIRMED_HOTEL_INFO } from '../../data/confirmedInventory';
import { DEMO_MEDIA } from '../../data/demoMedia';

export const WelcomeSection: React.FC = () => {
  return (
    <Section variant="white" padding="lg">
      <Container size="xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Dual Image Showcase */}
          <div className="relative">
            <div className="relative z-10 aspect-[4/3] rounded-card overflow-hidden shadow-card border border-neutral-border bg-neutral-100">
              <img
                src={DEMO_MEDIA.welcome.primary}
                alt="Hotel reception and welcoming ambience (Demo Stock)"
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="hidden sm:block absolute -bottom-6 -right-6 z-20 w-1/2 aspect-[4/3] rounded-card overflow-hidden shadow-elevated border-4 border-white bg-neutral-100">
              <img
                src={DEMO_MEDIA.welcome.secondary}
                alt="Guest room detail (Demo Stock)"
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -top-4 -left-4 z-0 w-24 h-24 bg-brand-subtle rounded-full blur-xl pointer-events-none" />
          </div>

          {/* Right: Editorial Intro Content */}
          <div className="flex flex-col items-start gap-5">
            <Badge variant="brand" size="md">
              Welcome to Manohar Grand
            </Badge>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-neutral-dark tracking-tight leading-snug">
              Modern Hospitality, Thoughtful Comfort &amp; Convenient Stay
            </h2>

            <p className="text-sm sm:text-base text-neutral-secondary leading-relaxed">
              At Manohar Grand, we are dedicated to providing our guests with clean, comfortable accommodations and attentive service. Whether traveling for business or leisure, enjoy a pleasant stay tailored to your everyday needs.
            </p>

            {/* Confirmed Inventory Highlights */}
            <div className="w-full grid grid-cols-2 gap-3 py-2">
              <div className="p-3.5 rounded-lg bg-neutral-light border border-neutral-border flex flex-col gap-1">
                <span className="text-2xl font-black text-brand">
                  {CONFIRMED_HOTEL_INFO.acRooms}
                </span>
                <span className="text-xs font-bold text-neutral-dark">AC Rooms</span>
                <span className="text-[11px] text-neutral-secondary">Climate controlled</span>
              </div>

              <div className="p-3.5 rounded-lg bg-neutral-light border border-neutral-border flex flex-col gap-1">
                <span className="text-2xl font-black text-brand">
                  {CONFIRMED_HOTEL_INFO.nonAcRooms}
                </span>
                <span className="text-xs font-bold text-neutral-dark">Non-AC Rooms</span>
                <span className="text-[11px] text-neutral-secondary">Budget-friendly</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 text-xs text-neutral-secondary pt-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-feedback-success" />
                <span>28 Total Guest Rooms with attached private bathrooms</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-feedback-success" />
                <span>Direct booking privileges &amp; transparent rate pricing</span>
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
          </div>
        </div>
      </Container>
    </Section>
  );
};
