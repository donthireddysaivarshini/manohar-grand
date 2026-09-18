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
 * Confirmed inventory: 20 AC / 8 Non-AC.
 * All other specifications are clearly tagged as demo data.
 */
export const ROOM_CATEGORIES_DATA: RoomCategoryExtended[] = [
  {
    id: CONFIRMED_ROOM_CATEGORIES[0].id,
    slug: CONFIRMED_ROOM_CATEGORIES[0].slug,
    name: CONFIRMED_ROOM_CATEGORIES[0].name,
    subtitle: 'Climate-controlled comfort with contemporary amenities',
    totalInventory: CONFIRMED_ROOM_CATEGORIES[0].totalInventory, // 20 Confirmed
    demoBasePricePerNight: DEMO_PRICING_CONFIG.baseRates['ac-room'],
    demoCapacity: {
      maxAdults: 2,
      maxChildren: 1,
    },
    demoBedType: 'King / Queen Double Bed (Demo specification)',
    demoSizeSqFt: '240 sq ft (Demo estimate)',
    demoAmenities: [
      'Individual Air Conditioning',
      'High-Speed Wi-Fi (Demo)',
      'Attached Bathroom with Hot Water (Demo)',
      'Flat-Screen TV (Demo)',
      'Daily Housekeeping (Demo)',
      'Wardrobe & Luggage Space (Demo)',
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
      'Our AC Rooms provide an inviting and climate-controlled haven for travelers seeking a refreshing, tranquil stay. Designed with practical comforts in mind, each room features air conditioning, dedicated workspace, and a comfortable double bed.',
      'Enjoy a restful night in a well-ventilated space equipped with an attached private bathroom, continuous hot water, and daily housekeeping services. Ideal for business travelers, couples, and visiting guests.',
    ],
    specifications: [
      {
        label: 'Room Category',
        value: 'Air Conditioned (AC Room)',
        isDemo: false,
        iconName: 'Wind',
      },
      {
        label: 'Total Inventory',
        value: '20 Rooms on Property',
        isDemo: false,
        iconName: 'Layers',
      },
      {
        label: 'Max Occupancy',
        value: 'Up to 2 Adults + 1 Child (Demo)',
        isDemo: true,
        iconName: 'Users',
      },
      {
        label: 'Bed Type',
        value: 'Double Bed (Demo)',
        isDemo: true,
        iconName: 'BedDouble',
      },
      {
        label: 'Room Size',
        value: 'Approx. 240 sq ft (Demo)',
        isDemo: true,
        iconName: 'Maximize2',
      },
      {
        label: 'Bathroom',
        value: 'Private Attached with Hot Shower (Demo)',
        isDemo: true,
        iconName: 'Droplets',
      },
    ],
    roomFeatures: [
      {
        title: 'Air Conditioning',
        description: 'Individual remote-controlled AC for personalized room climate comfort.',
        iconName: 'Wind',
        isConfirmed: true,
      },
      {
        title: 'Attached Private Bathroom',
        description: 'Private bathroom with shower and hot water supply.',
        iconName: 'Droplets',
        isConfirmed: false,
      },
      {
        title: 'High-Speed Wi-Fi',
        description: 'Complimentary wireless internet connectivity in-room.',
        iconName: 'Wifi',
        isConfirmed: false,
      },
      {
        title: 'Television Entertainment',
        description: 'Wall-mounted flat-screen TV with standard entertainment channels.',
        iconName: 'Tv',
        isConfirmed: false,
      },
      {
        title: 'Daily Housekeeping',
        description: 'Daily trash removal, fresh linen, and room tidying.',
        iconName: 'Sparkles',
        isConfirmed: false,
      },
      {
        title: 'Power Backup Support',
        description: 'Generator backup for lighting and essential power outlets.',
        iconName: 'Zap',
        isConfirmed: false,
      },
    ],
    policies: [
      {
        title: 'Check-in / Check-out',
        description: 'Check-in from 12:00 PM | Check-out until 11:00 AM (Demo timing pending confirmation).',
        isDemo: true,
      },
      {
        title: 'Cancellation & Changes',
        description: 'Free cancellation up to 24 hours prior to check-in date (Demo policy).',
        isDemo: true,
      },
      {
        title: 'Identification Requirement',
        description: 'Valid government-issued photo ID required for all adult guests at check-in.',
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
    demoBedType: 'Double / Twin Bed (Demo specification)',
    demoSizeSqFt: '210 sq ft (Demo estimate)',
    demoAmenities: [
      'Ceiling Fan & Natural Ventilation',
      'High-Speed Wi-Fi (Demo)',
      'Attached Bathroom with Hot Water (Demo)',
      'Daily Housekeeping (Demo)',
      'Wardrobe & Clothes Rack (Demo)',
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
      'Our Non-AC Rooms offer a practical and economical accommodation option without compromising on cleanliness and essential comfort. Each room is designed with good cross-ventilation, ceiling fan cooling, and clean furnishings.',
      'Complete with an attached private bathroom, hot water amenities, and daily housekeeping, the Non-AC category is the perfect solution for transit guests, budget-conscious travelers, and short stays.',
    ],
    specifications: [
      {
        label: 'Room Category',
        value: 'Standard (Non-AC Room)',
        isDemo: false,
        iconName: 'Wind',
      },
      {
        label: 'Total Inventory',
        value: '8 Rooms on Property',
        isDemo: false,
        iconName: 'Layers',
      },
      {
        label: 'Max Occupancy',
        value: 'Up to 2 Adults + 1 Child (Demo)',
        isDemo: true,
        iconName: 'Users',
      },
      {
        label: 'Bed Type',
        value: 'Double or Twin Beds (Demo)',
        isDemo: true,
        iconName: 'BedDouble',
      },
      {
        label: 'Room Size',
        value: 'Approx. 210 sq ft (Demo)',
        isDemo: true,
        iconName: 'Maximize2',
      },
      {
        label: 'Bathroom',
        value: 'Private Attached with Hot Shower (Demo)',
        isDemo: true,
        iconName: 'Droplets',
      },
    ],
    roomFeatures: [
      {
        title: 'Ceiling Fan Cooling',
        description: 'Ceiling fan and natural window airflow for room ventilation.',
        iconName: 'Wind',
        isConfirmed: true,
      },
      {
        title: 'Attached Private Bathroom',
        description: 'Private bathroom with shower and hot water supply.',
        iconName: 'Droplets',
        isConfirmed: false,
      },
      {
        title: 'High-Speed Wi-Fi',
        description: 'Complimentary wireless internet connectivity in-room.',
        iconName: 'Wifi',
        isConfirmed: false,
      },
      {
        title: 'Daily Housekeeping',
        description: 'Daily trash removal, fresh linen, and room tidying.',
        iconName: 'Sparkles',
        isConfirmed: false,
      },
      {
        title: 'Power Backup Support',
        description: 'Generator backup for lighting and essential power outlets.',
        iconName: 'Zap',
        isConfirmed: false,
      },
    ],
    policies: [
      {
        title: 'Check-in / Check-out',
        description: 'Check-in from 12:00 PM | Check-out until 11:00 AM (Demo timing pending confirmation).',
        isDemo: true,
      },
      {
        title: 'Cancellation & Changes',
        description: 'Free cancellation up to 24 hours prior to check-in date (Demo policy).',
        isDemo: true,
      },
      {
        title: 'Identification Requirement',
        description: 'Valid government-issued photo ID required for all adult guests at check-in.',
        isDemo: true,
      },
    ],
  },
];

export const INITIAL_ROOM_CATEGORIES: RoomCategory[] = ROOM_CATEGORIES_DATA;
