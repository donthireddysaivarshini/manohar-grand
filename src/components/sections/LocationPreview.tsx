import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, ArrowRight, ExternalLink } from 'lucide-react';
import { Container } from '../common/Container';
import { Section } from '../common/Section';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Card, CardContent } from '../common/Card';
import { PLACEHOLDER_HOTEL_INFO } from '../../data/placeholderHotelInfo';

export const LocationPreview: React.FC = () => {
  return (
    <Section variant="default" padding="lg">
      <Container size="xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          {/* Left: Location & Contact Cards */}
          <div className="flex flex-col items-start gap-5">
            <Badge variant="brand" size="md">
              Location &amp; Connectivity
            </Badge>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-neutral-dark tracking-tight">
              Convenient &amp; Accessible Location
            </h2>

            <p className="text-sm text-neutral-secondary leading-relaxed">
              Situated in an accessible, vibrant neighborhood with convenient connectivity to business hubs, transit points, and shopping destinations in Hyderabad.
            </p>

            <div className="w-full flex flex-col gap-3 py-1">
              <a
                href={PLACEHOLDER_HOTEL_INFO.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group block"
              >
                <Card variant="bordered" className="bg-white p-4 group-hover:border-brand/40 transition-colors">
                  <CardContent className="p-0 flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-brand shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
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
                  </CardContent>
                </Card>
              </a>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Card variant="bordered" className="bg-white p-4">
                  <CardContent className="p-0 flex items-center gap-3">
                    <Phone className="w-4 h-4 text-brand shrink-0" />
                    <div>
                      <span className="text-[11px] font-bold text-neutral-dark uppercase tracking-wider block">
                        Direct Phone
                      </span>
                      <p className="text-xs text-neutral-secondary">
                        {PLACEHOLDER_HOTEL_INFO.placeholderPhone}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card variant="bordered" className="bg-white p-4">
                  <CardContent className="p-0 flex items-center gap-3">
                    <Mail className="w-4 h-4 text-brand shrink-0" />
                    <div>
                      <span className="text-[11px] font-bold text-neutral-dark uppercase tracking-wider block">
                        Email Contact
                      </span>
                      <p className="text-xs text-neutral-secondary">
                        {PLACEHOLDER_HOTEL_INFO.placeholderEmail}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link to="/contact">
                <Button variant="outline" size="md" className="gap-2 font-semibold">
                  Contact &amp; Inquiry Details
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <a
                href={PLACEHOLDER_HOTEL_INFO.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="primary" size="md" className="gap-2 font-semibold">
                  <MapPin className="w-4 h-4" />
                  Get Directions
                </Button>
              </a>
            </div>
          </div>

          {/* Right: Interactive Google Map Iframe */}
          <div className="relative aspect-[4/3] rounded-card overflow-hidden bg-neutral-100 border border-neutral-border shadow-card">
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
        </div>
      </Container>
    </Section>
  );
};
