/**
 * CENTRALIZED DEMO MEDIA REGISTRY
 * All photography used is temporary demo stock imagery.
 * When authentic Manohar Grand photographs are provided, replace URLs here.
 */

export interface DemoImage {
  id: string;
  url: string;
  alt: string;
  category: 'all' | 'rooms' | 'exterior' | 'ambience';
  caption: string;
  isDemoStock: boolean;
}

export const DEMO_MEDIA = {
  hero: {
    url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1920&q=80',
    alt: 'Manohar Grand Hotel exterior and hospitality ambience (Demo Image)',
    caption: 'Comfortable stay and warm hospitality at Manohar Grand',
  },
  welcome: {
    primary: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1000&q=80',
    secondary: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80',
    alt: 'Hotel reception and welcome lobby ambience (Demo Image)',
  },
  gallery: [
    {
      id: 'gal-1',
      url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
      alt: 'Spacious AC Room accommodation (Demo Stock)',
      category: 'rooms',
      caption: 'AC Room — Comfortable bedding and climate control',
      isDemoStock: true,
    },
    {
      id: 'gal-2',
      url: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
      alt: 'Clean Non-AC Room accommodation (Demo Stock)',
      category: 'rooms',
      caption: 'Non-AC Room — Well-ventilated and budget-friendly',
      isDemoStock: true,
    },
    {
      id: 'gal-3',
      url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
      alt: 'Hotel building exterior and entrance (Demo Stock)',
      category: 'exterior',
      caption: 'Hotel Exterior — Convenient and accessible location',
      isDemoStock: true,
    },
    {
      id: 'gal-4',
      url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
      alt: 'Warm and inviting reception lounge (Demo Stock)',
      category: 'ambience',
      caption: 'Reception Lounge — 24/7 front desk and guest hospitality',
      isDemoStock: true,
    },
    {
      id: 'gal-5',
      url: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=1200&q=80',
      alt: 'Room details and clean linens (Demo Stock)',
      category: 'rooms',
      caption: 'Thoughtful room details for a restful sleep',
      isDemoStock: true,
    },
    {
      id: 'gal-6',
      url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80',
      alt: 'Evening hotel exterior lighting (Demo Stock)',
      category: 'exterior',
      caption: 'Evening hotel exterior view',
      isDemoStock: true,
    },
  ] as DemoImage[],
} as const;
