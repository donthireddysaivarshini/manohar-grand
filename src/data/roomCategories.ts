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
 * Features WAKEFIT Memory Foam Mattress in all bedrooms for extra comfort,
 * 32-Inch Smart TV with OTT Apps (subscription not included),
 * 50% refund cancellation before 2 days / 0% same-day, and mandatory Aadhar check-in.
 */
export const ROOM_CATEGORIES_DATA: RoomCategoryExtended[] = [
  {
    id: CONFIRMED_ROOM_CATEGORIES[0].id,
    slug: CONFIRMED_ROOM_CATEGORIES[0].slug,
    name: CONFIRMED_ROOM_CATEGORIES[0].name,
    subtitle: 'Climate-controlled comfort with Wakefit Memory Foam Mattress & 32" Smart TV',
    totalInventory: CONFIRMED_ROOM_CATEGORIES[0].totalInventory, // 20 Confirmed
    demoBasePricePerNight: DEMO_PRICING_CONFIG.baseRates['ac-room'],
    demoCapacity: {
      maxAdults: 2,
      maxChildren: 2,
    },
    occupancyNote: 'Up to 2 guests included. Extra charge may apply for 3rd & 4th guest (confirmed at check-in).',
    demoBedType: 'WAKEFIT Memory Foam Double Bed',
    demoSizeSqFt: '240 sq ft',
    demoAmenities: [
      'WAKEFIT Memory Foam Mattress',
      '32-Inch Smart TV with OTT Apps',
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
      'Our AC Rooms provide an inviting and climate-controlled haven. Each room is outfitted with a premium WAKEFIT Memory Foam mattress for extra comfort and posture support, ensuring deep, restful sleep.',
      'Stay entertained with a 32-Inch Smart TV featuring popular OTT apps (subscription not included / guest login supported). Enjoy remote AC control, private bathroom with 24/7 hot water, high-speed Wi-Fi, and on-premise car parking near JNTU Metro.',
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
        value: 'WAKEFIT Memory Foam Mattress',
        isDemo: false,
        iconName: 'comfortable-stay',
      },
      {
        label: 'Smart TV & Media',
        value: '32-Inch Smart TV (OTT Apps Included, Subscription Not Included)',
        isDemo: false,
        iconName: 'tv',
      },
      {
        label: 'Base Occupancy',
        value: 'Up to 2 Guests (Base rate)',
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
        title: 'WAKEFIT Memory Foam Mattress',
        description: 'WAKEFIT Memory Foam mattress in all bedrooms for extra contouring comfort and peaceful sleep.',
        iconName: 'comfortable-stay',
        isConfirmed: true,
      },
      {
        title: '32-Inch Smart TV with OTT Apps',
        description: 'Enjoy YouTube and OTT entertainment apps (subscription not included — log in with your own account).',
        iconName: 'tv',
        isConfirmed: true,
      },
      {
        title: 'Individual Air Conditioning',
        description: 'Personalized remote-controlled AC for custom cooling comfort.',
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
        description: 'Fast wireless internet connectivity for streaming, work, and browsing.',
        iconName: 'wifi',
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
        title: 'OTT Subscription Policy',
        description: '32-Inch Smart TV is provided with OTT apps. Personal active subscriptions required for OTT platforms.',
        isDemo: false,
      },
      {
        title: 'Check-in & Check-out',
        description: 'Check-in from 12:00 PM | Check-out until 11:00 AM (24/7 Front desk assistance available).',
        isDemo: false,
      },
    ],
  },
  {
    id: CONFIRMED_ROOM_CATEGORIES[1].id,
    slug: CONFIRMED_ROOM_CATEGORIES[1].slug,
    name: CONFIRMED_ROOM_CATEGORIES[1].name,
    subtitle: 'Practical comfort with Wakefit Memory Foam Mattress & 32" Smart TV',
    totalInventory: CONFIRMED_ROOM_CATEGORIES[1].totalInventory, // 8 Confirmed
    demoBasePricePerNight: DEMO_PRICING_CONFIG.baseRates['non-ac-room'],
    demoCapacity: {
      maxAdults: 2,
      maxChildren: 1,
    },
    occupancyNote: 'Up to 2 guests. Practical budget stay with Wakefit mattress & Smart TV.',
    demoBedType: 'WAKEFIT Memory Foam Double Bed',
    demoSizeSqFt: '210 sq ft',
    demoAmenities: [
      'WAKEFIT Memory Foam Mattress',
      '32-Inch Smart TV with OTT Apps',
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
      'Our Non-AC Rooms offer an economical and comfortable stay featuring genuine WAKEFIT Memory Foam mattresses in all bedrooms for extra comfort.',
      'Equipped with a 32-Inch Smart TV with OTT apps (subscription not included), ceiling fan ventilation, attached bathroom with 24/7 hot water, high-speed Wi-Fi, and on-site car parking.',
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
        value: 'WAKEFIT Memory Foam Mattress',
        isDemo: false,
        iconName: 'comfortable-stay',
      },
      {
        label: 'Smart TV & Media',
        value: '32-Inch Smart TV (OTT Apps Included, Subscription Not Included)',
        isDemo: false,
        iconName: 'tv',
      },
      {
        label: 'Base Occupancy',
        value: 'Up to 2 Guests (Base rate)',
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
        title: 'WAKEFIT Memory Foam Mattress',
        description: 'WAKEFIT Memory Foam mattress in all bedrooms for extra comfort and spinal alignment.',
        iconName: 'comfortable-stay',
        isConfirmed: true,
      },
      {
        title: '32-Inch Smart TV with OTT Apps',
        description: 'Wall-mounted Smart TV with OTT platform apps (subscription not included).',
        iconName: 'tv',
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
        title: 'OTT Subscription Policy',
        description: '32-Inch Smart TV is provided with OTT apps. Personal active subscriptions required for OTT platforms.',
        isDemo: false,
      },
      {
        title: 'Check-in & Check-out',
        description: 'Check-in from 12:00 PM | Check-out until 11:00 AM (24/7 Front desk assistance available).',
        isDemo: false,
      },
    ],
  },
];
export const INITIAL_ROOM_CATEGORIES = ROOM_CATEGORIES_DATA;
