import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CustomerUser, AuthState } from '../types/customer';

interface AuthContextType extends AuthState {
  login: (email: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = async (email: string) => {
    setIsLoading(true);
    // Mock login operation
    setTimeout(() => {
      setUser({
        id: 'demo-user-1',
        name: 'Demo Guest',
        email,
        phone: '+91 9876543210',
      });
      setIsLoading(false);
    }, 300);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
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
