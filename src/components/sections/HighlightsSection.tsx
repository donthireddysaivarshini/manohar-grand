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
 * - Showcases key value propositions including Wakefit Memory Foam mattresses.
 * - Responsive grid optimized for iPhone (320px–414px) and desktop.
 * - Soft grey container cards with subtle elevation.
 */
export const HighlightsSection: React.FC = () => {
  return (
    <Section variant="white" padding="lg">
      <Container size="xl" className="px-3 xs:px-4 sm:px-6 md:px-8">
        <ScrollReveal direction="up" className="text-center max-w-2xl mx-auto mb-8 sm:mb-12 flex flex-col items-center gap-2">
          <Badge variant="brand" size="md">
            Why Choose Us
          </Badge>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-neutral-dark tracking-tight">
            Why Guests Choose Manohar Grand
          </h2>
          <p className="text-xs sm:text-sm text-neutral-secondary max-w-lg leading-relaxed">
            From Wakefit Memory Foam mattresses in every room to 1-minute metro walkability and 24/7 hospitality.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
          {EXPERIENCE_HIGHLIGHTS.map((item, index) => (
            <ScrollReveal
              key={item.id}
              direction="up"
              delayMs={index * 80}
              className="h-full"
            >
              <Card
                variant="default"
                className="h-full bg-[#F7F7F7] border border-neutral-200/90 rounded-2xl p-4 xs:p-5 sm:p-6 transition-all duration-300 hover:border-brand/40 hover:-translate-y-1 hover:shadow-card-hover flex flex-col justify-between"
              >
                <CardContent className="p-0 flex items-start gap-3.5 sm:gap-4">
                  {/* 3D Hospitality Icon */}
                  <div className="shrink-0 pt-0.5">
                    <Icon3D name={item.iconName} size="md" className="shadow-xs" />
                  </div>

                  {/* Heading & Content */}
                  <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-1.5 flex-wrap">
                      <h3 className="text-sm xs:text-base font-extrabold text-neutral-dark tracking-tight break-words">
                        {item.title}
                      </h3>
                      {item.badge && (
                        <span className="text-[10px] uppercase font-bold text-brand bg-brand/10 px-2 py-0.5 rounded border border-brand/20 shrink-0">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-[13px] text-neutral-secondary leading-relaxed">
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
