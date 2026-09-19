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
import { CONFIRMED_HOTEL_INFO } from '../../data/confirmedInventory';

export const ContactPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Contact & Location | Manohar Grand Hotel';
  }, []);

  return (
    <div className="flex flex-col w-full">
      {/* Page Header */}
      <Section variant="dark" padding="md" className="border-b border-neutral-800">
        <Container size="xl">
          <div className="max-w-2xl flex flex-col items-start gap-3">
            <Badge variant="brand" size="md">
              Location &amp; Help Desk
            </Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
              Contact &amp; Location
            </h1>
            <p className="text-sm sm:text-base text-neutral-300 leading-relaxed">
              Find directions to Manohar Grand Luxury Hotel Rooms and connect directly with our front desk team.
            </p>
          </div>
        </Container>
      </Section>

      {/* Main Content Section */}
      <Section variant="default" padding="lg">
        <Container size="xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Contact Information & Direct Channels (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-5">
              <Card variant="bordered" className="bg-white p-6 shadow-card">
                <CardContent className="p-0 flex flex-col gap-6">
                  <div>
                    <h2 className="text-lg font-bold text-neutral-dark">
                      Hotel Information
                    </h2>
                    <p className="text-xs text-neutral-secondary mt-1">
                      Direct contact details and operational timings
                    </p>
                  </div>

                  {/* Location Card */}
                  <a
                    href={PLACEHOLDER_HOTEL_INFO.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3.5 group p-3 rounded-lg border border-neutral-border hover:border-brand/40 bg-neutral-light/50 hover:bg-brand-subtle/30 transition-all"
                  >
                    <div className="w-10 h-10 rounded-lg bg-white border border-neutral-border flex items-center justify-center shrink-0 group-hover:border-brand/40 group-hover:scale-105 transition-all">
                      <MapPin className="w-5 h-5 text-brand" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-neutral-dark group-hover:text-brand transition-colors">
                          Hotel Address
                        </h3>
                        <span className="text-[11px] text-brand font-semibold inline-flex items-center gap-1 group-hover:underline">
                          Map <ExternalLink className="w-3 h-3" />
                        </span>
                      </div>
                      <p className="text-xs text-neutral-secondary mt-1 leading-relaxed">
                        {PLACEHOLDER_HOTEL_INFO.placeholderAddress}
                      </p>
                    </div>
                  </a>

                  {/* Phone */}
                  <div className="flex items-start gap-3.5 p-3 rounded-lg border border-neutral-border bg-neutral-light/50">
                    <div className="w-10 h-10 rounded-lg bg-white border border-neutral-border flex items-center justify-center shrink-0">
                      <Phone className="w-5 h-5 text-brand" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-neutral-dark">Front Desk &amp; Inquiries</h3>
                      <p className="text-xs text-neutral-secondary mt-0.5">
                        {PLACEHOLDER_HOTEL_INFO.placeholderPhone}
                      </p>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-start gap-3.5 p-3 rounded-lg border border-neutral-border bg-neutral-light/50">
                    <div className="w-10 h-10 rounded-lg bg-white border border-neutral-border flex items-center justify-center shrink-0">
                      <Mail className="w-5 h-5 text-brand" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-neutral-dark">Email Inquiries</h3>
                      <p className="text-xs text-neutral-secondary mt-0.5">
                        {PLACEHOLDER_HOTEL_INFO.placeholderEmail}
                      </p>
                    </div>
                  </div>

                  {/* Check-in / Check-out */}
                  <div className="flex items-start gap-3.5 p-3 rounded-lg border border-neutral-border bg-neutral-light/50">
                    <div className="w-10 h-10 rounded-lg bg-white border border-neutral-border flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-brand" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-neutral-dark">Check-in / Check-out Schedule</h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-secondary mt-1">
                        <span>Check-in: <strong className="text-neutral-dark">{PLACEHOLDER_HOTEL_INFO.placeholderCheckInTime}</strong></span>
                        <span>Check-out: <strong className="text-neutral-dark">{PLACEHOLDER_HOTEL_INFO.placeholderCheckOutTime}</strong></span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Action Channels */}
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

                <a
                  href="https://wa.me/?text=Hello%20Manohar%20Grand%20Team%2C%20I%20have%20an%20inquiry%20regarding%20room%20booking"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full"
                >
                  <Button variant="outline" size="lg" className="w-full gap-2 font-bold text-green-700 hover:bg-green-50 border-green-300">
                    <MessageCircle className="w-4 h-4 text-green-600" />
                    WhatsApp Front Desk Support
                  </Button>
                </a>
              </div>
            </div>

            {/* Right: Interactive Map & Direct Booking Perks (7 cols) */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              {/* Interactive Google Map Embed */}
              <div className="bg-white rounded-card border border-neutral-border shadow-card overflow-hidden flex flex-col">
                <div className="p-4 border-b border-neutral-border flex items-center justify-between bg-neutral-light/60">
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

              {/* Direct Booking Highlight Card */}
              <Card variant="default" className="bg-white p-6 shadow-card border border-neutral-border">
                <CardContent className="p-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Building className="w-5 h-5 text-brand" />
                      <h3 className="text-base font-bold text-neutral-dark">
                        Ready to Plan Your Stay?
                      </h3>
                    </div>
                    <p className="text-xs text-neutral-secondary max-w-md leading-relaxed">
                      Choose between our {CONFIRMED_HOTEL_INFO.acRooms} AC Rooms and {CONFIRMED_HOTEL_INFO.nonAcRooms} Non-AC Rooms with guaranteed direct rates and instant reservation confirmation.
                    </p>
                    <div className="flex items-center gap-2 text-xs text-neutral-500 pt-1">
                      <ShieldCheck className="w-4 h-4 text-feedback-success" />
                      <span>Best price guarantee • No hidden charges • Instant booking</span>
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
            </div>
          </div>
        </Container>
      </Section>
    </div>
  );
};
