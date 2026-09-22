import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Container } from '../common/Container';
import { Section } from '../common/Section';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { ScrollReveal } from '../common/ScrollReveal';
import { RoomCategoryCard } from '../rooms/RoomCategoryCard';
import { INITIAL_ROOM_CATEGORIES } from '../../data/roomCategories';

export const RoomCategoriesSection: React.FC = () => {
  return (
    <Section variant="default" padding="lg">
      <Container size="xl">
        {/* Section Header */}
        <ScrollReveal direction="up" className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 sm:mb-12">
          <div className="flex flex-col items-start gap-2 max-w-xl">
            <Badge variant="brand" size="md">
              Room Categories
            </Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-neutral-dark tracking-tight">
              Accommodations at Manohar Grand
            </h2>
            <p className="text-xs sm:text-sm text-neutral-secondary leading-relaxed">
              Choose between our climate-controlled AC Rooms and budget-conscious Non-AC Rooms, both designed for everyday comfort and peaceful rest.
            </p>
          </div>

          <Link to="/rooms" className="shrink-0">
            <Button variant="outline" size="md" className="gap-2 font-semibold">
              View All Accommodations
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </ScrollReveal>

        {/* 2 Confirmed Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto">
          {INITIAL_ROOM_CATEGORIES.map((category, index) => (
            <ScrollReveal
              key={category.id}
              direction="up"
              delayMs={index * 150}
              className="h-full"
            >
              <RoomCategoryCard category={category} />
            </ScrollReveal>
          ))}
        </div>
      </Container>
    </Section>
  );
};
