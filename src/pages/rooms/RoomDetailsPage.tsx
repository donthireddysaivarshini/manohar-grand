import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ChevronRight,
  Wind,
  Droplets,
  Wifi,
  Tv,
  Sparkles,
  Zap,
  Clock,
  ShieldCheck,
  ArrowLeft,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { Container } from '../../components/common/Container';
import { Section } from '../../components/common/Section';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card, CardContent } from '../../components/common/Card';
import { RoomGallery } from '../../components/rooms/RoomGallery';
import { RoomSpecGrid } from '../../components/rooms/RoomSpecGrid';
import { RoomBookingCard } from '../../components/rooms/RoomBookingCard';
import { ROOM_CATEGORIES_DATA, RoomCategoryExtended } from '../../data/roomCategories';

const FEATURE_ICONS: Record<string, React.ReactNode> = {
  Wind: <Wind className="w-5 h-5 text-brand" />,
  Droplets: <Droplets className="w-5 h-5 text-brand" />,
  Wifi: <Wifi className="w-5 h-5 text-brand" />,
  Tv: <Tv className="w-5 h-5 text-brand" />,
  Sparkles: <Sparkles className="w-5 h-5 text-brand" />,
  Zap: <Zap className="w-5 h-5 text-brand" />,
  Clock: <Clock className="w-5 h-5 text-brand" />,
  ShieldCheck: <ShieldCheck className="w-5 h-5 text-brand" />,
};

export const RoomDetailsPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  const category = ROOM_CATEGORIES_DATA.find((c) => c.slug === slug) as RoomCategoryExtended | undefined;

  // Find the alternate category for quick comparison switch
  const otherCategory = ROOM_CATEGORIES_DATA.find((c) => c.slug !== slug);

  useEffect(() => {
    if (category) {
      document.title = `${category.name} | Manohar Grand Hotel`;
    } else {
      document.title = 'Room Category | Manohar Grand Hotel';
    }
  }, [category]);

  if (!category) {
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
              We currently offer two confirmed room categories: <strong>AC Room</strong> and <strong>Non-AC Room</strong>.
            </p>
            <Link to="/rooms">
              <Button variant="primary" size="md" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                View All Accommodations
              </Button>
            </Link>
          </div>
        </Container>
      </div>
    );
  }

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
                <Badge variant="success" size="sm" className="font-bold">
                  {category.totalInventory} Rooms Confirmed
                </Badge>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-neutral-dark tracking-tight">
                {category.name}
              </h1>
              <p className="text-xs sm:text-sm text-neutral-secondary">
                {category.subtitle}
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
              {/* 1. Interactive Image Gallery */}
              <RoomGallery roomName={category.name} images={category.demoImages.gallery} />

              {/* 2. Room Overview Paragraphs */}
              <Card variant="bordered" className="bg-white p-6 shadow-xs">
                <CardContent className="p-0 flex flex-col gap-3">
                  <h2 className="text-lg font-bold text-neutral-dark">
                    Room Overview
                  </h2>
                  {category.overviewParagraphs.map((para, idx) => (
                    <p key={idx} className="text-sm text-neutral-secondary leading-relaxed">
                      {para}
                    </p>
                  ))}
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
                <RoomSpecGrid specifications={category.specifications} />
              </div>

              {/* 4. Room Amenities & Facilities */}
              <Card variant="bordered" className="bg-white p-6 shadow-xs">
                <CardContent className="p-0 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-neutral-dark">
                      Room Amenities &amp; Facilities
                    </h2>
                    <Badge variant="default" size="sm" className="text-[10px]">
                      Essential Comforts
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    {category.roomFeatures.map((feat, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3 rounded-lg bg-neutral-light/70 border border-neutral-border/60"
                      >
                        <div className="w-8 h-8 rounded-md bg-white border border-neutral-border flex items-center justify-center shrink-0">
                          {FEATURE_ICONS[feat.iconName] || <Sparkles className="w-4 h-4 text-brand" />}
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-bold text-neutral-dark">
                            {feat.title}
                          </span>
                          <span className="text-[11px] text-neutral-secondary leading-relaxed">
                            {feat.description}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 5. Policies & House Rules */}
              <Card variant="bordered" className="bg-white p-6 shadow-xs">
                <CardContent className="p-0 flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-brand" />
                    <h2 className="text-lg font-bold text-neutral-dark">
                      Reservation Policies &amp; House Rules
                    </h2>
                  </div>

                  <div className="flex flex-col gap-3 text-xs text-neutral-secondary divide-y divide-neutral-border/60">
                    {category.policies.map((pol, idx) => (
                      <div key={idx} className={idx > 0 ? 'pt-3' : ''}>
                        <span className="font-bold text-neutral-dark block mb-0.5">
                          {pol.title}
                        </span>
                        <p className="leading-relaxed">{pol.description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 6. Alternate Category Switch Banner */}
              {otherCategory && (
                <Card variant="bordered" className="bg-white p-6 border-brand/20 shadow-sm">
                  <CardContent className="p-0 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex flex-col gap-1 text-center sm:text-left">
                      <span className="text-xs font-bold uppercase tracking-wider text-brand">
                        Explore Other Categories
                      </span>
                      <h3 className="text-base font-bold text-neutral-dark">
                        Looking for {otherCategory.name}? ({otherCategory.totalInventory} Rooms)
                      </h3>
                      <p className="text-xs text-neutral-secondary">
                        {otherCategory.subtitle}
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
