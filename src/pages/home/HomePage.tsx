import React from 'react';
import { Container } from '../../components/common/Container';
import { BookingSearchWidget } from '../../components/booking/BookingSearchWidget';
import { SEO } from '../../components/common/SEO';
import {
  HeroSection,
  WelcomeSection,
  RoomCategoriesSection,
  HighlightsSection,
  GalleryPreview,
  LocationPreview,
  FinalCTA,
} from '../../components/sections';

const HOTEL_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Hotel',
  name: 'Manohar Grand',
  description: 'Premier hotel offering 28 contemporary AC and Non-AC rooms located beside Nexus Hyderabad Mall, Kukatpally.',
  url: 'https://www.manohargrand.com',
  telephone: '+91-7997022999',
  image: 'https://www.manohargrand.com/logomg.jpeg',
  priceRange: '₹1,799 - ₹2,999',
  numberOfRooms: 28,
  checkinTime: '12:00',
  checkoutTime: '11:00',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Beside Nexus Hyderabad Mall, Kukatpally',
    addressLocality: 'Hyderabad',
    addressRegion: 'Telangana',
    postalCode: '500072',
    addressCountry: 'IN',
  },
};

export const HomePage: React.FC = () => {
  return (
    <div className="flex flex-col w-full">
      <SEO
        title="Manohar Grand | Luxury Hotel & Rooms in Kukatpally, Hyderabad"
        description="Book your stay at Manohar Grand, premier hotel beside Nexus Hyderabad Mall, Kukatpally. Featuring 28 premium AC & Non-AC rooms, 24/7 room service & direct booking."
        canonical="https://www.manohargrand.com/"
        jsonLd={HOTEL_SCHEMA}
      />
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
