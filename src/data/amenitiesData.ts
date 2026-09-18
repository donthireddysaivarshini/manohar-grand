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
    id: 'ac',
    name: 'Air Conditioning',
    category: 'comfort',
    description: 'Individual climate control available in all 20 AC Rooms.',
    iconName: 'Wind',
    isConfirmed: true,
    statusLabel: 'Confirmed (AC Rooms)',
  },
  {
    id: 'wifi',
    name: 'High-Speed Wi-Fi',
    category: 'convenience',
    description: 'Seamless internet connectivity throughout guest rooms and lobby area.',
    iconName: 'Wifi',
    isConfirmed: false,
    statusLabel: 'Demo Placeholder',
  },
  {
    id: 'front-desk',
    name: '24/7 Front Desk',
    category: 'service',
    description: 'Round-the-clock reception assistance for smooth check-ins and inquiries.',
    iconName: 'Clock',
    isConfirmed: false,
    statusLabel: 'Demo Placeholder',
  },
  {
    id: 'hot-water',
    name: '24/7 Hot & Cold Water',
    category: 'comfort',
    description: 'Continuous hot water supply in all attached private bathrooms.',
    iconName: 'Droplets',
    isConfirmed: false,
    statusLabel: 'Demo Placeholder',
  },
  {
    id: 'housekeeping',
    name: 'Daily Housekeeping',
    category: 'service',
    description: 'Daily room cleaning and fresh linen service for a hygienic stay.',
    iconName: 'Sparkles',
    isConfirmed: false,
    statusLabel: 'Demo Placeholder',
  },
  {
    id: 'power-backup',
    name: 'Power Backup',
    category: 'safety',
    description: 'Generator backup to ensure uninterrupted lighting and essential power.',
    iconName: 'Zap',
    isConfirmed: false,
    statusLabel: 'Demo Placeholder',
  },
  {
    id: 'parking',
    name: 'Vehicle Parking',
    category: 'convenience',
    description: 'On-site parking space for guest two-wheelers and four-wheelers.',
    iconName: 'Car',
    isConfirmed: false,
    statusLabel: 'Demo Placeholder',
  },
  {
    id: 'cctv',
    name: 'CCTV Surveillance',
    category: 'safety',
    description: 'Common area surveillance monitoring for enhanced guest security.',
    iconName: 'ShieldCheck',
    isConfirmed: false,
    statusLabel: 'Demo Placeholder',
  },
];
