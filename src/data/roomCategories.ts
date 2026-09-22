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
 * Strictly category-based (AC Room & Non-AC Room).
 * Confirmed inventory: 20 AC / 8 Non-AC maintained internally for booking.
 * Public marketing emphasis on total count removed per client instructions.
 */
export const ROOM_CATEGORIES_DATA: RoomCategoryExtended[] = [
  {
    id: CONFIRMED_ROOM_CATEGORIES[0].id,
    slug: CONFIRMED_ROOM_CATEGORIES[0].slug,
    name: CONFIRMED_ROOM_CATEGORIES[0].name,
    subtitle: 'Climate-controlled comfort with contemporary conveniences',
    totalInventory: CONFIRMED_ROOM_CATEGORIES[0].totalInventory, // 20 Confirmed
    demoBasePricePerNight: DEMO_PRICING_CONFIG.baseRates['ac-room'],
    demoCapacity: {
      maxAdults: 2,
      maxChildren: 2,
    },
    occupancyNote: 'Up to 2 guests included. Extra charge may apply for 3rd & 4th guest — rate to be confirmed.',
    demoBedType: 'Double Bed (Demo specification)',
    demoSizeSqFt: '240 sq ft (Demo estimate)',
    demoAmenities: [
      'Individual Air Conditioning',
      'Car Parking Available',
      'Attached Bathroom with Hot Water (Demo)',
      'High-Speed Wi-Fi (Demo)',
      'Flat-Screen TV (Demo)',
      'Daily Housekeeping (Demo)',
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
    isPlaceholderData: true,
    overviewParagraphs: [
      'Our AC Rooms provide an inviting and climate-controlled haven for travelers seeking a refreshing, tranquil stay. Designed with practical comforts in mind, each room features air conditioning, clean bedding, and private attached washrooms.',
      'Enjoy a restful night in a well-ventilated room equipped with hot water amenities and daily housekeeping. Ideal for business travelers, couples, and visiting guests.',
    ],
    specifications: [
      {
        label: 'Room Category',
        value: 'Air Conditioned (AC Room)',
        isDemo: false,
        iconName: 'air-conditioning',
      },
      {
        label: 'Base Occupancy',
        value: 'Up to 2 Guests (Base rate)',
        isDemo: false,
        iconName: 'comfortable-stay',
      },
      {
        label: 'Additional Guests',
        value: 'Extra charge for 3rd & 4th guest (TBC)',
        isDemo: true,
        iconName: 'easy-booking',
      },
      {
        label: 'Parking',
        value: 'Car Parking Available',
        isDemo: false,
        iconName: 'parking',
      },
      {
        label: 'Bedding',
        value: 'Comfortable Double Bed (Demo)',
        isDemo: true,
        iconName: 'comfortable-stay',
      },
      {
        label: 'Bathroom',
        value: 'Private Attached with Hot Shower (Demo)',
        isDemo: true,
        iconName: 'hot-water',
      },
    ],
    roomFeatures: [
      {
        title: 'Air Conditioning',
        description: 'Individual remote-controlled AC for personalized room climate comfort.',
        iconName: 'air-conditioning',
        isConfirmed: true,
      },
      {
        title: 'Car Parking Space',
        description: 'Dedicated parking facility available for visiting guest vehicles.',
        iconName: 'parking',
        isConfirmed: true,
      },
      {
        title: 'Attached Private Bathroom',
        description: 'Private bathroom with shower and 24/7 hot water supply.',
        iconName: 'hot-water',
        isConfirmed: false,
      },
      {
        title: 'High-Speed Wi-Fi',
        description: 'Complimentary wireless internet connectivity in-room.',
        iconName: 'wifi',
        isConfirmed: false,
      },
      {
        title: 'Television Entertainment',
        description: 'Wall-mounted flat-screen TV with standard entertainment channels.',
        iconName: 'tv',
        isConfirmed: false,
      },
      {
        title: 'Daily Housekeeping',
        description: 'Daily trash removal, fresh linen, and room tidying.',
        iconName: 'housekeeping',
        isConfirmed: false,
      },
    ],
    policies: [
      {
        title: 'Occupancy Policy',
        description: 'Base room rate covers up to 2 guests. Extra guest charges may apply for 3rd and 4th guest (rate to be confirmed upon check-in).',
        isDemo: true,
      },
      {
        title: 'Check-in / Check-out',
        description: 'Check-in from 12:00 PM | Check-out until 11:00 AM (24/7 Front desk available).',
        isDemo: true,
      },
      {
        title: 'Cancellation & Changes',
        description: 'Free cancellation up to 24 hours prior to check-in date (Demo policy).',
        isDemo: true,
      },
    ],
  },
  {
    id: CONFIRMED_ROOM_CATEGORIES[1].id,
    slug: CONFIRMED_ROOM_CATEGORIES[1].slug,
    name: CONFIRMED_ROOM_CATEGORIES[1].name,
    subtitle: 'Well-ventilated and budget-friendly practical accommodation',
    totalInventory: CONFIRMED_ROOM_CATEGORIES[1].totalInventory, // 8 Confirmed
    demoBasePricePerNight: DEMO_PRICING_CONFIG.baseRates['non-ac-room'],
    demoCapacity: {
      maxAdults: 2,
      maxChildren: 1,
    },
    occupancyNote: 'Up to 2 guests. Practical, budget-friendly comfort.',
    demoBedType: 'Double Bed (Demo specification)',
    demoSizeSqFt: '210 sq ft (Demo estimate)',
    demoAmenities: [
      'Ceiling Fan & Natural Ventilation',
      'Car Parking Available',
      'Attached Bathroom with Hot Water (Demo)',
      'High-Speed Wi-Fi (Demo)',
      'Daily Housekeeping (Demo)',
      'Wardrobe & Clothes Space (Demo)',
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
    isPlaceholderData: true,
    overviewParagraphs: [
      'Our Non-AC Rooms offer a practical and economical accommodation option without compromising on cleanliness and essential comfort. Each room is designed with good ventilation, ceiling fan cooling, and clean furnishings.',
      'Complete with an attached private bathroom, hot water amenities, and daily housekeeping, the Non-AC category is the perfect solution for transit guests, budget-conscious travelers, and short stays in Kukatpally.',
    ],
    specifications: [
      {
        label: 'Room Category',
        value: 'Standard (Non-AC Room)',
        isDemo: false,
        iconName: 'comfortable-stay',
      },
      {
        label: 'Base Occupancy',
        value: 'Up to 2 Guests',
        isDemo: false,
        iconName: 'comfortable-stay',
      },
      {
        label: 'Cooling',
        value: 'Ceiling Fan & Natural Ventilation',
        isDemo: false,
        iconName: 'air-conditioning',
      },
      {
        label: 'Parking',
        value: 'Car Parking Available',
        isDemo: false,
        iconName: 'parking',
      },
      {
        label: 'Bedding',
        value: 'Comfortable Double Bed (Demo)',
        isDemo: true,
        iconName: 'comfortable-stay',
      },
      {
        label: 'Bathroom',
        value: 'Private Attached with Hot Shower (Demo)',
        isDemo: true,
        iconName: 'hot-water',
      },
    ],
    roomFeatures: [
      {
        title: 'Ceiling Fan Cooling',
        description: 'Ceiling fan and window airflow for natural room ventilation.',
        iconName: 'air-conditioning',
        isConfirmed: true,
      },
      {
        title: 'Car Parking Space',
        description: 'On-site parking space for guest vehicles.',
        iconName: 'parking',
        isConfirmed: true,
      },
      {
        title: 'Attached Private Bathroom',
        description: 'Private bathroom with shower and 24/7 hot water supply.',
        iconName: 'hot-water',
        isConfirmed: false,
      },
      {
        title: 'High-Speed Wi-Fi',
        description: 'Complimentary wireless internet connectivity in-room.',
        iconName: 'wifi',
        isConfirmed: false,
      },
      {
        title: 'Daily Housekeeping',
        description: 'Daily trash removal, fresh linen, and room tidying.',
        iconName: 'housekeeping',
        isConfirmed: false,
      },
      {
        title: 'Power Backup Support',
        description: 'Generator backup for lighting and essential power outlets.',
        iconName: 'power-backup',
        isConfirmed: false,
      },
    ],
    policies: [
      {
        title: 'Occupancy Policy',
        description: 'Base room rate covers up to 2 guests in standard bed configuration.',
        isDemo: true,
      },
      {
        title: 'Check-in / Check-out',
        description: 'Check-in from 12:00 PM | Check-out until 11:00 AM (24/7 Front desk available).',
        isDemo: true,
      },
      {
        title: 'Cancellation & Changes',
        description: 'Free cancellation up to 24 hours prior to check-in date (Demo policy).',
        isDemo: true,
      },
    ],
  },
];

export const INITIAL_ROOM_CATEGORIES: RoomCategory[] = ROOM_CATEGORIES_DATA;
