import React, { useState, useEffect } from 'react';
import {
  Phone,
  CheckCircle2,
  ShieldCheck,
  Send,
  Briefcase,
} from 'lucide-react';
import { Container } from '../../components/common/Container';
import { Section } from '../../components/common/Section';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card, CardContent } from '../../components/common/Card';
import { Icon3D } from '../../components/common/Icon3D';
import { ScrollReveal } from '../../components/common/ScrollReveal';

export const CorporateBookingPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Corporate & Bulk Booking | Manohar Grand';
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    checkIn: '',
    checkOut: '',
    roomsRequired: '5',
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Frontend simulation only
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 600);
  };

  const perks = [
    {
      icon: 'corporate' as const,
      title: 'Corporate Stays',
      description:
        'Tailored lodging solutions for business professionals, delegates, and project teams visiting Kukatpally / HITEC City.',
    },
    {
      icon: 'comfortable-stay' as const,
      title: 'Group Accommodation',
      description:
        'Seamless group check-ins for family functions, conferences, and event attendees with dedicated coordination.',
    },
    {
      icon: 'easy-booking' as const,
      title: 'Bulk Room Inquiries',
      description:
        'Flexible room allocation across AC and Non-AC categories to suit team budgets and preferences.',
    },
    {
      icon: 'connectivity' as const,
      title: 'Extended Stays',
      description:
        'Specialized terms and comfortable amenities for multi-day and weekly residential bookings.',
    },
  ];

  return (
    <div className="flex flex-col w-full">
      {/* Page Header Banner */}
      <section className="bg-neutral-dark text-white py-12 lg:py-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#FE0000_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <Container size="xl" className="relative z-10">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto gap-3">
            <Badge variant="brand" size="sm" className="font-bold">
              Business &amp; Group Hospitality
            </Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
              Corporate / Bulk Booking
            </h1>
            <p className="text-sm sm:text-base text-neutral-300 leading-relaxed max-w-2xl">
              Comfortable, reliable lodging with prime metro connectivity for corporate teams, group travelers, and extended event stays in Kukatpally.
            </p>
          </div>
        </Container>
      </section>

      {/* Prominent Callout Banner */}
      <section className="bg-neutral-100 border-y border-neutral-200 py-6">
        <Container size="xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-neutral-200 shadow-xs">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center shrink-0">
                <Briefcase className="w-6 h-6 text-brand" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold uppercase tracking-wider text-brand">
                  Exclusive Privilege
                </span>
                <h2 className="text-lg sm:text-xl font-extrabold text-neutral-dark">
                  Special Rates for Bulk Bookings
                </h2>
                <p className="text-xs sm:text-sm text-neutral-secondary">
                  Contact our receptionist for the best available rates.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <a
                href="tel:7997044999"
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-brand text-white font-bold text-xs hover:bg-brand-hover transition-colors shadow-sm"
              >
                <Phone className="w-4 h-4" />
                <span>Call Reception: 7997044999</span>
              </a>
            </div>
          </div>
        </Container>
      </section>

      {/* Main Content & Inquiry Form */}
      <Section variant="default" padding="lg">
        <Container size="xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Left Column: Offerings & Benefits (7 Cols) */}
            <div className="lg:col-span-7 flex flex-col gap-8">
              <ScrollReveal>
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand">
                    Tailored Hospitality
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-dark tracking-tight">
                    Customized Group &amp; Corporate Stays
                  </h2>
                  <p className="text-sm text-neutral-secondary leading-relaxed">
                    Whether you are coordinating team travel for IT assignments near HITEC City, organizing family wedding accommodations, or planning long-term project stays, Manohar Grand provides dependable hospitality right by the JNTU Metro corridor.
                  </p>
                </div>
              </ScrollReveal>

              {/* 4 Offering Cards in 2x2 Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {perks.map((perk, idx) => (
                  <ScrollReveal key={idx} delay={idx * 80}>
                    <div className="p-5 rounded-2xl bg-neutral-light/70 border border-neutral-border hover:border-neutral-300 hover:bg-white transition-all shadow-xs flex flex-col gap-3.5 h-full">
                      <div className="flex items-center gap-3">
                        <Icon3D name={perk.icon} size="md" />
                        <h3 className="text-sm font-bold text-neutral-dark">
                          {perk.title}
                        </h3>
                      </div>
                      <p className="text-xs text-neutral-secondary leading-relaxed">
                        {perk.description}
                      </p>
                    </div>
                  </ScrollReveal>
                ))}
              </div>

              {/* Quick Info Box */}
              <ScrollReveal>
                <div className="p-5 rounded-2xl bg-white border border-neutral-200 flex flex-col gap-3 shadow-xs">
                  <h3 className="text-sm font-bold text-neutral-dark flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-feedback-success" />
                    Why Book Bulk Stays Directly With Us?
                  </h3>
                  <ul className="text-xs text-neutral-secondary space-y-2 leading-relaxed">
                    <li className="flex items-start gap-2">
                      <span className="text-brand font-bold">•</span>
                      <span><strong>Direct Reception Coordination:</strong> Personalized room assignment and flexible check-in schedules.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand font-bold">•</span>
                      <span><strong>Prime Metro Connectivity:</strong> Walkable distance from JNTU Metro Station for effortless commuting.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand font-bold">•</span>
                      <span><strong>Car Parking &amp; 24/7 Power:</strong> On-premise parking and reliable power backup for uninterrupted comfort.</span>
                    </li>
                  </ul>
                </div>
              </ScrollReveal>
            </div>

            {/* Right Column: Inquiry Form (5 Cols) */}
            <div className="lg:col-span-5">
              <ScrollReveal delay={150}>
                <Card variant="elevated" className="bg-white p-6 sm:p-8 border-neutral-border shadow-elevated">
                  <CardContent className="p-0 flex flex-col gap-5">
                    <div className="flex flex-col gap-1 pb-3 border-b border-neutral-border">
                      <Badge variant="brand" size="sm" className="w-fit font-bold">
                        Inquiry Form
                      </Badge>
                      <h2 className="text-xl font-bold text-neutral-dark mt-1">
                        Request Bulk Booking Quote
                      </h2>
                      <p className="text-xs text-neutral-secondary">
                        Submit your requirements and our reception will assist with custom pricing.
                      </p>
                    </div>

                    {submitted ? (
                      <div className="p-6 rounded-xl bg-green-50 border border-green-200 text-center flex flex-col items-center gap-3">
                        <CheckCircle2 className="w-10 h-10 text-feedback-success" />
                        <h3 className="text-base font-bold text-neutral-dark">
                          Inquiry Received
                        </h3>
                        <p className="text-xs text-neutral-secondary leading-relaxed">
                          Thank you for reaching out! Our front desk team will contact you shortly with the best available bulk rates.
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSubmitted(false);
                            setFormData({
                              name: '',
                              company: '',
                              email: '',
                              phone: '',
                              checkIn: '',
                              checkOut: '',
                              roomsRequired: '5',
                              message: '',
                            });
                          }}
                          className="mt-2 text-xs"
                        >
                          Submit Another Inquiry
                        </Button>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-neutral-dark">
                            Contact Name <span className="text-brand">*</span>
                          </label>
                          <input
                            type="text"
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter your full name"
                            className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-neutral-dark">
                            Company / Organization Name
                          </label>
                          <input
                            type="text"
                            name="company"
                            value={formData.company}
                            onChange={handleChange}
                            placeholder="e.g., ABC Tech / Family Group"
                            className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-neutral-dark">
                              Phone Number <span className="text-brand">*</span>
                            </label>
                            <input
                              type="tel"
                              name="phone"
                              required
                              value={formData.phone}
                              onChange={handleChange}
                              placeholder="+91 98765 43210"
                              className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                            />
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-neutral-dark">
                              Email Address
                            </label>
                            <input
                              type="email"
                              name="email"
                              value={formData.email}
                              onChange={handleChange}
                              placeholder="name@company.com"
                              className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-neutral-dark">
                              Check-In Date <span className="text-brand">*</span>
                            </label>
                            <input
                              type="date"
                              name="checkIn"
                              required
                              value={formData.checkIn}
                              onChange={handleChange}
                              className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                            />
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-neutral-dark">
                              Check-Out Date <span className="text-brand">*</span>
                            </label>
                            <input
                              type="date"
                              name="checkOut"
                              required
                              value={formData.checkOut}
                              onChange={handleChange}
                              className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-neutral-dark">
                            Rooms Required <span className="text-brand">*</span>
                          </label>
                          <select
                            name="roomsRequired"
                            value={formData.roomsRequired}
                            onChange={handleChange}
                            className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-white"
                          >
                            <option value="3">3 - 5 Rooms</option>
                            <option value="6">6 - 10 Rooms</option>
                            <option value="11">11 - 15 Rooms</option>
                            <option value="16">16+ Rooms (Full Block)</option>
                          </select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-neutral-dark">
                            Message / Specific Requirements
                          </label>
                          <textarea
                            name="message"
                            rows={3}
                            value={formData.message}
                            onChange={handleChange}
                            placeholder="Tell us about AC/Non-AC split, special timings, or guest requirements..."
                            className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand resize-none"
                          />
                        </div>

                        <Button
                          type="submit"
                          variant="primary"
                          size="lg"
                          disabled={isSubmitting}
                          className="w-full gap-2 font-bold shadow-sm mt-1"
                        >
                          <Send className="w-4 h-4" />
                          <span>{isSubmitting ? 'Sending Request...' : 'Send Bulk Inquiry'}</span>
                        </Button>

                        <p className="text-[11px] text-neutral-400 text-center">
                          Demo inquiry simulation — for immediate assistance, call 7997044999 / 7997022999.
                        </p>
                      </form>
                    )}
                  </CardContent>
                </Card>
              </ScrollReveal>
            </div>
          </div>
        </Container>
      </Section>
    </div>
  );
};
