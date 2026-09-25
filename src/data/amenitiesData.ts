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
    id: 'wakefit-mattress',
    name: 'WAKEFIT Memory Foam Mattresses',
    category: 'comfort',
    description: 'WAKEFIT Memory Foam mattresses in all bedrooms for extra comfort and posture support.',
    iconName: 'comfortable-stay',
    isConfirmed: true,
    statusLabel: 'All Rooms',
  },
  {
    id: 'smart-tv',
    name: '32" Smart TV with OTT Apps',
    category: 'convenience',
    description: 'Wall-mounted 32-inch Smart TV with OTT platform apps (subscription not included / guest login supported).',
    iconName: 'tv',
    isConfirmed: true,
    statusLabel: 'All Rooms',
  },
  {
    id: 'ac',
    name: 'Individual Air Conditioning',
    category: 'comfort',
    description: 'Remote-controlled individual AC cooling available in all 20 AC Rooms.',
    iconName: 'air-conditioning',
    isConfirmed: true,
    statusLabel: 'AC Rooms',
  },
  {
    id: 'parking',
    name: 'On-Site Vehicle Parking',
    category: 'convenience',
    description: 'Dedicated on-premise parking spaces for guest four-wheelers and vehicles.',
    iconName: 'parking',
    isConfirmed: true,
    statusLabel: 'Confirmed Amenity',
  },
  {
    id: 'front-desk',
    name: '24/7 Front Desk Service',
    category: 'service',
    description: 'Round-the-clock reception assistance for smooth check-ins and inquiries.',
    iconName: 'reception',
    isConfirmed: true,
    statusLabel: 'Confirmed 24/7 Service',
  },
  {
    id: 'hot-water',
    name: '24/7 Hot & Cold Water',
    category: 'comfort',
    description: 'Continuous hot shower water in all attached private bathrooms.',
    iconName: 'hot-water',
    isConfirmed: true,
    statusLabel: 'All Rooms',
  },
  {
    id: 'wifi',
    name: 'High-Speed Wi-Fi',
    category: 'convenience',
    description: 'Fast wireless internet access across all guest rooms and public spaces.',
    iconName: 'wifi',
    isConfirmed: true,
    statusLabel: 'Complimentary',
  },
  {
    id: 'housekeeping',
    name: 'Daily Housekeeping',
    category: 'service',
    description: 'Regular room tidying, fresh linen, and sanitization for a clean stay.',
    iconName: 'housekeeping',
    isConfirmed: true,
    statusLabel: 'Daily Service',
  },
  {
    id: 'power-backup',
    name: 'Power Backup Support',
    category: 'safety',
    description: 'Generator backup for uninterrupted lighting and essential room fixtures.',
    iconName: 'power-backup',
    isConfirmed: true,
    statusLabel: '24/7 Backup',
  },
  {
    id: 'security',
    name: 'CCTV & Security Monitoring',
    category: 'safety',
    description: 'Common area surveillance monitoring for guest safety and peace of mind.',
    iconName: 'security',
    isConfirmed: true,
    statusLabel: '24/7 Security',
  },
];
