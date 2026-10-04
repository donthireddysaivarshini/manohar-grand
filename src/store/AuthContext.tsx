import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { CustomerUser, AuthState } from '../types/customer';
import { authService, clearTokens, getAccessToken } from '../lib/api';
import { AuthModal } from '../components/auth/AuthModal';

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '611694955223-6ibdlp0ct37g0jlpbl8m06rcg5a06i7m.apps.googleusercontent.com';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (data: { name?: string; email: string; password: string; phone?: string }) => Promise<void>;
  loginWithGoogle: (code: string) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<CustomerUser | null>;
  setUser: (user: CustomerUser | null) => void;
  openAuthModal: (mode?: 'login' | 'signup') => void;
  closeAuthModal: () => void;
  isAuthModalOpen: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');

  const openAuthModal = (mode: 'login' | 'signup' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  // Hydrate user session from JWT token on load
  const hydrate = async (): Promise<CustomerUser | null> => {
    setIsLoading(true);
    try {
      const token = getAccessToken();
      if (!token) {
        setUser(null);
        return null;
      }
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        return currentUser;
      } else {
        clearTokens();
        setUser(null);
        return null;
      }
    } catch {
      clearTokens();
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    hydrate();

    // Listen for session expiry from Axios interceptors
    const handleSessionExpired = () => {
      setUser(null);
      openAuthModal('login');
    };
    window.addEventListener('auth:session-expired', handleSessionExpired);
    return () => window.removeEventListener('auth:session-expired', handleSessionExpired);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await authService.login(email, password);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (data: { name?: string; email: string; password: string; phone?: string }) => {
    setIsLoading(true);
    try {
      await authService.signup(data);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (code: string) => {
    setIsLoading(true);
    try {
      const res = await authService.loginWithGoogle(code);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setIsLoading(false);
    }
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthContext.Provider
        value={{
          user,
          isAuthenticated: !!user,
          isLoading,
          login,
          signup,
          loginWithGoogle,
          logout,
          hydrate,
          setUser,
          openAuthModal,
          closeAuthModal,
          isAuthModalOpen,
        }}
      >
        {children}
        {/* Global Auth Modal */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={closeAuthModal}
          defaultMode={authModalMode}
        />
      </AuthContext.Provider>
    </GoogleOAuthProvider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
