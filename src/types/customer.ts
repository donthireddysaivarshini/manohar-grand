export interface CustomerUser {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface AuthState {
  user: CustomerUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
