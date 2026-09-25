import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  ShieldCheck,
  Check,
  ShieldAlert,
  Car,
  Users,
  Tv,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { Container } from '../../components/common/Container';
import { Section } from '../../components/common/Section';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { ScrollReveal } from '../../components/common/ScrollReveal';
import { RoomCategoryCard } from '../../components/rooms/RoomCategoryCard';
import { ROOM_CATEGORIES_DATA } from '../../data/roomCategories';

export const RoomsPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Rooms & Accommodations | Manohar Grand';
  }, []);

  return (
    <div className="flex flex-col w-full">
      {/* Page Header */}
      <Section variant="dark" padding="md" className="border-b border-neutral-800">
        <Container size="xl">
          <div className="max-w-2xl flex flex-col items-start gap-3">
            <Badge variant="brand" size="md">
              Accommodations
            </Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
              Our Room Categories
            </h1>
            <p className="text-sm sm:text-base text-neutral-300 leading-relaxed">
              Manohar Grand offers clean, comfortable guest rooms across two main categories: Air-Conditioned rooms for climate-controlled comfort and Non-AC rooms for practical, budget-conscious stays in Kukatpally.
            </p>

            <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs text-neutral-300 font-medium">
              <span className="flex items-center gap-1.5 bg-neutral-800/80 px-3 py-1 rounded-full border border-neutral-700">
                <Sparkles className="w-3.5 h-3.5 text-brand" />
                WAKEFIT Mattresses in All Rooms
              </span>
              <span className="flex items-center gap-1.5 bg-neutral-800/80 px-3 py-1 rounded-full border border-neutral-700">
                <Tv className="w-3.5 h-3.5 text-brand" />
                32" Smart TV with OTT Apps
              </span>
              <span className="flex items-center gap-1.5 bg-neutral-800/80 px-3 py-1 rounded-full border border-neutral-700">
                <Car className="w-3.5 h-3.5 text-brand" />
                Car Parking Available
              </span>
            </div>
          </div>
        </Container>
      </Section>

      {/* Main Room Categories Section */}
      <Section variant="default" padding="lg">
        <Container size="xl" className="px-3 xs:px-4 sm:px-6 md:px-8">
          {/* Important Booking & ID Conditions Banner */}
          <div className="mb-8 p-4.5 rounded-2xl bg-amber-50/90 border border-amber-200/90 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldAlert className="w-5 h-5 text-amber-700" />
              </div>
              <div className="flex flex-col gap-0.5 text-xs text-amber-900">
                <span className="font-bold text-sm text-neutral-dark">
                  Mandatory Check-In Conditions &amp; Guest Policy
                </span>
                <p className="text-[12px] text-neutral-700 leading-relaxed">
                  <strong>Aadhar Card is mandatory for every person</strong> at check-in • Primary guest must be <strong>18+ years of age</strong> • Cancellations 2+ days prior receive a <strong>50% refund</strong> (Same-day: non-refundable).
                </p>
              </div>
            </div>

            <Link to="/booking" className="shrink-0 w-full md:w-auto">
              <Button variant="primary" size="sm" className="w-full md:w-auto font-bold h-9 text-xs">
                Check Availability
              </Button>
            </Link>
          </div>

          {/* Room Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto">
            {ROOM_CATEGORIES_DATA.map((category, index) => (
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

          {/* Room Conditions & Stay Guidelines Cards */}
          <ScrollReveal direction="up" className="mt-12 sm:mt-16 max-w-5xl mx-auto">
            <div className="text-center mb-8 flex flex-col items-center gap-1.5">
              <Badge variant="brand" size="sm" className="font-bold">
                Stay Rules &amp; Policies
              </Badge>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-neutral-dark">
                Important Room &amp; Reservation Conditions
              </h2>
              <p className="text-xs sm:text-sm text-neutral-secondary max-w-lg">
                Please review our official guest identification, cancellation, and bedding standards before booking.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. Mandatory Aadhar Card */}
              <Card variant="bordered" className="bg-white p-5 rounded-2xl border-neutral-200 shadow-xs flex flex-col gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-brand flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-neutral-dark">
                  Aadhar Card Mandatory
                </h3>
                <p className="text-[11px] sm:text-xs text-neutral-600 leading-relaxed">
                  Original physical Aadhar Card (or valid Govt. Photo ID) is mandatory for each and every staying guest upon check-in.
                </p>
              </Card>

              {/* 2. Age Requirement 18+ */}
              <Card variant="bordered" className="bg-white p-5 rounded-2xl border-neutral-200 shadow-xs flex flex-col gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-neutral-dark">
                  Age Limit (18+ Years)
                </h3>
                <p className="text-[11px] sm:text-xs text-neutral-600 leading-relaxed">
                  The primary guest making the reservation and checking in must be 18 years of age or older with valid proof of age.
                </p>
              </Card>

              {/* 3. Cancellation & Refund Policy */}
              <Card variant="bordered" className="bg-white p-5 rounded-2xl border-neutral-200 shadow-xs flex flex-col gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-neutral-dark">
                  Cancellation &amp; Refund
                </h3>
                <p className="text-[11px] sm:text-xs text-neutral-600 leading-relaxed">
                  Cancel 2+ days before check-in for a <strong>50% refund</strong>. Same-day cancellations or within 48 hours are <strong>non-refundable (0% refund)</strong>.
                </p>
              </Card>

              {/* 4. Wakefit & Smart TV Inclusions */}
              <Card variant="bordered" className="bg-white p-5 rounded-2xl border-neutral-200 shadow-xs flex flex-col gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-neutral-dark">
                  Wakefit &amp; 32" Smart TV
                </h3>
                <p className="text-[11px] sm:text-xs text-neutral-600 leading-relaxed">
                  WAKEFIT Memory Foam mattresses in all bedrooms. 32" Smart TV with OTT apps (subscription not included / user login supported).
                </p>
              </Card>
            </div>
          </ScrollReveal>

          {/* Quick Category Comparison Summary Table */}
          <ScrollReveal direction="up" className="mt-14 max-w-4xl mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-dark">
                Quick Category Comparison
              </h2>
              <p className="text-xs text-neutral-secondary mt-1">
                Compare primary specifications side-by-side
              </p>
            </div>

            <Card variant="bordered" className="bg-white overflow-hidden shadow-card border-neutral-200/90 rounded-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-neutral-light border-b border-neutral-border text-neutral-dark font-bold">
                    <tr>
                      <th className="p-4">Feature / Specification</th>
                      <th className="p-4">AC Room</th>
                      <th className="p-4">Non-AC Room</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-border text-neutral-secondary">
                    <tr>
                      <td className="p-4 font-semibold text-neutral-dark">Bedding &amp; Mattress</td>
                      <td className="p-4 font-bold text-brand flex items-center gap-1.5">
                        <Check className="w-4 h-4 text-feedback-success shrink-0" />
                        <span>WAKEFIT Memory Foam Mattress</span>
                      </td>
                      <td className="p-4 font-bold text-brand">
                        WAKEFIT Memory Foam Mattress
                      </td>
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold text-neutral-dark">Smart TV &amp; Entertainment</td>
                      <td className="p-4 flex items-center gap-1.5 text-neutral-dark font-medium">
                        <Check className="w-4 h-4 text-feedback-success shrink-0" />
                        <span>32" Smart TV (OTT Apps included, sub not included)</span>
                      </td>
                      <td className="p-4 text-neutral-dark font-medium">
                        32" Smart TV (OTT Apps included, sub not included)
                      </td>
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold text-neutral-dark">Climate Control</td>
                      <td className="p-4 flex items-center gap-1.5 text-feedback-success font-semibold">
                        <Check className="w-4 h-4 shrink-0" /> Individual Air Conditioning
                      </td>
                      <td className="p-4">Ceiling Fan &amp; Natural Airflow</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold text-neutral-dark">Base Occupancy</td>
                      <td className="p-4 font-medium text-neutral-dark">Up to 2 Guests (Included)</td>
                      <td className="p-4 font-medium text-neutral-dark">Up to 2 Guests (Included)</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold text-neutral-dark">Mandatory ID &amp; Age</td>
                      <td className="p-4 text-xs font-semibold text-neutral-900">
                        Aadhar Card Mandatory (18+ Primary Guest)
                      </td>
                      <td className="p-4 text-xs font-semibold text-neutral-900">
                        Aadhar Card Mandatory (18+ Primary Guest)
                      </td>
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold text-neutral-dark">Cancellation Policy</td>
                      <td className="p-4 text-xs">
                        50% refund 2+ days prior • 0% same-day
                      </td>
                      <td className="p-4 text-xs">
                        50% refund 2+ days prior • 0% same-day
                      </td>
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold text-neutral-dark">Car Parking</td>
                      <td className="p-4 flex items-center gap-1.5 text-feedback-success font-medium">
                        <Check className="w-4 h-4" /> Available on property
                      </td>
                      <td className="p-4 flex items-center gap-1.5 text-feedback-success font-medium">
                        <Check className="w-4 h-4" /> Available on property
                      </td>
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold text-neutral-dark">Attached Private Bathroom</td>
                      <td className="p-4 flex items-center gap-1.5 text-feedback-success font-medium">
                        <Check className="w-4 h-4" /> 24/7 Hot &amp; Cold Water
                      </td>
                      <td className="p-4 flex items-center gap-1.5 text-feedback-success font-medium">
                        <Check className="w-4 h-4" /> 24/7 Hot &amp; Cold Water
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          </ScrollReveal>

          {/* Bottom Booking & Inquiries Banner */}
          <ScrollReveal direction="up" className="mt-12 bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 text-center flex flex-col sm:flex-row items-center justify-between gap-6 max-w-4xl mx-auto shadow-card">
            <div className="text-left flex flex-col gap-1">
              <h3 className="text-lg sm:text-xl font-bold text-neutral-dark">
                Planning a stay or corporate booking?
              </h3>
              <p className="text-xs sm:text-sm text-neutral-secondary">
                Book online instantly or connect directly with our 24/7 front desk team.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link to="/corporate-booking">
                <Button variant="outline" size="md" className="gap-2 font-semibold">
                  Corporate Inquiries
                </Button>
              </Link>
              <Link to="/booking">
                <Button variant="primary" size="md" className="gap-2 font-bold shadow-sm">
                  <CalendarDays className="w-4 h-4" />
                  Book Now
                </Button>
              </Link>
            </div>
          </ScrollReveal>
        </Container>
      </Section>
    </div>
  );
};
