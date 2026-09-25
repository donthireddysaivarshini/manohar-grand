import React, { useEffect } from 'react';
import { Container } from '../../components/common/Container';
import { BookingSearchWidget } from '../../components/booking/BookingSearchWidget';
import {
  HeroSection,
  WelcomeSection,
  RoomCategoriesSection,
  HighlightsSection,
  GalleryPreview,
  LocationPreview,
  FinalCTA,
} from '../../components/sections';

export const HomePage: React.FC = () => {
  useEffect(() => {
    document.title = 'Manohar Grand | Hotel & Direct Booking Platform';
  }, []);

  return (
    <div className="flex flex-col w-full">
      {/* 1. Hero Section */}
      <HeroSection />

      {/* 2. Floating Search Widget */}
      <Container size="xl" className="px-4 sm:px-6">
        <BookingSearchWidget variant="floating" />
      </Container>

      {/* 3. Welcome & Story Section */}
      <WelcomeSection />

      {/* 4. Room Categories Section (20 AC / 8 Non-AC) */}
      <RoomCategoriesSection />

      {/* 5. Why Choose Us (Comprehensive Hotel Highlights & Amenities) */}
      <HighlightsSection />

      {/* 6. Visual Photo Gallery Preview */}
      <GalleryPreview />

      {/* 7. Location & Connectivity Preview */}
      <LocationPreview />

      {/* 8. Final Conversion Booking CTA */}
      <FinalCTA />
    </div>
  );
};
