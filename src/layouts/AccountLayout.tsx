import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Container } from '../components/common/Container';

export const AccountLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-light text-neutral-text antialiased">
      <Navbar />
      <main className="flex-1 py-10">
        <Container size="xl">
          <Outlet />
        </Container>
      </main>
      <Footer />
    </div>
  );
};
