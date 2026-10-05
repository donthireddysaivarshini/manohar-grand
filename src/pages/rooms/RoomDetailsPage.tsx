import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ChevronRight,
  Tv,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  ShieldAlert,
  Users,
  Car,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Container } from '../../components/common/Container';
import { Section } from '../../components/common/Section';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card, CardContent } from '../../components/common/Card';
import { RoomGallery } from '../../components/rooms/RoomGallery';
import { RoomSpecGrid } from '../../components/rooms/RoomSpecGrid';
import { RoomBookingCard } from '../../components/rooms/RoomBookingCard';
import { Icon3D } from '../../components/common/Icon3D';
import { roomApiService } from '../../services/api/roomApiService';
import { ApiRoomCategory } from '../../types/booking';

const AMENITY_ICON_MAP: Record<string, React.ReactNode> = {
  'air-conditioning': <Icon3D name="air-conditioning" size="sm" />,
  'hot-water': <Icon3D name="hot-water" size="sm" />,
  'wifi': <Icon3D name="wifi" size="sm" />,
  'tv': <Tv className="w-5 h-5 text-brand" />,
  'housekeeping': <Icon3D name="housekeeping" size="sm" />,
  'power-backup': <Icon3D name="power-backup" size="sm" />,
  'reception': <Icon3D name="reception" size="sm" />,
  'security': <Icon3D name="security" size="sm" />,
  'parking': <Icon3D name="parking" size="sm" />,
};

export const RoomDetailsPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  const [category, setCategory] = useState<ApiRoomCategory | null>(null);
  const [otherCategory, setOtherCategory] = useState<ApiRoomCategory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadRoomDetails = useCallback(async () => {
    if (!slug) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [currentCat, allCats] = await Promise.all([
        roomApiService.getCategoryBySlug(slug),
        roomApiService.getCategories().catch(() => [] as ApiRoomCategory[]),
      ]);

      setCategory(currentCat);
      const alternate = allCats.find((c) => c.slug !== slug) || null;
      setOtherCategory(alternate);
    } catch (err: any) {
      console.error('Failed to load room category details:', err);
      setErrorMessage(err?.message || 'Unable to retrieve category details from the server.');
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadRoomDetails();
  }, [loadRoomDetails]);

  useEffect(() => {
    if (category) {
      document.title = `${category.name} | Manohar Grand`;
    } else {
      document.title = 'Room Category | Manohar Grand';
    }
  }, [category]);

  // Loading State
  if (isLoading) {
    return (
      <div className="py-24 flex-1 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
        <span className="text-sm font-semibold text-neutral-secondary">
          Loading room specifications and imagery...
        </span>
      </div>
    );
  }

  // Error / Not Found State
  if (errorMessage || !category) {
    return (
      <div className="py-20 flex-1 flex items-center justify-center">
        <Container size="md">
          <div className="text-center flex flex-col items-center gap-5 max-w-md mx-auto">
            <Badge variant="error" size="md">
              Room Category Not Found
            </Badge>
            <h1 className="text-3xl font-extrabold text-neutral-dark">
              Category Not Available
            </h1>
            <p className="text-sm text-neutral-secondary leading-relaxed">
              {errorMessage || 'The requested room category could not be retrieved from the server.'}
            </p>
            <div className="flex gap-3">
              <Button variant="outline" size="md" onClick={loadRoomDetails} className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Retry
              </Button>
              <Link to="/rooms">
                <Button variant="primary" size="md" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  View All Rooms
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  const isAc =
    category.id === 'ac-room' ||
    category.slug === 'ac-room' ||
    category.name.toLowerCase().includes('ac') && !category.name.toLowerCase().includes('non-ac');

  return (
    <div className="flex flex-col w-full">
      {/* Breadcrumb Navigation Bar */}
      <div className="bg-white border-b border-neutral-border py-3">
        <Container size="xl">
          <nav className="flex items-center gap-2 text-xs text-neutral-secondary" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-brand transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
            <Link to="/rooms" className="hover:text-brand transition-colors">
              Accommodations
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
            <span className="font-semibold text-neutral-dark">{category.name}</span>
          </nav>
        </Container>
      </div>

      {/* Main Room Details Content */}
      <Section variant="default" padding="md">
        <Container size="xl">
          {/* Header Title & Badges */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <Badge variant="brand" size="sm" className="font-bold">
                  {category.name}
                </Badge>
                <Badge variant="default" size="sm" className="font-semibold">
                  Up to {category.included_adults || 2} Guests (Base)
                </Badge>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-neutral-dark tracking-tight">
                {category.name}
              </h1>
              <p className="text-xs sm:text-sm text-neutral-secondary">
                {category.tagline || 'Comfortable and dependable accommodation in Kukatpally.'}
              </p>
            </div>

            <Link to="/rooms" className="self-start sm:self-center">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold">
                <ArrowLeft className="w-3.5 h-3.5" />
                All Accommodations
              </Button>
            </Link>
          </div>

          {/* 2-Column Responsive Layout: Content (Left 8 cols) + Sticky Booking Card (Right 4 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column (8 cols) */}
            <div className="lg:col-span-8 flex flex-col gap-8">
              {/* 1. Interactive Dynamic Image Gallery */}
              <RoomGallery roomName={category.name} images={category.images} />

              {/* Occupancy & Parking Callouts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {isAc ? (
                  <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 flex items-start gap-3.5 shadow-2xs">
                    <div className="w-9 h-9 rounded-lg bg-white border border-neutral-200 flex items-center justify-center shrink-0 text-brand shadow-xs">
                      <Users className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-bold text-neutral-dark">Guest Occupancy</span>
                      <p className="text-xs text-neutral-600 leading-relaxed">
                        Included tariff for {category.included_adults} adults. Max total occupancy: {category.max_total_occupancy} guests.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 flex items-start gap-3.5 shadow-2xs">
                    <div className="w-9 h-9 rounded-lg bg-white border border-neutral-200 flex items-center justify-center shrink-0 text-brand shadow-xs">
                      <Users className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-bold text-neutral-dark">Standard Occupancy</span>
                      <p className="text-xs text-neutral-600 leading-relaxed">
                        Comfortable accommodation for <strong>up to {category.included_adults || 2} guests</strong>.
                      </p>
                    </div>
                  </div>
                )}

                <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 flex items-start gap-3.5 shadow-2xs">
                  <div className="w-9 h-9 rounded-lg bg-white border border-neutral-200 flex items-center justify-center shrink-0 text-brand shadow-xs">
                    <Car className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-neutral-dark">Car Parking Available</span>
                    <p className="text-xs text-neutral-600 leading-relaxed">
                      Convenient on-premise vehicle parking for all resident guests.
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. Room Overview */}
              <Card variant="bordered" className="bg-white p-6 shadow-xs rounded-2xl">
                <CardContent className="p-0 flex flex-col gap-3">
                  <h2 className="text-lg font-bold text-neutral-dark">
                    Room Overview
                  </h2>
                  <p className="text-sm text-neutral-secondary leading-relaxed whitespace-pre-line">
                    {category.description || category.tagline}
                  </p>
                </CardContent>
              </Card>

              {/* 3. Room Specifications Grid */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-neutral-dark">
                    Room Specifications
                  </h2>
                  <span className="text-xs text-neutral-secondary">
                    Capacity &amp; Layout
                  </span>
                </div>
                <RoomSpecGrid category={category} />
              </div>

              {/* 4. Room Amenities & Facilities */}
              <Card variant="bordered" className="bg-white p-6 shadow-xs rounded-2xl">
                <CardContent className="p-0 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-neutral-dark">
                      Room Amenities &amp; Inclusions
                    </h2>
                    <Badge variant="default" size="sm" className="text-[10px]">
                      Essential Comforts
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    {category.amenities && category.amenities.length > 0 ? (
                      category.amenities.map((amenity) => (
                        <div
                          key={amenity.id}
                          className="flex items-start gap-3.5 p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/80 hover:border-neutral-300 transition-colors"
                        >
                          <div className="shrink-0">
                            {AMENITY_ICON_MAP[amenity.icon_name] || <Sparkles className="w-5 h-5 text-brand" />}
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-bold text-neutral-dark">
                              {amenity.name}
                            </span>
                            <span className="text-[11px] text-neutral-secondary leading-relaxed">
                              {amenity.description || (amenity.is_property_wide ? 'Property-wide amenity' : 'In-room feature')}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-neutral-50 border border-neutral-200">
                          <Icon3D name="air-conditioning" size="sm" />
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-bold text-neutral-dark">Climate Comfort</span>
                            <span className="text-[11px] text-neutral-secondary">{isAc ? 'Individual AC' : 'Ceiling Fan'}</span>
                          </div>
                        </div>
                        <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-neutral-50 border border-neutral-200">
                          <Icon3D name="hot-water" size="sm" />
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-bold text-neutral-dark">24/7 Hot Water</span>
                            <span className="text-[11px] text-neutral-secondary">Private attached bath</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* 5. Policies & House Rules */}
              <Card variant="bordered" className="bg-white p-6 shadow-xs rounded-2xl">
                <CardContent className="p-0 flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-brand" />
                    <h2 className="text-lg font-bold text-neutral-dark">
                      Reservation Policies &amp; House Rules
                    </h2>
                  </div>

                  <div className="flex flex-col gap-3 text-xs text-neutral-secondary divide-y divide-neutral-border/60">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-neutral-dark">Government ID Verification</span>
                      <p className="leading-relaxed">
                        Original physical Aadhar Card is mandatory for every staying guest at check-in. Primary guest must be 18+ years of age.
                      </p>
                    </div>
                    <div className="pt-3 flex flex-col gap-0.5">
                      <span className="font-bold text-neutral-dark">Standard Check-In &amp; Check-Out</span>
                      <p className="leading-relaxed">
                        Check-in begins at 12:00 PM (Noon). Check-out is by 11:00 AM. Early check-in or late check-out is subject to physical room availability.
                      </p>
                    </div>
                    <div className="pt-3 flex flex-col gap-0.5">
                      <span className="font-bold text-neutral-dark">Cancellation &amp; Refund Policy</span>
                      <p className="leading-relaxed">
                        Cancellations requested 2 or more days prior to check-in receive a 50% refund. Cancellations made less than 2 days before check-in or same-day are strictly non-refundable.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 6. Alternate Category Switch Banner */}
              {otherCategory && (
                <Card variant="bordered" className="bg-white p-6 border-brand/20 shadow-sm rounded-2xl">
                  <CardContent className="p-0 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex flex-col gap-1 text-center sm:text-left">
                      <span className="text-xs font-bold uppercase tracking-wider text-brand">
                        Explore Other Categories
                      </span>
                      <h3 className="text-base font-bold text-neutral-dark">
                        Looking for {otherCategory.name}?
                      </h3>
                      <p className="text-xs text-neutral-secondary">
                        {otherCategory.tagline}
                      </p>
                    </div>

                    <Link to={`/rooms/${otherCategory.slug}`} className="shrink-0">
                      <Button variant="outline" size="sm" className="gap-1.5 font-semibold">
                        <span>View {otherCategory.name}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column: Sticky Pricing & Booking Card (4 cols) */}
            <div className="lg:col-span-4">
              <RoomBookingCard category={category} />
            </div>
          </div>
        </Container>
      </Section>
    </div>
  );
};
