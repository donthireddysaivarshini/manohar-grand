import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { BottomNav } from '../components/layout/BottomNav';
import { Footer } from '../components/layout/Footer';
import { MobileNav } from '../components/layout/MobileNav';
import { FloatingContactWidget } from '../components/common/FloatingContactWidget';
import { ScrollToTopButton } from '../components/common/ScrollToTopButton';

export const MainLayout: React.FC = () => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-neutral-light text-neutral-text antialiased pb-20 md:pb-0">
      <Navbar />
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
      <Footer />
      <BottomNav
        onOpenMenu={() => setIsMobileNavOpen(true)}
        isMenuOpen={isMobileNavOpen}
      />
      <MobileNav
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
      />
      {/* Persistent Floating Contact Us Widget & Scroll to Top */}
      <FloatingContactWidget />
      <ScrollToTopButton />
    </div>
  );
};
