import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Container } from '../components/common/Container';
import { useAuth } from '../store/AuthContext';
import { LayoutDashboard, BookOpen, User, LogOut, Loader2, Lock } from 'lucide-react';
import { Button } from '../components/common/Button';
import { cn } from '../utils/cn';

export const AccountLayout: React.FC = () => {
  const { user, isAuthenticated, isLoading, logout, openAuthModal } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-neutral-light text-neutral-text antialiased">
        <Navbar />
        <main className="flex-1 py-16 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-brand animate-spin" />
            <span className="text-xs text-neutral-secondary">Loading account session...</span>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex flex-col bg-neutral-light text-neutral-text antialiased">
        <Navbar />
        <main className="flex-1 py-16 flex items-center justify-center">
          <Container size="sm">
            <div className="bg-white p-8 rounded-2xl border border-neutral-border shadow-sm text-center flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-50 text-brand flex items-center justify-center">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-extrabold text-neutral-dark">Sign In Required</h2>
              <p className="text-xs text-neutral-secondary max-w-sm">
                Please sign in to view your reservations, booking vouchers, and account activity.
              </p>
              <Button
                variant="primary"
                size="md"
                onClick={() => openAuthModal('login')}
                className="gap-2 font-bold mt-2"
              >
                <span>Sign In to Account</span>
              </Button>
            </div>
          </Container>
        </main>
        <Footer />
      </div>
    );
  }

  const displayName = user.full_name || user.first_name || user.email.split('@')[0];
  const userInitial = displayName.charAt(0).toUpperCase();

  const tabs = [
    { label: 'Activity Dashboard', href: '/account/dashboard', icon: LayoutDashboard },
    { label: 'My Bookings', href: '/account/bookings', icon: BookOpen },
    { label: 'Profile Details', href: '/account/profile', icon: User },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-neutral-light text-neutral-text antialiased">
      <Navbar />

      {/* Account Hero Bar */}
      <div className="bg-neutral-dark text-white border-b border-neutral-800 pt-6 pb-0">
        <Container size="xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-brand text-white flex items-center justify-center text-lg font-black shadow-md shrink-0">
                {userInitial}
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-white">{displayName}</h2>
                <p className="text-xs text-neutral-400">{user.email}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              type="button"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-neutral-800/80 border border-neutral-700/80 text-xs font-semibold text-neutral-300 hover:text-red-400 hover:border-red-900/60 transition-colors w-fit cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>

          {/* Account Sub-Navigation Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar border-t border-neutral-800/80 pt-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <NavLink
                  key={tab.href}
                  to={tab.href}
                  className={({ isActive }) =>
                    cn(
                      'inline-flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap',
                      isActive
                        ? 'border-brand text-brand'
                        : 'border-transparent text-neutral-400 hover:text-neutral-200'
                    )
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </NavLink>
              );
            })}
          </div>
        </Container>
      </div>

      <main className="flex-1 py-8 sm:py-10">
        <Container size="xl">
          <Outlet />
        </Container>
      </main>
      <Footer />
    </div>
  );
};
