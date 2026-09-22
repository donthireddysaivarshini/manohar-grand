import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  ExternalLink,
  MessageCircle,
  CalendarDays,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { Container } from '../../components/common/Container';
import { Section } from '../../components/common/Section';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card, CardContent } from '../../components/common/Card';
import { PLACEHOLDER_HOTEL_INFO } from '../../data/placeholderHotelInfo';
import { Icon3D } from '../../components/common/Icon3D';
import { ScrollReveal } from '../../components/common/ScrollReveal';

export const ContactPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Contact & Location | Manohar Grand';
  }, []);

  return (
    <div className="flex flex-col w-full">
      {/* Page Header */}
      <section className="bg-neutral-dark text-white py-12 lg:py-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#FE0000_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <Container size="xl" className="relative z-10">
          <div className="max-w-2xl flex flex-col items-start gap-3">
            <Badge variant="brand" size="sm" className="font-bold">
              Location &amp; Help Desk
            </Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
              Contact &amp; Location
            </h1>
            <p className="text-sm sm:text-base text-neutral-300 leading-relaxed">
              Find directions to Manohar Grand and connect directly with our 24/7 front desk team.
            </p>
          </div>
        </Container>
      </section>

      {/* Main Content Section */}
      <Section variant="default" padding="lg">
        <Container size="xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Contact Information & Direct Channels (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-5">
              {/* Metro Connectivity Callout Box */}
              <ScrollReveal>
                <div className="p-4 sm:p-5 rounded-2xl bg-neutral-100/90 border border-neutral-200 shadow-xs flex items-start gap-4">
                  <Icon3D name="connectivity" size="md" />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-brand">
                      Metro Transit
                    </span>
                    <h2 className="text-base font-extrabold text-neutral-dark">
                      Walkable distance from JNTU Metro Station
                    </h2>
                    <p className="text-xs text-neutral-secondary">
                      Convenient access for business and city transit in Kukatpally.
                    </p>
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={80}>
                <Card variant="bordered" className="bg-white p-6 shadow-card rounded-2xl border-neutral-200">
                  <CardContent className="p-0 flex flex-col gap-5">
                    <div>
                      <h3 className="text-base font-bold text-neutral-dark">
                        Front Desk &amp; Hotel Details
                      </h3>
                      <p className="text-xs text-neutral-secondary mt-0.5">
                        Direct communication channels for reservations and assistance
                      </p>
                    </div>

                    {/* Location Card */}
                    <a
                      href={PLACEHOLDER_HOTEL_INFO.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-3.5 group p-3.5 rounded-xl border border-neutral-200 hover:border-brand/40 bg-neutral-50 hover:bg-neutral-100/70 transition-all"
                    >
                      <div className="w-10 h-10 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-all text-brand">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-neutral-dark uppercase tracking-wider group-hover:text-brand transition-colors">
                            Hotel Address
                          </h4>
                          <span className="text-[11px] text-brand font-semibold inline-flex items-center gap-1 group-hover:underline">
                            Maps <ExternalLink className="w-3 h-3" />
                          </span>
                        </div>
                        <p className="text-xs text-neutral-secondary mt-1 leading-relaxed">
                          {PLACEHOLDER_HOTEL_INFO.placeholderAddress}
                        </p>
                      </div>
                    </a>

                    {/* Phone Numbers */}
                    <div className="flex items-start gap-3.5 p-3.5 rounded-xl border border-neutral-200 bg-neutral-50">
                      <Icon3D name="reception" size="sm" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-neutral-dark uppercase tracking-wider">
                            Front Desk Phones
                          </h4>
                          <span className="text-[10px] text-feedback-success font-bold uppercase tracking-wider bg-green-50 px-2 py-0.5 rounded border border-green-200">
                            24 Hours
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-secondary mt-1">
                          <a href="tel:7997044999" className="hover:text-brand font-semibold text-neutral-dark">
                            +91 7997044999
                          </a>
                          <span>•</span>
                          <a href="tel:7997022999" className="hover:text-brand font-semibold text-neutral-dark">
                            +91 7997022999
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Email */}
                    <div className="flex items-start gap-3.5 p-3.5 rounded-xl border border-neutral-200 bg-neutral-50">
                      <div className="w-9 h-9 rounded-lg bg-neutral-200/60 border border-neutral-300/60 flex items-center justify-center shrink-0 text-brand">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-neutral-dark uppercase tracking-wider">
                          Email Inquiries
                        </h4>
                        <a
                          href={`mailto:${PLACEHOLDER_HOTEL_INFO.email}`}
                          className="text-xs text-neutral-secondary hover:text-brand font-medium mt-0.5 block"
                        >
                          {PLACEHOLDER_HOTEL_INFO.email}
                        </a>
                      </div>
                    </div>

                    {/* Operational Hours */}
                    <div className="flex items-start gap-3.5 p-3.5 rounded-xl border border-neutral-200 bg-neutral-50">
                      <div className="w-9 h-9 rounded-lg bg-neutral-200/60 border border-neutral-300/60 flex items-center justify-center shrink-0 text-brand">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-neutral-dark uppercase tracking-wider">
                          Front Desk &amp; Check-in
                        </h4>
                        <p className="text-xs text-neutral-secondary mt-0.5 font-medium">
                          {PLACEHOLDER_HOTEL_INFO.businessHours}
                        </p>
                        <p className="text-[11px] text-neutral-500 mt-1">
                          Standard Check-in: 12:00 PM | Standard Check-out: 11:00 AM
                        </p>
                      </div>
                    </div>

                    {/* Social Media Channels */}
                    <div className="pt-2 border-t border-neutral-border flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-dark uppercase tracking-wider">
                        Social Pages:
                      </span>
                      <div className="flex items-center gap-2">
                        <a
                          href={PLACEHOLDER_HOTEL_INFO.socialLinks.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-md bg-neutral-100 hover:bg-brand text-neutral-700 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
                        >
                          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                          </svg>
                          Facebook
                        </a>
                        <a
                          href={PLACEHOLDER_HOTEL_INFO.socialLinks.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-md bg-neutral-100 hover:bg-brand text-neutral-700 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
                        >
                          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                          </svg>
                          Instagram
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </ScrollReveal>

              {/* Quick Action Channels */}
              <ScrollReveal delay={140}>
                <div className="flex flex-col gap-3">
                  <a
                    href={PLACEHOLDER_HOTEL_INFO.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full"
                  >
                    <Button variant="primary" size="lg" className="w-full gap-2 font-bold shadow-sm">
                      <MapPin className="w-4 h-4" />
                      Get Directions on Google Maps
                    </Button>
                  </a>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <a href="tel:7997044999" className="w-full">
                      <Button variant="outline" size="md" className="w-full gap-2 font-semibold">
                        <Phone className="w-4 h-4 text-brand" />
                        Call Front Desk
                      </Button>
                    </a>

                    <a
                      href="https://wa.me/917997044999?text=Hello%20Manohar%20Grand%20Team%2C%20I%20have%20an%20inquiry%20regarding%20room%20booking"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full"
                    >
                      <Button variant="outline" size="md" className="w-full gap-2 font-semibold text-green-700 hover:bg-green-50 border-green-300">
                        <MessageCircle className="w-4 h-4 text-green-600" />
                        WhatsApp Chat
                      </Button>
                    </a>
                  </div>
                </div>
              </ScrollReveal>
            </div>

            {/* Right: Interactive Map & Direct Booking Perks (7 cols) */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              {/* Interactive Google Map Embed */}
              <ScrollReveal delay={100}>
                <div className="bg-white rounded-2xl border border-neutral-200 shadow-card overflow-hidden flex flex-col">
                  <div className="p-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-brand" />
                      <span className="text-xs font-bold text-neutral-dark uppercase tracking-wider">
                        Interactive Map — Hyderabad
                      </span>
                    </div>
                    <a
                      href={PLACEHOLDER_HOTEL_INFO.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-brand font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      Open Google Maps <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="relative aspect-[16/10] sm:aspect-[16/11] w-full bg-neutral-100">
                    <iframe
                      src={PLACEHOLDER_HOTEL_INFO.googleMapsEmbedUrl}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="strict-origin-when-cross-origin"
                      title="Manohar Grand Luxury Hotel Rooms Google Map Location"
                      className="w-full h-full"
                    />
                  </div>
                </div>
              </ScrollReveal>

              {/* Direct Booking Highlight Card */}
              <ScrollReveal delay={180}>
                <Card variant="default" className="bg-white p-6 shadow-card border border-neutral-200 rounded-2xl">
                  <CardContent className="p-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <Building className="w-5 h-5 text-brand" />
                        <h3 className="text-base font-bold text-neutral-dark">
                          Reserve Directly for Best Rates
                        </h3>
                      </div>
                      <p className="text-xs text-neutral-secondary max-w-md leading-relaxed">
                        Choose between our AC and Non-AC Rooms with guaranteed direct rates, free on-premise car parking, and instant reservation confirmation.
                      </p>
                      <div className="flex items-center gap-2 text-xs text-neutral-500 pt-1">
                        <ShieldCheck className="w-4 h-4 text-feedback-success" />
                        <span>Best price guarantee • No hidden charges • 24/7 Support</span>
                      </div>
                    </div>

                    <Link to="/booking" className="shrink-0 w-full sm:w-auto">
                      <Button variant="primary" size="lg" className="w-full sm:w-auto gap-2 font-bold shadow-md">
                        <CalendarDays className="w-4 h-4" />
                        Book Now
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </ScrollReveal>
            </div>
          </div>
        </Container>
      </Section>
    </div>
  );
};

