import { CustomerUser } from '../../types/customer';

export interface IAuthService {
  login(email: string): Promise<CustomerUser>;
  register(name: string, email: string, phone: string): Promise<CustomerUser>;
  getCurrentUser(): Promise<CustomerUser | null>;
  logout(): Promise<void>;
}
