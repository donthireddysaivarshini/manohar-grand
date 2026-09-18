import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, BedDouble, ShieldCheck, Check, Phone, ShieldAlert } from 'lucide-react';
import { Container } from '../../components/common/Container';
import { Section } from '../../components/common/Section';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { RoomCategoryCard } from '../../components/rooms/RoomCategoryCard';
import { CONFIRMED_HOTEL_INFO } from '../../data/confirmedInventory';
import { ROOM_CATEGORIES_DATA } from '../../data/roomCategories';

export const RoomsPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Rooms & Accommodations | Manohar Grand Hotel';
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
              Manohar Grand offers 28 comfortable guest rooms across two main categories: Air-Conditioned rooms for climate control and Non-AC rooms for practical, budget-conscious stays.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-neutral-300 font-medium">
              <span className="flex items-center gap-1.5 bg-neutral-800/80 px-3 py-1 rounded-full border border-neutral-700">
                <BedDouble className="w-3.5 h-3.5 text-brand" />
                {CONFIRMED_HOTEL_INFO.totalRooms} Total Rooms
              </span>
              <span className="flex items-center gap-1.5 bg-neutral-800/80 px-3 py-1 rounded-full border border-neutral-700">
                <ShieldCheck className="w-3.5 h-3.5 text-feedback-success" />
                {CONFIRMED_HOTEL_INFO.acRooms} AC Rooms
              </span>
              <span className="flex items-center gap-1.5 bg-neutral-800/80 px-3 py-1 rounded-full border border-neutral-700">
                <ShieldCheck className="w-3.5 h-3.5 text-feedback-success" />
                {CONFIRMED_HOTEL_INFO.nonAcRooms} Non-AC Rooms
              </span>
            </div>
          </div>
        </Container>
      </Section>

      {/* Main Room Categories Section */}
      <Section variant="default" padding="lg">
        <Container size="xl">
          {/* Transparency Disclaimer */}
          <div className="mb-8 p-4 rounded-lg bg-white border border-neutral-border shadow-sm flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-feedback-warning shrink-0 mt-0.5" />
            <div className="text-xs text-neutral-secondary leading-relaxed">
              <span className="font-bold text-neutral-dark">Category-Based Accommodation: </span>
              Inventory counts (20 AC Rooms / 8 Non-AC Rooms) are confirmed hotel specifications. Pricing, dimensions, and bed configurations shown are demo figures subject to official client confirmation.
            </div>
          </div>

          {/* Room Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {ROOM_CATEGORIES_DATA.map((category) => (
              <RoomCategoryCard key={category.id} category={category} />
            ))}
          </div>

          {/* Quick Comparison Summary Table */}
          <div className="mt-14 max-w-4xl mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-dark">
                Quick Category Comparison
              </h2>
              <p className="text-xs text-neutral-secondary mt-1">
                Compare primary specifications side-by-side
              </p>
            </div>

            <Card variant="bordered" className="bg-white overflow-hidden shadow-card">
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
                      <td className="p-4 font-semibold text-neutral-dark">Confirmed Inventory</td>
                      <td className="p-4 font-bold text-brand">20 Rooms</td>
                      <td className="p-4 font-bold text-brand">8 Rooms</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold text-neutral-dark">Climate Control</td>
                      <td className="p-4 flex items-center gap-1.5 text-feedback-success font-medium">
                        <Check className="w-4 h-4" /> Air Conditioned
                      </td>
                      <td className="p-4">Ceiling Fan &amp; Ventilation</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold text-neutral-dark">Capacity (Demo)</td>
                      <td className="p-4">2 Adults + 1 Child</td>
                      <td className="p-4">2 Adults + 1 Child</td>
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
                      <td className="p-4 font-semibold text-neutral-dark">Wi-Fi &amp; Housekeeping</td>
                      <td className="p-4">Included (Demo)</td>
                      <td className="p-4">Included (Demo)</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold text-neutral-dark">Starting Rate (Demo)</td>
                      <td className="p-4 font-bold text-neutral-dark">₹2,500 / night (Demo)</td>
                      <td className="p-4 font-bold text-neutral-dark">₹1,600 / night (Demo)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Bottom Booking & Inquiries Banner */}
          <div className="mt-14 bg-white rounded-card border border-neutral-border p-8 text-center flex flex-col sm:flex-row items-center justify-between gap-6 max-w-4xl mx-auto shadow-card">
            <div className="text-left flex flex-col gap-1">
              <h3 className="text-xl font-bold text-neutral-dark">
                Have specific room preferences?
              </h3>
              <p className="text-xs sm:text-sm text-neutral-secondary">
                Our front desk team is happy to assist with group bookings, extended stays, or general inquiries.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link to="/booking">
                <Button variant="primary" size="md" className="gap-2 font-bold shadow-sm">
                  <CalendarDays className="w-4 h-4" />
                  Check Availability
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="outline" size="md" className="gap-2 font-semibold">
                  <Phone className="w-4 h-4" />
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </Section>
    </div>
  );
};
