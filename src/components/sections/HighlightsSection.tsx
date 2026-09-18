import React from 'react';
import { BedDouble, BadgePercent, HeartHandshake, Sparkles } from 'lucide-react';
import { Container } from '../common/Container';
import { Section } from '../common/Section';
import { Badge } from '../common/Badge';
import { Card, CardContent } from '../common/Card';
import { EXPERIENCE_HIGHLIGHTS } from '../../data/experienceData';

const ICONS_MAP: Record<string, React.ReactNode> = {
  BedDouble: <BedDouble className="w-6 h-6 text-brand" />,
  BadgePercent: <BadgePercent className="w-6 h-6 text-brand" />,
  HeartHandshake: <HeartHandshake className="w-6 h-6 text-brand" />,
  Sparkles: <Sparkles className="w-6 h-6 text-brand" />,
};

export const HighlightsSection: React.FC = () => {
  return (
    <Section variant="white" padding="lg">
      <Container size="xl">
        <div className="text-center max-w-2xl mx-auto mb-12 flex flex-col items-center gap-3">
          <Badge variant="brand" size="md">
            The Manohar Grand Experience
          </Badge>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-neutral-dark tracking-tight">
            Why Guests Choose Us
          </h2>
          <p className="text-sm text-neutral-secondary">
            Designed for convenience, comfort, and peace of mind on every stay.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {EXPERIENCE_HIGHLIGHTS.map((item) => (
            <Card
              key={item.id}
              variant="default"
              className="bg-neutral-light border-neutral-border/80 p-6 flex flex-col gap-4 hover:border-brand/30 transition-all hover:shadow-card-hover"
            >
              <CardContent className="p-0 flex flex-col gap-3">
                <div className="w-12 h-12 rounded-lg bg-white border border-neutral-border flex items-center justify-center shadow-sm">
                  {ICONS_MAP[item.iconName] || <Sparkles className="w-6 h-6 text-brand" />}
                </div>
                <h3 className="text-base font-bold text-neutral-dark">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-secondary leading-relaxed">
                  {item.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Container>
    </Section>
  );
};
