import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { BottomNav } from '../components/layout/BottomNav';
import { Footer } from '../components/layout/Footer';

export const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-light text-neutral-text antialiased pb-20 lg:pb-0">
      <Navbar />
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
};
