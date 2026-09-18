import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';

// Layouts
import { MainLayout } from '../layouts/MainLayout';
import { BookingLayout } from '../layouts/BookingLayout';
import { AccountLayout } from '../layouts/AccountLayout';

// Pages
import { HomePage } from '../pages/home/HomePage';
import { RoomsPage } from '../pages/rooms/RoomsPage';
import { RoomDetailsPage } from '../pages/rooms/RoomDetailsPage';
import { AboutPage } from '../pages/about/AboutPage';
import { AmenitiesPage } from '../pages/amenities/AmenitiesPage';
import { GalleryPage } from '../pages/gallery/GalleryPage';
import { ContactPage } from '../pages/contact/ContactPage';
import { BookingPage } from '../pages/booking/BookingPage';
import { CheckoutPage } from '../pages/checkout/CheckoutPage';
import { PaymentDemoPage } from '../pages/payment-demo/PaymentDemoPage';
import { ConfirmationPage } from '../pages/confirmation/ConfirmationPage';
import { LoginPage } from '../pages/account/LoginPage';
import { RegisterPage } from '../pages/account/RegisterPage';
import { DashboardPage } from '../pages/account/DashboardPage';
import { MyBookingsPage } from '../pages/account/MyBookingsPage';
import { BookingDetailPage } from '../pages/account/BookingDetailPage';
import { ProfilePage } from '../pages/account/ProfilePage';
import { NotFoundPage } from '../pages/NotFound';

// Scroll restoration helper
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

export const AppRoutes: React.FC = () => {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Main Public Website Layout */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/rooms" element={<RoomsPage />} />
          <Route path="/rooms/:slug" element={<RoomDetailsPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/amenities" element={<AmenitiesPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/booking" element={<BookingPage />} />
          <Route path="/account/login" element={<LoginPage />} />
          <Route path="/account/register" element={<RegisterPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Focused Booking & Checkout Layout */}
        <Route element={<BookingLayout />}>
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/payment-demo" element={<PaymentDemoPage />} />
          <Route path="/booking/confirmation/:id" element={<ConfirmationPage />} />
        </Route>

        {/* Customer Account Dashboard Layout */}
        <Route path="/account" element={<AccountLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="bookings" element={<MyBookingsPage />} />
          <Route path="bookings/:id" element={<BookingDetailPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Routes>
    </>
  );
};
