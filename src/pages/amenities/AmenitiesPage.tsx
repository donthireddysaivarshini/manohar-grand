import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Wind,
  Wifi,
  Clock,
  Droplets,
  Sparkles,
  Zap,
  Car,
  ShieldCheck,
  CalendarDays,
  ShieldAlert,
} from 'lucide-react';
import { Container } from '../../components/common/Container';
import { Section } from '../../components/common/Section';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card, CardContent } from '../../components/common/Card';
import { AMENITIES_DATA } from '../../data/amenitiesData';

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  Wind: <Wind className="w-6 h-6 text-brand" />,
  Wifi: <Wifi className="w-6 h-6 text-brand" />,
  Clock: <Clock className="w-6 h-6 text-brand" />,
  Droplets: <Droplets className="w-6 h-6 text-brand" />,
  Sparkles: <Sparkles className="w-6 h-6 text-brand" />,
  Zap: <Zap className="w-6 h-6 text-brand" />,
  Car: <Car className="w-6 h-6 text-brand" />,
  ShieldCheck: <ShieldCheck className="w-6 h-6 text-brand" />,
};

export const AmenitiesPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Hotel Amenities & Services | Manohar Grand';
  }, []);

  return (
    <div className="flex flex-col w-full">
      {/* Page Header */}
      <Section variant="dark" padding="md" className="border-b border-neutral-800">
        <Container size="xl">
          <div className="max-w-2xl flex flex-col items-start gap-3">
            <Badge variant="brand" size="md">
              Hotel Facilities
            </Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
              Amenities &amp; Guest Services
            </h1>
            <p className="text-sm sm:text-base text-neutral-300 leading-relaxed">
              Experience convenient conveniences, clean attached bathrooms, and dedicated hospitality designed for a restful stay.
            </p>
          </div>
        </Container>
      </Section>

      {/* Main Amenities Grid */}
      <Section variant="default" padding="lg">
        <Container size="xl">
          <div className="mb-6 p-4 rounded-lg bg-white border border-neutral-border shadow-sm flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-feedback-warning shrink-0 mt-0.5" />
            <div className="text-xs text-neutral-secondary">
              <span className="font-bold text-neutral-dark">Information Transparency: </span>
              Air Conditioning in AC Rooms is a confirmed property specification. Other amenities listed below are temporary demo representations and will be verified upon client delivery.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {AMENITIES_DATA.map((item) => (
              <Card
                key={item.id}
                variant="default"
                className="bg-white p-6 flex flex-col justify-between gap-4 hover:border-brand/30 transition-all hover:shadow-card-hover"
              >
                <CardContent className="p-0 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-lg bg-neutral-light border border-neutral-border flex items-center justify-center">
                      {AMENITY_ICONS[item.iconName] || <Sparkles className="w-6 h-6 text-brand" />}
                    </div>
                    <Badge
                      variant={item.isConfirmed ? 'success' : 'default'}
                      size="sm"
                      className="font-bold"
                    >
                      {item.isConfirmed ? 'Confirmed' : 'Demo Placeholder'}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-neutral-dark">{item.name}</h3>
                    <p className="text-xs sm:text-sm text-neutral-secondary leading-relaxed mt-1">
                      {item.description}
                    </p>
                  </div>
                </CardContent>

                <div className="pt-2 border-t border-neutral-border/50 text-[11px] text-neutral-400 font-medium">
                  {item.statusLabel}
                </div>
              </Card>
            ))}
          </div>

          {/* Book Now Bottom Banner */}
          <div className="mt-14 bg-white rounded-card border border-neutral-border p-8 text-center flex flex-col items-center gap-4 max-w-2xl mx-auto shadow-card">
            <h3 className="text-2xl font-bold text-neutral-dark">
              Ready to Book Your Room?
            </h3>
            <p className="text-sm text-neutral-secondary">
              Choose your dates and select between our comfortable AC and Non-AC room options.
            </p>
            <Link to="/booking">
              <Button variant="primary" size="lg" className="gap-2 font-bold shadow-md">
                <CalendarDays className="w-5 h-5" />
                Check Room Availability
              </Button>
            </Link>
          </div>
        </Container>
      </Section>
    </div>
  );
};
