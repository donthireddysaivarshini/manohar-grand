import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CustomerUser, AuthState } from '../types/customer';
import { BACKEND_URL, fetchApi, initCsrfToken } from '../services/apiClient';

interface AuthContextType extends AuthState {
  loginWithGoogle: () => void;
  hydrate: () => Promise<CustomerUser | null>;
  logout: () => Promise<void>;
  setUser: (user: CustomerUser | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const hydrate = async (): Promise<CustomerUser | null> => {
    try {
      const res = await fetchApi<CustomerUser>('/api/v1/auth/me/');
      if (res.success && res.data) {
        setUser(res.data);
        return res.data;
      } else {
        setUser(null);
        return null;
      }
    } catch {
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initCsrfToken();
    hydrate();
  }, []);

  const loginWithGoogle = () => {
    // Initiates django-allauth OAuth Authorization Code flow
    window.location.href = `${BACKEND_URL}/accounts/google/login/?process=login`;
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await fetchApi('/api/v1/auth/logout/', { method: 'POST' });
    } catch (err) {
      console.warn('Logout API error:', err);
    } finally {
      setUser(null);
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        loginWithGoogle,
        hydrate,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
