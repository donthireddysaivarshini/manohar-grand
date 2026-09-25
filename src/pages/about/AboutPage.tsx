import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, CheckCircle2, ArrowRight } from 'lucide-react';
import { Container } from '../../components/common/Container';
import { Section } from '../../components/common/Section';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { DEMO_MEDIA } from '../../data/demoMedia';
import { Icon3D } from '../../components/common/Icon3D';
import { ScrollReveal } from '../../components/common/ScrollReveal';

export const AboutPage: React.FC = () => {
  useEffect(() => {
    document.title = 'About Us | Manohar Grand';
  }, []);

  return (
    <div className="flex flex-col w-full">
      {/* Page Header */}
      <section className="bg-neutral-dark text-white py-12 lg:py-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#FE0000_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <Container size="xl" className="relative z-10">
          <div className="max-w-2xl flex flex-col items-start gap-3">
            <Badge variant="brand" size="sm" className="font-bold">
              About Manohar Grand
            </Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
              Redefines Luxury with Affordable Prices
            </h1>
            <p className="text-sm sm:text-base text-neutral-300 leading-relaxed">
              Providing welcoming hospitality, comfortable rooms, and dependable service with direct walkable access to the JNTU Metro corridor.
            </p>
          </div>
        </Container>
      </section>

      {/* Main Story & Overview */}
      <Section variant="white" padding="lg">
        <Container size="xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            {/* Image Preview */}
            <ScrollReveal>
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-card border border-neutral-border bg-neutral-100">
                <img
                  src={DEMO_MEDIA.welcome.primary}
                  alt="Manohar Grand reception lobby"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-3 left-3 bg-neutral-dark/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs font-medium">
                  Manohar Grand Hospitality
                </div>
              </div>
            </ScrollReveal>

            {/* Editorial Content */}
            <ScrollReveal delay={100}>
              <div className="flex flex-col items-start gap-4">
                <Badge variant="brand" size="sm" className="font-bold">
                  Our Philosophy
                </Badge>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-dark tracking-tight leading-snug">
                  Dedicated to a Relaxing &amp; Convenient Hotel Experience
                </h2>
                <p className="text-sm text-neutral-secondary leading-relaxed">
                  Welcome to Manohar Grand. Located conveniently near JNTU Metro Station in Kukatpally, our hotel is configured to serve business professionals, transit travelers, and visiting families with dependable amenities, clean attached bathrooms, and warm hospitality.
                </p>
                <p className="text-sm text-neutral-secondary leading-relaxed">
                  We focus on the essentials that make a stay comfortable — clean air-conditioned and ventilated rooms, round-the-clock power backup, daily housekeeping, on-premise car parking, and dedicated reception assistance.
                </p>

                <div className="flex flex-col gap-2.5 pt-2 text-xs text-neutral-dark font-medium w-full">
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-neutral-50 border border-neutral-200">
                    <CheckCircle2 className="w-4 h-4 text-feedback-success shrink-0" />
                    <span><strong>WAKEFIT Memory Foam Mattress</strong> in all bedrooms &amp; <strong>32" Smart TV</strong> with OTT Apps</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-neutral-50 border border-neutral-200">
                    <CheckCircle2 className="w-4 h-4 text-feedback-success shrink-0" />
                    <span>Air-Conditioned &amp; Non-AC Room options available</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-neutral-50 border border-neutral-200">
                    <CheckCircle2 className="w-4 h-4 text-feedback-success shrink-0" />
                    <span>Walkable distance from JNTU Metro Station (1 min walk)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-neutral-50 border border-neutral-200">
                    <CheckCircle2 className="w-4 h-4 text-feedback-success shrink-0" />
                    <span>24/7 front desk support &amp; direct reservation assistance</span>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </Container>
      </Section>

      {/* Key Highlights */}
      <Section variant="default" padding="lg">
        <Container size="xl">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <Badge variant="brand" size="sm" className="font-bold">
              Guest Commitments
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-dark mt-2">
              Our Core Principles
            </h2>
            <p className="text-xs text-neutral-secondary mt-1">
              Thoughtful service and practical comfort for every guest
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ScrollReveal delay={0}>
              <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs flex flex-col gap-3 h-full">
                <Icon3D name="security" size="md" />
                <h3 className="text-base font-bold text-neutral-dark">Integrity &amp; Care</h3>
                <p className="text-xs sm:text-sm text-neutral-secondary leading-relaxed">
                  Transparent room rates, clear policies, and reliable service from check-in to check-out.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={80}>
              <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs flex flex-col gap-3 h-full">
                <Icon3D name="comfortable-stay" size="md" />
                <h3 className="text-base font-bold text-neutral-dark">Hygiene &amp; Cleanliness</h3>
                <p className="text-xs sm:text-sm text-neutral-secondary leading-relaxed">
                  Regular sanitization, fresh linens, and well-maintained private attached bathrooms.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={160}>
              <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs flex flex-col gap-3 h-full">
                <Icon3D name="reception" size="md" />
                <h3 className="text-base font-bold text-neutral-dark">Warm Reception</h3>
                <p className="text-xs sm:text-sm text-neutral-secondary leading-relaxed">
                  Attentive reception staff ready 24/7 to assist with room requests, travel queries, and transit needs.
                </p>
              </div>
            </ScrollReveal>
          </div>

          <div className="mt-12 text-center flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/booking">
              <Button variant="primary" size="lg" className="gap-2 font-bold shadow-md">
                <CalendarDays className="w-5 h-5" />
                Book Your Stay
              </Button>
            </Link>
            <Link to="/corporate-booking">
              <Button variant="outline" size="lg" className="gap-2 font-bold">
                <span>Corporate &amp; Bulk Bookings</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </Container>
      </Section>
    </div>
  );
};

