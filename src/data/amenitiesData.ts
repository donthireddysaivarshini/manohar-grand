export interface AmenityItem {
  id: string;
  name: string;
  category: 'comfort' | 'convenience' | 'safety' | 'service';
  description: string;
  iconName: string;
  isConfirmed: boolean;
  statusLabel: string;
}

export const AMENITIES_DATA: AmenityItem[] = [
  {
    id: 'parking',
    name: 'Car & Vehicle Parking',
    category: 'convenience',
    description: 'On-site vehicle parking space available for visiting guests and four-wheelers.',
    iconName: 'parking',
    isConfirmed: true,
    statusLabel: 'Confirmed Amenity',
  },
  {
    id: 'ac',
    name: 'Air Conditioning',
    category: 'comfort',
    description: 'Individual remote-controlled AC available in all 20 AC Rooms.',
    iconName: 'air-conditioning',
    isConfirmed: true,
    statusLabel: 'Confirmed (AC Rooms)',
  },
  {
    id: 'front-desk',
    name: '24/7 Front Desk Service',
    category: 'service',
    description: 'Round-the-clock reception assistance for flexible check-ins and inquiries.',
    iconName: 'reception',
    isConfirmed: true,
    statusLabel: 'Confirmed 24/7 Service',
  },
  {
    id: 'housekeeping',
    name: 'Daily Housekeeping',
    category: 'service',
    description: 'Dedicated room tidying, clean linen, and sanitation for a fresh stay.',
    iconName: 'housekeeping',
    isConfirmed: false,
    statusLabel: 'Demo Placeholder',
  },
  {
    id: 'hot-water',
    name: '24/7 Hot & Cold Water',
    category: 'comfort',
    description: 'Continuous hot shower water in all attached private bathrooms.',
    iconName: 'hot-water',
    isConfirmed: false,
    statusLabel: 'Demo Placeholder',
  },
  {
    id: 'wifi',
    name: 'High-Speed Wi-Fi',
    category: 'convenience',
    description: 'Wireless internet connectivity across guest rooms and common areas.',
    iconName: 'wifi',
    isConfirmed: false,
    statusLabel: 'Demo Placeholder',
  },
  {
    id: 'power-backup',
    name: 'Power Backup Support',
    category: 'safety',
    description: 'Generator backup for uninterrupted lighting and essential room fixtures.',
    iconName: 'power-backup',
    isConfirmed: false,
    statusLabel: 'Demo Placeholder',
  },
  {
    id: 'security',
    name: 'Security & Surveillance',
    category: 'safety',
    description: 'Common area surveillance monitoring for enhanced guest peace of mind.',
    iconName: 'security',
    isConfirmed: false,
    statusLabel: 'Demo Placeholder',
  },
];
