import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { Container } from '../components/common/Container';
import { Logo } from '../components/common/Logo';

export const BookingLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-light text-neutral-text antialiased">
      {/* Streamlined Checkout Header */}
      <header className="bg-white border-b border-neutral-border sticky top-0 z-30">
        <Container size="xl">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 group">
              <Logo size="sm" />
            </Link>

            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-secondary">
              <ShieldCheck className="w-4 h-4 text-feedback-success" />
              <span>Secure Direct Reservation</span>
            </div>

            <Link
              to="/rooms"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-secondary hover:text-neutral-text transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Rooms
            </Link>
          </div>
        </Container>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col py-8">
        <Outlet />
      </main>

      {/* Minimal Footer */}
      <footer className="bg-white border-t border-neutral-border py-4 text-center text-xs text-neutral-secondary">
        <Container size="xl">
          <p>&copy; {new Date().getFullYear()} Manohar Grand. Demo Booking Experience.</p>
        </Container>
      </footer>
    </div>
  );
};
