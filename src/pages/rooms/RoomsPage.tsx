import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ShieldCheck, Check, ShieldAlert, Car, Users } from 'lucide-react';
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

            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-neutral-300 font-medium">
              <span className="flex items-center gap-1.5 bg-neutral-800/80 px-3 py-1 rounded-full border border-neutral-700">
                <ShieldCheck className="w-3.5 h-3.5 text-feedback-success" />
                AC &amp; Non-AC Categories
              </span>
              <span className="flex items-center gap-1.5 bg-neutral-800/80 px-3 py-1 rounded-full border border-neutral-700">
                <Car className="w-3.5 h-3.5 text-brand" />
                Car Parking Available
              </span>
              <span className="flex items-center gap-1.5 bg-neutral-800/80 px-3 py-1 rounded-full border border-neutral-700">
                <Users className="w-3.5 h-3.5 text-brand" />
                Up to 2 Guests (Base)
              </span>
            </div>
          </div>
        </Container>
      </Section>

      {/* Main Room Categories Section */}
      <Section variant="default" padding="lg">
        <Container size="xl">
          {/* Transparency Disclaimer */}
          <div className="mb-8 p-4 rounded-xl bg-[#F7F7F7] border border-neutral-200/90 shadow-sm flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-feedback-warning shrink-0 mt-0.5" />
            <div className="text-xs text-neutral-secondary leading-relaxed">
              <span className="font-bold text-neutral-dark">Category-Based Accommodation: </span>
              Air Conditioning (AC Rooms) and Non-AC Rooms are official room categories. Pricing and policies shown are demo representations subject to final hotel verification.
            </div>
          </div>

          {/* Room Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
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

          {/* Quick Comparison Summary Table */}
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
                      <td className="p-4 font-semibold text-neutral-dark">Climate Control</td>
                      <td className="p-4 flex items-center gap-1.5 text-feedback-success font-semibold">
                        <Check className="w-4 h-4" /> Individual Air Conditioning
                      </td>
                      <td className="p-4">Ceiling Fan &amp; Natural Airflow</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold text-neutral-dark">Base Occupancy</td>
                      <td className="p-4 font-medium text-neutral-dark">Up to 2 Guests (Included)</td>
                      <td className="p-4 font-medium text-neutral-dark">Up to 2 Guests (Included)</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold text-neutral-dark">Extra Guest Policy</td>
                      <td className="p-4 text-xs">Extra charge for 3rd &amp; 4th guest (Rate TBC)</td>
                      <td className="p-4 text-xs">Standard double occupancy</td>
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
                        <Check className="w-4 h-4" /> Yes (With Hot Water)
                      </td>
                      <td className="p-4 flex items-center gap-1.5 text-feedback-success font-medium">
                        <Check className="w-4 h-4" /> Yes (With Hot Water)
                      </td>
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold text-neutral-dark">Front Desk &amp; Wi-Fi</td>
                      <td className="p-4">24/7 Front Desk &amp; Wi-Fi</td>
                      <td className="p-4">24/7 Front Desk &amp; Wi-Fi</td>
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
                Planning a group or corporate stay?
              </h3>
              <p className="text-xs sm:text-sm text-neutral-secondary">
                Explore our corporate &amp; bulk booking options or connect directly with our front desk team.
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
