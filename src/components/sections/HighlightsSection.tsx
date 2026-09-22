import React from 'react';
import { Container } from '../common/Container';
import { Section } from '../common/Section';
import { Badge } from '../common/Badge';
import { Card, CardContent } from '../common/Card';
import { Icon3D } from '../common/Icon3D';
import { ScrollReveal } from '../common/ScrollReveal';
import { EXPERIENCE_HIGHLIGHTS } from '../../data/experienceData';

/**
 * Why Choose Us (Highlights Section)
 * - Features large 3D hospitality icons on soft grey surface plates.
 * - Heading placed beside the icon with supporting description below.
 * - Soft grey container cards (#F7F7F7) with subtle border and elevation.
 */
export const HighlightsSection: React.FC = () => {
  return (
    <Section variant="white" padding="lg">
      <Container size="xl">
        <ScrollReveal direction="up" className="text-center max-w-2xl mx-auto mb-10 sm:mb-12 flex flex-col items-center gap-2.5">
          <Badge variant="brand" size="md">
            Why Choose Us
          </Badge>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-neutral-dark tracking-tight">
            Why Guests Choose Manohar Grand
          </h2>
          <p className="text-xs sm:text-sm text-neutral-secondary">
            Comfortable rooms, prime metro connectivity, and dependable guest service in Kukatpally.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
          {EXPERIENCE_HIGHLIGHTS.map((item, index) => (
            <ScrollReveal
              key={item.id}
              direction="up"
              delayMs={index * 100}
              className="h-full"
            >
              <Card
                variant="default"
                className="h-full bg-[#F7F7F7] border border-neutral-200/90 rounded-2xl p-5 sm:p-6 transition-all duration-300 hover:border-brand/40 hover:-translate-y-1 hover:shadow-card-hover"
              >
                <CardContent className="p-0 flex items-start gap-4 sm:gap-5">
                  {/* Large 3D Icon */}
                  <Icon3D name={item.iconName} size="lg" className="shadow-sm" />

                  {/* Heading beside icon & Description below */}
                  <div className="flex-1 flex flex-col justify-center gap-1.5 pt-0.5">
                    <h3 className="text-base sm:text-lg font-extrabold text-neutral-dark tracking-tight">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-neutral-secondary leading-relaxed">
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
