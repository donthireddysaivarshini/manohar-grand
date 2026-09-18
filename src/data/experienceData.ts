export interface ExperienceHighlight {
  id: string;
  title: string;
  description: string;
  iconName: string;
}

export const EXPERIENCE_HIGHLIGHTS: ExperienceHighlight[] = [
  {
    id: 'stay',
    title: 'Comfortable & Restful Rooms',
    description: 'Well-appointed AC and Non-AC rooms designed for peaceful rest and everyday practicality.',
    iconName: 'BedDouble',
  },
  {
    id: 'direct',
    title: 'Direct Booking Value',
    description: 'Book directly through our website for instant reservation confirmation without hidden intermediary fees.',
    iconName: 'BadgePercent',
  },
  {
    id: 'hospitality',
    title: 'Attentive Hospitality',
    description: 'Dedicated front desk and housekeeping staff focused on making your visit pleasant and seamless.',
    iconName: 'HeartHandshake',
  },
  {
    id: 'hygiene',
    title: 'Cleanliness & Hygiene',
    description: 'Strict standards for fresh bedding, sanitized attached bathrooms, and tidy surroundings.',
    iconName: 'Sparkles',
  },
];
