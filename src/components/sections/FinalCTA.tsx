import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ShieldCheck, ArrowRight } from 'lucide-react';
import { Container } from '../common/Container';
import { Section } from '../common/Section';
import { Button } from '../common/Button';

export const FinalCTA: React.FC = () => {
  return (
    <Section variant="dark" padding="lg" className="border-t border-neutral-800">
      <Container size="lg">
        <div className="text-center max-w-2xl mx-auto flex flex-col items-center gap-5 sm:gap-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-800 border border-neutral-700 text-xs font-semibold text-neutral-300">
            <ShieldCheck className="w-4 h-4 text-brand" />
            <span>Direct Booking Benefits</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight text-balance">
            Plan Your Stay at <br />
            <span className="text-brand">Manohar Grand</span>
          </h2>

          <p className="text-sm sm:text-base text-neutral-300 leading-relaxed max-w-lg">
            Enjoy comfortable AC &amp; Non-AC rooms with transparent rates and attentive hospitality. Reserve directly for instant booking confirmation.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
            <Link to="/booking">
              <Button variant="primary" size="lg" className="font-bold shadow-lg gap-2 h-12 px-7">
                <CalendarDays className="w-5 h-5" />
                Book Your Stay Now
              </Button>
            </Link>
            <Link to="/rooms">
              <Button
                variant="outline"
                size="lg"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 h-12 font-semibold gap-2"
              >
                View Rooms
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </Section>
  );
};
