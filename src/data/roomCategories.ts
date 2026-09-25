import { RoomCategory } from '../types/roomCategory';
import { CONFIRMED_ROOM_CATEGORIES } from './confirmedInventory';
import { DEMO_PRICING_CONFIG } from './demoPricingConfig';

export interface RoomDetailedSpecification {
  label: string;
  value: string;
  isDemo: boolean;
  iconName: string;
}

export interface RoomCategoryExtended extends RoomCategory {
  subtitle: string;
  occupancyNote?: string;
  overviewParagraphs: string[];
  specifications: RoomDetailedSpecification[];
  roomFeatures: {
    title: string;
    description: string;
    iconName: string;
    isConfirmed: boolean;
  }[];
  policies: {
    title: string;
    description: string;
    isDemo: boolean;
  }[];
}

/**
 * COMPREHENSIVE ROOM CATEGORIES DATA
 * Features Wakefit Memory Foam Mattresses, clear cancellation policies, and mandatory Aadhar check-in.
 */
export const ROOM_CATEGORIES_DATA: RoomCategoryExtended[] = [
  {
    id: CONFIRMED_ROOM_CATEGORIES[0].id,
    slug: CONFIRMED_ROOM_CATEGORIES[0].slug,
    name: CONFIRMED_ROOM_CATEGORIES[0].name,
    subtitle: 'Climate-controlled comfort with Wakefit Memory Foam Mattress',
    totalInventory: CONFIRMED_ROOM_CATEGORIES[0].totalInventory, // 20 Confirmed
    demoBasePricePerNight: DEMO_PRICING_CONFIG.baseRates['ac-room'],
    demoCapacity: {
      maxAdults: 2,
      maxChildren: 2,
    },
    occupancyNote: 'Up to 2 guests included. Extra charge may apply for 3rd & 4th guest (confirmed at check-in).',
    demoBedType: 'Wakefit Memory Foam Double Bed',
    demoSizeSqFt: '240 sq ft',
    demoAmenities: [
      'Wakefit Memory Foam Mattress',
      'Individual Air Conditioning',
      'Car Parking Available',
      'Attached Bathroom with 24/7 Hot Water',
      'High-Speed Wi-Fi',
      'Daily Housekeeping',
    ],
    demoImages: {
      hero: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=1200&q=80',
      ],
    },
    isPlaceholderData: false,
    overviewParagraphs: [
      'Our AC Rooms provide an inviting and climate-controlled haven. Each room is outfitted with a premium Wakefit Memory Foam mattress, ensuring ergonomic spine support and a deep, refreshing night’s sleep.',
      'Enjoy individual remote AC control, clean attached private bathroom with 24/7 hot water, daily housekeeping, and on-premise car parking. Walkable distance to JNTU Metro Station.',
    ],
    specifications: [
      {
        label: 'Room Category',
        value: 'Air Conditioned (AC Room)',
        isDemo: false,
        iconName: 'air-conditioning',
      },
      {
        label: 'Mattress & Bedding',
        value: 'Wakefit Memory Foam Mattress',
        isDemo: false,
        iconName: 'comfortable-stay',
      },
      {
        label: 'Base Occupancy',
        value: 'Up to 2 Guests (Base rate)',
        isDemo: false,
        iconName: 'comfortable-stay',
      },
      {
        label: 'Additional Guests',
        value: 'Extra charge for 3rd & 4th guest',
        isDemo: false,
        iconName: 'easy-booking',
      },
      {
        label: 'Parking',
        value: 'Dedicated Car Parking on Property',
        isDemo: false,
        iconName: 'parking',
      },
      {
        label: 'Bathroom',
        value: 'Private Attached with 24/7 Hot Water',
        isDemo: false,
        iconName: 'hot-water',
      },
    ],
    roomFeatures: [
      {
        title: 'Wakefit Memory Foam Mattress',
        description: 'Premium ergonomic mattress for restorative sleep and contouring pressure relief.',
        iconName: 'comfortable-stay',
        isConfirmed: true,
      },
      {
        title: 'Individual Air Conditioning',
        description: 'Personalized remote-controlled AC for quiet, custom cooling comfort.',
        iconName: 'air-conditioning',
        isConfirmed: true,
      },
      {
        title: 'Car Parking Space',
        description: 'Secure on-site parking available for guest four-wheelers and vehicles.',
        iconName: 'parking',
        isConfirmed: true,
      },
      {
        title: 'Attached Private Bathroom',
        description: 'Private bathroom with 24/7 hot & cold water shower and fresh amenities.',
        iconName: 'hot-water',
        isConfirmed: true,
      },
      {
        title: 'High-Speed Wi-Fi',
        description: 'Wireless internet connectivity for work, streaming, and navigation.',
        iconName: 'wifi',
        isConfirmed: true,
      },
      {
        title: 'Daily Housekeeping',
        description: 'Professional room tidying, clean linen, and sanitation.',
        iconName: 'housekeeping',
        isConfirmed: true,
      },
    ],
    policies: [
      {
        title: 'Mandatory Guest Identification (18+)',
        description: 'Original Aadhar Card is mandatory for every person checking in. Primary guest must be 18+ years of age.',
        isDemo: false,
      },
      {
        title: 'Cancellation Policy',
        description: 'Cancel 2+ days before check-in to receive a 50% refund. Cancellations on the check-in day or within 48 hours are non-refundable (0% refund).',
        isDemo: false,
      },
      {
        title: 'Check-in & Check-out',
        description: 'Check-in from 12:00 PM | Check-out until 11:00 AM (24/7 Front desk assistance available).',
        isDemo: false,
      },
      {
        title: 'Occupancy Terms',
        description: 'Base rate includes up to 2 guests. Extra guest charge applies for 3rd/4th guest.',
        isDemo: false,
      },
    ],
  },
  {
    id: CONFIRMED_ROOM_CATEGORIES[1].id,
    slug: CONFIRMED_ROOM_CATEGORIES[1].slug,
    name: CONFIRMED_ROOM_CATEGORIES[1].name,
    subtitle: 'Practical comfort with Wakefit Memory Foam Mattress',
    totalInventory: CONFIRMED_ROOM_CATEGORIES[1].totalInventory, // 8 Confirmed
    demoBasePricePerNight: DEMO_PRICING_CONFIG.baseRates['non-ac-room'],
    demoCapacity: {
      maxAdults: 2,
      maxChildren: 1,
    },
    occupancyNote: 'Up to 2 guests. Practical budget stay with Wakefit mattress.',
    demoBedType: 'Wakefit Memory Foam Double Bed',
    demoSizeSqFt: '210 sq ft',
    demoAmenities: [
      'Wakefit Memory Foam Mattress',
      'Ceiling Fan & Natural Ventilation',
      'Car Parking Available',
      'Attached Bathroom with 24/7 Hot Water',
      'High-Speed Wi-Fi',
      'Daily Housekeeping',
    ],
    demoImages: {
      hero: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=1200&q=80',
      ],
    },
    isPlaceholderData: false,
    overviewParagraphs: [
      'Our Non-AC Rooms offer an economical and practical stay featuring genuine Wakefit Memory Foam mattresses for great spinal comfort and peaceful rest.',
      'Equipped with ceiling fan cooling, attached private bathroom with 24/7 hot water, high-speed Wi-Fi, and on-site car parking. Ideal for budget-conscious business and family transit stays.',
    ],
    specifications: [
      {
        label: 'Room Category',
        value: 'Non-AC Room (Budget Practical)',
        isDemo: false,
        iconName: 'comfortable-stay',
      },
      {
        label: 'Mattress & Bedding',
        value: 'Wakefit Memory Foam Mattress',
        isDemo: false,
        iconName: 'comfortable-stay',
      },
      {
        label: 'Base Occupancy',
        value: 'Up to 2 Guests (Base rate)',
        isDemo: false,
        iconName: 'comfortable-stay',
      },
      {
        label: 'Ventilation',
        value: 'Ceiling Fan & Natural Airflow',
        isDemo: false,
        iconName: 'comfortable-stay',
      },
      {
        label: 'Parking',
        value: 'Dedicated Car Parking on Property',
        isDemo: false,
        iconName: 'parking',
      },
      {
        label: 'Bathroom',
        value: 'Private Attached with 24/7 Hot Water',
        isDemo: false,
        iconName: 'hot-water',
      },
    ],
    roomFeatures: [
      {
        title: 'Wakefit Memory Foam Mattress',
        description: 'Authentic Wakefit mattress in every room for deep, rejuvenating sleep.',
        iconName: 'comfortable-stay',
        isConfirmed: true,
      },
      {
        title: 'Ceiling Fan & Ventilation',
        description: 'Optimal airflow and clean room environment for everyday comfort.',
        iconName: 'comfortable-stay',
        isConfirmed: true,
      },
      {
        title: 'Car Parking Space',
        description: 'Secure vehicle parking space on the hotel property.',
        iconName: 'parking',
        isConfirmed: true,
      },
      {
        title: 'Attached Private Bathroom',
        description: 'Clean attached bathroom with shower and 24/7 hot water supply.',
        iconName: 'hot-water',
        isConfirmed: true,
      },
      {
        title: 'High-Speed Wi-Fi',
        description: 'Fast wireless internet for browsing and productivity.',
        iconName: 'wifi',
        isConfirmed: true,
      },
      {
        title: 'Daily Housekeeping',
        description: 'Regular room tidying and clean linen upkeep.',
        iconName: 'housekeeping',
        isConfirmed: true,
      },
    ],
    policies: [
      {
        title: 'Mandatory Guest Identification (18+)',
        description: 'Original Aadhar Card is mandatory for every person checking in. Primary guest must be 18+ years of age.',
        isDemo: false,
      },
      {
        title: 'Cancellation Policy',
        description: 'Cancel 2+ days before check-in to receive a 50% refund. Cancellations on the check-in day or within 48 hours are non-refundable (0% refund).',
        isDemo: false,
      },
      {
        title: 'Check-in & Check-out',
        description: 'Check-in from 12:00 PM | Check-out until 11:00 AM (24/7 Front desk assistance available).',
        isDemo: false,
      },
      {
        title: 'Occupancy Terms',
        description: 'Standard occupancy is 2 guests in clean, practical surroundings.',
        isDemo: false,
      },
    ],
  },
];
export const INITIAL_ROOM_CATEGORIES = ROOM_CATEGORIES_DATA;
