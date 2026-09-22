export interface ExperienceHighlight {
  id: string;
  title: string;
  description: string;
  iconName: string;
}

export const EXPERIENCE_HIGHLIGHTS: ExperienceHighlight[] = [
  {
    id: 'stay',
    title: 'Comfortable Stay',
    description: 'Clean, well-maintained AC & Non-AC rooms designed for peaceful rest and everyday practicality.',
    iconName: 'comfortable-stay',
  },
  {
    id: 'connectivity',
    title: 'Great Connectivity',
    description: 'Walkable distance from JNTU Metro Station with quick access to Kukatpally and Hyderabad transit.',
    iconName: 'connectivity',
  },
  {
    id: 'booking',
    title: 'Easy Direct Booking',
    description: 'Simple, transparent online reservation process with instant confirmation.',
    iconName: 'easy-booking',
  },
  {
    id: 'parking',
    title: 'Car Parking Available',
    description: 'Dedicated on-site vehicle parking space for visiting guests and four-wheelers.',
    iconName: 'parking',
  },
];
