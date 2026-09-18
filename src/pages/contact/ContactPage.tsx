import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Container } from '../../components/common/Container';
import { Section } from '../../components/common/Section';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Card, CardContent } from '../../components/common/Card';
import { PLACEHOLDER_HOTEL_INFO } from '../../data/placeholderHotelInfo';

export const ContactPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Contact & Location | Manohar Grand Hotel';
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Please enter your name';
    if (!formData.email.trim()) newErrors.email = 'Please enter your email';
    if (!formData.message.trim()) newErrors.message = 'Please enter your message or question';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitted(true);
  };

  return (
    <div className="flex flex-col w-full">
      {/* Page Header */}
      <Section variant="dark" padding="md" className="border-b border-neutral-800">
        <Container size="xl">
          <div className="max-w-2xl flex flex-col items-start gap-3">
            <Badge variant="brand" size="md">
              Inquiries &amp; Assistance
            </Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
              Contact &amp; Location
            </h1>
            <p className="text-sm sm:text-base text-neutral-300 leading-relaxed">
              Have questions about room availability or your upcoming stay? Reach out to our front desk team.
            </p>
          </div>
        </Container>
      </Section>

      {/* Main Contact Section */}
      <Section variant="default" padding="lg">
        <Container size="xl">
          {/* Transparency Disclaimer */}
          <div className="mb-8 p-4 rounded-lg bg-white border border-neutral-border shadow-sm flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-feedback-warning shrink-0 mt-0.5" />
            <div className="text-xs text-neutral-secondary">
              <span className="font-bold text-neutral-dark">Placeholder Notice: </span>
              Physical address, direct telephone, and map coordinates will be populated upon client confirmation. The form below provides a frontend demonstration.
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Contact Information Cards (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <Card variant="bordered" className="bg-white p-6">
                <CardContent className="p-0 flex flex-col gap-5">
                  <a
                    href={PLACEHOLDER_HOTEL_INFO.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3.5 group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-neutral-light border border-neutral-border flex items-center justify-center shrink-0 group-hover:bg-brand-subtle group-hover:border-brand/30 transition-colors">
                      <MapPin className="w-5 h-5 text-brand" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-neutral-dark group-hover:text-brand transition-colors">
                          Hotel Location
                        </h3>
                        <span className="text-[11px] text-brand font-semibold underline">
                          Open Map &rarr;
                        </span>
                      </div>
                      <p className="text-xs text-neutral-secondary mt-1 leading-relaxed">
                        {PLACEHOLDER_HOTEL_INFO.placeholderAddress}
                      </p>
                    </div>
                  </a>

                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-lg bg-neutral-light border border-neutral-border flex items-center justify-center shrink-0">
                      <Phone className="w-5 h-5 text-brand" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-neutral-dark">Direct Telephone</h3>
                      <p className="text-xs text-neutral-secondary mt-1">
                        {PLACEHOLDER_HOTEL_INFO.placeholderPhone}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-lg bg-neutral-light border border-neutral-border flex items-center justify-center shrink-0">
                      <Mail className="w-5 h-5 text-brand" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-neutral-dark">Email Inquiries</h3>
                      <p className="text-xs text-neutral-secondary mt-1">
                        {PLACEHOLDER_HOTEL_INFO.placeholderEmail}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5 pt-2 border-t border-neutral-border/60">
                    <div className="w-10 h-10 rounded-lg bg-neutral-light border border-neutral-border flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-brand" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-neutral-dark">Check-in / Check-out</h3>
                      <p className="text-xs text-neutral-secondary mt-1">
                        {PLACEHOLDER_HOTEL_INFO.placeholderCheckInTime}
                      </p>
                      <p className="text-xs text-neutral-secondary">
                        {PLACEHOLDER_HOTEL_INFO.placeholderCheckOutTime}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Live Interactive Google Maps Container */}
              <div className="relative aspect-[16/11] rounded-card overflow-hidden bg-neutral-100 border border-neutral-border shadow-sm">
                <iframe
                  src={PLACEHOLDER_HOTEL_INFO.googleMapsEmbedUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  title="Manohar Grand Luxury Hotel Rooms Location"
                  className="w-full h-full"
                />
              </div>

              <a
                href={PLACEHOLDER_HOTEL_INFO.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full"
              >
                <Button variant="outline" size="md" className="w-full gap-2 font-semibold">
                  <MapPin className="w-4 h-4 text-brand" />
                  Get Turn-by-Turn Directions on Google Maps
                </Button>
              </a>
            </div>

            {/* Right: Inquiry Form (7 cols) */}
            <div className="lg:col-span-7">
              <Card variant="default" className="bg-white p-6 sm:p-8 shadow-card">
                <CardContent className="p-0">
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-neutral-dark">
                      Send a Message to Manohar Grand
                    </h2>
                    <p className="text-xs sm:text-sm text-neutral-secondary mt-1">
                      Fill out the form below and our reception staff will get back to you promptly.
                    </p>
                  </div>

                  {isSubmitted ? (
                    <div className="p-6 rounded-lg bg-green-50 border border-green-200 text-center flex flex-col items-center gap-3 animate-in fade-in duration-300">
                      <div className="w-12 h-12 rounded-full bg-green-100 text-feedback-success flex items-center justify-center">
                        <CheckCircle2 className="w-7 h-7" />
                      </div>
                      <h3 className="text-base font-bold text-neutral-dark">
                        Demo Inquiry Received!
                      </h3>
                      <p className="text-xs text-neutral-secondary max-w-sm">
                        Thank you for reaching out. In this frontend prototype, your submission has been processed locally without external backend APIs.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsSubmitted(false);
                          setFormData({ name: '', email: '', phone: '', message: '' });
                        }}
                        className="mt-2 text-xs"
                      >
                        Send Another Message
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                      <Input
                        label="Full Name *"
                        placeholder="Enter your full name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        error={errors.name}
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                          label="Email Address *"
                          type="email"
                          placeholder="name@example.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          error={errors.email}
                        />

                        <Input
                          label="Phone Number"
                          type="tel"
                          placeholder="+91 98765 43210"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          helperText="Optional for callback"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold tracking-wide text-neutral-text uppercase select-none">
                          Your Message / Inquiry *
                        </label>
                        <textarea
                          rows={4}
                          placeholder="How can we assist you with your stay?"
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          className={`w-full px-3.5 py-2.5 rounded-lg text-sm bg-white border ${
                            errors.message ? 'border-feedback-error' : 'border-neutral-border'
                          } text-neutral-text focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand placeholder:text-neutral-muted transition-all`}
                        />
                        {errors.message && (
                          <span className="text-xs text-feedback-error font-medium">
                            {errors.message}
                          </span>
                        )}
                      </div>

                      <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        className="gap-2 font-bold shadow-md self-start mt-2"
                      >
                        <Send className="w-4 h-4" />
                        Send Inquiry
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </Container>
      </Section>
    </div>
  );
};
