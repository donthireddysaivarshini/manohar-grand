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
import { useHotelConfig } from '../../store/HotelConfigContext';
import { Icon3D } from '../../components/common/Icon3D';
import { ScrollReveal } from '../../components/common/ScrollReveal';
import { SEO } from '../../components/common/SEO';

export const ContactPage: React.FC = () => {
  const { config } = useHotelConfig();

  useEffect(() => {
    document.title = `Contact & Location | ${config.hotel_name || 'Manohar Grand'}`;
  }, [config.hotel_name]);

  const primaryCleanPhone = config.primary_phone.replace(/[^0-9]/g, '');
  const secondaryCleanPhone = config.secondary_phone.replace(/[^0-9]/g, '');
  const whatsappNumber = primaryCleanPhone.startsWith('91') ? primaryCleanPhone : `91${primaryCleanPhone}`;

  return (
    <div className="flex flex-col w-full">
      <SEO
        title="Contact & Location | Manohar Grand Hotel Kukatpally Hyderabad"
        description="Find Manohar Grand beside Nexus Hyderabad Mall, Kukatpally. Contact our 24/7 front desk at +91 79970 22999 or +91 81799 93330 for direct room bookings and directions."
        canonical="https://www.manohargrand.com/contact"
      />
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
              Find directions to {config.hotel_name || 'Manohar Grand'} and connect directly with our 24/7 front desk team.
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
              {/* Metro / Landmark Connectivity Callout Box */}
              <ScrollReveal>
                <div className="p-4 sm:p-5 rounded-2xl bg-neutral-100/90 border border-neutral-200 shadow-xs flex items-start gap-4">
                  <Icon3D name="connectivity" size="md" />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-brand">
                      Prime Location
                    </span>
                    <h2 className="text-base font-extrabold text-neutral-dark">
                      {config.near_landmark ? `Located ${config.near_landmark}` : 'Centrally Located with Easy Transit'}
                    </h2>
                    <p className="text-xs text-neutral-secondary">
                      Convenient access for business, family stays, and city transit.
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
                      href={config.google_maps_url}
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
                          {config.address}
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
                          <a href={`tel:${primaryCleanPhone}`} className="hover:text-brand font-semibold text-neutral-dark">
                            {config.primary_phone}
                          </a>
                          {config.secondary_phone && (
                            <>
                              <span>•</span>
                              <a href={`tel:${secondaryCleanPhone}`} className="hover:text-brand font-semibold text-neutral-dark">
                                {config.secondary_phone}
                              </a>
                            </>
                          )}
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
                        <span className="text-xs text-neutral-dark font-medium mt-0.5 block select-all">
                          {config.email}
                        </span>
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
                          24/7 Front Desk Support
                        </p>
                        <p className="text-[11px] text-neutral-500 mt-1">
                          Standard Check-in: {config.standard_check_in_time} | Standard Check-out: {config.standard_check_out_time}
                        </p>
                      </div>
                    </div>

                    {/* Social Media Channels */}
                    <div className="pt-2 border-t border-neutral-border flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-dark uppercase tracking-wider">
                        Social Pages:
                      </span>
                      <div className="flex items-center gap-2.5">
                        <a
                          href="https://facebook.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Manohar Grand on Facebook"
                          className="px-3.5 py-1.5 rounded-full bg-[#1877F2] hover:bg-[#166fe5] text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs hover:scale-105 active:scale-95"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 36 36" fill="none">
                            <circle cx="18" cy="18" r="18" fill="#1877F2" />
                            <path d="M22.5 18.5H19.5V27H16V18.5H14.5V15.5H16V13.5C16 11.2 17.3 10 19.8 10C20.9 10 21.8 10.1 22.1 10.15V12.75H20.6C19.5 12.75 19.5 13.3 19.5 14.1V15.5H22.8L22.5 18.5Z" fill="white" />
                          </svg>
                          <span>Facebook</span>
                        </a>
                        <a
                          href="https://instagram.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Manohar Grand on Instagram"
                          className="px-3.5 py-1.5 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] hover:opacity-95 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs hover:scale-105 active:scale-95"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 36 36" fill="none">
                            <path d="M18 12.2c1.9 0 2.15.01 2.9.04 1.9.09 2.8.99 2.9 2.9.03.74.04 1 .04 2.86s-.01 2.12-.04 2.86c-.09 1.9-.99 2.8-2.9 2.9-.74.03-1 .04-2.9.04s-2.16-.01-2.9-.04c-1.9-.09-2.8-.99-2.9-2.9-.03-.74-.04-1-.04-2.86s.01-2.12.04-2.86c.09-1.9.99-2.8 2.9-2.9.74-.03 1-.04 2.9-.04zm0-1.6c-1.93 0-2.18.01-2.94.04-2.6.12-4.04 1.56-4.15 4.15-.04.76-.04 1-.04 2.94s.01 2.18.04 2.94c.12 2.6 1.56 4.04 4.15 4.15.76.04 1.01.04 2.94.04s2.18-.01 2.94-.04c2.6-.12 4.04-1.56 4.15-4.15.04-.76.04-1.01.04-2.94s-.01-2.18-.04-2.94c-.12-2.6-1.56-4.04-4.15-4.15-.76-.04-1.01-.04-2.94-.04zm0 4a3.4 3.4 0 1 0 0 6.8 3.4 3.4 0 0 0 0-6.8zm0 5.4a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm4.4-5.8a.8.8 0 1 0 0 1.6.8.8 0 0 0 0-1.6z" fill="white" />
                          </svg>
                          <span>Instagram</span>
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
                    href={config.google_maps_url}
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
                    <a href={`tel:${primaryCleanPhone}`} className="w-full">
                      <Button variant="outline" size="md" className="w-full gap-2 font-semibold">
                        <Phone className="w-4 h-4 text-brand" />
                        Call Front Desk
                      </Button>
                    </a>

                    <a
                      href={`https://wa.me/${whatsappNumber}?text=Hello%20${encodeURIComponent(config.hotel_name || 'Manohar Grand')}%20Team%2C%20I%20have%20an%20inquiry%20regarding%20room%20booking`}
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
                        Interactive Map — {config.hotel_name || 'Manohar Grand'}
                      </span>
                    </div>
                    <a
                      href={config.google_maps_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-brand font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      Open Google Maps <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="relative aspect-[16/10] sm:aspect-[16/11] w-full bg-neutral-100">
                    <iframe
                      src={config.google_maps_embed_url}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="strict-origin-when-cross-origin"
                      title={`${config.hotel_name || 'Manohar Grand'} Hotel Google Map Location`}
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

