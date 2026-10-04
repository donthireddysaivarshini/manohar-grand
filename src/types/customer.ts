export interface CustomerUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  name?: string;
  phone?: string;
  role?: string;
  is_staff?: boolean;
  city?: string;
  state?: string;
  customer_profile?: {
    id?: string;
    city?: string;
    state?: string;
    notes?: string;
  };
}

export interface AuthState {
  user: CustomerUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
