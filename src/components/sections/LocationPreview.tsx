import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Mail, ArrowRight, ExternalLink, Navigation } from 'lucide-react';
import { Container } from '../common/Container';
import { Section } from '../common/Section';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { PLACEHOLDER_HOTEL_INFO } from '../../data/placeholderHotelInfo';
import { Icon3D } from '../common/Icon3D';
import { ScrollReveal } from '../common/ScrollReveal';

export const LocationPreview: React.FC = () => {
  return (
    <Section variant="default" padding="lg">
      <Container size="xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left: Location & Contact Cards (7 cols) */}
          <div className="lg:col-span-7 flex flex-col items-start gap-5">
            <ScrollReveal>
              <div className="flex flex-col gap-2">
                <Badge variant="brand" size="sm" className="font-bold">
                  Location &amp; Connectivity
                </Badge>

                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-neutral-dark tracking-tight">
                  Prime Metro Connectivity in Kukatpally
                </h2>

                <p className="text-sm text-neutral-secondary leading-relaxed">
                  Conveniently situated with seamless transit access across Hyderabad's commercial and tech corridors.
                </p>
              </div>
            </ScrollReveal>

            {/* Metro Highlight Box */}
            <ScrollReveal delay={60} className="w-full">
              <div className="p-4 sm:p-5 rounded-2xl bg-neutral-100/90 border border-neutral-200 shadow-xs flex items-start gap-4">
                <Icon3D name="connectivity" size="md" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand">
                    Metro Connectivity
                  </span>
                  <h3 className="text-base font-extrabold text-neutral-dark">
                    Walkable distance from JNTU Metro Station
                  </h3>
                  <p className="text-xs text-neutral-secondary">
                    Effortless direct transit for business, shopping, and city exploration.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <div className="w-full flex flex-col gap-3 py-1">
              <ScrollReveal delay={120}>
                <a
                  href={PLACEHOLDER_HOTEL_INFO.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block"
                >
                  <div className="p-4 rounded-2xl bg-white border border-neutral-200 group-hover:border-brand/40 shadow-xs transition-colors flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center shrink-0 text-brand">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-neutral-dark uppercase tracking-wider block">
                          Hotel Address
                        </span>
                        <span className="text-xs text-brand font-semibold inline-flex items-center gap-1 group-hover:underline">
                          Open in Maps <ExternalLink className="w-3 h-3" />
                        </span>
                      </div>
                      <p className="text-xs text-neutral-secondary mt-1">
                        {PLACEHOLDER_HOTEL_INFO.placeholderAddress}
                      </p>
                    </div>
                  </div>
                </a>
              </ScrollReveal>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ScrollReveal delay={180}>
                  <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-xs flex items-start gap-3.5 h-full">
                    <Icon3D name="reception" size="sm" />
                    <div>
                      <span className="text-[11px] font-bold text-neutral-dark uppercase tracking-wider block">
                        Front Desk Phone
                      </span>
                      <div className="flex flex-col text-xs text-neutral-secondary mt-0.5">
                        <a href="tel:7997044999" className="hover:text-brand font-medium">
                          +91 7997044999
                        </a>
                        <a href="tel:7997022999" className="hover:text-brand font-medium">
                          +91 7997022999
                        </a>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>

                <ScrollReveal delay={240}>
                  <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-xs flex items-start gap-3.5 h-full">
                    <div className="w-9 h-9 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center shrink-0 text-brand">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-neutral-dark uppercase tracking-wider block">
                        Email Contact
                      </span>
                      <a
                        href={`mailto:${PLACEHOLDER_HOTEL_INFO.email}`}
                        className="text-xs text-neutral-secondary hover:text-brand font-medium block truncate mt-0.5"
                      >
                        {PLACEHOLDER_HOTEL_INFO.email}
                      </a>
                      <span className="text-[10px] text-feedback-success font-semibold mt-0.5 block">
                        24/7 Front Desk Support
                      </span>
                    </div>
                  </div>
                </ScrollReveal>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link to="/contact">
                <Button variant="outline" size="md" className="gap-2 font-semibold">
                  <span>Contact Information</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <a
                href={PLACEHOLDER_HOTEL_INFO.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="primary" size="md" className="gap-2 font-semibold">
                  <Navigation className="w-4 h-4" />
                  <span>Get Directions</span>
                </Button>
              </a>
            </div>
          </div>

          {/* Right: Interactive Google Map Iframe (5 cols) */}
          <div className="lg:col-span-5">
            <ScrollReveal delay={100}>
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-border shadow-card">
                <iframe
                  src={PLACEHOLDER_HOTEL_INFO.googleMapsEmbedUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  title="Manohar Grand Luxury Hotel Rooms Location Map"
                  className="w-full h-full"
                />
              </div>
            </ScrollReveal>
          </div>
        </div>
      </Container>
    </Section>
  );
};

