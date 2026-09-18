import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ShieldCheck, HeartHandshake, CheckCircle2, BedDouble, Users } from 'lucide-react';
import { Container } from '../../components/common/Container';
import { Section } from '../../components/common/Section';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card, CardContent } from '../../components/common/Card';
import { CONFIRMED_HOTEL_INFO } from '../../data/confirmedInventory';
import { PLACEHOLDER_HOTEL_INFO } from '../../data/placeholderHotelInfo';
import { DEMO_MEDIA } from '../../data/demoMedia';

export const AboutPage: React.FC = () => {
  useEffect(() => {
    document.title = 'About Us | Manohar Grand Hotel';
  }, []);

  return (
    <div className="flex flex-col w-full">
      {/* Page Header */}
      <Section variant="dark" padding="md" className="border-b border-neutral-800">
        <Container size="xl">
          <div className="max-w-2xl flex flex-col items-start gap-3">
            <Badge variant="brand" size="md">
              About Manohar Grand
            </Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
              Hospitality with Care &amp; Comfort
            </h1>
            <p className="text-sm sm:text-base text-neutral-300 leading-relaxed">
              Discover the story behind Manohar Grand — providing welcoming hospitality, comfortable rooms, and dependable service.
            </p>
          </div>
        </Container>
      </Section>

      {/* Main Story & Overview */}
      <Section variant="white" padding="lg">
        <Container size="xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Image Preview */}
            <div className="relative aspect-[4/3] rounded-card overflow-hidden shadow-card border border-neutral-border bg-neutral-100">
              <img
                src={DEMO_MEDIA.welcome.primary}
                alt="Manohar Grand reception lobby (Demo Stock)"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 left-3 bg-neutral-dark/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs font-medium">
                Welcoming guest ambience (Demo Photography)
              </div>
            </div>

            {/* Editorial Content */}
            <div className="flex flex-col items-start gap-5">
              <Badge variant="brand" size="sm">
                Our Philosophy
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-dark tracking-tight leading-snug">
                Dedicated to a Relaxing &amp; Practical Hotel Experience
              </h2>
              <p className="text-sm text-neutral-secondary leading-relaxed">
                {PLACEHOLDER_HOTEL_INFO.placeholderDescription}
              </p>
              <p className="text-sm text-neutral-secondary leading-relaxed">
                Our property is configured to serve solo travelers, business professionals, and visiting families with dependable amenities, clean attached bathrooms, and warm hospitality.
              </p>

              <div className="flex flex-col gap-2.5 pt-2 text-xs text-neutral-dark font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-feedback-success shrink-0" />
                  <span>28 Total Guest Rooms (20 Air-Conditioned, 8 Non-AC Rooms)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-feedback-success shrink-0" />
                  <span>Direct reservation guarantees our most competitive room rates</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-feedback-success shrink-0" />
                  <span>Attentive front desk assistance throughout your stay</span>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* Confirmed Property Profile */}
      <Section variant="default" padding="lg">
        <Container size="xl">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-dark">
              Property Inventory Overview
            </h2>
            <p className="text-xs text-neutral-secondary mt-1">
              Confirmed room breakdown and capacity
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card variant="bordered" className="bg-white p-6 text-center flex flex-col items-center gap-2">
              <BedDouble className="w-8 h-8 text-brand mb-1" />
              <span className="text-3xl font-black text-neutral-dark">{CONFIRMED_HOTEL_INFO.totalRooms}</span>
              <span className="text-sm font-bold text-neutral-dark">Total Rooms</span>
              <span className="text-xs text-neutral-secondary">Full hotel inventory</span>
            </Card>

            <Card variant="bordered" className="bg-white p-6 text-center flex flex-col items-center gap-2">
              <ShieldCheck className="w-8 h-8 text-brand mb-1" />
              <span className="text-3xl font-black text-neutral-dark">{CONFIRMED_HOTEL_INFO.acRooms}</span>
              <span className="text-sm font-bold text-neutral-dark">AC Rooms</span>
              <span className="text-xs text-neutral-secondary">Air-conditioned comfort</span>
            </Card>

            <Card variant="bordered" className="bg-white p-6 text-center flex flex-col items-center gap-2">
              <Users className="w-8 h-8 text-brand mb-1" />
              <span className="text-3xl font-black text-neutral-dark">{CONFIRMED_HOTEL_INFO.nonAcRooms}</span>
              <span className="text-sm font-bold text-neutral-dark">Non-AC Rooms</span>
              <span className="text-xs text-neutral-secondary">Practical &amp; ventilated</span>
            </Card>
          </div>
        </Container>
      </Section>

      {/* Hospitality Values */}
      <Section variant="white" padding="lg">
        <Container size="xl">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge variant="brand" size="md">
              Hospitality Values
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-dark mt-2">
              Our Commitment to You
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card variant="default" className="bg-neutral-light p-6">
              <CardContent className="p-0 flex flex-col gap-3">
                <div className="w-10 h-10 rounded-lg bg-white border border-neutral-border flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-brand" />
                </div>
                <h3 className="text-base font-bold text-neutral-dark">Integrity &amp; Transparency</h3>
                <p className="text-xs sm:text-sm text-neutral-secondary leading-relaxed">
                  Clear rates, no surprise booking add-ons, and honest guest policies on every reservation.
                </p>
              </CardContent>
            </Card>

            <Card variant="default" className="bg-neutral-light p-6">
              <CardContent className="p-0 flex flex-col gap-3">
                <div className="w-10 h-10 rounded-lg bg-white border border-neutral-border flex items-center justify-center">
                  <BedDouble className="w-5 h-5 text-brand" />
                </div>
                <h3 className="text-base font-bold text-neutral-dark">Hygiene &amp; Comfort</h3>
                <p className="text-xs sm:text-sm text-neutral-secondary leading-relaxed">
                  Regular sanitization, fresh bedding, and well-maintained private attached bathrooms.
                </p>
              </CardContent>
            </Card>

            <Card variant="default" className="bg-neutral-light p-6">
              <CardContent className="p-0 flex flex-col gap-3">
                <div className="w-10 h-10 rounded-lg bg-white border border-neutral-border flex items-center justify-center">
                  <HeartHandshake className="w-5 h-5 text-brand" />
                </div>
                <h3 className="text-base font-bold text-neutral-dark">Warm Guest Service</h3>
                <p className="text-xs sm:text-sm text-neutral-secondary leading-relaxed">
                  Friendly reception staff ready to assist with your check-in, questions, and transit needs.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12 text-center">
            <Link to="/booking">
              <Button variant="primary" size="lg" className="gap-2 font-bold shadow-md">
                <CalendarDays className="w-5 h-5" />
                Reserve Your Stay at Manohar Grand
              </Button>
            </Link>
          </div>
        </Container>
      </Section>
    </div>
  );
};
