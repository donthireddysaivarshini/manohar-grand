import { IAuthService } from '../contracts/IAuthService';
import { CustomerUser } from '../../types/customer';

export class MockAuthService implements IAuthService {
  private currentUser: CustomerUser | null = null;

  async login(email: string): Promise<CustomerUser> {
    const user: CustomerUser = {
      id: 'demo-user-1',
      name: 'Demo Guest',
      email: email,
      phone: '+91 9876543210',
    };
    this.currentUser = user;
    return Promise.resolve(user);
  }

  async register(name: string, email: string, phone: string): Promise<CustomerUser> {
    const user: CustomerUser = {
      id: `user-${Date.now()}`,
      name,
      email,
      phone,
    };
    this.currentUser = user;
    return Promise.resolve(user);
  }

  async getCurrentUser(): Promise<CustomerUser | null> {
    return Promise.resolve(this.currentUser);
  }

  async logout(): Promise<void> {
    this.currentUser = null;
    return Promise.resolve();
  }
}
