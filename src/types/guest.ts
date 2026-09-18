export interface GuestDetails {
  fullName: string;
  email: string;
  phone: string;
  specialRequests?: string;
}

export interface GuestOccupancy {
  adults: number;
  children: number;
}
