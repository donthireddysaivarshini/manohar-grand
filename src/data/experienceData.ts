export interface ExperienceHighlight {
  id: string;
  title: string;
  description: string;
  iconName: string;
  badge?: string;
}

export const EXPERIENCE_HIGHLIGHTS: ExperienceHighlight[] = [
  {
    id: 'wakefit-comfort',
    title: 'Comfortable Stay & Wakefit Mattresses',
    description: 'Every bedroom is equipped with premium Wakefit Memory Foam mattresses for spine support and restful, deep sleep in both AC and Non-AC rooms.',
    iconName: 'comfortable-stay',
    badge: 'Wakefit Memory Foam',
  },
  {
    id: 'connectivity',
    title: '1-Min Walk to JNTU Metro',
    description: 'Walkable distance from JNTU Metro Station with immediate access to Nexus Forum Mall and Kukatpally business & shopping hubs.',
    iconName: 'connectivity',
    badge: 'Prime Location',
  },
  {
    id: 'front-desk',
    title: '24/7 Front Desk & Security',
    description: 'Round-the-clock reception team for flexible check-ins, guest inquiries, wake-up calls, and CCTV monitored premises.',
    iconName: 'reception',
    badge: '24/7 Service',
  },
  {
    id: 'parking',
    title: 'Dedicated Car & Vehicle Parking',
    description: 'Spacious on-site parking spaces on the property for four-wheelers and visiting guest vehicles.',
    iconName: 'parking',
    badge: 'On-Site Parking',
  },
  {
    id: 'bath-water',
    title: 'Attached Bath & 24/7 Hot Water',
    description: 'Spotless private attached bathrooms with 24/7 hot & cold water, clean fresh towels, and daily housekeeping.',
    iconName: 'hot-water',
    badge: '24/7 Hot Water',
  },
  {
    id: 'direct-booking',
    title: 'Best Rates & Direct Booking',
    description: 'Transparent pricing with no hidden middleman fees, instant booking confirmation, and dedicated direct guest support.',
    iconName: 'easy-booking',
    badge: 'Best Rate Guarantee',
  },
];
