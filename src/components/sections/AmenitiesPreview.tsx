import React from 'react';
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
  ArrowRight,
} from 'lucide-react';
import { Container } from '../common/Container';
import { Section } from '../common/Section';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Card, CardContent } from '../common/Card';
import { AMENITIES_DATA } from '../../data/amenitiesData';

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  Wind: <Wind className="w-5 h-5 text-brand" />,
  Wifi: <Wifi className="w-5 h-5 text-brand" />,
  Clock: <Clock className="w-5 h-5 text-brand" />,
  Droplets: <Droplets className="w-5 h-5 text-brand" />,
  Sparkles: <Sparkles className="w-5 h-5 text-brand" />,
  Zap: <Zap className="w-5 h-5 text-brand" />,
  Car: <Car className="w-5 h-5 text-brand" />,
  ShieldCheck: <ShieldCheck className="w-5 h-5 text-brand" />,
};

export const AmenitiesPreview: React.FC = () => {
  return (
    <Section variant="default" padding="lg">
      <Container size="xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 sm:mb-12">
          <div className="flex flex-col items-start gap-2 max-w-xl">
            <Badge variant="brand" size="md">
              Facilities &amp; Services
            </Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-neutral-dark tracking-tight">
              Thoughtful Amenities
            </h2>
            <p className="text-sm text-neutral-secondary leading-relaxed">
              Equipped with essential comforts and modern conveniences to make your stay effortless.
            </p>
          </div>

          <Link to="/amenities" className="shrink-0">
            <Button variant="outline" size="md" className="gap-2 font-semibold">
              View All Amenities
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {AMENITIES_DATA.slice(0, 6).map((item) => (
            <Card
              key={item.id}
              variant="default"
              className="bg-white p-5 hover:border-brand/30 transition-all hover:shadow-card-hover"
            >
              <CardContent className="p-0 flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-neutral-light border border-neutral-border flex items-center justify-center shrink-0">
                  {AMENITY_ICONS[item.iconName] || <Sparkles className="w-5 h-5 text-brand" />}
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-neutral-dark">{item.name}</h3>
                    <Badge
                      variant={item.isConfirmed ? 'success' : 'default'}
                      size="sm"
                      className="text-[10px] py-0 px-1.5"
                    >
                      {item.isConfirmed ? 'Confirmed' : 'Demo'}
                    </Badge>
                  </div>
                  <p className="text-xs text-neutral-secondary leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </Container>
    </Section>
  );
};
