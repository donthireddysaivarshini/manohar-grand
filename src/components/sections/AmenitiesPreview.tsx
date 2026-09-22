import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Container } from '../common/Container';
import { Section } from '../common/Section';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Card, CardContent } from '../common/Card';
import { Icon3D } from '../common/Icon3D';
import { ScrollReveal } from '../common/ScrollReveal';
import { AMENITIES_DATA } from '../../data/amenitiesData';

export const AmenitiesPreview: React.FC = () => {
  return (
    <Section variant="default" padding="lg">
      <Container size="xl">
        <ScrollReveal direction="up" className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 sm:mb-12">
          <div className="flex flex-col items-start gap-2 max-w-xl">
            <Badge variant="brand" size="md">
              Facilities &amp; Conveniences
            </Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-neutral-dark tracking-tight">
              Hotel Amenities
            </h2>
            <p className="text-xs sm:text-sm text-neutral-secondary leading-relaxed">
              Equipped with on-site car parking, round-the-clock reception, and essential room conveniences.
            </p>
          </div>

          <Link to="/amenities" className="shrink-0">
            <Button variant="outline" size="md" className="gap-2 font-semibold">
              View All Amenities
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {AMENITIES_DATA.slice(0, 6).map((item, index) => (
            <ScrollReveal
              key={item.id}
              direction="up"
              delayMs={index * 80}
              className="h-full"
            >
              <Card
                variant="default"
                className="h-full bg-white border border-neutral-200/90 rounded-2xl p-5 hover:border-brand/30 transition-all hover:-translate-y-1 hover:shadow-card-hover"
              >
                <CardContent className="p-0 flex items-start gap-4">
                  {/* Large 3D Icon Badge */}
                  <Icon3D name={item.iconName} size="md" className="shrink-0 shadow-sm" />

                  <div className="flex flex-col gap-1.5 flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm sm:text-base font-bold text-neutral-dark truncate">
                        {item.name}
                      </h3>
                      {item.isConfirmed && (
                        <span className="text-[10px] uppercase font-bold text-feedback-success bg-green-50 px-2 py-0.5 rounded border border-green-200 shrink-0">
                          Confirmed
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-secondary leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>
          ))}
        </div>
      </Container>
    </Section>
  );
};
